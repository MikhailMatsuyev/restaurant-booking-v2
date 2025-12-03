import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: 'api-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.producer = this.kafka.producer();
    
    try {
      await this.producer.connect();
      console.log('✅ Connected to Kafka');
    } catch (error) {
      console.error('❌ Kafka connection error:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async sendBookingEvent(booking: any) {
    try {
      await this.producer.send({
        topic: 'booking-events',
        messages: [
          {
            key: booking.id.toString(),
            value: JSON.stringify({
              type: 'BOOKING_CREATED',
              data: booking,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      console.log('📤 Booking event sent to Kafka:', booking.id);
    } catch (error) {
      console.error('❌ Error sending booking event:', error);
      throw error;
    }
  }
}
