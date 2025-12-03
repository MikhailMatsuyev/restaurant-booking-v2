# 🔄 Migration Guide: Restaurant Booking → Event Booking v2.0

Руководство по миграции с версии restaurant-booking на restaurant-booking-v2

## 📊 Сравнение версий

| Аспект | restaurant-booking v1 | restaurant-booking-v2 |
|--------|----------------------|----------------------|
| **Предметная область** | Рестораны и столики | Мероприятия |
| **БД: Главная сущность** | `restaurants` + `tables` | `events` |
| **БД: Бронирование** | `bookings` (table_id, restaurant_id) | `bookings` (event_id) |
| **API endpoint** | `POST /bookings` | `POST /api/bookings/reserve` |
| **Поля запроса** | restaurant_id, table_id, user_name, date | event_id, user_id |
| **Логика мест** | Привязка к конкретному столику | Общий пул мест |

## 🔄 Изменения в структуре БД

### Было (v1)
```sql
-- 3 таблицы
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    location VARCHAR
);

CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(id),
    table_number INT,
    seats INT
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(id),
    table_id INT REFERENCES tables(id),
    user_name VARCHAR,
    booking_date DATE
);
```

### Стало (v2)
```sql
-- 2 таблицы
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_seats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id),
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Ключевые изменения:
1. ✅ Удалены таблицы `restaurants` и `tables`
2. ✅ Добавлена таблица `events`
3. ✅ Упрощена структура `bookings`
4. ✅ `user_name` → `user_id`
5. ✅ `booking_date` → `created_at` (автоматически)

## 🔄 Миграция данных

### Если нужно перенести данные из старой БД

#### Шаг 1: Экспорт старых данных
```sql
-- Подключитесь к старой БД
psql -U postgres -d restaurant_booking

-- Экспортируйте рестораны как мероприятия
COPY (
  SELECT 
    r.id,
    CONCAT(r.name, ' - ', r.location) as name,
    SUM(t.seats) as total_seats
  FROM restaurants r
  JOIN tables t ON r.id = t.restaurant_id
  GROUP BY r.id, r.name, r.location
) TO '/tmp/events_export.csv' WITH CSV HEADER;

-- Экспортируйте бронирования
COPY (
  SELECT 
    b.id,
    b.restaurant_id as event_id,
    b.user_name as user_id,
    b.created_at
  FROM bookings b
) TO '/tmp/bookings_export.csv' WITH CSV HEADER;
```

#### Шаг 2: Импорт в новую БД
```sql
-- Подключитесь к новой БД
psql -U postgres -d event_booking

-- Импортируйте мероприятия
COPY events(id, name, total_seats)
FROM '/tmp/events_export.csv' WITH CSV HEADER;

-- Импортируйте бронирования
COPY bookings(id, event_id, user_id, created_at)
FROM '/tmp/bookings_export.csv' WITH CSV HEADER;
```

## 🔄 Изменения в API

### Было (v1)
```javascript
// POST /bookings
{
  "restaurant_id": 1,
  "table_id": 2,
  "user_name": "John Doe",
  "booking_date": "2025-01-15"
}
```

### Стало (v2)
```javascript
// POST /api/bookings/reserve
{
  "event_id": 1,
  "user_id": "user123"
}
```

### Маппинг полей:
- `restaurant_id` → `event_id`
- `table_id` → удалено (больше не нужно)
- `user_name` → `user_id`
- `booking_date` → удалено (автоматически `created_at`)

## 🔄 Обновление клиентского кода

### Frontend: Запрос бронирования

**Было:**
```javascript
fetch('http://localhost:3000/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    restaurant_id: restaurantId,
    table_id: tableId,
    user_name: userName,
    booking_date: date
  })
});
```

**Стало:**
```javascript
fetch('http://localhost:3000/api/bookings/reserve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_id: eventId,
    user_id: userId
  })
});
```

### Frontend: Получение списка

**Было:**
```javascript
// GET /restaurants
const response = await fetch('http://localhost:3000/restaurants');
const restaurants = await response.json();
```

**Стало:**
```javascript
// GET /events
const response = await fetch('http://localhost:3000/events');
const result = await response.json();
const events = result.data; // ⚠️ Обратите внимание на структуру ответа
```

## 🔄 Kafka Events

### Было (v1)
```json
{
  "type": "BOOKING_CREATED",
  "data": {
    "id": 1,
    "restaurant_id": 1,
    "table_id": 2,
    "user_name": "John Doe"
  }
}
```

### Стало (v2)
```json
{
  "type": "BOOKING_CREATED",
  "data": {
    "id": 1,
    "event_id": 1,
    "event_name": "Rock Concert 2025",
    "user_id": "user123",
    "created_at": "2025-12-02T10:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.123Z"
}
```

## 📋 Чек-лист миграции

### Перед миграцией:
- [ ] Сделайте backup старой базы данных
- [ ] Экспортируйте критичные данные
- [ ] Задокументируйте текущий API

### Во время миграции:
- [ ] Остановите старые сервисы
- [ ] Запустите новую инфраструктуру (docker-compose)
- [ ] Импортируйте данные (если нужно)
- [ ] Запустите новые сервисы

### После миграции:
- [ ] Протестируйте все endpoints
- [ ] Проверьте работу Kafka
- [ ] Обновите клиентский код
- [ ] Обновите документацию

## 🧪 Тестирование после миграции

```bash
# 1. Проверьте что сервисы работают
curl http://localhost:3000/events

# 2. Создайте тестовое бронирование
curl -X POST http://localhost:3000/api/bookings/reserve \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1, "user_id": "test_user"}'

# 3. Проверьте бронирования пользователя
curl http://localhost:3000/api/bookings/user/test_user

# 4. Проверьте события в Kafka
docker exec -it event-booking-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking-events \
  --from-beginning
```

## 🔄 Параллельный запуск (если нужен)

Если вам нужно запустить обе версии одновременно:

```yaml
# docker-compose.yml для v2
services:
  postgres:
    ports:
      - "5433:5432"  # Используйте другой порт
  kafka:
    ports:
      - "9093:9092"  # Используйте другой порт
```

```bash
# API Service v2
PORT=3001 npm run start:dev
```

```bash
# Frontend v2
python3 -m http.server 8081
```

## 🎯 Преимущества новой версии

1. **Упрощенная структура БД**
   - Меньше таблиц
   - Проще запросы
   - Легче масштабировать

2. **Более гибкая модель бронирования**
   - Нет привязки к конкретному столику/месту
   - Проще управлять доступностью
   - Автоматический подсчет свободных мест

3. **Улучшенный API**
   - Меньше обязательных полей
   - Консистентная структура ответов
   - Лучшая обработка ошибок

4. **Лучшая типизация**
   - TypeScript в API Service
   - Строгие интерфейсы
   - Меньше runtime ошибок

## ❓ FAQ

**Q: Можно ли вернуться к старой версии?**  
A: Да, если вы сделали backup БД. Просто восстановите старую схему.

**Q: Что делать со старыми бронированиями?**  
A: Используйте скрипт миграции выше или создайте архивную таблицу.

**Q: Изменился ли формат Kafka событий?**  
A: Да, структура немного изменилась. Обновите consumers.

**Q: Нужно ли переписывать весь клиентский код?**  
A: Зависит от архитектуры. Можно создать адаптер для совместимости.

---

**Версия:** 2.0.0  
**Дата:** 2025-12-02
