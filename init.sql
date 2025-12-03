-- Удаляем старые таблицы если существуют
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Создаем таблицу мероприятий
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу бронирований
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_event UNIQUE (event_id, user_id)
);


-- Создаем индексы для оптимизации запросов
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Вставляем тестовые мероприятия
INSERT INTO events (name, total_seats) VALUES
    ('Rock Concert 2025', 1000),
    ('Tech Conference', 500),
    ('Stand-up Comedy Show', 200),
    ('Classical Music Evening', 300),
    ('Business Networking Event', 150);

-- Комментарии для документации
COMMENT ON TABLE events IS 'Таблица мероприятий с информацией о доступных местах';
COMMENT ON TABLE bookings IS 'Таблица бронирований мест на мероприятия';
COMMENT ON COLUMN events.total_seats IS 'Общее количество мест на мероприятии';
COMMENT ON COLUMN bookings.event_id IS 'Ссылка на мероприятие';
COMMENT ON COLUMN bookings.user_id IS 'Идентификатор пользователя';
