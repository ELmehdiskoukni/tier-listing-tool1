# Tier Listing Tool - Backend API

A Node.js + Express + PostgreSQL backend API for the Tier Listing Tool.

## 🚀 Features

- **Tier Management**: Create, update, delete, and reorder tiers
- **Card Management**: Full CRUD operations for cards with drag-and-drop support
- **Source Cards**: Manage source cards (competitors, pages, personas) with cascade delete
- **Comments**: Add comments to cards with full CRUD operations
- **Version History**: Save and restore board states with version control
- **RESTful API**: Clean, well-documented REST endpoints
- **Validation**: Comprehensive input validation and error handling
- **Security**: CORS, rate limiting, and security headers
- **Database**: PostgreSQL with proper indexing and relationships

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/tier_listing_db
   PORT=4000
   NODE_ENV=development
   ```

4. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE tier_listing_db;
   ```

5. **Initialize database schema:**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database with sample data:**
   ```bash
   npm run db:seed
   ```

## 🚀 Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:4000` (or the port specified in your `.env` file).

## 📊 API Endpoints

### Health Check
- `GET /health` - Server health status

### Tiers
- `GET /api/tiers` - Get all tiers
- `GET /api/tiers/with-cards` - Get all tiers with cards
- `GET /api/tiers/:id` - Get tier by ID
- `GET /api/tiers/:id/with-cards` - Get tier with cards
- `POST /api/tiers` - Create new tier
- `PUT /api/tiers/:id` - Update tier
- `DELETE /api/tiers/:id` - Delete tier
- `POST /api/tiers/:id/move` - Move tier position
- `POST /api/tiers/:id/duplicate` - Duplicate tier
- `POST /api/tiers/:id/clear` - Clear all cards from tier
- `GET /api/tiers/stats` - Get tier statistics

### Cards
- `GET /api/cards` - Get all cards
- `GET /api/cards/:id` - Get card by ID
- `GET /api/cards/:id/with-comments` - Get card with comments
- `GET /api/cards/tier/:tierId` - Get cards by tier ID
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/:id/move` - Move card to different tier
- `POST /api/cards/:id/duplicate` - Duplicate card
- `POST /api/cards/:id/toggle-hidden` - Toggle card hidden status
- `POST /api/cards/bulk-create` - Bulk create cards
- `DELETE /api/cards/bulk-delete` - Bulk delete cards
- `GET /api/cards/search` - Search cards
- `GET /api/cards/stats` - Get card statistics

### Source Cards
- `GET /api/source-cards` - Get all source cards
- `GET /api/source-cards/grouped` - Get source cards grouped by category
- `GET /api/source-cards/:id` - Get source card by ID
- `GET /api/source-cards/category/:category` - Get source cards by category
- `POST /api/source-cards` - Create new source card
- `PUT /api/source-cards/:id` - Update source card
- `DELETE /api/source-cards/:id` - Delete source card (with cascade)
- `POST /api/source-cards/bulk-create` - Bulk create source cards
- `DELETE /api/source-cards/bulk-delete` - Bulk delete source cards
- `GET /api/source-cards/search` - Search source cards
- `GET /api/source-cards/stats` - Get source card statistics
- `POST /api/source-cards/import` - Import cards from source to tier

### Comments
- `GET /api/comments` - Get all comments
- `GET /api/comments/:id` - Get comment by ID
- `GET /api/comments/card/:cardId` - Get comments by card ID
- `GET /api/comments/card/:cardId/count` - Get comment count for card
- `POST /api/comments` - Create new comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `DELETE /api/comments/card/:cardId` - Delete all comments for card
- `POST /api/comments/bulk-create` - Bulk create comments
- `DELETE /api/comments/bulk-delete` - Bulk delete comments
- `GET /api/comments/recent` - Get recent comments
- `GET /api/comments/search` - Search comments

### Versions
- `GET /api/versions` - Get all versions
- `GET /api/versions/:id` - Get version by ID
- `GET /api/versions/recent` - Get recent versions
- `GET /api/versions/latest` - Get latest version
- `POST /api/versions` - Create new version
- `POST /api/versions/from-current` - Create version from current state
- `DELETE /api/versions/:id` - Delete version
- `POST /api/versions/:id/restore` - Restore to version
- `GET /api/versions/stats` - Get version statistics
- `GET /api/versions/search` - Search versions
- `GET /api/versions/date-range` - Get versions by date range
- `POST /api/versions/cleanup` - Cleanup old versions
- `GET /api/versions/compare/:version1Id/:version2Id` - Compare versions

## 🗄️ Database Schema

### Tables

1. **tiers** - Tier information
   - `id` (SERIAL PRIMARY KEY)
   - `tier_id` (VARCHAR UNIQUE) - Frontend ID
   - `name` (VARCHAR) - Tier name (A, B, C, etc.)
   - `color` (VARCHAR) - CSS color class
   - `position` (INTEGER) - Order position
   - `created_at`, `updated_at` (TIMESTAMP)

2. **source_cards** - Source cards (competitors, pages, personas)
   - `id` (SERIAL PRIMARY KEY)
   - `card_id` (VARCHAR UNIQUE) - Frontend ID
   - `text` (VARCHAR) - Card text
   - `type` (VARCHAR) - Card type
   - `subtype` (VARCHAR) - Card subtype
   - `source_category` (VARCHAR) - Category (competitors, pages, personas)
   - `image_url` (TEXT) - Optional image URL
   - `created_at`, `updated_at` (TIMESTAMP)

3. **cards** - Tier cards
   - `id` (SERIAL PRIMARY KEY)
   - `card_id` (VARCHAR UNIQUE) - Frontend ID
   - `text` (VARCHAR) - Card text
   - `type` (VARCHAR) - Card type
   - `subtype` (VARCHAR) - Card subtype
   - `image_url` (TEXT) - Optional image URL
   - `hidden` (BOOLEAN) - Hidden status
   - `tier_id` (VARCHAR) - Foreign key to tiers
   - `position` (INTEGER) - Order position within tier
   - `created_at`, `updated_at` (TIMESTAMP)

4. **comments** - Card comments
   - `id` (SERIAL PRIMARY KEY)
   - `comment_id` (VARCHAR UNIQUE) - Frontend ID
   - `text` (TEXT) - Comment text
   - `card_id` (VARCHAR) - Foreign key to cards
   - `created_at`, `updated_at` (TIMESTAMP)

5. **versions** - Version history
   - `id` (SERIAL PRIMARY KEY)
   - `version_id` (VARCHAR UNIQUE) - Frontend ID
   - `description` (VARCHAR) - Version description
   - `tiers_data` (JSONB) - Complete tiers state
   - `source_cards_data` (JSONB) - Complete source cards state
   - `created_at` (TIMESTAMP)

## 🔧 Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── tierController.js    # Tier business logic
│   ├── cardController.js    # Card business logic
│   ├── sourceCardController.js # Source card business logic
│   ├── commentController.js # Comment business logic
│   └── versionController.js # Version business logic
├── middleware/
│   ├── errorHandler.js      # Error handling middleware
│   └── validation.js        # Input validation
├── models/
│   ├── Tier.js             # Tier data model
│   ├── Card.js             # Card data model
│   ├── SourceCard.js       # Source card data model
│   ├── Comment.js          # Comment data model
│   └── Version.js          # Version data model
├── routes/
│   ├── tiers.js            # Tier routes
│   ├── cards.js            # Card routes
│   ├── sourceCards.js      # Source card routes
│   ├── comments.js         # Comment routes
│   └── versions.js         # Version routes
├── seeds/
│   └── seedData.js         # Database seeding
├── server.js               # Main server file
├── package.json            # Dependencies
└── README.md               # This file
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:migrate` - Initialize database schema
- `npm run db:seed` - Seed database with sample data

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT secret for future authentication
- `FRONTEND_URL` - Frontend URL for CORS

## 🔒 Security Features

- **CORS**: Configured for frontend domain
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **SQL Injection Protection**: Parameterized queries with pg

## 🧪 Testing

The API can be tested using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

Example curl commands:
```bash
# Get all tiers
curl http://localhost:4000/api/tiers

# Create a new tier
curl -X POST http://localhost:4000/api/tiers \
  -H "Content-Type: application/json" \
  -d '{"name": "F", "color": "bg-green-200", "position": 5}'

# Get health status
curl http://localhost:4000/health
```

## 🚀 Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migration: `npm run db:migrate`
4. Start the server: `npm start`

## 📝 License

MIT License 