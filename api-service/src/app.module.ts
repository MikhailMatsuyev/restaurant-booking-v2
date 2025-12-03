import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { KafkaService } from './kafka.service';
import { EventsController } from './events.controller';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [],
  controllers: [EventsController, BookingsController],
  providers: [DatabaseService, KafkaService],
})
export class AppModule {}
