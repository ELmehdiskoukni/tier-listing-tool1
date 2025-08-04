# Database Inspection Guide

## 🔍 **How to Check Your PostgreSQL Database**

This guide shows you various ways to inspect your `tier_listing_db` database.

## 📋 **Quick Database Overview**

### **Current Database Status:**
- **Database Name**: `tier_listing_db`
- **Tables**: 5 (tiers, cards, source_cards, comments, versions)
- **Total Records**: 
  - Tiers: 10 (including test data)
  - Cards: 7 (including test data)
  - Source Cards: 8 (including test data)
  - Comments: 2 (sample data)
  - Versions: 1 (initial version)

## 🛠️ **Database Commands**

### **1. Connect to Database**
```bash
# Connect to the database
psql tier_listing_db

# Or run a single command
psql tier_listing_db -c "YOUR_QUERY_HERE"
```

### **2. List All Tables**
```bash
psql tier_listing_db -c "\dt"
```

### **3. Check Table Structure**
```bash
# Check tiers table structure
psql tier_listing_db -c "\d tiers"

# Check cards table structure
psql tier_listing_db -c "\d cards"

# Check source_cards table structure
psql tier_listing_db -c "\d source_cards"

# Check comments table structure
psql tier_listing_db -c "\d comments"

# Check versions table structure
psql tier_listing_db -c "\d versions"
```

## 📊 **Data Inspection Queries**

### **Count Records in Each Table**
```bash
psql tier_listing_db -c "
SELECT 'tiers' as table_name, COUNT(*) as count FROM tiers
UNION ALL
SELECT 'cards', COUNT(*) FROM cards
UNION ALL
SELECT 'source_cards', COUNT(*) FROM source_cards
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'versions', COUNT(*) FROM versions;"
```

### **View All Tiers**
```bash
psql tier_listing_db -c "SELECT * FROM tiers ORDER BY position;"
```

### **View All Cards with Tier Information**
```bash
psql tier_listing_db -c "
SELECT 
    c.card_id,
    c.text,
    c.type,
    c.subtype,
    c.hidden,
    t.name as tier_name,
    c.position,
    c.created_at
FROM cards c
LEFT JOIN tiers t ON c.tier_id = t.tier_id
ORDER BY t.position, c.position;"
```

### **View Source Cards by Category**
```bash
psql tier_listing_db -c "
SELECT 
    card_id,
    text,
    type,
    subtype,
    source_category,
    created_at
FROM source_cards
ORDER BY source_category, created_at;"
```

### **View Comments with Card Information**
```bash
psql tier_listing_db -c "
SELECT 
    c.comment_id,
    c.text,
    c.card_id,
    card.text as card_text,
    c.created_at
FROM comments c
LEFT JOIN cards card ON c.card_id = card.card_id
ORDER BY c.created_at;"
```

### **View Latest Version**
```bash
psql tier_listing_db -c "
SELECT 
    version_id,
    description,
    created_at,
    LENGTH(tiers_data::text) as tiers_data_size,
    LENGTH(source_cards_data::text) as source_cards_data_size
FROM versions
ORDER BY created_at DESC
LIMIT 1;"
```

## 🔍 **Advanced Queries**

### **Find Cards in Specific Tier**
```bash
psql tier_listing_db -c "
SELECT 
    card_id,
    text,
    type,
    position,
    created_at
FROM cards
WHERE tier_id = 'tier-a'
ORDER BY position;"
```

### **Find Source Cards by Type**
```bash
psql tier_listing_db -c "
SELECT 
    card_id,
    text,
    source_category,
    created_at
FROM source_cards
WHERE type = 'competitor'
ORDER BY created_at;"
```

### **Find Recent Activity**
```bash
psql tier_listing_db -c "
SELECT 
    'tier' as type,
    tier_id as id,
    name as text,
    created_at
FROM tiers
WHERE created_at > NOW() - INTERVAL '1 day'
UNION ALL
SELECT 
    'card' as type,
    card_id as id,
    text,
    created_at
FROM cards
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;"
```

### **Check for Orphaned Records**
```bash
psql tier_listing_db -c "
SELECT 
    'Cards without valid tier' as issue,
    COUNT(*) as count
FROM cards c
LEFT JOIN tiers t ON c.tier_id = t.tier_id
WHERE t.tier_id IS NULL
UNION ALL
SELECT 
    'Comments without valid card' as issue,
    COUNT(*) as count
FROM comments c
LEFT JOIN cards card ON c.card_id = card.card_id
WHERE card.card_id IS NULL;"
```

## 🧹 **Database Maintenance Queries**

### **Delete Test Data**
```bash
# Delete cards created during testing (adjust the date as needed)
psql tier_listing_db -c "
DELETE FROM cards 
WHERE created_at > '2025-08-03 17:00:00';"

# Delete tiers created during testing
psql tier_listing_db -c "
DELETE FROM tiers 
WHERE created_at > '2025-08-03 17:00:00';"

# Delete source cards created during testing
psql tier_listing_db -c "
DELETE FROM source_cards 
WHERE created_at > '2025-08-03 17:00:00';"
```

### **Reset to Initial State**
```bash
# Clear all data and re-seed
psql tier_listing_db -c "TRUNCATE cards, comments, source_cards, versions CASCADE;"
psql tier_listing_db -c "DELETE FROM tiers WHERE tier_id NOT IN ('tier-a', 'tier-b', 'tier-c', 'tier-d', 'tier-e');"

# Then run the seed script
npm run db:seed
```

## 📈 **Performance Queries**

### **Check Table Sizes**
```bash
psql tier_listing_db -c "
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename IN ('tiers', 'cards', 'source_cards', 'comments', 'versions')
ORDER BY tablename, attname;"
```

### **Check Index Usage**
```bash
psql tier_listing_db -c "
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('tiers', 'cards', 'source_cards', 'comments', 'versions')
ORDER BY tablename, indexname;"
```

## 🎯 **Useful One-Liners**

### **Quick Status Check**
```bash
psql tier_listing_db -c "SELECT 'Database Status' as status, NOW() as checked_at, (SELECT COUNT(*) FROM tiers) as tiers, (SELECT COUNT(*) FROM cards) as cards, (SELECT COUNT(*) FROM source_cards) as source_cards;"
```

### **Export Data to CSV**
```bash
# Export tiers to CSV
psql tier_listing_db -c "\copy (SELECT * FROM tiers) TO 'tiers.csv' CSV HEADER"

# Export cards to CSV
psql tier_listing_db -c "\copy (SELECT * FROM cards) TO 'cards.csv' CSV HEADER"
```

### **Backup Database**
```bash
# Create a backup
pg_dump tier_listing_db > tier_listing_backup.sql

# Restore from backup
psql tier_listing_db < tier_listing_backup.sql
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Connection Refused**
   ```bash
   # Check if PostgreSQL is running
   brew services list | grep postgresql
   
   # Start PostgreSQL if needed
   brew services start postgresql
   ```

2. **Database Doesn't Exist**
   ```bash
   # Create the database
   createdb tier_listing_db
   ```

3. **Permission Issues**
   ```bash
   # Check your PostgreSQL user
   whoami
   
   # Create user if needed
   createuser -s $(whoami)
   ```

## 📚 **PostgreSQL Help**

### **Get Help in psql**
```bash
# Connect to database
psql tier_listing_db

# Then use these commands:
\?          # List all psql commands
\h          # Get help on SQL commands
\d          # List tables
\d+         # List tables with details
\q          # Quit psql
```

---

**Happy Database Exploring! 🗄️** 