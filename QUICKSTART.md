# ⚡ Quick Start Guide

Быстрое руководство для запуска Event Booking System v2.0

### restaurant-booking-v2)
- Бронирование **мест на мероприятия**
- Таблицы: `events`, `bookings`
- API endpoint: `POST /api/bookings/reserve`

## 🚀 Запуск за 3 минуты

### Шаг 1: Запустите инфраструктуру
```bash
cd restaurant-booking-v2
chmod +x start-all.sh
./start-all.sh
```

### Шаг 2: Запустите API Service (новый терминал)
```bash
cd restaurant-booking-v2/api-service
npm install
npm run start:dev
```

Дождитесь сообщения:
```
✅ Connected to PostgreSQL
✅ Connected to Kafka
🚀 API Service is running on: http://localhost:3000
```

### Шаг 3: Запустите Booking Service (новый терминал)
```bash
cd restaurant-booking-v2/booking-service
npm install
npm start
```

Дождитесь сообщения:
```
✅ Booking Service connected to Kafka
✅ Booking Service connected to PostgreSQL
📡 Subscribed to booking-events topic
🚀 Booking Service is running...
```

### Шаг 4: Запустите Frontend (новый терминал)
```bash
cd restaurant-booking-v2/frontend
npx http-server -p 8080 -c-1
```

### Шаг 5: Откройте браузер
```
http://localhost:8080
```

## 🧪 Тестирование API

### 1. Получить все мероприятия
```bash
curl http://localhost:3000/events
```

### 2. Забронировать место
```bash
curl -X POST http://localhost:3000/api/bookings/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "user_id": "user123"
  }'
```

Ответ:
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking_id": 1,
    "event_id": 1,
    "event_name": "Rock Concert 2025",
    "user_id": "user123",
    "created_at": "2025-12-02T10:30:00.000Z"
  }
}
```

### 3. Получить бронирования пользователя
```bash
curl http://localhost:3000/api/bookings/user/user123
```

## 📊 Проверка работы Kafka

```bash
# Подключитесь к контейнеру Kafka
docker exec -it event-booking-kafka bash

# Просмотрите события в реальном времени
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking-events \
  --from-beginning
```

## 🗄️ Проверка базы данных

```bash
# Подключитесь к PostgreSQL
docker exec -it event-booking-postgres psql -U postgres -d event_booking

# SQL запросы
SELECT * FROM events;
SELECT * FROM bookings;

# Проверка доступных мест для мероприятия
SELECT 
  e.name,
  e.total_seats,
  COUNT(b.id) as booked,
  (e.total_seats - COUNT(b.id)) as available
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id
GROUP BY e.id;
```

## 🛑 Остановка системы

```bash
# Остановите Node.js процессы
# Нажмите Ctrl+C в терминалах где запущены сервисы

# Остановите Docker контейнеры
docker-compose down

# Полная очистка (включая данные)
docker-compose down -v
```

## 🔄 Перезапуск после изменений

### Если изменили код API Service:
```bash
# Не нужно перезапускать - работает nodemon с hot-reload
# Изменения применятся автоматически
```

### Если изменили код Booking Service:
```bash
# Остановите (Ctrl+C) и запустите снова
npm start
```

### Если изменили Frontend:
```bash
# Просто обновите страницу в браузере (F5)
```

### Если изменили базу данных (init.sql):
```bash
# Пересоздайте базу данных
docker-compose down -v
docker-compose up -d
sleep 10
# База пересоздастся автоматически
```

## 📱 Интерфейс

### Экран бронирования
- Введите свой User ID (например: `user123`)
- Просмотрите список мероприятий
- Нажмите "Book Now" для бронирования
- Увидите уведомление об успешном бронировании

### Просмотр бронирований
- Нажмите "Load My Bookings"
- Увидите список ваших бронирований

## 🐛 Частые проблемы

### Порт 3000 занят
```bash
# Найдите процесс
lsof -i :3000

# Остановите его
kill -9 <PID>
```

### Порт 5432 занят (PostgreSQL)
```bash
# Измените порт в docker-compose.yml
ports:
  - "5433:5432"  # Используйте 5433 вместо 5432
```

### Kafka не запускается
```bash
# Увеличьте таймаут
docker-compose restart zookeeper
sleep 15
docker-compose restart kafka
sleep 15
```

## ✅ Чек-лист готовности

- [ ] Docker запущен и работает
- [ ] Все 3 контейнера работают (`docker-compose ps`)
- [ ] API Service отвечает на http://localhost:3000/events
- [ ] Booking Service показывает логи о подключении
- [ ] Frontend открывается на http://localhost:8080
- [ ] Можно создать тестовое бронирование

## 🎓 Следующие шаги

1. Изучите код API Service (`api-service/src/`)
2. Посмотрите как работает Kafka Consumer (`booking-service/index.js`)
3. Попробуйте добавить новые endpoints
4. Добавьте валидацию данных
5. Реализуйте отмену бронирований

---

Удачи! 🚀
