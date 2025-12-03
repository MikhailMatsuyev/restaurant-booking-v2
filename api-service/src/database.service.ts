import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'event_booking',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
      const client = await this.pool.connect();
      console.log('✅ Connected to PostgreSQL');
      client.release();
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async getAllEvents() {
    const query = `
      SELECT 
        e.id,
        e.name,
        e.total_seats,
        e.created_at,
        COUNT(b.id) as booked_seats,
        (e.total_seats - COUNT(b.id)) as available_seats
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      GROUP BY e.id
      ORDER BY e.id
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async getEventById(eventId: number) {
    const query = `
      SELECT 
        e.id,
        e.name,
        e.total_seats,
        e.created_at,
        COUNT(b.id) as booked_seats,
        (e.total_seats - COUNT(b.id)) as available_seats
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    const result = await this.query(query, [eventId]);
    return result.rows[0];
  }

  async getAvailableSeats(eventId: number): Promise<number> {
    const query = `
      SELECT 
        e.total_seats - COUNT(b.id) as available_seats
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    const result = await this.query(query, [eventId]);
    return result.rows[0]?.available_seats || 0;
  }

    async createBooking(eventId: number, userId: string) {
        const client = await this.getClient();

        try {
            await client.query('BEGIN');

            const existingBookingQuery = `
      SELECT id FROM bookings
      WHERE event_id = $1 AND user_id = $2
    `;
            const existingBooking = await client.query(existingBookingQuery, [eventId, userId]);

            if (existingBooking.rows.length > 0) {
                throw new Error('User has already booked this event');
            }

            const eventQuery = `
      SELECT id, total_seats
      FROM events
      WHERE id = $1
      FOR UPDATE
    `;
            const eventResult = await client.query(eventQuery, [eventId]);

            if (eventResult.rows.length === 0) {
                throw new Error('Event not found');
            }

            const event = eventResult.rows[0];

            const bookingsCountQuery = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE event_id = $1
    `;
            const bookingsResult = await client.query(bookingsCountQuery, [eventId]);
            const bookedSeats = parseInt(bookingsResult.rows[0].count);
            const availableSeats = event.total_seats - bookedSeats;

            if (availableSeats <= 0) {
                throw new Error('No available seats');
            }

            // Шаг 4: Создаем бронирование
            const insertQuery = `
      INSERT INTO bookings (event_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `;

            const result = await client.query(insertQuery, [eventId, userId]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');

            if (error.code === '23505' && error.constraint === 'unique_user_event') {
                throw new Error('User has already booked this event');
            }

            throw error;
        } finally {
            client.release();
        }
    }

  async getUserBookings(userId: string) {
    const query = `
      SELECT 
        b.id,
        b.event_id,
        b.user_id,
        b.created_at,
        e.name as event_name,
        e.total_seats
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `;
    const result = await this.query(query, [userId]);
    return result.rows;
  }
}
