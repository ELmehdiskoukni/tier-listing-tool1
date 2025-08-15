import React, { useRef, useEffect } from 'react'

const CardContextMenu = ({ 
  isOpen, 
  position, 
  card, 
  onClose, 
  onEdit,
  onDelete,
  onDuplicate,
  onAddComment,
  onToggleHidden,
  onChangeImage,
  onRemoveImage,
  onPickAnotherPersona,
  isCardInSourceArea
}) => {
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !card) return null

  // Check if card has an image
  const hasImage = (card.imageUrl && card.imageUrl !== null) || (card.image && card.image !== null)
  const isImageCard = card.subtype === 'image' && hasImage
  
  // Check if card is a persona card
  const isPersonaCard = card.type === 'personas' || card.type === 'persona'

  const menuItems = [
    // Edit option - hide for persona cards in tiers
    ...(isPersonaCard && !isCardInSourceArea(card) ? [] : [
      {
        id: 'edit',
        label: 'Edit',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        onClick: () => {
          onEdit(card)
          onClose()
        }
      }
    ]),
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => {
        onDuplicate(card)
        onClose()
      }
    },
    {
      id: 'comment',
      label: 'Add Comment',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      onClick: () => {
        onAddComment(card)
        onClose()
      }
    },
    // Show hide/show option only for cards in source area; cascades to tier instances
    ...(isCardInSourceArea(card) ? [{
      id: 'toggle-hidden',
      label: 'Hide/Show ',
      icon: card.hidden ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ),
      onClick: () => {
        onToggleHidden(card)
        onClose()
      }
    }] : []),
    // Persona-specific options (only show for persona cards in tiers, not in source area)
    ...(isPersonaCard && !isCardInSourceArea(card) ? [
      {
        id: 'pick-another-persona',
        label: 'Pick another persona',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        onClick: () => {
          onPickAnotherPersona(card)
          onClose()
        }
      }
    ] : []),
    // Image-related options (only show for image cards)
    ...(isImageCard ? [
      {
        id: 'change-image',
        label: 'Change Image',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
        ),
        onClick: () => {
          onChangeImage(card)
          onClose()
        }
      },
      {
        id: 'remove-image',
        label: 'Remove Image',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        onClick: () => {
          onRemoveImage(card)
          onClose()
        },
        className: 'text-red-600 hover:bg-red-50'
      }
    ] : []),
    {
      id: 'divider',
      isDivider: true
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: () => {
        onDelete(card)
        onClose()
      },
      className: 'text-red-600 hover:bg-red-50'
    }
  ]

  // Adjust position to prevent menu from going off-screen
  const adjustedPosition = {
    top: Math.min(position.y, window.innerHeight - 250), // Rough menu height
    left: Math.min(position.x, window.innerWidth - 200) // Menu width
  }

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-[9999999999]"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
      }}
    >
      {menuItems.map((item) => {
        if (item.isDivider) {
          return <div key={item.id} className="border-t border-gray-100 my-1" />
        }

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`
              w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors duration-150
              ${item.className || 'text-gray-700 hover:bg-gray-100'}
            `}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default CardContextMenu