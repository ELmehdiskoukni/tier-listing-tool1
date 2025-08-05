# Import Image Debugging Summary

## Problem
When importing competitor cards from the dropdown menu, only the text appears without the images. The competitor source cards show images (Airbnb, Google, Netflix logos, etc.) but when imported to tiers, only the text appears.

## Investigation

### 1. Backend Import Logic Analysis
**Location**: `backend/controllers/sourceCardController.js` - `importCardsToTier` function

**Current Logic**:
```javascript
// Create the card in the tier
const importedCard = await Card.create({
  id: cardId,
  text: sourceCard.text,
  type: sourceCard.type,
  subtype: sourceCard.subtype,
  imageUrl: sourceCard.imageUrl,  // ✅ Copying imageUrl
  hidden: false,
  tierId: tierId,
  position: position
});
```

**Analysis**: The backend logic appears correct - it's copying all properties including `imageUrl`.

### 2. Database Schema Verification
**Location**: `backend/config/database.js`

**Cards Table Schema**:
```sql
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR(255) UNIQUE NOT NULL,
  text VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subtype VARCHAR(50),
  image_url TEXT,  // ✅ Column exists
  hidden BOOLEAN DEFAULT FALSE,
  tier_id VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tier_id) REFERENCES tiers(tier_id) ON DELETE CASCADE
)
```

**Analysis**: The database schema is correct - `image_url` column exists.

### 3. Card Model Analysis
**Location**: `backend/models/Card.js` - `create` method

**SQL Query**:
```sql
INSERT INTO cards (card_id, text, type, subtype, image_url, hidden, tier_id, position)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING 
  card_id as id,
  text,
  type,
  subtype,
  image_url as imageUrl,  // ✅ Returning imageUrl
  hidden,
  tier_id as tierId,
  position,
  created_at,
  updated_at
```

**Analysis**: The Card model correctly handles `imageUrl` in both INSERT and RETURNING clauses.

### 4. Frontend Card Component Analysis
**Location**: `src/components/Card.jsx`

**Image Detection Logic**:
```javascript
// Check if card has an image
const hasImage = (card.imageUrl && card.imageUrl !== null) || (card.image && card.image !== null)
const isImageCard = card.subtype === 'image' && hasImage
```

**Image Rendering Logic**:
```javascript
{isImageCard && hasImage ? (
  // Image card with actual image
  <div className="flex flex-col items-center gap-1">
    <img 
      src={card.imageUrl || card.image} 
      alt={card.text}
      className={`w-12 h-12 object-cover rounded ${isDeletedSource ? 'opacity-50' : ''}`}
      onError={(e) => {
        // Fallback to text if image fails to load
        e.target.style.display = 'none'
        e.target.nextSibling.style.display = 'block'
      }}
    />
    <span className={`text-xs text-center leading-tight px-1 ${isDeletedSource ? 'text-gray-500 italic' : ''}`}>
      {isDeletedSource ? 'This item is deleted' : card.text}
    </span>
  </div>
) : (
  // Text card or image card without image
  <span className={isDeletedSource ? 'text-gray-500 italic line-through' : ''}>
    {isDeletedSource ? 'This item is deleted' : card.text}
  </span>
)}
```

**Analysis**: The frontend logic requires both `subtype === 'image'` AND `hasImage` to render images.

## Debugging Steps Added

### 1. Backend Debugging
**Added to `sourceCardController.js`**:
```javascript
console.log('🔍 Importing source card:', {
  id: sourceCard.id,
  text: sourceCard.text,
  type: sourceCard.type,
  subtype: sourceCard.subtype,
  imageUrl: sourceCard.imageUrl
});

console.log('🔍 Created imported card:', {
  id: importedCard.id,
  text: importedCard.text,
  type: importedCard.type,
  subtype: importedCard.subtype,
  imageUrl: importedCard.imageUrl
});
```

**Added to `Card.js`**:
```javascript
console.log('🔍 Card.create called with:', {
  id, text, type, subtype, imageUrl, hidden, tierId, position
});

console.log('🔍 Card.create returned:', {
  id: createdCard.id,
  text: createdCard.text,
  type: createdCard.type,
  subtype: createdCard.subtype,
  imageUrl: createdCard.imageUrl
});
```

**Added to `SourceCard.js`**:
```javascript
console.log('🔍 SourceCard.getById returned:', {
  id: sourceCard?.id,
  text: sourceCard?.text,
  type: sourceCard?.type,
  subtype: sourceCard?.subtype,
  imageUrl: sourceCard?.imageUrl
});
```

### 2. Frontend Debugging
**Added to `useTierBoard.js`**:
```javascript
// Debug: Check imported cards for image data
sanitizedTiers.forEach((tier, tierIndex) => {
  if (tier.cards && tier.cards.length > 0) {
    console.log(`🔍 Tier ${tierIndex} (${tier.name}) cards:`, tier.cards.map(card => ({
      id: card.id,
      text: card.text,
      type: card.type,
      subtype: card.subtype,
      imageUrl: card.imageUrl,
      hasImage: (card.imageUrl && card.imageUrl !== null) || (card.image && card.image !== null),
      isImageCard: card.subtype === 'image' && ((card.imageUrl && card.imageUrl !== null) || (card.image && card.image !== null))
    })));
  }
});
```

## Expected Data Flow
1. **Source Card Retrieval** → `SourceCard.getById()` returns card with `imageUrl`
2. **Card Creation** → `Card.create()` stores card with `imageUrl` in database
3. **Tier Retrieval** → `Tier.getAllWithCards()` returns tiers with cards including `imageUrl`
4. **Frontend Rendering** → Card component checks `subtype === 'image'` AND `hasImage` to render image

## Next Steps
1. **Test Import Functionality** → Import a competitor card and check console logs
2. **Verify Data at Each Step** → Ensure `imageUrl` is preserved throughout the flow
3. **Identify Missing Link** → Find where the `imageUrl` is being lost or not properly set
4. **Fix the Issue** → Apply the necessary fix based on debugging results

## Potential Issues to Check
- **Source Card Data**: Are source cards actually storing `imageUrl` correctly?
- **Subtype Value**: Are imported cards getting `subtype: 'image'`?
- **Database Storage**: Is `imageUrl` being stored correctly in the database?
- **Data Retrieval**: Is `imageUrl` being retrieved correctly from the database?
- **Frontend Logic**: Is the frontend correctly detecting and rendering image cards? 