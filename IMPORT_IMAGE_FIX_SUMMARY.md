# Import Image Fix Summary

## Problem
When importing competitor cards from the dropdown menu, only the text appeared without the images. The competitor source cards showed images (Airbnb, Google, Netflix logos, etc.) but when imported to tiers, only the text appeared.

## Root Cause
The issue was with PostgreSQL column aliases. PostgreSQL converts unquoted column aliases to lowercase by default, causing a mismatch between expected and actual property names.

**Database Query Result:**
```javascript
// Expected (what the code was looking for):
{
  id: 'source-competitors-1754299716902-b0u15tsol',
  text: 'netflix',
  type: 'competitor',
  subtype: 'image',
  imageUrl: 'https://img.logo.dev/netflix.com?token=...'  // ❌ Not found
}

// Actual (what PostgreSQL returned):
{
  id: 'source-competitors-1754299716902-b0u15tsol',
  text: 'netflix',
  type: 'competitor',
  subtype: 'image',
  imageurl: 'https://img.logo.dev/netflix.com?token=...'  // ❌ Lowercase
}
```

## Solution

### 1. Fixed SourceCard Model (`backend/models/SourceCard.js`)

**Before:**
```sql
SELECT 
  card_id as id,
  text,
  type,
  subtype,
  source_category as sourceCategory,
  image_url as imageUrl,  -- ❌ PostgreSQL converts to lowercase
  created_at,
  updated_at
FROM source_cards
```

**After:**
```sql
SELECT 
  card_id as "id",
  text,
  type,
  subtype,
  source_category as "sourceCategory",
  image_url as "imageUrl",  -- ✅ Quoted alias preserves case
  created_at,
  updated_at
FROM source_cards
```

### 2. Fixed Card Model (`backend/models/Card.js`)

**Before:**
```sql
RETURNING 
  card_id as id,
  text,
  type,
  subtype,
  image_url as imageUrl,  -- ❌ PostgreSQL converts to lowercase
  hidden,
  tier_id as tierId,
  position,
  created_at,
  updated_at
```

**After:**
```sql
RETURNING 
  card_id as "id",
  text,
  type,
  subtype,
  image_url as "imageUrl",  -- ✅ Quoted alias preserves case
  hidden,
  tier_id as "tierId",
  position,
  created_at,
  updated_at
```

### 3. Fixed Tier Model (`backend/models/Tier.js`)

**Before:**
```sql
SELECT 
  t.tier_id as id,  -- ❌ PostgreSQL converts to lowercase
  t.name,
  t.color,
  t.position,
  t.created_at,
  t.updated_at,
  ...
```

**After:**
```sql
SELECT 
  t.tier_id as "id",  -- ✅ Quoted alias preserves case
  t.name,
  t.color,
  t.position,
  t.created_at,
  t.updated_at,
  ...
```

## Technical Details

### PostgreSQL Column Alias Behavior
- **Unquoted aliases**: Converted to lowercase (`imageUrl` → `imageurl`)
- **Quoted aliases**: Preserve exact case (`"imageUrl"` → `imageUrl`)

### Data Flow Fix
1. **Source Card Retrieval** → `SourceCard.getById()` now returns correct `imageUrl`
2. **Card Creation** → `Card.create()` now stores and returns correct `imageUrl`
3. **Tier Retrieval** → `Tier.getAllWithCards()` now returns correct `imageUrl`
4. **Frontend Rendering** → Card component receives correct `imageUrl` and renders images

### Files Modified
- `backend/models/SourceCard.js` - Fixed column aliases in all query methods
- `backend/models/Card.js` - Fixed column aliases in create and update methods
- `backend/models/Tier.js` - Fixed column aliases in getAllWithCards method

## Testing Results

### ✅ Before Fix
```
🔍 SourceCard.getById returned: {
  id: 'source-competitors-1754299716902-b0u15tsol',
  text: 'netflix',
  type: 'competitor',
  subtype: 'image',
  imageUrl: undefined  // ❌ Missing image data
}
```

### ✅ After Fix
```
🔍 SourceCard.getById returned: {
  id: 'source-competitors-1754299716902-b0u15tsol',
  text: 'netflix',
  type: 'competitor',
  subtype: 'image',
  imageUrl: 'https://img.logo.dev/netflix.com?token=...'  // ✅ Image data preserved
}
```

## User Experience

### ✅ Fixed Issues
- **Import functionality works correctly** - Images are preserved during import
- **Visual consistency** - Imported cards look identical to source cards
- **All card properties preserved** - Text, images, styling, and metadata maintained
- **Proper image rendering** - Cards display logos + text as expected

### ✅ User Experience
- **Import Competitors** → Shows logos + text in tiers
- **Import Personas** → Shows text-only cards in tiers  
- **Import Pages** → Shows text-only cards in tiers
- **Visual consistency** → Imported cards match source card appearance

## Prevention
- ✅ **Quoted aliases** - All future SQL queries use quoted column aliases
- ✅ **Consistent naming** - Maintains camelCase property names throughout
- ✅ **Database compatibility** - Works correctly with PostgreSQL's case sensitivity
- ✅ **Future-proof** - Prevents similar issues with other column aliases 