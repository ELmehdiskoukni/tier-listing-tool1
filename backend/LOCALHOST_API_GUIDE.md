# Localhost API Guide

## 🌐 **Check Your Database via Localhost**

Your backend server is running on `http://localhost:4000`. Here's how to check your database data through the API endpoints.

## 🚀 **Quick Commands**

### **Health Check**
```bash
curl http://localhost:4000/health
```

### **View All Tiers**
```bash
curl http://localhost:4000/api/tiers
```

### **View All Cards**
```bash
curl http://localhost:4000/api/cards
```

### **View Source Cards (Grouped by Category)**
```bash
curl http://localhost:4000/api/source-cards/grouped
```

### **View All Comments**
```bash
curl http://localhost:4000/api/comments
```

### **View All Versions**
```bash
curl http://localhost:4000/api/versions
```

## 📊 **Pretty Print with jq**

If you have `jq` installed, you can format the JSON output:

```bash
# Install jq (if not already installed)
brew install jq

# Then use it to format JSON responses
curl -s http://localhost:4000/api/tiers | jq '.'
curl -s http://localhost:4000/api/cards | jq '.'
curl -s http://localhost:4000/api/source-cards/grouped | jq '.'
```

## 🔍 **Specific Data Queries**

### **Get Specific Tier**
```bash
curl http://localhost:4000/api/tiers/tier-a
```

### **Get Specific Card**
```bash
curl http://localhost:4000/api/cards/card-sample-1
```

### **Get Cards by Tier**
```bash
curl http://localhost:4000/api/tiers/tier-a
```

### **Get Comments by Card**
```bash
curl http://localhost:4000/api/comments/card/card-sample-1
```

### **Get Source Cards by Category**
```bash
curl http://localhost:4000/api/source-cards/category/competitors
curl http://localhost:4000/api/source-cards/category/pages
curl http://localhost:4000/api/source-cards/category/personas
```

## 📈 **Statistics**

### **Get Tier Statistics**
```bash
curl http://localhost:4000/api/tiers/stats
```

### **Get Source Cards Statistics**
```bash
curl http://localhost:4000/api/source-cards/stats
```

### **Get Version Statistics**
```bash
curl http://localhost:4000/api/versions/stats
```

## 🔧 **Browser Access**

You can also access these endpoints directly in your browser:

- **Health Check**: http://localhost:4000/health
- **All Tiers**: http://localhost:4000/api/tiers
- **All Cards**: http://localhost:4000/api/cards
- **Source Cards**: http://localhost:4000/api/source-cards/grouped
- **All Comments**: http://localhost:4000/api/comments
- **All Versions**: http://localhost:4000/api/versions

## 🧪 **Test Data Creation**

### **Create a New Tier**
```bash
curl -X POST http://localhost:4000/api/tiers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Tier", "color": "bg-green-200", "position": 10}'
```

### **Create a New Card**
```bash
curl -X POST http://localhost:4000/api/cards \
  -H "Content-Type: application/json" \
  -d '{"text": "Test Card", "type": "competitor", "subtype": "text", "tierId": "tier-a", "position": 0, "sourceCategory": "competitors", "hidden": false}'
```

### **Create a New Source Card**
```bash
curl -X POST http://localhost:4000/api/source-cards \
  -H "Content-Type: application/json" \
  -d '{"text": "Test Competitor", "type": "competitor", "subtype": "text", "sourceCategory": "competitors"}'
```

### **Create a New Comment**
```bash
curl -X POST http://localhost:4000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"text": "Test comment", "cardId": "card-sample-1"}'
```

## 🎯 **Quick Status Check**

Run this to get a quick overview of your database:

```bash
echo "=== Database Status ===" && \
echo "Health:" && curl -s http://localhost:4000/health | jq '.status' && \
echo "Tiers:" && curl -s http://localhost:4000/api/tiers | jq '.data | length' && \
echo "Cards:" && curl -s http://localhost:4000/api/cards | jq '.data | length' && \
echo "Source Cards:" && curl -s http://localhost:4000/api/source-cards/grouped | jq '.data.competitors | length + (.data.pages | length) + (.data.personas | length)' && \
echo "Comments:" && curl -s http://localhost:4000/api/comments | jq '.data | length' && \
echo "Versions:" && curl -s http://localhost:4000/api/versions | jq '.data | length'
```

## 🔍 **Search Functionality**

### **Search Cards**
```bash
curl "http://localhost:4000/api/cards/search?q=google"
```

### **Search Source Cards**
```bash
curl "http://localhost:4000/api/source-cards/search?q=google"
```

### **Search Comments**
```bash
curl "http://localhost:4000/api/comments/search?q=sample"
```

## 📝 **Error Handling**

If you get errors, check:

1. **Server Status**: `curl http://localhost:4000/health`
2. **Server Logs**: Check your terminal where the server is running
3. **Database Connection**: The server should show "Database connected successfully"

## 🚨 **Common Issues**

### **Connection Refused**
```bash
# Check if server is running
lsof -i :4000

# Start server if needed
cd backend && node server.js &
```

### **404 Not Found**
- Check the endpoint URL
- Make sure the resource ID exists

### **400 Bad Request**
- Check request body format
- Refer to `VALIDATION_GUIDE.md` for field requirements

---

**Happy API Testing! 🌐** 