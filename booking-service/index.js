const { Kafka } = require('kafkajs');
const { Pool } = require('pg');

// Настройка Kafka
const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

// Настройка PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'event_booking',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const consumer = kafka.consumer({ groupId: 'booking-service-group' });

async function processBookingEvent(message) {
  try {
    const event = JSON.parse(message.value.toString());
    console.log('📨 Received booking event:', event);

    const { type, data, timestamp } = event;

    if (type === 'BOOKING_CREATED') {
      // Здесь можно добавить дополнительную бизнес-логику:
      // - Отправка email пользователю
      // - Отправка уведомления
      // - Логирование в отдельную таблицу
      // - Интеграция с внешними системами

      console.log('✅ Processing booking:', {
        booking_id: data.id,
        event_id: data.event_id,
        event_name: data.event_name,
        user_id: data.user_id,
        created_at: data.created_at,
      });

      // Пример: сохраняем в таблицу логов (если нужно)
      await logBookingEvent(data);

      // Пример: имитация отправки email
      await sendEmailNotification(data);
    }
  } catch (error) {
    console.error('❌ Error processing booking event:', error);
  }
}

async function logBookingEvent(bookingData) {
  try {
    // Можно создать таблицу booking_logs для аудита
    console.log('📝 Logging booking event to database...');
    // const query = 'INSERT INTO booking_logs (booking_id, event_id, user_id, action, timestamp) VALUES ($1, $2, $3, $4, NOW())';
    // await pool.query(query, [bookingData.id, bookingData.event_id, bookingData.user_id, 'CREATED']);
  } catch (error) {
    console.error('Error logging booking event:', error);
  }
}

async function sendEmailNotification(bookingData) {
  try {
    console.log('📧 Sending email notification...');
    console.log(`   To: ${bookingData.user_id}`);
    console.log(`   Subject: Booking Confirmation - ${bookingData.event_name}`);
    console.log(`   Message: Your booking (ID: ${bookingData.id}) has been confirmed!`);
    
    // Здесь можно добавить реальную отправку email через SendGrid, AWS SES и т.д.
    // await emailService.send({
    //   to: bookingData.user_id,
    //   subject: `Booking Confirmation - ${bookingData.event_name}`,
    //   body: `Your booking has been confirmed!`
    // });
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

async function run() {
  try {
    // Подключение к Kafka
    await consumer.connect();
    console.log('✅ Booking Service connected to Kafka');

    // Подключение к PostgreSQL
    const client = await pool.connect();
    console.log('✅ Booking Service connected to PostgreSQL');
    client.release();

    // Подписка на топик
    await consumer.subscribe({ topic: 'booking-events', fromBeginning: true });
    console.log('📡 Subscribed to booking-events topic');

    // Обработка сообщений
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`📥 Message received from ${topic} [${partition}]`);
        await processBookingEvent(message);
      },
    });

    console.log('🚀 Booking Service is running...');
  } catch (error) {
    console.error('❌ Error starting Booking Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await consumer.disconnect();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await consumer.disconnect();
  await pool.end();
  process.exit(0);
});

run();
