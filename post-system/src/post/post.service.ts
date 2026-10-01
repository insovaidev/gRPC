import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface LeadPayload {
  lead_id: string;
  user_id: string;
  user_phone: string;
  post_id: string;
  post_title: string;
  price: number;
  category: string;
  created_at: string;
}

@Injectable()
export class PostService {
  // RxJS Subject broadcasts real-time updates to all subscribers
  private leadStream$ = new Subject<LeadPayload>();

  constructor(private prisma: PrismaService) {}

  async createPost(data: {
    title: string;
    price: number;
    category: string;
    userId: string;
  }) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException(
        'Body missing. Send JSON with "Content-Type: application/json".',
      );
    }
    if (typeof data.title !== 'string' || !data.title.trim()) {
      throw new BadRequestException('Field "title" (non-empty string) is required.');
    }
    if (typeof data.price !== 'number' || Number.isNaN(data.price)) {
      throw new BadRequestException('Field "price" (number) is required.');
    }
    if (typeof data.category !== 'string' || !data.category.trim()) {
      throw new BadRequestException('Field "category" (non-empty string) is required.');
    }
    if (typeof data.userId !== 'string' || !data.userId.trim()) {
      throw new BadRequestException('Field "userId" (non-empty string) is required.');
    }

    // 1. Save post to Post System DB (only known fields — ignores extras)
    const post = await this.prisma.post.create({
      data: {
        title: data.title,
        price: data.price,
        category: data.category,
        userId: data.userId,
      },
      include: { user: true },
    });

    const leadPayload: LeadPayload = {
      lead_id: `lead_${post.id}`,
      user_id: post.userId,
      user_phone: post.user.phone,
      post_id: post.id,
      post_title: post.title,
      price: post.price,
      category: post.category,
      created_at: post.createdAt.toISOString(),
    };

    // 2. Emit payload into stream instantly
    this.leadStream$.next(leadPayload);

    return post;
  }

  // Returns stream filtering by requested category if provided
  getLeadStream(categoryFilter?: string): Observable<LeadPayload> {
    return this.leadStream$.asObservable().pipe(
      filter((lead) => {
        if (!categoryFilter || categoryFilter === '') return true;
        return lead.category.toLowerCase() === categoryFilter.toLowerCase();
      }),
    );
  }

  async findAllPosts() {
    return this.prisma.post.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!post) {
      throw new NotFoundException(`Post with id "${id}" not found`);
    }
    return post;
  }

  async updatePost(
    id: string,
    data: { title?: string; price?: number; category?: string },
  ) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException(
        'Body missing. Send JSON with "Content-Type: application/json".',
      );
    }
    const update: { title?: string; price?: number; category?: string } = {};
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new BadRequestException(
          'Field "title" must be a non-empty string.',
        );
      }
      update.title = data.title;
    }
    if (data.price !== undefined) {
      if (typeof data.price !== 'number' || Number.isNaN(data.price)) {
        throw new BadRequestException('Field "price" must be a number.');
      }
      update.price = data.price;
    }
    if (data.category !== undefined) {
      if (typeof data.category !== 'string' || !data.category.trim()) {
        throw new BadRequestException(
          'Field "category" must be a non-empty string.',
        );
      }
      update.category = data.category;
    }
    await this.findPostById(id);
    return this.prisma.post.update({
      where: { id },
      data: update,
      include: { user: true },
    });
  }

  async removePost(id: string) {
    await this.findPostById(id);
    return this.prisma.post.delete({ where: { id } });
  }
}
