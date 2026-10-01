import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Start HTTP app for incoming web/REST requests (e.g. creating posts)
  const app = await NestFactory.create(AppModule);

  // Connect gRPC microservice listener
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'lead',
      protoPath: join(__dirname, '../../proto/lead.proto'),
      url: '0.0.0.0:50051',
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log('Post System: HTTP listening on :3000 | gRPC listening on :50051');
}
bootstrap();
