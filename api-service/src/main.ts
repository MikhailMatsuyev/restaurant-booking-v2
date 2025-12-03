import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API Service is running on: http://localhost:${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /events - Get all events`);
  console.log(`   GET  /events/:id - Get event by ID`);
  console.log(`   GET  /events/:id/available-seats - Get available seats`);
  console.log(`   POST /api/bookings/reserve - Reserve a seat`);
  console.log(`   GET  /api/bookings/user/:userId - Get user bookings`);
}

bootstrap();
