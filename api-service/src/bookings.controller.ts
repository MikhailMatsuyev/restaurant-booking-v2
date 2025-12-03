import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { KafkaService } from './kafka.service';

interface ReserveBookingDto {
  event_id: number;
  user_id: string;
}

@Controller('api/bookings')
export class BookingsController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly kafkaService: KafkaService,
  ) {}

    @Post('reserve')
    async reserve(@Body() dto: ReserveBookingDto) {
        try {
            console.log('📝 Received booking request:', dto);

            if (!dto.event_id || !dto.user_id) {
                throw new BadRequestException('event_id and user_id are required');
            }

            const event = await this.databaseService.getEventById(dto.event_id);
            if (!event) {
                throw new BadRequestException(`Event with ID ${dto.event_id} not found`);
            }

            const availableSeats = await this.databaseService.getAvailableSeats(dto.event_id);
            if (availableSeats <= 0) {
                throw new BadRequestException('No available seats for this event');
            }

            const booking = await this.databaseService.createBooking(
                dto.event_id,
                dto.user_id,
            );

            await this.kafkaService.sendBookingEvent({
                ...booking,
                event_name: event.name,
            });

            console.log('✅ Booking created successfully:', booking.id);

            return {
                success: true,
                message: 'Booking created successfully',
                data: {
                    booking_id: booking.id,
                    event_id: booking.event_id,
                    event_name: event.name,
                    user_id: booking.user_id,
                    created_at: booking.created_at,
                },
            };
        } catch (error) {
            console.error('❌ Error creating booking:', error);

            let userMessage = error.message || 'Failed to create booking';

            if (userMessage.includes('already booked')) {
                userMessage = 'You have already booked this event';
            } else if (userMessage.includes('No available seats')) {
                userMessage = 'No available seats for this event';
            } else if (userMessage.includes('Event not found')) {
                userMessage = `Event with ID ${dto.event_id} not found`;
            }

            return {
                success: false,
                error: userMessage,
            };
        }
    }

  @Get('user/:userId')
  async getUserBookings(@Param('userId') userId: string) {
    try {
      const bookings = await this.databaseService.getUserBookings(userId);
      
      return {
        success: true,
        data: bookings,
      };
    } catch (error) {
      console.error('Error getting user bookings:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
