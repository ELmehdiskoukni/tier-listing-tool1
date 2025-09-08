import React, { useRef, useEffect } from 'react'

const UserContextMenu = ({ 
  isOpen, 
  position, 
  user, 
  onClose, 
  onEdit,
  onDelete
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

  if (!isOpen || !user) return null

  const menuItems = [
    {
      id: 'edit',
      label: 'Edit User',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => {
        onEdit(user)
        onClose()
      }
    },
    {
      id: 'divider',
      isDivider: true
    },
    {
      id: 'delete',
      label: 'Delete User',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: () => {
        onDelete(user)
        onClose()
      },
      className: 'text-red-600 hover:bg-red-50'
    }
  ]

  // Adjust position to prevent menu from going off-screen
  const adjustedPosition = {
    top: Math.min(position.y, window.innerHeight - 150), // Smaller menu height
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

export default UserContextMenu