#!/bin/bash

echo "🚀 Starting Tier Listing Backend Setup..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database credentials before continuing"
    echo "   DATABASE_URL=postgresql://username:password@localhost:5432/tier_listing_db"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Create database: CREATE DATABASE tier_listing_db;"
echo "3. Update .env file with your database credentials"
echo "4. Run: npm run db:migrate"
echo "5. Run: npm run db:seed"
echo "6. Start server: npm run dev"
echo ""
echo "🌐 Server will run on: http://localhost:4000"
echo "📊 Health check: http://localhost:4000/health" 