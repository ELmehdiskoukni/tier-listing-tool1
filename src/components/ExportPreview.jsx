import React from 'react'

const ExportPreview = ({ tiers = [], sourceCards = {}, exportOptions = {} }) => {
  // Color mapping for source categories
  const getCategoryColor = (category) => {
    switch (category) {
      case 'competitors':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'pages':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'personas':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4 text-center">Tier Board Preview</h2>
      
      {/* Source Area Preview */}
      {exportOptions.includeSourceArea && sourceCards && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Source Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(sourceCards).map(([category, cards = []]) => (
              <div key={category} className="border rounded p-3">
                <h4 className={`font-medium capitalize mb-2 p-2 rounded ${getCategoryColor(category)}`}>
                  {category}
                </h4>
                <div className="space-y-1">
                  {cards.slice(0, 3).map(card => (
                    <div key={card.id} className="text-sm bg-gray-100 p-1 rounded">
                      {card.text}
                    </div>
                  ))}
                  {cards.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{cards.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tiers Preview - Completely static, no interactive elements */}
      <div className="space-y-3">
        {tiers.map(tier => {
          // Ensure tier.cards is always an array
          const cards = tier.cards || []
          
          return (
            <div key={tier.id} className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="flex items-stretch min-h-[80px]">
                {/* Tier Label - Static only */}
                <div className={`flex items-center justify-center w-16 ${tier.color} border-r border-gray-300`}>
                  <span className="text-xl font-bold text-gray-800">
                    {tier.name}
                  </span>
                </div>
                
                {/* Cards Area - Static only, no buttons or controls */}
                <div className="flex-1 flex items-center p-4 bg-gray-50 min-h-[80px]">
                  <div className="flex items-center gap-3 flex-wrap w-full">
                    {cards
                      .filter(card => !card.hidden || exportOptions.includeHiddenCards)
                      .map(card => {
                        const isDeletedSource = isCardFromDeletedSource(card)
                        return (
                          <div 
                            key={card.id} 
                            className={`bg-white border border-gray-300 rounded-lg p-3 shadow-sm min-w-[120px] max-w-[200px] relative ${
                              isDeletedSource ? 'bg-gray-200 border-gray-400' : ''
                            }`}
                          >
                            {/* Deleted source indicator */}
                            {isDeletedSource && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              </div>
                            )}

                            {/* Hidden card indicator */}
                            {card.hidden && !isDeletedSource && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                            <div className={`font-medium text-gray-800 mb-1 ${
                              isDeletedSource || card.hidden ? 'text-gray-500 italic line-through' : ''
                            }`}>
                              {isDeletedSource ? 'This item is deleted' : card.hidden ? 'This item is hidden' : card.text}
                            </div>
                            {exportOptions.includeComments && card.comments && card.comments.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {card.comments.length} comment{card.comments.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ExportPreview 