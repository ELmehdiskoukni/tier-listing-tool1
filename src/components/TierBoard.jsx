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

const TierBoard = () => {
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

  // State for source cards (above tier board)
  const [sourceCards, setSourceCards] = useState({
    competitors: [
      { 
        id: 'source-comp-1', 
        text: 'Google Google', 
        type: 'competitor', 
        subtype: 'image', 
        sourceCategory: 'competitors',
        imageUrl: 'https://img.logo.dev/google.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200'
      },
      { 
        id: 'source-comp-2', 
        text: 'Meta', 
        type: 'competitor', 
        subtype: 'text', 
        sourceCategory: 'competitors' 
      },
      { 
        id: 'source-comp-3', 
        text: 'Apple Apple', 
        type: 'competitor', 
        subtype: 'image', 
        sourceCategory: 'competitors',
        imageUrl: 'https://img.logo.dev/apple.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200'
      }
    ],
    pages: [
      { id: 'source-page-1', text: 'Homepage', type: 'page', sourceCategory: 'pages' },
      { id: 'source-page-2', text: 'About Us', type: 'page', sourceCategory: 'pages' }
    ],
    personas: [
      { id: 'source-persona-1', text: 'Adam', type: 'personas', sourceCategory: 'personas' },
      { id: 'source-persona-2', text: 'Sara', type: 'personas', sourceCategory: 'personas' }
    ]
  })

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
  const [versionHistory, setVersionHistory] = useState([])
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1)
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)

  // Initial tier data with updated card types
  const [tiers, setTiers] = useState([
    {
      id: 'tier-a',
      name: 'A',
      color: 'bg-blue-200',
      cards: []
    },
    {
      id: 'tier-b',
      name: 'B',
      color: 'bg-blue-200',
      cards: []
    },
    {
      id: 'tier-c',
      name: 'C',
      color: 'bg-blue-200',
      cards: []
    },
    {
      id: 'tier-d',
      name: 'D',
      color: 'bg-yellow-200',
      cards: []
    },
    {
      id: 'tier-e',
      name: 'E',
      color: 'bg-purple-200',
      cards: []
    }
  ])

  // Initialize version history with current state
  useEffect(() => {
    const initialVersion = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      description: 'Initial state',
      tiers: JSON.parse(JSON.stringify(tiers)),
      sourceCards: JSON.parse(JSON.stringify(sourceCards))
    }
    setVersionHistory([initialVersion])
    setCurrentVersionIndex(0)
  }, [])

  // Save version after significant changes
  const saveVersion = (description) => {
    const newVersion = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      description,
      tiers: JSON.parse(JSON.stringify(tiers)),
      sourceCards: JSON.parse(JSON.stringify(sourceCards))
    }
    
    setVersionHistory(prev => {
      const updatedHistory = [...prev.slice(0, currentVersionIndex + 1), newVersion]
      // Keep only last 20 versions
      return updatedHistory.slice(-20)
    })
    setCurrentVersionIndex(prev => Math.min(prev + 1, 19))
  }

  // Restore version
  const restoreVersion = (versionIndex) => {
    if (versionIndex < 0 || versionIndex >= versionHistory.length) return
    
    const version = versionHistory[versionIndex]
    setTiers(JSON.parse(JSON.stringify(version.tiers)))
    setSourceCards(JSON.parse(JSON.stringify(version.sourceCards)))
    setCurrentVersionIndex(versionIndex)
  }

  // Check if a card references a deleted source item
  const isCardFromDeletedSource = (card) => {
    // Check if this card matches any current source item
    const allSourceCards = [
      ...sourceCards.competitors,
      ...sourceCards.pages,
      ...sourceCards.personas
    ]
    
    // A card is from a deleted source if it has the same text and type as a source item
    // but that source item no longer exists
    return allSourceCards.some(sourceCard => 
      sourceCard.text === card.text && sourceCard.type === card.type
    ) === false && (
      card.type === 'competitor' || 
      card.type === 'page' || 
      card.type === 'personas'
    )
  }

  // Check if a card is in the source area (not in tiers)
  const isCardInSourceArea = (card) => {
    // Check if this card is in any source area
    const allSourceCards = [
      ...sourceCards.competitors,
      ...sourceCards.pages,
      ...sourceCards.personas
    ]
    
    // A card is in source area if:
    // 1. It has a sourceCategory property, OR
    // 2. Its ID matches a source card ID
    return card.sourceCategory || allSourceCards.some(sourceCard => sourceCard.id === card.id)
  }

  // Check if a version has deleted source items
  const versionHasDeletedItems = (version) => {
    const allSourceCards = [
      ...sourceCards.competitors,
      ...sourceCards.pages,
      ...sourceCards.personas
    ]
    
    return version.tiers.some(tier => 
      tier.cards.some(card => {
        if (card.type === 'competitor' || card.type === 'page' || card.type === 'personas') {
          return !allSourceCards.some(sourceCard => 
            sourceCard.text === card.text && sourceCard.type === card.type
          )
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
        cards: tier.cards.filter(card => 
          !(card.text === deletedSourceCard.text && card.type === deletedSourceCard.type)
        )
      }))
    )
  }

  const moveTierUp = (tierId) => {
    const tierIndex = tiers.findIndex(tier => tier.id === tierId)
    if (tierIndex > 0) {
      const newTiers = [...tiers]
      // Store the tiers we want to swap
      const currentTier = newTiers[tierIndex]
      const tierAbove = newTiers[tierIndex - 1]
      // Swap them
      newTiers[tierIndex - 1] = currentTier
      newTiers[tierIndex] = tierAbove
      setTiers(newTiers)
      
      // Save version after moving tier
      saveVersion(`Moved tier ${currentTier.name} up`)
    }
  }

  const moveTierDown = (tierId) => {
    const tierIndex = tiers.findIndex(tier => tier.id === tierId)
    if (tierIndex < tiers.length - 1) {
      const newTiers = [...tiers]
      // Store the tiers we want to swap
      const currentTier = newTiers[tierIndex]
      const tierBelow = newTiers[tierIndex + 1]
      // Swap them
      newTiers[tierIndex] = tierBelow
      newTiers[tierIndex + 1] = currentTier
      setTiers(newTiers)
      
      // Save version after moving tier
      saveVersion(`Moved tier ${currentTier.name} down`)
    }
  }

  const addCard = (tierId) => {
    setSelectedTierId(tierId)
    setIsModalOpen(true)
  }

  const importCards = (tierId, sourceType = null) => {
    setSelectedTierForImport(tierId)
    setSelectedSourceType(sourceType)
    setIsImportCardsModalOpen(true)
  }

  const handleCreateCard = async (cardData) => {
    if (!selectedTierId) return

    // Generate a unique ID for the new card
    const newCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: cardData.text,
      type: cardData.type
    }

    // Add the card to the selected tier
    setTiers(prevTiers => 
      prevTiers.map(tier => 
        tier.id === selectedTierId 
          ? { ...tier, cards: [...tier.cards, newCard] }
          : tier
      )
    )
    
    // Save version after creating card
    const tierName = tiers.find(t => t.id === selectedTierId)?.name || ''
    saveVersion(`Added card "${cardData.text}" to tier ${tierName}`)
  }

  const handleImportCards = async (selectedCardsData) => {
    if (!selectedTierForImport) return

    // Find the target tier
    const targetTier = tiers.find(tier => tier.id === selectedTierForImport)
    if (!targetTier) return

    // Create new cards from source cards
    const newCards = selectedCardsData.map(selection => {
      const sourceCard = sourceCards[selection.sourceCategory].find(
        card => card.id === selection.cardId
      )
      
      if (!sourceCard) return null

      return {
        ...sourceCard,
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // New ID for tier
        sourceCategory: undefined // Remove source category
      }
    }).filter(Boolean)

    // Add the cards to the target tier
    setTiers(prevTiers => 
      prevTiers.map(tier => 
        tier.id === selectedTierForImport 
          ? { ...tier, cards: [...tier.cards, ...newCards] }
          : tier
      )
    )
    
    // Save version after importing cards
    const tierName = targetTier.name
    const cardNames = newCards.map(card => card.text).join(', ')
    saveVersion(`Imported ${newCards.length} cards (${cardNames}) to tier ${tierName}`)
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

  const handleMoveCard = (cardData, targetTierId, dropPosition) => {
    if (!cardData) return

    // Check if card is from source area
    const isFromSource = cardData.sourceCategory
    
    if (isFromSource) {
      // Moving from source area to tier
      const targetTier = tiers.find(tier => tier.id === targetTierId)
      if (!targetTier) return

      // Create a copy of the card for the tier (keep original in source)
      const newCard = {
        ...cardData,
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // New ID for tier
        sourceCategory: undefined // Remove source category
      }

      let newCards
      if (dropPosition === 'start') {
        newCards = [newCard, ...targetTier.cards]
      } else if (dropPosition === 'middle') {
        const middleIndex = Math.floor(targetTier.cards.length / 2)
        newCards = [
          ...targetTier.cards.slice(0, middleIndex),
          newCard,
          ...targetTier.cards.slice(middleIndex)
        ]
      } else { // 'end'
        newCards = [...targetTier.cards, newCard]
      }

      const updatedTargetTier = {
        ...targetTier,
        cards: newCards
      }

      // Update only the target tier (source card stays in source)
      setTiers(prevTiers => 
        prevTiers.map(tier => 
          tier.id === targetTier.id ? updatedTargetTier : tier
        )
      )
      return
    }

    // Original logic for moving between tiers
    const sourceTier = tiers.find(tier => 
      tier.cards.some(card => card.id === cardData.id)
    )
    
    if (!sourceTier) return

    // Remove card from source tier
    const updatedSourceTier = {
      ...sourceTier,
      cards: sourceTier.cards.filter(card => card.id !== cardData.id)
    }

    // Find target tier and add card
    const targetTier = tiers.find(tier => tier.id === targetTierId)
    if (!targetTier) return

    let updatedTargetTier
    
    if (sourceTier.id === targetTier.id) {
      // Moving within the same tier - handle reordering
      const cardIndex = sourceTier.cards.findIndex(card => card.id === cardData.id)
      const otherCards = sourceTier.cards.filter(card => card.id !== cardData.id)
      
      let newCards
      if (dropPosition === 'start') {
        newCards = [cardData, ...otherCards]
      } else if (dropPosition === 'middle') {
        const middleIndex = Math.floor(otherCards.length / 2)
        newCards = [
          ...otherCards.slice(0, middleIndex),
          cardData,
          ...otherCards.slice(middleIndex)
        ]
      } else { // 'end'
        newCards = [...otherCards, cardData]
      }
      
      updatedTargetTier = {
        ...targetTier,
        cards: newCards
      }
    } else {
      // Moving between different tiers
      let newCards
      if (dropPosition === 'start') {
        newCards = [cardData, ...targetTier.cards]
      } else if (dropPosition === 'middle') {
        const middleIndex = Math.floor(targetTier.cards.length / 2)
        newCards = [
          ...targetTier.cards.slice(0, middleIndex),
          cardData,
          ...targetTier.cards.slice(middleIndex)
        ]
      } else { // 'end'
        newCards = [...targetTier.cards, cardData]
      }
      
      updatedTargetTier = {
        ...targetTier,
        cards: newCards
      }
    }

    // Update tiers state
    setTiers(prevTiers => 
      prevTiers.map(tier => {
        if (tier.id === sourceTier.id && sourceTier.id !== targetTier.id) {
          return updatedSourceTier
        } else if (tier.id === targetTier.id) {
          return updatedTargetTier
        }
        return tier
      })
    )
    
    // Save version after moving card
    const sourceTierName = sourceTier.name
    const targetTierName = targetTier.name
    saveVersion(`Moved card "${cardData.text}" from tier ${sourceTierName} to ${targetTierName}`)
  }

  // Source card functions
  const handleAddSourceCard = (sourceType) => {
    setSelectedSourceType(sourceType)
    setIsSourceModalOpen(true)
  }

  const handleCreateSourceCard = async (cardData) => {
    if (!selectedSourceType) return

    const newCard = {
      id: `source-${selectedSourceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: cardData.text,
      type: cardData.type,
      subtype: cardData.subtype,
      sourceCategory: selectedSourceType,
      imageUrl: cardData.imageUrl || null
    }

    setSourceCards(prevCards => ({
      ...prevCards,
      [selectedSourceType]: [...(prevCards[selectedSourceType] || []), newCard]
    }))
    
    // Save version after creating source card
    saveVersion(`Added source card "${cardData.text}" to ${selectedSourceType}`)
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

  const handleDuplicateCard = (card) => {
    // Find which tier or source area contains this card
    let foundInSource = false
    let sourceCategory = null

    // Check source areas first
    for (const [category, cards] of Object.entries(sourceCards)) {
      if (cards.some(c => c.id === card.id)) {
        foundInSource = true
        sourceCategory = category
        break
      }
    }

    if (foundInSource) {
      // Duplicate in source area
      const newCard = {
        ...card,
        id: `source-${sourceCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: `${card.text} Copy`,
        comments: [] // Don't copy comments
      }

      setSourceCards(prevCards => ({
        ...prevCards,
        [sourceCategory]: [...prevCards[sourceCategory], newCard]
      }))
    } else {
      // Duplicate in tier
      const tierWithCard = tiers.find(tier => 
        tier.cards.some(c => c.id === card.id)
      )

      if (tierWithCard) {
        const newCard = {
          ...card,
          id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: `${card.text} Copy`,
          comments: [] // Don't copy comments
        }

        const cardIndex = tierWithCard.cards.findIndex(c => c.id === card.id)
        const updatedTier = {
          ...tierWithCard,
          cards: [
            ...tierWithCard.cards.slice(0, cardIndex + 1),
            newCard,
            ...tierWithCard.cards.slice(cardIndex + 1)
          ]
        }

        setTiers(prevTiers =>
          prevTiers.map(tier =>
            tier.id === tierWithCard.id ? updatedTier : tier
          )
        )
      }
    }
  }

  const handleAddCommentToCard = (card) => {
    setSelectedCardForOperation(card)
    setIsAddCommentModalOpen(true)
  }

  const handleToggleCardHidden = (card) => {
    const isCurrentlyHidden = card.hidden || false
    updateCardProperty(card, { hidden: !isCurrentlyHidden })
  }

  const handleChangeCardImage = (card) => {
    setSelectedCardForOperation(card)
    setIsChangeImageModalOpen(true)
  }

  const handleRemoveImage = (card) => {
    updateCardProperty(card, { imageUrl: null, image: null })
  }

  const handlePickAnotherPersona = (card) => {
    setSelectedCardForOperation(card)
    setIsPickAnotherPersonaModalOpen(true)
  }

  const handleConfirmPersonaChange = (currentCard, newPersona) => {
    // Update the card with the new persona data while preserving existing properties
    updateCardProperty(currentCard, {
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
    saveVersion(`Changed persona from "${currentCard.text}" to "${newPersona.text}"`)
  }

  const handleSaveImage = async (card, newImageUrl) => {
    updateCardProperty(card, { imageUrl: newImageUrl })
  }

  // Save edited card
  const handleSaveEditedCard = (card, updates) => {
    updateCardProperty(card, updates)
  }

  // Add comment to card
  const handleSaveComment = (card, comment, updatedComments = null) => {
    if (updatedComments !== null) {
      // This is a comment deletion - use the provided updated comments array
      updateCardProperty(card, { comments: updatedComments })
    } else if (comment) {
      // This is adding a new comment
      const currentComments = card.comments || []
      const newComments = [...currentComments, comment]
      updateCardProperty(card, { comments: newComments })
    }
  }

  // Confirm delete card
  const handleConfirmDeleteCard = (card) => {
    // Find which tier or source area contains this card and remove it
    let foundInSource = false
    let sourceCategory = null

    // Check source areas first
    for (const [category, cards] of Object.entries(sourceCards)) {
      if (cards.some(c => c.id === card.id)) {
        foundInSource = true
        sourceCategory = category
        break
      }
    }

    if (foundInSource) {
      // Remove from source area and cascade delete from tiers
      setSourceCards(prevCards => ({
        ...prevCards,
        [sourceCategory]: prevCards[sourceCategory].filter(c => c.id !== card.id)
      }))
      
      // Cascade delete: remove all tier cards that reference this source item
      cascadeDeleteFromTiers(card)
      
      // Save version after cascade delete
      saveVersion(`Deleted source item "${card.text}" and related tier cards`)
    } else {
      // Remove from tier
      const tierWithCard = tiers.find(tier => 
        tier.cards.some(c => c.id === card.id)
      )

      if (tierWithCard) {
        const updatedTier = {
          ...tierWithCard,
          cards: tierWithCard.cards.filter(c => c.id !== card.id)
        }

        setTiers(prevTiers =>
          prevTiers.map(tier =>
            tier.id === tierWithCard.id ? updatedTier : tier
          )
        )
        
        // Save version after tier card deletion
        saveVersion(`Deleted card "${card.text}" from tier ${tierWithCard.name}`)
      }
    }
  }

  // Helper function to update a card property across all locations
  const updateCardProperty = (targetCard, updates) => {
    // Check source areas first
    let foundInSource = false
    let sourceCategory = null

    for (const [category, cards] of Object.entries(sourceCards)) {
      if (cards.some(c => c.id === targetCard.id)) {
        foundInSource = true
        sourceCategory = category
        break
      }
    }

    if (foundInSource) {
      // Update in source area
      setSourceCards(prevCards => ({
        ...prevCards,
        [sourceCategory]: prevCards[sourceCategory].map(card =>
          card.id === targetCard.id ? { ...card, ...updates } : card
        )
      }))
    } else {
      // Update in tier
      setTiers(prevTiers =>
        prevTiers.map(tier => ({
          ...tier,
          cards: tier.cards.map(card =>
            card.id === targetCard.id ? { ...card, ...updates } : card
          )
        }))
      )
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
        duplicateTier(tierId)
        break
      case 'delete':
        setSelectedTierForEdit(tier)
        setIsDeleteModalOpen(true)
        break
      default:
        console.log(`Unknown tier action: ${action}`)
    }
  }

  const changeTierColor = (tierId, newColor) => {
    setTiers(prevTiers =>
      prevTiers.map(tier =>
        tier.id === tierId
          ? { ...tier, color: newColor }
          : tier
      )
    )
  }

  const saveTierName = async (newName) => {
    if (!selectedTierForEdit) return

    setTiers(prevTiers =>
      prevTiers.map(tier =>
        tier.id === selectedTierForEdit.id
          ? { ...tier, name: newName }
          : tier
      )
    )
    
    // Save version after renaming tier
    saveVersion(`Renamed tier from "${selectedTierForEdit.name}" to "${newName}"`)
  }

  const duplicateTier = (tierId) => {
    const tierToDuplicate = tiers.find(t => t.id === tierId)
    if (!tierToDuplicate) return

    const newTier = {
      id: `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${tierToDuplicate.name} Copy`,
      color: tierToDuplicate.color,
      cards: tierToDuplicate.cards.map(card => ({
        ...card,
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }

    const tierIndex = tiers.findIndex(t => t.id === tierId)
    const newTiers = [...tiers]
    newTiers.splice(tierIndex + 1, 0, newTier)
    setTiers(newTiers)

    // Show success message
    setTimeout(() => {
      alert('Tier duplicated successfully.')
    }, 100)
  }

  const deleteTier = async () => {
    if (!selectedTierForEdit) return

    // Don't allow deleting if only 2 tiers remain (minimum requirement)
    if (tiers.length <= 2) {
      alert('Cannot delete tier. Your Tier Listing board must have at least 2 tiers.')
      return
    }

    setTiers(prevTiers =>
      prevTiers.filter(tier => tier.id !== selectedTierForEdit.id)
    )

    // Show success message
    setTimeout(() => {
      alert('Tier deleted successfully.')
    }, 100)
  }

  // Add new tier functionality
  const addTierBelow = (currentTierId) => {
    console.log('Adding tier below:', currentTierId) // Debug log
    
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
      const usedNames = tiers.map(tier => tier.name.toUpperCase())
      
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

    // Pick color (cycle through available colors based on tier count)
    const colorIndex = tiers.length % availableColors.length
    const newColor = availableColors[colorIndex]

    // Create new tier
    const newTier = {
      id: `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: getNextTierName(),
      color: newColor,
      cards: []
    }

    // Find current tier index and insert after it
    const currentTierIndex = tiers.findIndex(tier => tier.id === currentTierId)
    if (currentTierIndex === -1) {
      console.error('Current tier not found:', currentTierId)
      return
    }

    setTiers(prevTiers => {
      const newTiers = [...prevTiers]
      newTiers.splice(currentTierIndex + 1, 0, newTier) // Insert after current tier
      return newTiers
    })

    // Save version after adding tier
    saveVersion(`Added new tier "${newTier.name}"`)

    console.log('New tier added successfully!') // Debug log
  }

  const selectedTier = tiers.find(tier => tier.id === selectedTierId)
  const tierForOptionsMenu = tiers.find(tier => tier.id === tierOptionsMenu.tierId)

  return (
    <div className="space-y-6">
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
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all cards from the board?')) {
                  setTiers(prevTiers => prevTiers.map(tier => ({ ...tier, cards: [] })))
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
        {tiers.some(tier => 
          tier.cards.some(card => isCardFromDeletedSource(card))
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

        <div className="space-y-2">
          {tiers.map((tier, index) => (
            <TierRow
              key={tier.id}
              tier={tier}
              isFirst={index === 0}
              isLast={index === tiers.length - 1}
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
        availablePersonas={sourceCards.personas.filter(p => p.id !== selectedCardForOperation?.id)}
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
        tierName={selectedTier?.name || ''}
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
        onConfirm={deleteTier}
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
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
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

              <div className="flex-1 overflow-y-auto">
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
                        onClick={() => restoreVersion(index)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{version.description}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(version.timestamp).toLocaleString()}
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
                                restoreVersion(index)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Restore
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
        </div>
      )}
    </div>
  )
}

export default TierBoard