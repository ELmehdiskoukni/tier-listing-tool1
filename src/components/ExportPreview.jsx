import React from 'react'

const ExportPreview = ({ tiers, sourceCards, exportOptions }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4 text-center">Tier Board Preview</h2>
      
      {/* Source Area Preview */}
      {exportOptions.includeSourceArea && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Source Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(sourceCards).map(([category, cards]) => (
              <div key={category} className="border rounded p-3">
                <h4 className="font-medium capitalize mb-2">{category}</h4>
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
        {tiers.map(tier => (
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
                  {tier.cards
                    .filter(card => !card.hidden || exportOptions.includeHiddenCards)
                    .map(card => (
                      <div key={card.id} className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm min-w-[120px] max-w-[200px]">
                        <div className="font-medium text-gray-800 mb-1">{card.text}</div>
                        {exportOptions.includeComments && card.comments && card.comments.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {card.comments.length} comment{card.comments.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExportPreview 