# API Validation Guide

## 🔍 **Validation Error Solutions**

This guide explains the exact requirements for each field to avoid validation errors.

## 📋 **Field Requirements**

### **Tier Fields:**
- **`name`** (required): String, 1-50 characters
- **`color`** (optional): String, max 100 characters
- **`position`** (required): Integer, non-negative (0 or greater)

### **Card Fields:**
- **`text`** (required): String, 2-255 characters
- **`type`** (required): One of: `'image'`, `'text'`, `'page'`, `'personas'`, `'competitor'`
- **`subtype`** (optional): One of: `'image'`, `'text'`
- **`tierId`** (required): String, existing tier ID
- **`position`** (required): Integer, non-negative (0 or greater)
- **`imageUrl`** (optional): Valid URL or omit entirely (NOT `null` or empty string)
- **`sourceCategory`** (required): One of: `'competitors'`, `'pages'`, `'personas'`
- **`hidden`** (optional): Boolean (true/false)

### **Source Card Fields:**
- **`text`** (required): String, 2-255 characters
- **`type`** (required): One of: `'image'`, `'text'`, `'page'`, `'personas'`, `'competitor'`
- **`subtype`** (optional): One of: `'image'`, `'text'`
- **`sourceCategory`** (required): One of: `'competitors'`, `'pages'`, `'personas'`
- **`imageUrl`** (optional): Valid URL or omit entirely (NOT `null` or empty string)

### **Comment Fields:**
- **`text`** (required): String, 1-1000 characters
- **`cardId`** (required): String, existing card ID

## ❌ **Common Validation Errors & Solutions**

### 1. **"Position must be a non-negative integer"**
**Problem:** Position field is missing, negative, or not an integer
**Solution:** 
```json
{
  "position": 0  // Must be 0 or positive integer
}
```

### 2. **"Invalid image URL"**
**Problem:** `imageUrl` is `null`, empty string, or invalid URL
**Solutions:**
```json
// Option 1: Omit the field entirely
{
  "text": "My Card",
  "type": "competitor"
  // No imageUrl field
}

// Option 2: Use valid URL
{
  "text": "My Card",
  "type": "competitor",
  "imageUrl": "https://img.logo.dev/google.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200"
}
```

### 3. **"Invalid card type"**
**Problem:** Type field has invalid value
**Solution:** Use one of the allowed values:
```json
{
  "type": "competitor"  // Valid: "image", "text", "page", "personas", "competitor"
}
```

### 4. **"Card text must be between 2 and 255 characters"**
**Problem:** Text is too short or too long
**Solution:**
```json
{
  "text": "Valid card text"  // Must be 2-255 characters
}
```

## ✅ **Correct Request Examples**

### Create Tier:
```json
{
  "name": "S",
  "color": "bg-red-200",
  "position": 5
}
```

### Create Card (without image):
```json
{
  "text": "New Card",
  "type": "competitor",
  "subtype": "text",
  "tierId": "tier-a",
  "position": 0,
  "sourceCategory": "competitors",
  "hidden": false
}
```

### Create Card (with image):
```json
{
  "text": "Google Card",
  "type": "competitor",
  "subtype": "image",
  "tierId": "tier-a",
  "position": 0,
  "imageUrl": "https://img.logo.dev/google.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200",
  "sourceCategory": "competitors",
  "hidden": false
}
```

### Create Source Card:
```json
{
  "text": "New Competitor",
  "type": "competitor",
  "subtype": "text",
  "sourceCategory": "competitors"
}
```

### Create Comment:
```json
{
  "text": "This is a great card!",
  "cardId": "card-1"
}
```

## 🧪 **Testing Commands**

### Test Tier Creation:
```bash
curl -X POST http://localhost:4000/api/tiers \
  -H "Content-Type: application/json" \
  -d '{"name": "S", "color": "bg-red-200", "position": 5}'
```

### Test Card Creation:
```bash
curl -X POST http://localhost:4000/api/cards \
  -H "Content-Type: application/json" \
  -d '{"text": "Test Card", "type": "competitor", "subtype": "text", "tierId": "tier-a", "position": 0, "sourceCategory": "competitors", "hidden": false}'
```

### Test Source Card Creation:
```bash
curl -X POST http://localhost:4000/api/source-cards \
  -H "Content-Type: application/json" \
  -d '{"text": "New Competitor", "type": "competitor", "subtype": "text", "sourceCategory": "competitors"}'
```

## 🔧 **Troubleshooting Tips**

1. **Always check the response** for detailed validation error messages
2. **Use the exact field names** (case-sensitive)
3. **Omit optional fields** instead of setting them to `null`
4. **Use valid URLs** for `imageUrl` or omit the field entirely
5. **Ensure position is a number** (not a string)
6. **Check that referenced IDs exist** (tierId, cardId, etc.)

## 📚 **Validation Rules Summary**

| Field | Type | Required | Min | Max | Allowed Values |
|-------|------|----------|-----|-----|----------------|
| name | string | ✅ | 1 | 50 | Any text |
| color | string | ❌ | - | 100 | Any text |
| position | integer | ✅ | 0 | - | Non-negative |
| text | string | ✅ | 2 | 255 | Any text |
| type | string | ✅ | - | - | image, text, page, personas, competitor |
| subtype | string | ❌ | - | - | image, text |
| imageUrl | string | ❌ | - | - | Valid URL or omit |
| sourceCategory | string | ✅ | - | - | competitors, pages, personas |
| hidden | boolean | ❌ | - | - | true, false |
| tierId | string | ✅ | - | - | Existing tier ID |
| cardId | string | ✅ | - | - | Existing card ID |

---

**Happy API Testing! 🚀** 