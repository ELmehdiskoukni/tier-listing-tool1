import React, { useState, useEffect } from 'react'
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
import { useTierBoard } from '../hooks/useTierBoard'
import { tierAPI } from '../api/apiClient'

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
    toggleCardHidden,
    createComment,
    deleteComment,
    createVersion,
    restoreVersion,
    importCardsToTier,
    clearError,
    refreshData,
    deleteCardsAndTier
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

  // Save version after significant changes
  const saveVersion = async (description) => {
    try {
      await createVersion({
        description,
        tiersData: JSON.parse(JSON.stringify(tiers)),
        sourceCardsData: JSON.parse(JSON.stringify(sourceCards))
      })
    } catch (err) {
      console.error('Failed to save version:', err)
    }
  }

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
      
      // Validate that we have at least 2 tiers after restoration
      const currentTiersResponse = await tierAPI.getAllTiersWithCards()
      const currentTiers = currentTiersResponse.data.data || currentTiersResponse.data
      if (!currentTiers || currentTiers.length < 2) {
        console.warn('Version restoration resulted in less than 2 tiers. Backend should have created default tiers.')
        setError('Warning: Version restored but board has insufficient tiers. Default tiers should have been created.')
        setTimeout(() => setError(null), 5000)
      } else {
        // Show success message
        setError('Version restored successfully!')
        setTimeout(() => setError(null), 3000)
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

  // Check if a card references a deleted source item
  const isCardFromDeletedSource = (card) => {
    // Only check cards that are from source areas (competitor, page, personas)
    if (!(card.type === 'competitor' || card.type === 'page' || card.type === 'personas')) {
      return false
    }

    // Get all current source cards
    const allSourceCards = [
      ...(sourceCards.competitors || []),
      ...(sourceCards.pages || []),
      ...(sourceCards.personas || [])
    ]
    
    // Check if there's a matching source card with the same text and type
    const matchingSourceCard = allSourceCards.find(sourceCard => 
      sourceCard.text === card.text && sourceCard.type === card.type
    )
    
    // If no matching source card is found, this card references a deleted source item
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
        // Only check cards that are from source areas
        if (card.type === 'competitor' || card.type === 'page' || card.type === 'personas') {
          // Check if there's a matching source card with the same text and type
          const matchingSourceCard = allSourceCards.find(sourceCard => 
            sourceCard.text === card.text && sourceCard.type === card.type
          )
          
          // If no matching source card is found, this card references a deleted source item
          return !matchingSourceCard
        }
        return false
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
      await moveTierPosition(tierId, 'up')
      await saveVersion(`Moved tier up`)
    } catch (err) {
      console.error('Failed to move tier up:', err)
    }
  }

  const moveTierDown = async (tierId) => {
    try {
      await moveTierPosition(tierId, 'down')
      await saveVersion(`Moved tier down`)
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
      console.log('🔍 About to call createCard with tierId:', selectedTierId)
      await createCard({
        ...cardData,
        tierId: selectedTierId
      })
      
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
      
      // Save version after importing cards
      const targetTier = tiers.find(tier => tier.id === selectedTierForImport)
      const tierName = targetTier?.name || ''
      const cardNames = selectedCardsData.map(selection => {
        const sourceCard = (sourceCards[selection.sourceCategory] || []).find(
          card => card.id === selection.cardId
        )
        return sourceCard?.text || ''
      }).join(', ')
      await saveVersion(`Imported ${selectedCardsData.length} cards (${cardNames}) to tier ${tierName}`)
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
    // Don't allow dragging cards from deleted sources
    if (isCardFromDeletedSource(card)) {
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
      } else {
        // Moving between tiers
        await moveCard(cardData.id, {
          targetTierId,
          position: position
        })
      }
      
      // Save version after moving card
      const sourceTier = tiers.find(tier => 
        (tier?.cards || []).some(card => card.id === cardData.id)
      )
      const targetTier = tiers.find(tier => tier.id === targetTierId)
      const sourceTierName = sourceTier?.name || 'source'
      const targetTierName = targetTier?.name || ''
      await saveVersion(`Moved card "${cardData.text}" from ${sourceTierName} to ${targetTierName}`)
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
      
      // Save version after creating source card
      await saveVersion(`Added source card "${cardData.text}" to ${selectedSourceType}`)
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
    // Don't show context menu for cards from deleted sources
    if (isCardFromDeletedSource(card)) {
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
    setSelectedCardForOperation(card)
    setIsEditCardModalOpen(true)
  }

  const handleDeleteCard = (card) => {
    setSelectedCardForOperation(card)
    setIsDeleteCardModalOpen(true)
  }

  const handleDuplicateCard = async (card) => {
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
        // Duplicate in source area
        await createSourceCard({
          ...card,
          text: `${card.text} Copy`,
          sourceCategory,
          comments: [] // Don't copy comments
        })
      } else {
        // Duplicate in tier
        await duplicateCard(card.id)
      }
    } catch (err) {
      console.error('Failed to duplicate card:', err)
    }
  }

  const handleAddCommentToCard = (card) => {
    setSelectedCardForOperation(card)
    setIsAddCommentModalOpen(true)
  }

  const handleToggleCardHidden = async (card) => {
    try {
      await toggleCardHidden(card.id)
    } catch (err) {
      console.error('Failed to toggle card hidden status:', err)
    }
  }

  const handleChangeCardImage = (card) => {
    setSelectedCardForOperation(card)
    setIsChangeImageModalOpen(true)
  }

  const handleRemoveImage = async (card) => {
    try {
      // Remove image and convert card back to text type
      await updateCardProperty(card, { 
        imageUrl: null, 
        image: null,
        subtype: 'text' // Convert from 'image' to 'text' type
      })
      
      // Save version after removing image
      await saveVersion(`Removed image from card "${card.text}"`)
    } catch (err) {
      console.error('Failed to remove image:', err)
    }
  }

  const handlePickAnotherPersona = (card) => {
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
      
      // Save version after changing persona
      await saveVersion(`Changed persona from "${currentCard.text}" to "${newPersona.text}"`)
    } catch (err) {
      console.error('Failed to change persona:', err)
    }
  }

  const handleSaveImage = async (card, newImageUrl) => {
    try {
      await updateCardProperty(card, { imageUrl: newImageUrl })
    } catch (err) {
      console.error('Failed to save image:', err)
    }
  }

  // Save edited card
  const handleSaveEditedCard = async (card, updates) => {
    try {
      await updateCardProperty(card, updates)
    } catch (err) {
      console.error('Failed to save edited card:', err)
    }
  }

  // Add comment to card
  const handleSaveComment = async (card, comment, updatedComments = null) => {
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
        
        // Save version after cascade delete
        await saveVersion(`Deleted source item "${card.text}" and related tier cards`)
      } else {
        // Remove from tier
        await deleteCard(card.id)
        
        // Save version after tier card deletion
        const tierWithCard = tiers.find(tier => 
          (tier.cards || []).some(c => c.id === card.id)
        )
        const tierName = tierWithCard?.name || ''
        await saveVersion(`Deleted card "${card.text}" from tier ${tierName}`)
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
        // Update in source area
        await updateSourceCard(targetCard.id, {
          ...targetCard,
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
      await updateTier(tierId, { color: newColor })
    } catch (err) {
      console.error('Failed to change tier color:', err)
    }
  }

  const saveTierName = async (newName) => {
    if (!selectedTierForEdit) return

    try {
      await updateTier(selectedTierForEdit.id, { name: newName })
      
      // Save version after renaming tier
      await saveVersion(`Renamed tier from "${selectedTierForEdit.name}" to "${newName}"`)
    } catch (err) {
      console.error('Failed to save tier name:', err)
    }
  }

  const handleDuplicateTier = async (tierId) => {
    try {
      await duplicateTier(tierId)
      setError('Tier duplicated successfully!')
      setTimeout(() => setError(null), 3000) // Clear success message after 3 seconds
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
      await saveVersion(`Deleted all cards in tier "${selectedTierForEdit.name}" and deleted the tier`)
      setError('Cards and tier deleted successfully!')
      setTimeout(() => setError(null), 3000) // Clear success message after 3 seconds
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

      // Save version after adding tier
      await saveVersion(`Added new tier "${newTierData.name}"`)
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
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      const now = new Date()
      const diffInMs = now - date
      const diffInHours = diffInMs / (1000 * 60 * 60)
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
      
      // Less than 1 hour ago
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInMs / (1000 * 60))
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
      }
      
      // Less than 24 hours ago
      if (diffInHours < 24) {
        const hours = Math.floor(diffInHours)
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`
      }
      
      // Less than 7 days ago
      if (diffInDays < 7) {
        const days = Math.floor(diffInDays)
        if (days === 1) {
          return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        }
        return `${days} days ago`
      }
      
      // More than 7 days ago - show full date
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  return (
    <div className="space-y-6">
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
                if (window.confirm('Are you sure you want to clear all cards from the board?')) {
                  try {
                    // Clear all tiers
                    for (const tier of tiers) {
                      await clearTierCards(tier.id)
                    }
                    setError('Board cleared successfully!')
                    setTimeout(() => setError(null), 3000) // Clear success message after 3 seconds
                  } catch (err) {
                    console.error('Failed to clear board:', err)
                    alert('Failed to clear board.')
                  }
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
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        index === currentVersionIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleRestoreVersion(version.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{version.description}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatVersionDate(version.created_at)}
                          </p>
                          {versionHasDeletedItems(version) && (
                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Contains deleted source items
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {index === currentVersionIndex && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Current
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRestoreVersion(version.id)
                            }}
                            disabled={loading.versions}
                            className={`text-sm font-medium transition-colors ${
                              loading.versions 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            {loading.versions ? (
                              <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Restoring...
                              </div>
                            ) : (
                              'Restore'
                            )}
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