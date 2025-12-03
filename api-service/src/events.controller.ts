import { Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('events')
export class EventsController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async getAllEvents() {
    try {
      const events = await this.databaseService.getAllEvents();
      return {
        success: true,
        data: events,
      };
    } catch (error) {
      console.error('Error getting events:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    try {
      const event = await this.databaseService.getEventById(id);
      
      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      console.error('Error getting event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id/available-seats')
  async getAvailableSeats(@Param('id', ParseIntPipe) id: number) {
    try {
      const availableSeats = await this.databaseService.getAvailableSeats(id);
      
      return {
        success: true,
        data: {
          event_id: id,
          available_seats: availableSeats,
        },
      };
    } catch (error) {
      console.error('Error getting available seats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
