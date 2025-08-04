# API Integration Guide

## Overview

The frontend has been successfully integrated with the backend API. All mock state has been replaced with real API calls using Axios.

## Key Changes Made

### 1. API Client Setup (`src/api/apiClient.js`)

- Created a centralized API client using Axios
- Base URL: `http://localhost:4000/api`
- Global error handling and request/response interceptors
- Organized API functions by resource type (tiers, cards, source cards, comments, versions)

### 2. Custom Hook (`src/hooks/useTierBoard.js`)

- Created `useTierBoard` hook to manage all API state and operations
- Handles loading states, error states, and data synchronization
- Provides clean interface for components to interact with the API

### 3. Component Updates (`src/components/TierBoard.jsx`)

- Replaced all mock state with API calls
- Added error handling and loading indicators
- Updated all CRUD operations to use the API:
  - **Tiers**: Create, update, delete, move, duplicate
  - **Cards**: Create, update, delete, move, duplicate, toggle hidden
  - **Source Cards**: Create, update, delete
  - **Comments**: Create, delete
  - **Versions**: Create, restore

## API Endpoints Used

### Tiers
- `GET /api/tiers/with-cards` - Load all tiers with their cards
- `POST /api/tiers` - Create new tier
- `PUT /api/tiers/:id` - Update tier
- `DELETE /api/tiers/:id` - Delete tier
- `POST /api/tiers/:id/move` - Move tier position
- `POST /api/tiers/:id/duplicate` - Duplicate tier
- `POST /api/tiers/:id/clear` - Clear tier cards

### Source Cards
- `GET /api/source-cards/grouped` - Load source cards grouped by category
- `POST /api/source-cards` - Create source card
- `PUT /api/source-cards/:id` - Update source card
- `DELETE /api/source-cards/:id` - Delete source card
- `POST /api/source-cards/import` - Import cards to tier

### Cards
- `POST /api/cards` - Create card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/:id/move` - Move card
- `POST /api/cards/:id/duplicate` - Duplicate card
- `POST /api/cards/:id/toggle-hidden` - Toggle card hidden status

### Comments
- `POST /api/comments` - Create comment
- `DELETE /api/comments/:id` - Delete comment

### Versions
- `GET /api/versions` - Load all versions
- `POST /api/versions` - Create version
- `POST /api/versions/:id/restore` - Restore version

## Error Handling

- Global error handling in API client
- User-friendly error messages displayed in UI
- Error clearing functionality
- Console logging for debugging

## Loading States

- Loading indicators for initial data fetch
- Individual loading states for different operations
- Visual feedback during API calls

## Data Synchronization

- Real-time data updates from API
- Optimistic updates where appropriate
- Proper state management to keep UI in sync

## Usage

1. **Start the backend server** on port 4000
2. **Start the frontend** with `npm run dev`
3. **The frontend will automatically connect** to the backend API
4. **All operations** (create, update, delete, move) will be persisted to the database

## Key Features Preserved

- ✅ All existing UI components and layout
- ✅ Drag and drop functionality
- ✅ Context menus and modals
- ✅ Version history
- ✅ Export functionality
- ✅ All card operations (edit, delete, duplicate, comments)
- ✅ Tier operations (rename, delete, duplicate, move)
- ✅ Source card management

## Error Scenarios Handled

- Network connectivity issues
- Server errors (404, 500, etc.)
- Validation errors
- Database constraint violations
- Timeout errors

## Performance Considerations

- Efficient API calls with proper caching
- Minimal re-renders through proper state management
- Optimistic updates for better UX
- Error boundaries to prevent app crashes

## Testing

To test the integration:

1. Ensure backend is running on `http://localhost:4000`
2. Start frontend with `npm run dev`
3. Try creating, editing, and deleting tiers and cards
4. Test drag and drop functionality
5. Verify version history works
6. Check that all operations persist to the database

## Troubleshooting

If you encounter issues:

1. **Check backend connectivity**: Ensure backend is running on port 4000
2. **Check browser console**: Look for API error messages
3. **Verify API endpoints**: Ensure all endpoints are available in the backend
4. **Check CORS**: Ensure backend allows requests from frontend origin
5. **Database connection**: Verify database is accessible and seeded with data 