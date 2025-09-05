import React, { useState, useEffect, useRef } from 'react'
import { toast as toastify } from 'react-toastify'
import TierRow from './TierRow'
import CardCreationModal from './CardCreationModal'
import EditTierNameModal from './EditTierNameModal'
import DeleteTierModal from './DeleteTierModal'
import TierOptionsMenu from './TierOptionsMenu'
import SourceArea from './SourceArea'
import AddSourceCardModal from './AddSourceCardModal'
import CardContextMenu from './CardContextMenu'
import EditCardModal from './EditCardModal'
import AddCommentModal from './AddCommentModal'
import DeleteCardModal from './DeleteCardModal'
import ChangeImageModal from './ChangeImageModal'
import ImportCardsModal from './ImportCardsModal'
import ExportModal from './ExportModal'
import PickAnotherPersonaModal from './PickAnotherPersonaModal'
import UndoRedoButtons from './UndoRedoButtons'
import { useTierBoard } from '../hooks/useTierBoard'
import { tierAPI, sourceCardAPI } from '../api/apiClient'

const TierBoard = () => {
  // Use the API hook for data management
  const {
    tiers,
    sourceCards,
    versionHistory,
    currentVersionIndex,
    loading,
    setLoading,
    error,
    setError,
    createTier,
    updateTier,
    deleteTier,
    moveTierPosition,
    duplicateTier,
    clearTierCards,
    createSourceCard,
    updateSourceCard,
    deleteSourceCard,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    duplicateCard,
    duplicateSourceCard,
    toggleCardHidden,
    createComment,
    deleteComment,
    createVersion,
    restoreVersion,
    deleteVersion,
    setManualVersionIndex,
    importCardsToTier,
    clearError,
    refreshData,
    deleteCardsAndTier,
    // Undo/Redo functionality
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    getNextUndoDescription,
    getNextRedoDescription,
    isPerformingAction,
    toast,
    setNextAutosaveDescription,
    clearToast
  } = useTierBoard()

  // Modal state for card creation
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState(null)

  // Modal state for tier operations
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTierForEdit, setSelectedTierForEdit] = useState(null)
  
  // State for tier options menu
  const [tierOptionsMenu, setTierOptionsMenu] = useState({
    isOpen: false,
    tierId: null,
    position: { top: 0, right: 0 }
  })

  // State for drag and drop
  const [draggedCard, setDraggedCard] = useState(null)

  // State for source card creation modal
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false)
  const [selectedSourceType, setSelectedSourceType] = useState(null)

  // State for card context menu
  const [cardContextMenu, setCardContextMenu] = useState({
    isOpen: false,
    card: null,
    position: { x: 0, y: 0 }
  })

  // State for card operation modals
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false)
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false)
  const [isDeleteCardModalOpen, setIsDeleteCardModalOpen] = useState(false)
  const [isChangeImageModalOpen, setIsChangeImageModalOpen] = useState(false)
  const [selectedCardForOperation, setSelectedCardForOperation] = useState(null)

  // State for import cards modal
  const [isImportCardsModalOpen, setIsImportCardsModalOpen] = useState(false)
  const [selectedTierForImport, setSelectedTierForImport] = useState(null)

  // State for export modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // State for pick another persona modal
  const [isPickAnotherPersonaModalOpen, setIsPickAnotherPersonaModalOpen] = useState(false)

  // Version History State
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)
  const currentVersionRef = useRef(null)

  // Manual version saving is now handled by autosave in the hook

  // Restore version
  const handleRestoreVersion = async (versionId) => {
    try {
      // Set loading state for version restoration
      setLoading(prev => ({ ...prev, versions: true }))
      
      // Show restoration in progress message
      setError('Restoring version... Please wait.')
      
      // Restore the version
      await restoreVersion(versionId)
      
      // Reload all data to get the restored state
      await refreshData()
      
      // Update currentVersionIndex to point to the restored version
      setManualVersionIndex(versionId)
      
      // Validate that we have at least 2 tiers after restoration
      const currentTiersResponse = await tierAPI.getAllTiersWithCards()
      const currentTiers = currentTiersResponse.data.data || currentTiersResponse.data
      if (!currentTiers || currentTiers.length < 2) {
        console.warn('Version restoration resulted in less than 2 tiers. Backend should have created default tiers.')
        setError('Warning: Version restored but board has insufficient tiers. Default tiers should have been created.')
        setTimeout(() => setError(null), 5000)
      } else {
        // Show success message
        toastify.success('Version restored successfully!')
      }
      
      // Close version history modal if open
      setIsVersionHistoryOpen(false)
      
      console.log('Version restored successfully')
    } catch (err) {
      console.error('Failed to restore version:', err)
      setError('Failed to restore version. Please try again.')
      setTimeout(() => setError(null), 5000)
    } finally {
      // Clear loading state
      setLoading(prev => ({ ...prev, versions: false }))
    }
  }

  // When opening the Version History, bring the current version into view and focus it
  // Robustly bring current version into view when the modal opens
  const scrollCurrentVersionIntoView = () => {
    // Use rAF to wait until the list is painted
    requestAnimationFrame(() => {
      if (currentVersionRef.current) {
        try {
          currentVersionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          currentVersionRef.current.focus({ preventScroll: true })
        } catch (e) {}
      }
    })
  }

  useEffect(() => {
    if (isVersionHistoryOpen && currentVersionIndex >= 0) {
      scrollCurrentVersionIntoView()
    }
  }, [isVersionHistoryOpen, currentVersionIndex, versionHistory.length])

  // Check if a card references a deleted source item
  const isCardFromDeletedSource = (card) => {
    // Only apply deleted-source logic to items that explicitly originate from a source area
    // Duplicated or regular tier cards should NOT be considered linked to source items
    if (!card || !card.sourceCategory) {
      return false
    }

    // Get all current source cards
    const allSourceCards = [
      ...(sourceCards.competitors || []),
      ...(sourceCards.pages || []),
      ...(sourceCards.personas || [])
    ]

    // A card truly references a deleted source item only if it carries a sourceCategory
    // and there is no matching source card remaining with the same id
    const matchingSourceCard = allSourceCards.find(sourceCard => sourceCard.id === card.id)
    return !matchingSourceCard
  }

  // Check if a card is in the source area (not in tiers)
  const isCardInSourceArea = (card) => {
    // Check if this card is in any source area
    const allSourceCards = [
      ...(sourceCards.competitors || []),
      ...(sourceCards.pages || []),
      ...(sourceCards.personas || [])
    ]
    
    // A card is in source area if:
    // 1. It has a sourceCategory property, OR
    // 2. Its ID matches a source card ID
    return card.sourceCategory || (allSourceCards || []).some(sourceCard => sourceCard.id === card.id)
  }

  // Check if a version has deleted source items
  const versionHasDeletedItems = (version) => {
    const allSourceCards = [
      ...(sourceCards.competitors || []),
      ...(sourceCards.pages || []),
      ...(sourceCards.personas || [])
    ]

    return (version.tiers || []).some(tier =>
      (tier.cards || []).some(card => {
        // Only consider cards that explicitly originate from source areas
        if (!card.sourceCategory) return false

        // Only treat as deleted if the exact source card id is missing from current sources
        const matchingSourceCard = allSourceCards.find(sourceCard => sourceCard.id === card.id)
        return !matchingSourceCard
      })
    )
  }

  // Cascade delete function - removes tier cards when source items are deleted
  const cascadeDeleteFromTiers = (deletedSourceCard) => {
    setTiers(prevTiers => 
      prevTiers.map(tier => ({
        ...tier,
        cards: (tier.cards || []).filter(card => 
          !(card.text === deletedSourceCard.text && card.type === deletedSourceCard.type)
        )
      }))
    )
  }

  const moveTierUp = async (tierId) => {
    try {
      const tier = tiers.find(t => t.id === tierId);
      await moveTierPosition(tierId, 'up')
      setNextAutosaveDescription(`Moved tier ${tier?.name || 'tier'} up`)
    } catch (err) {
      console.error('Failed to move tier up:', err)
    }
  }

  const moveTierDown = async (tierId) => {
    try {
      const tier = tiers.find(t => t.id === tierId);
      await moveTierPosition(tierId, 'down')
      setNextAutosaveDescription(`Moved tier ${tier?.name || 'tier'} down`)
    } catch (err) {
      console.error('Failed to move tier down:', err)
    }
  }

  const addCard = (tierId) => {
    console.log('🔍 addCard called with tierId:', tierId)
    console.log('🔍 Current tiers before addCard:', tiers)
    console.log('🔍 Current tiers length:', tiers?.length)
    console.log('🔍 About to set selectedTierId and open modal...')
    setSelectedTierId(tierId)
    setIsModalOpen(true)
    console.log('🔍 Modal should now be open')
  }

  const importCards = (tierId, sourceType = null) => {
    console.log('🔍 importCards called with tierId:', tierId, 'sourceType:', sourceType)
    setSelectedTierForImport(tierId)
    setSelectedSourceType(sourceType)
    setIsImportCardsModalOpen(true)
  }

  const handleCreateCard = async (cardData) => {
    console.log('🔍 handleCreateCard called with:', cardData)
    console.log('🔍 selectedTierId:', selectedTierId)
    console.log('🔍 Current tiers before handleCreateCard:', tiers)
    console.log('🔍 Current tiers length:', tiers?.length)
    
    if (!selectedTierId) {
      console.log('🔍 No selectedTierId, returning early')
      return
    }

    try {
      const tier = tiers.find(t => t.id === selectedTierId);
      console.log('🔍 About to call createCard with tierId:', selectedTierId)
      await createCard({
        ...cardData,
        tierId: selectedTierId
      })
      
      setNextAutosaveDescription(`Added card '${cardData.text}' to tier ${tier?.name || 'tier'}`)
      
      console.log('🔍 createCard completed successfully')
      console.log('🔍 Current tiers after createCard:', tiers)
      console.log('🔍 Current tiers length after createCard:', tiers?.length)
      
      // Don't save version immediately - let the user save manually or auto-save later
      // This prevents race conditions and state corruption
    } catch (err) {
      console.error('🔍 Failed to create card:', err)
    }
  }

  const handleImportCards = async (selectedCardsData) => {
    if (!selectedTierForImport) return

    try {
      // Extract just the card IDs from the selected cards data
      const sourceCardIds = selectedCardsData.map(selection => selection.cardId)
      
      await importCardsToTier({
        tierId: selectedTierForImport,
        sourceCardIds: sourceCardIds
      })
      
      const targetTier = tiers.find(tier => tier.id === selectedTierForImport)
      const cardNames = selectedCardsData.map(selection => {
        const sourceCard = (sourceCards[selection.sourceCategory] || []).find(
          card => card.id === selection.cardId
        )
        return sourceCard?.text || ''
      }).join(', ')
      
      setNextAutosaveDescription(`Imported ${selectedCardsData.length} cards (${cardNames}) to tier ${targetTier?.name || 'tier'}`)
    } catch (err) {
      console.error('Failed to import cards:', err)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTierId(null)
  }

  const closeImportModal = () => {
    setIsImportCardsModalOpen(false)
    setSelectedTierForImport(null)
    setSelectedSourceType(null)
  }

  // Drag and Drop handlers
  const handleDragStart = (card) => {
    // Don't allow dragging cards from deleted sources or hidden cards
    if (isCardFromDeletedSource(card) || card.hidden) {
      return
    }
    setDraggedCard(card)
  }

  const handleDragEnd = (card) => {
    setDraggedCard(null)
  }

  const handleMoveCard = async (cardData, targetTierId, dropPosition) => {
    if (!cardData) return

    try {
      // Convert drop position string to integer position
      let position = 0; // default to start
      
      if (dropPosition === 'start') {
        position = 0;
      } else if (dropPosition === 'middle') {
        // Get the middle position of the target tier
        const targetTier = tiers.find(tier => tier.id === targetTierId);
        const cardCount = targetTier?.cards?.length || 0;
        position = Math.floor(cardCount / 2);
      } else if (dropPosition === 'end') {
        // Get the end position of the target tier
        const targetTier = tiers.find(tier => tier.id === targetTierId);
        const cardCount = targetTier?.cards?.length || 0;
        position = cardCount;
      }
      
      // Check if card is from source area
      const isFromSource = cardData.sourceCategory
      
      if (isFromSource) {
        // Moving from source area to tier - create new card
        await createCard({
          ...cardData,
          tierId: targetTierId,
          position: position
        })
        const targetTier = tiers.find(tier => tier.id === targetTierId)
        setNextAutosaveDescription(`Added card '${cardData.text}' to tier ${targetTier?.name || 'tier'}`)
      } else {
        // Moving between tiers
        await moveCard(cardData.id, {
          targetTierId,
          position: position
        })
        
        const sourceTier = tiers.find(tier => 
          (tier?.cards || []).some(card => card.id === cardData.id)
        )
        const targetTier = tiers.find(tier => tier.id === targetTierId)
        setNextAutosaveDescription(`Moved card '${cardData.text}' from ${sourceTier?.name || 'tier'} to ${targetTier?.name || 'tier'}`)
      }
    } catch (err) {
      console.error('Failed to move card:', err)
    }
  }

  // Source card functions
  const handleAddSourceCard = (sourceType) => {
    setSelectedSourceType(sourceType)
    setIsSourceModalOpen(true)
  }

  const handleCreateSourceCard = async (cardData) => {
    if (!selectedSourceType) return

    try {
      await createSourceCard({
        ...cardData,
        sourceCategory: selectedSourceType
      })
      
      setNextAutosaveDescription(`Added source card '${cardData.text}' to ${selectedSourceType}`)
    } catch (err) {
      console.error('Failed to create source card:', err)
    }
  }

  const closeSourceModal = () => {
    setIsSourceModalOpen(false)
    setSelectedSourceType(null)
  }

  const closeChangeImageModal = () => {
    setIsChangeImageModalOpen(false)
    setSelectedCardForOperation(null)
  }

  const closePickAnotherPersonaModal = () => {
    setIsPickAnotherPersonaModalOpen(false)
    setSelectedCardForOperation(null)
  }

  // Card context menu functions
  const handleCardRightClick = (card, position) => {
    // Don't show context menu for cards that reference deleted source items
    if (isCardFromDeletedSource(card)) {
      return
    }

    // Allow context menu on hidden source cards (so user can unhide),
    // but keep blocking it for hidden tier cards
    if (card.hidden && !isCardInSourceArea(card)) {
      return
    }

    setCardContextMenu({
      isOpen: true,
      card: card,
      position: { x: position.x, y: position.y }
    })
  }

  const closeCardContextMenu = () => {
    setCardContextMenu({
      isOpen: false,
      card: null,
      position: { x: 0, y: 0 }
    })
  }

  const handleEditCard = (card) => {
    // Don't allow editing hidden cards
    if (card.hidden) {
      return
    }
    setSelectedCardForOperation(card)
    setIsEditCardModalOpen(true)
  }

  const handleDeleteCard = (card) => {
    // Don't allow deleting hidden cards
    if (card.hidden) {
      return
    }
    setSelectedCardForOperation(card)
    setIsDeleteCardModalOpen(true)
  }

  const handleDuplicateCard = async (card) => {
    // Don't allow duplicating hidden cards
    if (card.hidden) {
      return
    }
    try {
      // Find which tier or source area contains this card
      let foundInSource = false
      let sourceCategory = null

      // Check source areas first
      for (const [category, cards] of Object.entries(sourceCards)) {
        if ((cards || []).some(c => c.id === card.id)) {
          foundInSource = true
          sourceCategory = category
          break
        }
      }

      if (foundInSource) {
        // If the card is from a source area, duplicate it within the same source area
        await duplicateSourceCard(card.id)
      } else {
        // Duplicate in tier via backend endpoint that creates an independent tier card copy
        await duplicateCard(card.id)
      }
    } catch (err) {
      console.error('Failed to duplicate card:', err)
    }
  }

  const handleAddCommentToCard = (card) => {
    // Don't allow adding comments to hidden cards
    if (card.hidden) {
      return
    }
    setSelectedCardForOperation(card)
    setIsAddCommentModalOpen(true)
  }

  const handleToggleCardHidden = async (card) => {
    try {
      if (isCardInSourceArea(card)) {
        // Cascade toggle for all tier instances of this source card
        await sourceCardAPI.toggleHiddenForInstances(card.id)
        // Refresh tiers after cascading change
        await refreshData()
      } else {
        await toggleCardHidden(card.id)
      }
    } catch (err) {
      console.error('Failed to toggle card hidden status:', err)
    }
  }

  const handleChangeCardImage = (card) => {
    // Don't allow changing image of hidden cards
    if (card.hidden) {
      return
    }
    setSelectedCardForOperation(card)
    setIsChangeImageModalOpen(true)
  }

  const handleRemoveImage = async (card) => {
    // Don't allow removing image from hidden cards
    if (card.hidden) {
      return
    }
    try {
      // Remove image and convert card back to text type
      await updateCardProperty(card, { 
        imageUrl: null, 
        image: null,
        subtype: 'text' // Convert from 'image' to 'text' type
      })
      
      setNextAutosaveDescription(`Removed image from card '${card.text}'`)
    } catch (err) {
      console.error('Failed to remove image:', err)
    }
  }

  const handlePickAnotherPersona = (card) => {
    // Don't allow picking another persona for hidden cards
    if (card.hidden) {
      return
    }
    setSelectedCardForOperation(card)
    setIsPickAnotherPersonaModalOpen(true)
  }

  const handleConfirmPersonaChange = async (currentCard, newPersona) => {
    try {
      // Update the card with the new persona data while preserving existing properties
      await updateCardProperty(currentCard, {
        id: newPersona.id,
        text: newPersona.text,
        type: newPersona.type,
        subtype: newPersona.subtype,
        imageUrl: newPersona.imageUrl,
        image: newPersona.image,
        sourceCategory: newPersona.sourceCategory,
        // Preserve existing properties that shouldn't be overwritten
        comments: currentCard.comments,
        hidden: currentCard.hidden
      })
      
      setNextAutosaveDescription(`Changed persona from '${currentCard.text}' to '${newPersona.text}'`)
    } catch (err) {
      console.error('Failed to change persona:', err)
    }
  }

  const handleSaveImage = async (card, newImageUrl) => {
    // Don't allow saving image for hidden cards
    if (card.hidden) {
      return
    }
    try {
      console.log('🔍 handleSaveImage - card:', card)
      console.log('🔍 handleSaveImage - newImageUrl:', newImageUrl)
      console.log('🔍 handleSaveImage - updates object:', { imageUrl: newImageUrl })
      await updateCardProperty(card, { imageUrl: newImageUrl })
    } catch (err) {
      console.error('Failed to save image:', err)
    }
  }

  // Save edited card
  const handleSaveEditedCard = async (card, updates) => {
    // Don't allow saving edits for hidden cards
    if (card.hidden) {
      return
    }
    try {
      await updateCardProperty(card, updates)
    } catch (err) {
      console.error('Failed to save edited card:', err)
    }
  }

  // Add comment to card
  const handleSaveComment = async (card, comment, updatedComments = null) => {
    // Don't allow adding/removing comments for hidden cards
    if (card.hidden) {
      return
    }
    try {
      if (updatedComments !== null) {
        // This is a comment deletion - find the deleted comment and use the proper API
        const originalComments = card.comments || []
        const deletedComment = originalComments.find(c => !updatedComments.some(uc => uc.id === c.id))
        
        if (deletedComment) {
          // Use the proper comment deletion API
          await deleteComment(deletedComment.id, card.id)
        }
      } else if (comment) {
        // This is adding a new comment
        await createComment({
          cardId: card.id,
          text: comment, // Changed from 'content' to 'text' to match backend validation
          card: card
        })
      }
    } catch (err) {
      console.error('Failed to save comment:', err)
    }
  }

  // Confirm delete card
  const handleConfirmDeleteCard = async (card) => {
    try {
      // Find which tier or source area contains this card and remove it
      let foundInSource = false
      let sourceCategory = null

      // Check source areas first
      for (const [category, cards] of Object.entries(sourceCards)) {
        if ((cards || []).some(c => c.id === card.id)) {
          foundInSource = true
          sourceCategory = category
          break
        }
      }

      if (foundInSource) {
        // Remove from source area and cascade delete from tiers
        await deleteSourceCard(card.id, sourceCategory)
        
        setNextAutosaveDescription(`Deleted source item '${card.text}' and related tier cards`)
      } else {
        // Remove from tier
        await deleteCard(card.id)
        
        const tierWithCard = tiers.find(tier => 
          (tier.cards || []).some(c => c.id === card.id)
        )
        setNextAutosaveDescription(`Deleted card '${card.text}' from tier ${tierWithCard?.name || 'tier'}`)
      }
    } catch (err) {
      console.error('Failed to delete card:', err)
    }
  }

  // Helper function to update a card property across all locations
  const updateCardProperty = async (targetCard, updates) => {
    try {
      // Check source areas first
      let foundInSource = false
      let sourceCategory = null

      for (const [category, cards] of Object.entries(sourceCards)) {
        if ((cards || []).some(c => c.id === targetCard.id)) {
          foundInSource = true
          sourceCategory = category
          break
        }
      }

      if (foundInSource) {
        // Update in source area - only send the updates, not the entire card object
        console.log('🔍 updateCardProperty - foundInSource, updates:', updates)
        console.log('🔍 updateCardProperty - sending to updateSourceCard:', {
          ...updates,
          sourceCategory
        })
        await updateSourceCard(targetCard.id, {
          ...updates,
          sourceCategory
        })
      } else {
        // Update in tier
        await updateCard(targetCard.id, updates)
      }
    } catch (err) {
      console.error('Failed to update card property:', err)
    }
  }

  const openTierOptionsMenu = (tierId, position) => {
    setTierOptionsMenu({
      isOpen: true,
      tierId: tierId,
      position: position
    })
  }

  const closeTierOptionsMenu = () => {
    setTierOptionsMenu({
      isOpen: false,
      tierId: null,
      position: { top: 0, right: 0 }
    })
  }

  const openTierOptions = (tierId, action, data) => {
    // Close the menu first
    closeTierOptionsMenu()
    
    const tier = tiers.find(t => t.id === tierId)
    if (!tier) return

    switch (action) {
      case 'edit-name':
        setSelectedTierForEdit(tier)
        setIsEditNameModalOpen(true)
        break
      case 'change-color':
        changeTierColor(tierId, data)
        break
      case 'duplicate':
        handleDuplicateTier(tierId)
        break
      case 'delete':
        // Check if deletion is allowed (minimum 2 tiers requirement)
        if (tiers.length <= 2) {
          setError('Cannot delete tier. Your Tier Listing board must have at least 2 tiers.')
          setTimeout(() => setError(null), 5000) // Clear error message after 5 seconds
          return
        }
        setSelectedTierForEdit(tier)
        setIsDeleteModalOpen(true)
        break
      default:
        console.log(`Unknown tier action: ${action}`)
    }
  }

  const changeTierColor = async (tierId, newColor) => {
    try {
      const tier = tiers.find(t => t.id === tierId);
      await updateTier(tierId, { color: newColor })
      setNextAutosaveDescription(`Changed tier ${tier?.name || 'tier'} color to ${newColor.replace('bg-', '').replace('-200', '')}`)
    } catch (err) {
      console.error('Failed to change tier color:', err)
    }
  }

  const saveTierName = async (newName) => {
    if (!selectedTierForEdit) return

    try {
      await updateTier(selectedTierForEdit.id, { name: newName })
      
      setNextAutosaveDescription(`Renamed tier from '${selectedTierForEdit.name}' to '${newName}'`)
    } catch (err) {
      console.error('Failed to save tier name:', err)
    }
  }

  const handleDuplicateTier = async (tierId) => {
    try {
      await duplicateTier(tierId)
      toastify.success('Tier duplicated successfully!')
    } catch (err) {
      console.error('Failed to duplicate tier:', err)
    }
  }

  const handleDeleteTier = async () => {
    if (!selectedTierForEdit) return

    // Don't allow deleting if only 2 tiers remain (minimum requirement)
    if (tiers.length <= 2) {
      setError('Cannot delete tier. Your Tier Listing board must have at least 2 tiers.')
      setTimeout(() => setError(null), 5000) // Clear error message after 5 seconds
      return
    }

    // If the tier has cards, the modal will handle the options
    // Otherwise, proceed with direct deletion (though the modal now handles this logic)
    // This function is now primarily a trigger for the modal
    setIsDeleteModalOpen(true)
  }

  // Handle deleting all cards in a tier and then deleting the tier
  const handleDeleteCardsAndTier = async () => {
    if (!selectedTierForEdit) return

    // Don't allow deleting if only 2 tiers remain (minimum requirement)
    if (tiers.length <= 2) {
      setError('Cannot delete tier. Your Tier Listing board must have at least 2 tiers.')
      setTimeout(() => setError(null), 5000) // Clear error message after 5 seconds
      return
    }

    try {
      await deleteCardsAndTier(selectedTierForEdit.id)
      setNextAutosaveDescription(`Deleted tier ${selectedTierForEdit.name} and its cards`)
      // Autosave will capture this change
      toastify.success('Cards and tier deleted successfully!')
    } catch (err) {
      console.error('Failed to delete cards and tier:', err)
      throw err // Re-throw to let the modal handle the error
    }
  }

  // Add new tier functionality
  const addTierBelow = async (currentTierId) => {
    try {
      console.log('🔍 addTierBelow called with currentTierId:', currentTierId)
      console.log('🔍 Current tiers:', tiers)
      
      // Available colors to cycle through
      const availableColors = [
        'bg-gray-300',
        'bg-blue-200', 
        'bg-yellow-200',
        'bg-green-200',
        'bg-red-200',
        'bg-purple-200',
        'bg-orange-200',
        'bg-pink-200'
      ]

      // Generate next tier name
      const getNextTierName = () => {
        const usedNames = (tiers || []).map(tier => tier?.name?.toUpperCase() || '')
        
        // Try letters A-Z first
        for (let i = 65; i <= 90; i++) { // A-Z ASCII codes
          const letter = String.fromCharCode(i)
          if (!usedNames.includes(letter)) {
            return letter
          }
        }
        
        // If all letters are used, use "New Tier X"
        let counter = 1
        while (usedNames.includes(`NEW TIER ${counter}`)) {
          counter++
        }
        return `New Tier ${counter}`
      }

      // Find the current tier to get its position
      const currentTier = tiers.find(tier => tier.id === currentTierId)
      if (!currentTier) {
        console.error('🔍 Current tier not found:', currentTierId)
        throw new Error('Current tier not found')
      }

      console.log('🔍 Current tier found:', currentTier)
      console.log('🔍 Current tier position:', currentTier.position)

      // Calculate the new position (after the current tier)
      const newPosition = currentTier.position + 1
      console.log('🔍 Calculated new position:', newPosition)

      // Pick color (cycle through available colors based on tier count)
      const colorIndex = tiers.length % availableColors.length
      const newColor = availableColors[colorIndex]

      // Create new tier data with integer position
      const newTierData = {
        name: getNextTierName(),
        color: newColor,
        position: newPosition
      }

      console.log('🔍 New tier data to send:', newTierData)

      await createTier(newTierData)
      setNextAutosaveDescription(`Added tier ${newTierData.name}`)
      // Autosave will capture this change
    } catch (err) {
      console.error('🔍 Failed to add tier:', err)
    }
  }

  const selectedTier = (tiers || []).find(tier => tier?.id === selectedTierId)
  const tierForOptionsMenu = (tiers || []).find(tier => tier?.id === tierOptionsMenu.tierId)

  // Helper function to format dates in a user-friendly way
  const formatVersionDate = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    try {
      const now = new Date()
      let versionDate
      if (timestamp instanceof Date) {
        versionDate = new Date(timestamp.getTime())
      } else if (typeof timestamp === 'string') {
        const isoLike = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)
        versionDate = new Date(isoLike && !/Z|[+-]\d{2}:?\d{2}$/.test(timestamp) ? `${timestamp}Z` : timestamp)
      } else {
        versionDate = new Date(timestamp)
      }
      if (isNaN(versionDate.getTime())) {
        return 'Invalid date'
      }
      const diffMs = now.getTime() - versionDate.getTime()
      const diffMinutes = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      return versionDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={clearToast}
              className="ml-2 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`border rounded-lg p-4 mb-4 ${
          error.toLowerCase().includes('successfully') 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {error.toLowerCase().includes('successfully') ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className={`font-medium ${
                error.toLowerCase().includes('successfully') 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {error.toLowerCase().includes('successfully') ? error : `Error loading data: ${error}`}
              </span>
            </div>
            <button
              onClick={clearError}
              className={`font-medium ${
                error.toLowerCase().includes('successfully') 
                  ? 'text-green-600 hover:text-green-800' 
                  : 'text-red-600 hover:text-red-800'
              }`}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {(loading.tiers || loading.sourceCards || loading.versions) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-blue-800 font-medium">
              {loading.tiers && loading.sourceCards && loading.versions 
                ? 'Loading all data...' 
                : 'Loading data...'}
            </span>
          </div>
        </div>
      )}

      {/* Source Area - Above Tier Board */}
      <SourceArea 
        sourceCards={sourceCards}
        onAddSourceCard={handleAddSourceCard}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggedCard={draggedCard}
        onCardRightClick={handleCardRightClick}
      />

      {/* Main Tier Board */}
      <div className="bg-white rounded-lg shadow-lg p-6 tier-board-container">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4">
          {/* Left side buttons */}
          <div className="flex gap-2">
            {/* Version History Button */}
            <button
              onClick={() => setIsVersionHistoryOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Version History
            </button>
            
            {/* Undo/Redo Buttons */}
            <UndoRedoButtons
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              undoDescription={getNextUndoDescription()}
              redoDescription={getNextRedoDescription()}
            />
          </div>
          
          {/* Right side buttons */}
          <div className="flex gap-2">
            {/* Export Button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Board
            </button>
            
            {/* Clear Board Button */}
            <button
              onClick={async () => {
                // Simple non-blocking confirm via toast could be implemented; for now, proceed without window.confirm
                try {
                  for (const tier of tiers) {
                    await clearTierCards(tier.id)
                  }
                  toastify.success('Board cleared successfully!')
                } catch (err) {
                  console.error('Failed to clear board:', err)
                  setError('Failed to clear board.')
                  setTimeout(() => setError(null), 3000)
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Board
            </button>
          </div>
        </div>
        
        {/* Warning message for deleted source items */}
        {(tiers || []).some(tier => 
          (tier?.cards || []).some(card => isCardFromDeletedSource(card))
        ) && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-yellow-800 font-medium">
                Some cards reference deleted source items and are marked with a red X. These cards cannot be moved or edited.
              </span>
            </div>
          </div>
        )}

        {/* Warning message for hidden cards */}
        {(tiers || []).some(tier => 
          (tier?.cards || []).some(card => card.hidden)
        ) && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-gray-800 font-medium">
                Some cards are hidden and are marked with a gray X. These cards cannot be moved or edited.
              </span>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading.tiers && !loading.versions && (!tiers || tiers.length === 0) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-gray-900">No tiers available</h3>
                <p className="text-gray-500">Create your first tier to get started.</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State for Tiers */}
        {(loading.tiers || loading.versions) && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tiers List */}
        {!loading.tiers && !loading.versions && tiers && tiers.length > 0 && (
          <div className="space-y-2">
            {tiers.map((tier, index) => (
              <TierRow
                key={tier?.id || index}
                tier={tier}
                isFirst={index === 0}
                isLast={index === (tiers?.length || 0) - 1}
                sourceCards={sourceCards}
                onMoveTierUp={() => moveTierUp(tier.id)}
                onMoveTierDown={() => moveTierDown(tier.id)}
                onAddCard={() => addCard(tier.id)}
                onImportCards={(sourceType) => importCards(tier.id, sourceType)}
                onOpenOptionsMenu={(position) => openTierOptionsMenu(tier.id, position)}
                onOpenOptions={(action, data) => openTierOptions(tier.id, action, data)}
                onMoveCard={handleMoveCard}
                draggedCard={draggedCard}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onAddTierBelow={() => addTierBelow(tier.id)}
                onCardRightClick={handleCardRightClick}
                isCardFromDeletedSource={isCardFromDeletedSource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Context Menu */}
      <CardContextMenu
        isOpen={cardContextMenu.isOpen}
        position={cardContextMenu.position}
        card={cardContextMenu.card}
        onClose={closeCardContextMenu}
        onEdit={handleEditCard}
        onDelete={handleDeleteCard}
        onDuplicate={handleDuplicateCard}
        onAddComment={handleAddCommentToCard}
        onToggleHidden={handleToggleCardHidden}
        onChangeImage={handleChangeCardImage}
        onRemoveImage={handleRemoveImage}
        onPickAnotherPersona={handlePickAnotherPersona}
        isCardInSourceArea={isCardInSourceArea}
      />

      {/* Tier Options Menu - Rendered at board level */}
      <TierOptionsMenu
        isOpen={tierOptionsMenu.isOpen}
        onClose={closeTierOptionsMenu}
        tierName={tierForOptionsMenu?.name || ''}
        tierColor={tierForOptionsMenu?.color || ''}
        onEditName={() => openTierOptions(tierOptionsMenu.tierId, 'edit-name')}
        onChangeColor={(color) => openTierOptions(tierOptionsMenu.tierId, 'change-color', color)}
        onDuplicate={() => openTierOptions(tierOptionsMenu.tierId, 'duplicate')}
        onDelete={() => openTierOptions(tierOptionsMenu.tierId, 'delete')}
        position={tierOptionsMenu.position}
        canDelete={tiers.length > 2} // Only allow deletion if more than 2 tiers exist
      />

      {/* Edit Card Modal */}
      <EditCardModal
        isOpen={isEditCardModalOpen}
        onClose={() => {
          setIsEditCardModalOpen(false)
          setSelectedCardForOperation(null)
        }}
        card={selectedCardForOperation}
        onSave={handleSaveEditedCard}
      />

      {/* Add Comment Modal */}
      <AddCommentModal
        isOpen={isAddCommentModalOpen}
        onClose={() => {
          setIsAddCommentModalOpen(false)
          setSelectedCardForOperation(null)
        }}
        card={selectedCardForOperation}
        onAddComment={handleSaveComment}
      />

      {/* Delete Card Modal */}
      <DeleteCardModal
        isOpen={isDeleteCardModalOpen}
        onClose={() => {
          setIsDeleteCardModalOpen(false)
          setSelectedCardForOperation(null)
        }}
        card={selectedCardForOperation}
        onConfirm={handleConfirmDeleteCard}
      />

      {/* Change Image Modal */}
      <ChangeImageModal
        isOpen={isChangeImageModalOpen}
        onClose={closeChangeImageModal}
        onSaveImage={handleSaveImage}
        card={selectedCardForOperation}
      />

      {/* Pick Another Persona Modal */}
      <PickAnotherPersonaModal
        isOpen={isPickAnotherPersonaModalOpen}
        onClose={closePickAnotherPersonaModal}
        currentCard={selectedCardForOperation}
        availablePersonas={(sourceCards.personas || []).filter(p => p.id !== selectedCardForOperation?.id)}
        onConfirm={handleConfirmPersonaChange}
      />

      {/* Source Card Creation Modal */}
      <AddSourceCardModal
        isOpen={isSourceModalOpen}
        onClose={closeSourceModal}
        onCreateCard={handleCreateSourceCard}
        sourceType={selectedSourceType}
      />

      {/* Card Creation Modal (for tier cards) */}
      <CardCreationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onCreateCard={handleCreateCard}
        tierName={tiers.find(t => t.id === selectedTierId)?.name || ''}
      />

      {/* Import Cards Modal */}
      <ImportCardsModal
        isOpen={isImportCardsModalOpen}
        onClose={closeImportModal}
        onImportCards={handleImportCards}
        sourceCards={sourceCards}
        tierName={tiers.find(t => t.id === selectedTierForImport)?.name || ''}
        selectedSourceType={selectedSourceType}
      />

      {/* Edit Tier Name Modal */}
      <EditTierNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => {
          setIsEditNameModalOpen(false)
          setSelectedTierForEdit(null)
        }}
        currentName={selectedTierForEdit?.name || ''}
        onSave={saveTierName}
      />

      {/* Delete Tier Modal */}
      <DeleteTierModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedTierForEdit(null)
        }}
        tierName={selectedTierForEdit?.name || ''}
        cardCount={selectedTierForEdit?.cards?.length || 0}
        onDeleteCardsAndTier={handleDeleteCardsAndTier}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tiers={tiers}
        sourceCards={sourceCards}
      />

      {/* Version History Modal */}
      {isVersionHistoryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999999999]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Version History</h2>
                <button
                  onClick={() => setIsVersionHistoryOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {versionHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No version history available</p>
              ) : (
                <div className="space-y-3">
                  {versionHistory.map((version, index) => (
                    <div
                      key={version.id}
                      ref={index === currentVersionIndex ? currentVersionRef : null}
                      tabIndex={index === currentVersionIndex ? -1 : 0}
                      aria-current={index === currentVersionIndex ? 'true' : undefined}
                      className={`p-4 border rounded-lg transition-colors outline-none ${
                        index === currentVersionIndex
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{version.description}</h3>
                          <p className="text-sm text-gray-500 mt-1">{formatVersionDate(version.created_at)}</p>
                          {versionHasDeletedItems(version) && (
                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Contains deleted source items
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {index === currentVersionIndex && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Current
                            </span>
                          )}
                          <button
                            onClick={() => handleRestoreVersion(version.id)}
                            disabled={loading.versions}
                            className={`text-sm font-medium transition-colors ${
                              loading.versions 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            {loading.versions ? 'Restoring...' : 'Restore'}
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                await deleteVersion(version.id)
                              } catch {}
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                            title="Delete version"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TierBoard