# 🧩 "Pick Another Persona" Feature

## Overview
This feature allows users to change the persona reference for cards that come from the **Personas** row. When a user clicks on a Personas card's ⚙️ menu, they can select "Pick another persona" to choose a different persona from the available list.

## How It Works

### 1. Accessing the Feature
- Right-click on any **Personas card** (cards with type `personas` or `persona`) **that is placed inside tiers**
- In the context menu, you'll see the option: **"Pick another persona"**
- This option only appears for persona cards in tiers (not in the Personas source row)

### 2. Using the Modal
When you click "Pick another persona":
- A modal opens with the title: "Changing the personas document → {currentPersonaName}"
- The modal shows a list of all available personas (excluding the current one)
- You can select a new persona using radio buttons
- The modal includes clear instructions and action buttons

### 3. Confirming the Change
- **Confirm the new personas document**: Updates the card with the selected persona
- **No, keep this one**: Cancels the operation and keeps the current persona

### 4. What Gets Updated
When you confirm a persona change, the card is updated with:
- New persona ID
- New persona name (text)
- New persona type and subtype
- New persona image (if any)
- New source category

**Preserved properties:**
- Comments (if any)
- Hidden status
- Position in tier

## Technical Implementation

### Components Added
1. **PickAnotherPersonaModal.jsx** - The modal component for selecting a new persona
2. **Updated CardContextMenu.jsx** - Added the "Pick another persona" menu option
3. **Updated TierBoard.jsx** - Added state management and handlers

### Key Functions
- `handlePickAnotherPersona(card)` - Opens the modal
- `handleConfirmPersonaChange(currentCard, newPersona)` - Updates the card data
- `closePickAnotherPersonaModal()` - Closes the modal
- `isCardInSourceArea(card)` - Checks if card is in source area (to hide option for source cards)

### Data Flow
1. User right-clicks persona card → Context menu shows "Pick another persona"
2. User clicks option → Modal opens with available personas
3. User selects new persona → Confirms selection
4. Card data is updated → Version history is saved
5. Modal closes → User sees updated card

## UI/UX Features

### Modal Design
- Clean, modern interface with blue accent colors
- Clear header with current persona name
- Scrollable list of available personas
- Radio button selection
- Disabled confirm button until selection is made
- Responsive design with proper spacing

### User Experience
- Intuitive workflow
- Clear visual feedback
- Proper error handling
- Version history tracking
- Preserves important card properties

## Testing the Feature

1. **Start the application**: `npm run dev`
2. **Find a persona card**: Look for blue-colored cards in tiers (not in the Personas source row)
3. **Right-click the card**: You should see the context menu
4. **Select "Pick another persona"**: The modal should open
5. **Choose a different persona**: Select from the available list
6. **Confirm the change**: Click the confirm button
7. **Verify the update**: The card should now show the new persona name

## Error Handling

- Modal only shows for persona cards in tiers (not in source area)
- Available personas list excludes the current persona
- Confirm button is disabled until a selection is made
- Proper cleanup when modal is closed
- Version history is saved for tracking changes
- Edit option is hidden for persona cards in tiers (to prevent manual editing)

## Edit Restrictions

### Persona Cards in Tiers
- **Edit option is hidden** for persona cards placed in tiers
- This prevents manual editing of persona cards that should only be changed via "Pick another persona"
- **Edit option remains available** for persona cards in the source row
- **Other card types** (text, image, competitor, etc.) retain full edit functionality

## Future Enhancements

Potential improvements could include:
- Search/filter functionality for large persona lists
- Preview of persona details before selection
- Bulk persona changes for multiple cards
- Undo functionality for persona changes
- Persona categories or tags 