# Cascade Delete and Version History Features

## Overview

This document describes the new cascade delete logic and version history system implemented in the Tier Listing Tool.

## 🔁 Cascade Delete Logic

### How it Works

When a user deletes an item from one of the source rows (Competitors, Pages, Personas), the system automatically removes all cards inside tiers that reference that source item.

### Implementation Details

1. **Source Item Deletion**: When a source card is deleted, the `cascadeDeleteFromTiers()` function is called
2. **Matching Logic**: The system matches tier cards to source items based on:
   - `text` property (exact match)
   - `type` property (exact match)
3. **Automatic Removal**: All matching tier cards are automatically removed from all tiers
4. **Version Tracking**: The deletion is automatically saved to version history

### Example

If you delete "Google" from the Competitors source row:
- All tier cards with `text: "Google"` and `type: "competitor"` will be automatically removed
- The action is logged in version history as "Deleted source item 'Google' and related tier cards"

## 🕘 Version History System

### Features

1. **Automatic Version Saving**: Versions are automatically saved after significant actions:
   - Creating cards
   - Importing cards
   - Moving cards between tiers
   - Deleting cards
   - Adding/removing source items
   - Moving tiers
   - Renaming tiers
   - Adding new tiers

2. **Version Restoration**: Users can restore any previous version
3. **Deleted Item Handling**: Versions with deleted source items are clearly marked
4. **History Limit**: Keeps the last 20 versions to prevent memory issues

### Version History Modal

- **Access**: Click the "Version History" button in the main toolbar
- **Display**: Shows all saved versions with timestamps and descriptions
- **Current Version**: Clearly marked with a "Current" badge
- **Deleted Items Warning**: Versions containing deleted source items show a warning icon
- **Restore**: Click any version to restore it

## 🚫 Deleted Source Item Handling

### Visual Indicators

When a version is restored that contains cards referencing deleted source items:

1. **Card Appearance**: 
   - Cards are greyed out with reduced opacity
   - Red X icon in the top-right corner
   - Cursor changes to "not-allowed"

2. **Functionality Restrictions**:
   - Cards cannot be dragged or moved
   - Right-click context menu is disabled
   - Cards cannot be edited

3. **Warning Messages**:
   - Yellow warning banner appears at the top of the board
   - Message: "Some cards reference deleted source items and are marked with a red X. These cards cannot be moved or edited."

### Technical Implementation

- `isCardFromDeletedSource()` function checks if a card references a deleted source
- `versionHasDeletedItems()` function checks if a version contains deleted source items
- Visual styling applied through CSS classes and conditional rendering

## 🎯 User Experience

### Workflow Example

1. **Create a board** with source items and tier cards
2. **Delete a source item** (e.g., "Google" from Competitors)
3. **Observe cascade delete** - all related tier cards are automatically removed
4. **Open version history** to see the deletion logged
5. **Restore an earlier version** where the source item still existed
6. **See visual indicators** on cards that now reference deleted sources
7. **Understand the situation** through warning messages and visual cues

### Benefits

- **Data Integrity**: Prevents orphaned cards that reference non-existent sources
- **User Awareness**: Clear visual feedback about deleted source items
- **Recovery Options**: Version history allows users to recover from mistakes
- **Non-Destructive**: Deleted source items are preserved in version history

## 🔧 Technical Notes

### State Management

- Version history is stored in component state (not persisted to localStorage)
- Each version contains complete snapshots of `tiers` and `sourceCards`
- Version metadata includes timestamp, description, and unique ID

### Performance Considerations

- Deep cloning of state objects for version snapshots
- Limited to 20 versions to prevent memory issues
- Efficient matching algorithms for cascade delete operations

### Future Enhancements

- Persist version history to localStorage or backend
- Export/import version history
- Branching version history for collaborative work
- Automatic version pruning based on time or size 