# 🗄️ pgAdmin Connection Guide

## 📋 **Your PostgreSQL Connection Details**

Based on your `.env` file, here are your database connection details:

### **Connection Information:**
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `tier_listing_db`
- **Username**: `mehdi`
- **Password**: `(none - using local authentication)`
- **Connection String**: `postgresql://mehdi@localhost:5432/tier_listing_db`

## 🛠️ **Step 1: Install pgAdmin (if not already installed)**

### **macOS (using Homebrew):**
```bash
brew install --cask pgadmin4
```

### **Alternative: Download from Official Site:**
1. Go to: https://www.pgadmin.org/download/
2. Download pgAdmin 4 for macOS
3. Install the downloaded package

## 🔗 **Step 2: Create New Server Connection in pgAdmin**

### **1. Open pgAdmin**
- Launch pgAdmin 4 from Applications or Spotlight
- pgAdmin will open in your default web browser (usually http://127.0.0.1:5050)

### **2. Create New Server**
1. **Right-click** on "Servers" in the left sidebar
2. Select **"Register"** → **"Server..."**
3. In the **"General"** tab:
   - **Name**: `Tier Listing Local DB` (or any name you prefer)

### **3. Configure Connection**
In the **"Connection"** tab, enter these exact details:

```
Host name/address: localhost
Port: 5432
Maintenance database: tier_listing_db
Username: mehdi
Password: (leave blank - using local authentication)
```

### **4. Advanced Settings (Optional)**
In the **"Advanced"** tab:
- **DB restriction**: `tier_listing_db` (to only show this database)

### **5. Save Connection**
- Click **"Save"**
- pgAdmin will test the connection automatically

## ✅ **Step 3: Verify Connection**

### **Test Connection:**
1. **Expand** your server in the left sidebar
2. **Expand** "Databases"
3. **Expand** "tier_listing_db"
4. **Expand** "Schemas" → "public"
5. **Expand** "Tables"

You should see these 5 tables:
- `tiers`
- `cards`
- `source_cards`
- `comments`
- `versions`

## 📚 **Step 4: Explore Your Database**

### **A. View Table Structures**

#### **1. View Table Schema:**
1. **Right-click** on any table (e.g., `tiers`)
2. Select **"Properties"**
3. Go to **"Columns"** tab
4. See all columns, data types, constraints, and defaults

#### **2. View Table Relationships:**
1. **Right-click** on table
2. Select **"Properties"**
3. Go to **"Constraints"** tab
4. See foreign keys and relationships

### **B. Browse Data**

#### **1. View Table Data:**
1. **Right-click** on any table
2. Select **"View/Edit Data"** → **"All Rows"**
3. See all data in a spreadsheet-like interface

#### **2. Execute Custom Queries:**
1. **Right-click** on your database
2. Select **"Query Tool"**
3. Write SQL queries like:
   ```sql
   -- View all tiers with their cards
   SELECT t.name, t.color, COUNT(c.id) as card_count
   FROM tiers t
   LEFT JOIN cards c ON t.tier_id = c.tier_id
   GROUP BY t.id, t.name, t.color
   ORDER BY t.position;
   ```

### **C. Useful Queries for Your Tier Listing Tool**

#### **1. Database Overview:**
```sql
-- Count records in each table
SELECT 'tiers' as table_name, COUNT(*) as count FROM tiers
UNION ALL
SELECT 'cards', COUNT(*) FROM cards
UNION ALL
SELECT 'source_cards', COUNT(*) FROM source_cards
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'versions', COUNT(*) FROM versions;
```

#### **2. View Tiers with Cards:**
```sql
SELECT 
    t.tier_id,
    t.name,
    t.color,
    t.position,
    COUNT(c.id) as card_count
FROM tiers t
LEFT JOIN cards c ON t.tier_id = c.tier_id
GROUP BY t.id, t.tier_id, t.name, t.color, t.position
ORDER BY t.position;
```

#### **3. View Cards with Comments:**
```sql
SELECT 
    c.card_id,
    c.text,
    c.type,
    t.name as tier_name,
    COUNT(com.id) as comment_count
FROM cards c
LEFT JOIN tiers t ON c.tier_id = t.tier_id
LEFT JOIN comments com ON c.card_id = com.card_id
GROUP BY c.id, c.card_id, c.text, c.type, t.name
ORDER BY t.position, c.position;
```

#### **4. View Source Cards by Category:**
```sql
SELECT 
    source_category,
    COUNT(*) as count,
    STRING_AGG(text, ', ') as examples
FROM source_cards
GROUP BY source_category
ORDER BY source_category;
```

## 🔧 **Step 5: Troubleshooting**

### **Connection Issues:**

#### **1. "Connection refused" Error:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql
```

#### **2. "Authentication failed" Error:**
```bash
# Test connection from command line
psql -h localhost -p 5432 -U mehdi -d tier_listing_db

# If this works, pgAdmin should work too
```

#### **3. "Database does not exist" Error:**
```bash
# List all databases
psql -h localhost -p 5432 -U mehdi -l

# Create database if missing
createdb -h localhost -p 5432 -U mehdi tier_listing_db
```

### **pgAdmin Issues:**

#### **1. pgAdmin won't start:**
```bash
# Kill existing processes
pkill -f pgadmin

# Restart pgAdmin
open -a pgAdmin4
```

#### **2. Browser connection issues:**
- Try: http://127.0.0.1:5050 instead of localhost
- Check if port 5050 is available: `lsof -i :5050`

## 🎯 **Step 6: Advanced Features**

### **A. Create Database Diagrams:**
1. **Right-click** on your database
2. Select **"ERD Tool"**
3. Add tables and see relationships visually

### **B. Export/Import Data:**
1. **Right-click** on table
2. Select **"Import/Export"**
3. Choose format (CSV, JSON, etc.)

### **C. Monitor Performance:**
1. **Right-click** on server
2. Select **"Dashboard"**
3. View database statistics and performance

## 📊 **Your Current Database Status**

Based on your backend, you should see:
- **📊 Tiers**: 10 records
- **🃏 Cards**: 7 records
- **📋 Source Cards**: 8 records
- **💬 Comments**: 2 records
- **📚 Versions**: 1 record

## 🚀 **Quick Start Commands**

### **Test Connection:**
```bash
psql -h localhost -p 5432 -U mehdi -d tier_listing_db -c "SELECT COUNT(*) FROM tiers;"
```

### **View All Tables:**
```bash
psql -h localhost -p 5432 -U mehdi -d tier_listing_db -c "\dt"
```

### **View Table Structure:**
```bash
psql -h localhost -p 5432 -U mehdi -d tier_listing_db -c "\d tiers"
```

---

## 🎉 **You're Ready!**

Once connected to pgAdmin, you'll have:
- ✅ **Visual database exploration**
- ✅ **Real-time data viewing**
- ✅ **SQL query execution**
- ✅ **Schema analysis**
- ✅ **Data export/import**
- ✅ **Performance monitoring**

**Happy Database Exploring! 🗄️✨** 