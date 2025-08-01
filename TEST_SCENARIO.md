# Test Scenario: Cascade Delete and Version History

## 🧪 Testing the New Features

Follow this step-by-step scenario to test the cascade delete logic and version history system.

## Step 1: Initial Setup

1. **Open the application** in your browser
2. **Observe the initial state**:
   - Source area has Competitors, Pages, and Personas
   - Tier board has cards in different tiers
   - Some cards reference source items (e.g., "Google", "Meta", "Apple")

## Step 2: Test Version History

1. **Click "Version History"** button in the toolbar
2. **Verify the modal opens** showing the initial version
3. **Check version details**:
   - Should show "Initial state" as description
   - Should have current timestamp
   - Should be marked as "Current"

## Step 3: Create Some Activity

1. **Add a new card** to any tier:
   - Click the "+" button on a tier
   - Create a card with text "Test Card"
   - Verify it appears in the tier

2. **Import cards from source**:
   - Click the "+" button on another tier
   - Select "Competitors" from dropdown
   - Import "Google" or "Meta"
   - Verify cards appear in the tier

3. **Check version history again**:
   - Open version history modal
   - Should now show multiple versions
   - Each action should have its own version entry

## Step 4: Test Cascade Delete

1. **Delete a source item**:
   - Right-click on "Google" in the Competitors source row
   - Select "Delete" from context menu
   - Confirm deletion

2. **Observe cascade delete**:
   - All tier cards with text "Google" and type "competitor" should disappear
   - This should happen automatically across all tiers

3. **Check version history**:
   - Open version history modal
   - Should see new version: "Deleted source item 'Google' and related tier cards"

## Step 5: Test Version Restoration

1. **Restore an earlier version**:
   - In version history modal, click on a version before the deletion
   - Click "Restore" button
   - Verify the board returns to that state

2. **Test with deleted source items**:
   - Restore a version that had "Google" cards in tiers
   - But "Google" is no longer in the source area
   - **Expected behavior**:
     - Cards should appear but be greyed out
     - Red X icon should appear on these cards
     - Cards should not be draggable
     - Right-click should not work on these cards
     - Yellow warning banner should appear at top

## Step 6: Test Visual Indicators

1. **Verify deleted source indicators**:
   - Cards from deleted sources should have:
     - Reduced opacity (60%)
     - Grey background
     - Red X icon in top-right corner
     - "not-allowed" cursor

2. **Test functionality restrictions**:
   - Try to drag a deleted source card (should not work)
   - Try to right-click a deleted source card (should not show menu)
   - Verify warning message appears at top of board

## Step 7: Test Other Operations

1. **Move tiers**:
   - Use up/down arrows to move tiers
   - Check version history for new entries

2. **Rename tiers**:
   - Right-click tier options menu
   - Edit tier name
   - Check version history

3. **Add new tiers**:
   - Hover over tier rows to see "+" button
   - Add new tier
   - Check version history

## Expected Results

### ✅ Cascade Delete
- Source item deletion automatically removes related tier cards
- Version history tracks the deletion
- No orphaned cards remain

### ✅ Version History
- All significant actions create new versions
- Versions can be restored
- Current version is clearly marked
- Deleted source items are detected and marked

### ✅ Deleted Source Handling
- Cards from deleted sources are visually distinct
- Functionality is properly restricted
- Clear warning messages are shown
- User understands the situation

## 🐛 Troubleshooting

### If cascade delete doesn't work:
- Check browser console for errors
- Verify source card has matching `text` and `type` properties
- Ensure `cascadeDeleteFromTiers()` function is called

### If version history doesn't save:
- Check that `saveVersion()` is called after operations
- Verify version history state is properly updated
- Check for JavaScript errors in console

### If deleted source indicators don't appear:
- Verify `isCardFromDeletedSource()` function logic
- Check that `isDeletedSource` prop is passed to Card component
- Ensure CSS classes are applied correctly

## 🎯 Success Criteria

The implementation is successful if:

1. ✅ Deleting a source item automatically removes all related tier cards
2. ✅ Version history tracks all significant actions
3. ✅ Restoring versions with deleted sources shows proper visual indicators
4. ✅ Deleted source cards are non-functional (no drag, no context menu)
5. ✅ Clear warning messages inform users about deleted source items
6. ✅ No JavaScript errors occur during any operation 