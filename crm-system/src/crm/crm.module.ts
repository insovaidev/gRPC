import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LEAD_STREAM_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'lead',
          protoPath: join(__dirname, '../../../proto/lead.proto'),
          url: 'localhost:50051', // Connects to Post System gRPC server
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  controllers: [CrmController],
  providers: [CrmService],
})
export class CrmModule {}
