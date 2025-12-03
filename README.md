# 🎟️ Event Booking System v2.0

Event-driven система бронирования мест на мероприятия с использованием **Kafka**, **PostgreSQL**, **NestJS** и **Vanilla JS**.

## 🏗️ Архитектура

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Frontend   │ ───> │ API Service  │ ───> │   PostgreSQL    │
│ (HTML/JS)   │      │  (NestJS)    │      │   (Database)    │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Kafka    │
                     └─────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Booking Service  │
                  │   (Node.js)      │
                  └──────────────────┘
```

## 📦 Структура проекта

```
restaurant-booking-v2/
├── api-service/              # REST API (NestJS)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── database.service.ts
│   │   ├── kafka.service.ts
│   │   ├── events.controller.ts
│   │   └── bookings.controller.ts
│   ├── package.json
│   └── tsconfig.json
├── booking-service/          # Kafka Consumer (Node.js)
│   ├── index.js
│   └── package.json
├── frontend/                 # UI (HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── docker-compose.yml        # Docker services
└── init.sql                  # Database schema
```

## 🗄️ Структура базы данных

### Таблица `events`
```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_seats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица `bookings`
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id),
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Быстрый старт

### 1. Запустите Docker контейнеры

```bash
cd restaurant-booking-v2
docker-compose up -d
```

Это запустит:
- PostgreSQL (порт 5432)
- Kafka (порт 9092)
- Zookeeper (порт 2181)

### 2. Проверьте, что контейнеры работают

```bash
docker-compose ps
```

Должны работать 3 контейнера:
- event-booking-postgres
- event-booking-kafka
- event-booking-zookeeper

### 3. Проверьте базу данных

```bash
docker exec -it event-booking-postgres psql -U postgres -d event_booking -c "SELECT * FROM events;"
```

Должны быть видны 5 тестовых мероприятий.

### 4. Установите зависимости и запустите API Service

```bash
cd api-service
npm install
npm run start:dev
```

API будет доступен на http://localhost:3000

### 5. Установите зависимости и запустите Booking Service

**Откройте новый терминал:**

```bash
cd booking-service
npm install
npm start
```

### 6. Запустите Frontend

**Откройте третий терминал:**

```bash
cd frontend
python3 -m http.server 8080
```

Или используйте любой другой HTTP сервер:
```bash
# Альтернатива 1: Node.js
npx http-server -p 8080

# Альтернатива 2: PHP
php -S localhost:8080
```

### 7. Откройте в браузере

```
http://localhost:8080
```

## 📡 API Endpoints

### Events

#### Получить все мероприятия
```http
GET /events
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Rock Concert 2025",
      "total_seats": 1000,
      "booked_seats": 0,
      "available_seats": 1000,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### Получить мероприятие по ID
```http
GET /events/:id
```

#### Получить доступные места
```http
GET /events/:id/available-seats
```

### Bookings

#### Забронировать место
```http
POST /api/bookings/reserve
Content-Type: application/json

{
  "event_id": 1,
  "user_id": "user123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking_id": 42,
    "event_id": 1,
    "event_name": "Rock Concert 2025",
    "user_id": "user123",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Response (Error - No seats):**
```json
{
  "success": false,
  "error": "No available seats for this event"
}
```

#### Получить бронирования пользователя
```http
GET /api/bookings/user/:userId
```

## 🔧 Настройка переменных окружения

### API Service
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_booking
DB_USER=postgres
DB_PASSWORD=postgres
KAFKA_BROKER=localhost:9092
PORT=3000
```

### Booking Service
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_booking
DB_USER=postgres
DB_PASSWORD=postgres
KAFKA_BROKER=localhost:9092
```

## 🎯 Функциональность

### ✅ Реализовано

1. **Просмотр мероприятий**
   - Список всех доступных мероприятий
   - Информация о количестве мест
   - Реальное время обновление доступности

2. **Бронирование мест**
   - Резервирование места на мероприятие
   - Проверка доступности мест
   - Транзакционная безопасность (ACID)

3. **Event-Driven Architecture**
   - Отправка событий в Kafka при создании бронирования
   - Асинхронная обработка бронирований
   - Логирование и уведомления

4. **История бронирований**
   - Просмотр всех бронирований пользователя
   - Детальная информация о каждом бронировании

### 🚀 Возможные улучшения

1. **Аутентификация**
   - JWT токены
   - OAuth 2.0
   - Роли пользователей

2. **Уведомления**
   - Email уведомления (SendGrid, AWS SES)
   - SMS уведомления (Twilio)
   - Push уведомления

3. **Платежи**
   - Интеграция со Stripe
   - Интеграция с PayPal

4. **Отмена бронирований**
   - Возможность отменить бронирование
   - Возврат средств

5. **Аналитика**
   - Dashboard с метриками
   - Отчеты о популярности мероприятий

## 🧪 Тестирование

### Проверка API с curl

```bash
# Получить все мероприятия
curl http://localhost:3000/events

# Забронировать место
curl -X POST http://localhost:3000/api/bookings/reserve \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1, "user_id": "user123"}'

# Получить бронирования пользователя
curl http://localhost:3000/api/bookings/user/user123
```

## 🛑 Остановка проекта

```bash
# Остановить Docker контейнеры
docker-compose down

# Удалить volumes (очистить базу данных)
docker-compose down -v
```

## 📊 Мониторинг

### Проверка логов

```bash
# API Service
# Смотрите в терминале где запущен npm run start:dev

# Booking Service
# Смотрите в терминале где запущен npm start

# Docker containers
docker-compose logs -f postgres
docker-compose logs -f kafka
```

### Проверка базы данных

```bash
# Подключение к PostgreSQL
docker exec -it event-booking-postgres psql -U postgres -d event_booking

# SQL запросы
SELECT * FROM events;
SELECT * FROM bookings;
SELECT COUNT(*) FROM bookings WHERE event_id = 1;
```

### Проверка Kafka

```bash
# Список топиков
docker exec -it event-booking-kafka kafka-topics --list --bootstrap-server localhost:9092

# Просмотр сообщений
docker exec -it event-booking-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking-events \
  --from-beginning
```

## 🐛 Решение проблем

### Проблема: Не могу подключиться к PostgreSQL

**Решение:**
```bash
# Проверьте что контейнер запущен
docker ps | grep postgres

# Проверьте логи
docker logs event-booking-postgres

# Перезапустите контейнер
docker-compose restart postgres
```

### Проблема: Kafka не отвечает

**Решение:**
```bash
# Проверьте статус
docker-compose ps

# Перезапустите Kafka и Zookeeper
docker-compose restart zookeeper kafka

# Подождите 30 секунд для инициализации
```

### Проблема: Frontend не видит API

**Решение:**
1. Проверьте что API Service запущен (http://localhost:3000/events)
2. Проверьте CORS настройки в main.ts
3. Откройте консоль браузера для просмотра ошибок

## 📝 Лицензия

MIT License

## 👨‍💻 Автор

Учебный проект для изучения event-driven архитектуры

---

**Версия:** 2.0.0  
**Дата:** 2025-12-02
