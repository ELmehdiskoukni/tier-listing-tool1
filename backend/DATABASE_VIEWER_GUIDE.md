# Database Viewer Guide

## 🗄️ **Database Schema Visualization**

Your database viewer is now running on **http://localhost:5556**

## 🌐 **Access the Viewer**

Open your browser and go to:
```
http://localhost:5556
```

## 📊 **What You'll See**

### **1. Statistics Dashboard**
- Real-time counts of all tables
- Visual cards showing:
  - 📊 Tiers: 10
  - 🃏 Cards: 7
  - 📋 Source Cards: 8
  - 💬 Comments: 2
  - 📚 Versions: 1

### **2. Database Schema**
- Complete table structure for all 5 tables
- Column names, data types, nullable status, and defaults
- Tables shown:
  - `tiers`
  - `cards`
  - `source_cards`
  - `comments`
  - `versions`

### **3. Live Data Tables**
- Real-time data from each table
- Sortable and searchable
- Auto-refreshes every 30 seconds
- Hover effects for better UX

## 🔧 **Features**

### **Auto-Refresh**
- Data automatically refreshes every 30 seconds
- Click "🔄 Refresh Data" button for manual refresh

### **Responsive Design**
- Works on desktop, tablet, and mobile
- Grid layout adapts to screen size

### **Real-time Updates**
- See changes immediately when you modify data
- No need to refresh the page

## 🛠️ **API Endpoints**

The viewer also provides API endpoints:

### **Statistics**
```bash
curl http://localhost:5556/api/stats
```

### **Schema Information**
```bash
curl http://localhost:5556/api/schema
```

### **Table Data**
```bash
curl http://localhost:5556/api/tiers
curl http://localhost:5556/api/cards
curl http://localhost:5556/api/source-cards
curl http://localhost:5556/api/comments
curl http://localhost:5556/api/versions
```

## 📋 **Schema Overview**

### **Tiers Table**
- `id` (integer, primary key)
- `tier_id` (varchar, unique identifier)
- `name` (varchar, tier name)
- `color` (varchar, CSS color class)
- `position` (integer, display order)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### **Cards Table**
- `id` (integer, primary key)
- `card_id` (varchar, unique identifier)
- `text` (varchar, card content)
- `type` (varchar, card type)
- `subtype` (varchar, card subtype)
- `image_url` (varchar, optional image URL)
- `hidden` (boolean, visibility status)
- `tier_id` (varchar, foreign key to tiers)
- `position` (integer, position within tier)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### **Source Cards Table**
- `id` (integer, primary key)
- `card_id` (varchar, unique identifier)
- `text` (varchar, card content)
- `type` (varchar, card type)
- `subtype` (varchar, card subtype)
- `source_category` (varchar, category)
- `image_url` (varchar, optional image URL)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### **Comments Table**
- `id` (integer, primary key)
- `comment_id` (varchar, unique identifier)
- `text` (varchar, comment content)
- `card_id` (varchar, foreign key to cards)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### **Versions Table**
- `id` (integer, primary key)
- `version_id` (varchar, unique identifier)
- `description` (varchar, version description)
- `tiers_data` (jsonb, tier data snapshot)
- `source_cards_data` (jsonb, source card data snapshot)
- `created_at` (timestamp)

## 🚀 **Usage Tips**

### **1. Monitor Changes**
- Keep the viewer open while testing your API
- See data changes in real-time

### **2. Debug Issues**
- Check if data is being saved correctly
- Verify relationships between tables
- Monitor data integrity

### **3. Development Workflow**
- Use alongside your API testing
- Verify CRUD operations work correctly
- Check data consistency

## 🔍 **Troubleshooting**

### **Viewer Not Loading**
```bash
# Check if server is running
lsof -i :5556

# Restart if needed
cd backend
node db-viewer.js &
```

### **Database Connection Issues**
- Ensure your main backend server is running
- Check `.env` file has correct `DATABASE_URL`
- Verify PostgreSQL is running

### **Port Already in Use**
```bash
# Find process using port 5556
lsof -i :5556

# Kill the process
kill <PID>

# Or change port in db-viewer.js
```

## 📱 **Mobile Access**

The viewer is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

## 🎯 **Next Steps**

1. **Open the viewer**: http://localhost:5556
2. **Test your API**: Make changes via your API endpoints
3. **Watch the data**: See changes reflected in real-time
4. **Debug issues**: Use the viewer to troubleshoot data problems

---

**Happy Database Exploring! 🗄️✨** 