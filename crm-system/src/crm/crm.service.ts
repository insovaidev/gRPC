import { Injectable, OnModuleInit, Inject, OnModuleDestroy } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, Subscription } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

interface StreamLeadsRequest {
  filter_category?: string;
}

interface LeadResponse {
  lead_id: string;
  user_id: string;
  user_phone: string;
  post_id: string;
  post_title: string;
  price: number;
  category: string;
  created_at: string;
}

interface LeadStreamService {
  streamNewLeads(data: StreamLeadsRequest): Observable<LeadResponse>;
}

@Injectable()
export class CrmService implements OnModuleInit, OnModuleDestroy {
  private gRpcLeadService!: LeadStreamService;
  private streamSubscription?: Subscription;
  private reconnectTimer?: NodeJS.Timeout;
  private destroyed = false;

  constructor(
    @Inject('LEAD_STREAM_PACKAGE') private client: ClientGrpc,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.gRpcLeadService = this.client.getService<LeadStreamService>(
      'LeadStreamService',
    );
    this.startIngestingLeads();
  }

  onModuleDestroy() {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
  }

  startIngestingLeads(filterCategory?: string) {
    if (this.destroyed) return;
    console.log('[CRM] Opening live gRPC stream connection to Post System...');

    const stream$ = this.gRpcLeadService.streamNewLeads({
      filter_category: filterCategory || '',
    });

    this.streamSubscription = stream$.subscribe({
      next: async (lead: LeadResponse) => {
        console.log('[CRM] Instant Lead Received via gRPC Stream:', lead.post_title);

        // Process and persist lead immediately to CRM Database
        await this.prisma.crmLead.create({
          data: {
            postSystemId: lead.lead_id,
            userId: lead.user_id,
            userPhone: lead.user_phone,
            postTitle: lead.post_title,
            price: lead.price,
            category: lead.category,
            status: 'UNCONTACTED',
          },
        });
      },
      error: (err) => {
        console.error('[CRM] Stream Error:', err?.message ?? err);
        this.scheduleReconnect(filterCategory);
      },
      complete: () => {
        console.log('[CRM] gRPC Stream closed by server.');
        this.scheduleReconnect(filterCategory);
      },
    });
  }

  // The Post System may not be up yet (or may have restarted) — keep retrying
  private scheduleReconnect(filterCategory?: string) {
    if (this.destroyed || this.reconnectTimer) return;
    console.log('[CRM] Retrying gRPC stream in 3s...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.startIngestingLeads(filterCategory);
    }, 3000);
  }

  async getAllLeads() {
    return this.prisma.crmLead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
