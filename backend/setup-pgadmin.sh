#!/bin/bash

echo "🗄️  PostgreSQL Database Connection Setup"
echo "========================================"
echo ""

echo "📋 Your Database Connection Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: tier_listing_db"
echo "   Username: mehdi"
echo "   Password: (none - using local authentication)"
echo ""

echo "🔍 Verifying database connection..."
if psql -h localhost -p 5432 -U mehdi -d tier_listing_db -c "SELECT COUNT(*) FROM tiers;" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    echo ""
    
    echo "📊 Current database status:"
    echo "   Tiers: $(psql -h localhost -p 5432 -U mehdi -d tier_listing_db -t -c "SELECT COUNT(*) FROM tiers;" | xargs)"
    echo "   Cards: $(psql -h localhost -p 5432 -U mehdi -d tier_listing_db -t -c "SELECT COUNT(*) FROM cards;" | xargs)"
    echo "   Source Cards: $(psql -h localhost -p 5432 -U mehdi -d tier_listing_db -t -c "SELECT COUNT(*) FROM source_cards;" | xargs)"
    echo "   Comments: $(psql -h localhost -p 5432 -U mehdi -d tier_listing_db -t -c "SELECT COUNT(*) FROM comments;" | xargs)"
    echo "   Versions: $(psql -h localhost -p 5432 -U mehdi -d tier_listing_db -t -c "SELECT COUNT(*) FROM versions;" | xargs)"
    echo ""
    
    echo "🚀 Launching pgAdmin 4..."
    open -a "pgAdmin 4"
    echo ""
    
    echo "📖 Next Steps:"
    echo "   1. pgAdmin will open in your browser"
    echo "   2. Right-click 'Servers' → 'Register' → 'Server...'"
    echo "   3. Use these connection details:"
    echo "      - Name: Tier Listing Local DB"
    echo "      - Host: localhost"
    echo "      - Port: 5432"
    echo "      - Database: tier_listing_db"
    echo "      - Username: mehdi"
    echo "      - Password: (leave blank)"
    echo ""
    
    echo "📚 For detailed instructions, see: PGADMIN_CONNECTION_GUIDE.md"
    echo ""
    
    echo "🌐 Alternative: Use your web-based database viewer at:"
    echo "   http://localhost:5556"
    echo ""
    
else
    echo "❌ Database connection failed!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check if PostgreSQL is running:"
    echo "      brew services list | grep postgresql"
    echo ""
    echo "   2. Start PostgreSQL if needed:"
    echo "      brew services start postgresql"
    echo ""
    echo "   3. Check your .env file for correct DATABASE_URL"
    echo ""
fi

echo "========================================" 