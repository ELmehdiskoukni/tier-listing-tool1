import React, { useState } from 'react'

const PickAnotherPersonaModal = ({ isOpen, onClose, currentCard, availablePersonas, onConfirm }) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState('')

  const handleConfirm = () => {
    if (selectedPersonaId) {
      const selectedPersona = availablePersonas.find(p => p.id === selectedPersonaId)
      if (selectedPersona) {
        onConfirm(currentCard, selectedPersona)
        onClose()
      }
    }
  }

  const handleCancel = () => {
    setSelectedPersonaId('')
    onClose()
  }

  if (!isOpen || !currentCard) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Changing the personas document → {currentCard.text}
            </h2>
            <p className="text-sm text-gray-500">
              Pick another personas document
            </p>
          </div>
        </div>



        {/* Persona Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Personas:
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
            {availablePersonas.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No other personas available
              </div>
            ) : (
              availablePersonas.map((persona) => (
                <label
                  key={persona.id}
                  className={`
                    flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0
                    hover:bg-gray-50 transition-colors duration-150
                    ${selectedPersonaId === persona.id ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                >
                  <input
                    type="radio"
                    name="selectedPersona"
                    value={persona.id}
                    checked={selectedPersonaId === persona.id}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{persona.text}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            No, keep this one
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPersonaId}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Confirm the new personas document
          </button>
        </div>
      </div>
    </div>
  )
}

export default PickAnotherPersonaModal 