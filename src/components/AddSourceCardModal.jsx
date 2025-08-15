import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

const AddSourceCardModal = ({ isOpen, onClose, onCreateCard, sourceType }) => {
  const [cardText, setCardText] = useState('')
  const [cardSubtype, setCardSubtype] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'logos'
  const fileInputRef = useRef(null)
  
  // Logo Finder states
  const [logoSearch, setLogoSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // Popular companies for initial suggestions
  const popularCompanies = [
    'google', 'apple', 'microsoft', 'amazon', 'meta', 'netflix', 'tesla', 'spotify',
    'uber', 'airbnb', 'twitter', 'linkedin', 'instagram', 'youtube', 'facebook',
    'adobe', 'salesforce', 'zoom', 'slack', 'dropbox', 'github', 'stripe'
  ]

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCardText('')
      setCardSubtype('')
      setSelectedImage(null)
      setImagePreview(null)
      setActiveTab('upload')
      setLogoSearch('')
      setSearchResults([])
      setSearchError(null)
      if (sourceType === 'competitors') {
        setCardSubtype('text') // Default for competitors
        // Load popular logos when modal opens to Logo Finder tab
        loadPopularLogos()
      }
    }
  }, [isOpen, sourceType])

  const loadPopularLogos = async () => {
    setIsSearching(true)
    setSearchError(null)
    
    try {
      // Create logo objects with direct URLs (no fetching to avoid CORS)
      const logoResults = popularCompanies.slice(0, 12).map((company) => {
        return {
          name: company.charAt(0).toUpperCase() + company.slice(1),
          domain: `${company}.com`,
          url: `https://img.logo.dev/${company}.com?token=pk_BGahd1eJTNevXh9wadmQ1w&format=png&size=200`
        }
      })
      
      setSearchResults(logoResults)
    } catch (error) {
      setSearchError('Failed to load popular logos')
    } finally {
      setIsSearching(false)
    }
  }

  const searchLogos = async (query) => {
    if (!query.trim()) {
      loadPopularLogos()
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      // Try to find logos by searching for potential domain variations
      const searchTerms = [
        `${query.toLowerCase()}.com`,
        `${query.toLowerCase()}.ma`,
        `${query.toLowerCase()}.io`,
        `${query.toLowerCase()}.org`,
        `${query.toLowerCase().replace(/\s+/g, '')}.com`
      ]

      // Create logo objects with direct URLs (no fetching to avoid CORS)
      const logoResults = searchTerms.map((domain) => {
        return {
          name: query,
          domain: domain,
          url: `https://img.logo.dev/${domain}?token=pk_BGahd1eJTNevXh9wadmQ1w&format=png&size=200`
        }
      })
      
      setSearchResults(logoResults)
      setSearchError(null)
    } catch (error) {
      setSearchError('Search failed. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (activeTab === 'logos' && logoSearch) {
      const timeoutId = setTimeout(() => {
        searchLogos(logoSearch)
      }, 500) // Wait 500ms after user stops typing

      return () => clearTimeout(timeoutId)
    }
  }, [logoSearch, activeTab])

  const getModalConfig = () => {
    switch (sourceType) {
      case 'competitors':
        return {
          title: 'Add Competitor Card',
          placeholder: 'Enter competitor name (2-20 characters)',
          subtypes: [
            { value: 'text', label: 'Text Card' },
            { value: 'image', label: 'Image Card' }
          ],
          cardType: 'competitor'
        }
      case 'pages':
        return {
          title: 'Add Page Card',
          placeholder: 'Enter page name/title (2-20 characters)',
          subtypes: null,
          cardType: 'page'
        }
      case 'personas':
        return {
          title: 'Add Persona Card',
          placeholder: 'Enter persona name/title (2-20 characters)',
          subtypes: null,
          cardType: 'personas'
        }
      default:
        return {
          title: 'Add Card',
          placeholder: 'Enter card text',
          subtypes: null,
          cardType: 'text'
        }
    }
  }

  const config = getModalConfig()

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 2MB limit
        toast.error('File size must be less than 2MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target.result
        setSelectedImage(imageUrl)
        setImagePreview(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoSelect = (logo) => {
    setSelectedImage(logo.url)
    setImagePreview(logo.url)
    if (!cardText) {
      setCardText(logo.name)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!cardText.trim()) {
      toast.error('Please enter card text')
      return
    }

    if (cardText.length < 2) {
      toast.error('Text is too short. Must be at least 2 characters.')
      return
    }

    if (cardText.length > 20) {
      toast.error('Text is too long. Must not be more than 20 characters.')
      return
    }

    if (config.subtypes && !cardSubtype) {
      toast.error('Please select a card type')
      return
    }

    if (cardSubtype === 'image' && !selectedImage) {
      toast.error('Please select an image for the image card')
      return
    }

    setIsCreating(true)

    try {
      await onCreateCard({
        text: cardText.trim(),
        type: config.cardType,
        subtype: cardSubtype || null,
        sourceCategory: sourceType,
        imageUrl: cardSubtype === 'image' ? selectedImage : null
      })
      
      setCardText('')
      setCardSubtype('')
      setSelectedImage(null)
      setImagePreview(null)
      onClose()
    } catch (error) {
      toast.error('Failed to create card. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setCardText('')
    setCardSubtype('')
    setSelectedImage(null)
    setImagePreview(null)
    onClose()
  }

  if (!isOpen) return null

  const showImageOptions = sourceType === 'competitors' && cardSubtype === 'image'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {config.title}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card Subtype Selection (for competitors) */}
          {config.subtypes && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {config.subtypes.map((subtype) => (
                  <button
                    key={subtype.value}
                    type="button"
                    onClick={() => {
                      setCardSubtype(subtype.value)
                      if (subtype.value === 'text') {
                        setSelectedImage(null)
                        setImagePreview(null)
                      }
                    }}
                    className={`
                      p-3 border rounded-lg text-left transition-colors duration-200
                      ${cardSubtype === subtype.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{subtype.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload Section (only for competitor image cards) */}
          {showImageOptions && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image
              </label>
              
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('logos')
                    if (searchResults.length === 0 && !logoSearch) {
                      loadPopularLogos()
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'logos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Logo Finder
                </button>
              </div>

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600 mt-1">Click to upload image</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Logo Finder Tab */}
              {activeTab === 'logos' && (
                <div>
                  {/* Search Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={logoSearch}
                      onChange={(e) => setLogoSearch(e.target.value)}
                      placeholder="Search for company logos... (e.g., 'Netflix', 'Airbnb')"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Loading State */}
                  {isSearching && (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-600 mt-2">Searching for logos...</p>
                    </div>
                  )}

                  {/* Search Error */}
                  {searchError && (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-600">{searchError}</p>
                    </div>
                  )}

                  {/* Logo Results */}
                  {!isSearching && searchResults.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        {logoSearch ? `Results for "${logoSearch}":` : 'Popular company logos:'}
                      </p>
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {searchResults.map((logo, index) => (
                          <button
                            key={`${logo.domain}-${index}`}
                            type="button"
                            onClick={() => handleLogoSelect(logo)}
                            className={`p-2 border rounded-lg hover:border-blue-400 transition-colors ${
                              selectedImage === logo.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            title={logo.name}
                          >
                            <div className="relative w-full h-8 flex items-center justify-center">
                              <img 
                                src={logo.url} 
                                alt={logo.name}
                                className="w-full h-8 object-contain"
                                onError={(e) => {
                                  // Show fallback placeholder when image fails to load
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                              {/* Fallback placeholder for failed images */}
                              <div 
                                className="w-full h-8 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-500 text-xs font-medium"
                                style={{ display: 'none' }}
                              >
                                {logo.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <p className="text-xs text-center mt-1 truncate">{logo.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!isSearching && searchResults.length === 0 && logoSearch && !searchError && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">No logos found. Try a different company name.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card Text Input */}
          <div className="mb-6">
            <label htmlFor="cardText" className="block text-sm font-medium text-gray-700 mb-2">
              {sourceType === 'competitors' ? 'Competitor Name' : 
               sourceType === 'pages' ? 'Page Name/Title' : 
               'Persona Name/Title'}
            </label>
            <input
              type="text"
              id="cardText"
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              placeholder={config.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-500">
              {cardText.length}/20 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !cardText.trim() || (config.subtypes && !cardSubtype) || (cardSubtype === 'image' && !selectedImage)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isCreating ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSourceCardModal