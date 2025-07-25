import React, { useState } from 'react'
import TierRow from './TierRow'
import CardCreationModal from './CardCreationModal'
import EditTierNameModal from './EditTierNameModal'
import DeleteTierModal from './DeleteTierModal'
import TierOptionsMenu from './TierOptionsMenu'
import SourceArea from './SourceArea'
import AddSourceCardModal from './AddSourceCardModal'

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
        text: 'Google', 
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
        text: 'Apple', 
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
      { id: 'source-persona-1', text: 'John Smith', type: 'personas', sourceCategory: 'personas' },
      { id: 'source-persona-2', text: 'Sarah Wilson', type: 'personas', sourceCategory: 'personas' }
    ]
  })

  // State for source card creation modal
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false)
  const [selectedSourceType, setSelectedSourceType] = useState(null)

  // Initial tier data with updated card types
  const [tiers, setTiers] = useState([
    {
      id: 'tier-a',
      name: 'A',
      color: 'bg-gray-300',
      cards: [
        { id: 'card-1', text: 'Competitor A', type: 'competitor' },
        { id: 'card-2', text: 'Persona A', type: 'personas' },
        { 
          id: 'card-3', 
          text: 'Microsoft', 
          type: 'competitor', 
          subtype: 'image',
          imageUrl: 'https://img.logo.dev/microsoft.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200'
        },
        { id: 'card-4', text: 'IMG', type: 'image' },
        { id: 'card-5', text: 'Competitor Text', type: 'competitor' }
      ]
    },
    {
      id: 'tier-b',
      name: 'B',
      color: 'bg-blue-200',
      cards: [
        { id: 'card-6', text: 'Persona B', type: 'personas' },
        { id: 'card-7', text: 'Persona C', type: 'personas' },
        { id: 'card-8', text: 'Comp IMG', type: 'competitor' },
        { id: 'card-9', text: 'Page', type: 'page' },
        { id: 'card-10', text: 'IMG', type: 'image' }
      ]
    },
    {
      id: 'tier-c',
      name: 'C',
      color: 'bg-blue-200',
      cards: [
        { id: 'card-11', text: 'Competitor IMG', type: 'competitor' },
        { id: 'card-12', text: 'Persona A', type: 'personas' },
        { id: 'card-13', text: 'IMG', type: 'image' },
        { id: 'card-14', text: 'Comp Text', type: 'competitor' },
        { id: 'card-15', text: 'Text Card', type: 'text' }
      ]
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
    }
  }

  const addCard = (tierId) => {
    setSelectedTierId(tierId)
    setIsModalOpen(true)
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
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTierId(null)
  }

  // Drag and Drop handlers
  const handleDragStart = (card) => {
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
  }

  const closeSourceModal = () => {
    setIsSourceModalOpen(false)
    setSelectedSourceType(null)
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
      />

      {/* Main Tier Board */}
      <div className="bg-white rounded-lg shadow-lg p-6">
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
              onOpenOptionsMenu={(position) => openTierOptionsMenu(tier.id, position)}
              onOpenOptions={(action, data) => openTierOptions(tier.id, action, data)}
              onMoveCard={handleMoveCard}
              draggedCard={draggedCard}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onAddTierBelow={() => addTierBelow(tier.id)}
            />
          ))}
        </div>
      </div>

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
    </div>
  )
}

export default TierBoard