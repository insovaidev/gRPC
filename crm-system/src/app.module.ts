import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CrmModule } from './crm/crm.module';

@Module({
  imports: [PrismaModule, CrmModule],
})
export class AppModule {}
