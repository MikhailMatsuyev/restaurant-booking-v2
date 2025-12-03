#!/bin/bash

echo "🚀 Starting Event Booking System v2.0"
echo "======================================"

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Запуск Docker контейнеров
echo "📦 Starting Docker containers..."
docker-compose up -d

# Ждем пока контейнеры запустятся
echo "⏳ Waiting for services to start..."
sleep 10

# Проверка базы данных
echo "🗄️  Checking database..."
docker exec -it event-booking-postgres psql -U postgres -d event_booking -c "SELECT COUNT(*) FROM events;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database is ready"
else
    echo "⚠️  Database might need initialization"
fi

echo ""
echo "======================================"
echo "✅ Infrastructure is ready!"
echo ""
echo "Now run in separate terminals:"
echo ""
echo "Terminal 1 (API Service):"
echo "  cd api-service && npm install && npm run start:dev"
echo ""
echo "Terminal 2 (Booking Service):"
echo "  cd booking-service && npm install && npm start"
echo ""
echo "Terminal 3 (Frontend):"
echo "  cd frontend && python3 -m http.server 8080"
echo ""
echo "Then open: http://localhost:8080"
echo "======================================"
