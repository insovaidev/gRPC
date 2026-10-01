import { Controller, Get } from '@nestjs/common';
import { CrmService } from './crm.service';

@Controller('leads')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  getAllLeads() {
    return this.crmService.getAllLeads();
  }
}
