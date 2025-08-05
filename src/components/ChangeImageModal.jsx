import React, { useState, useEffect, useRef } from 'react'

const ChangeImageModal = ({ isOpen, onClose, onSaveImage, card }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
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
      setSelectedImage(null)
      setImagePreview(null)
      setActiveTab('upload')
      setLogoSearch('')
      setSearchResults([])
      setSearchError(null)
      // Load popular logos when modal opens to Logo Finder tab
      loadPopularLogos()
    }
  }, [isOpen])

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
      setSearchError('Failed to search logos')
    } finally {
      setIsSearching(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size must be less than 2MB')
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedImage) {
      alert('Please select an image')
      return
    }

    setIsSaving(true)

    try {
      await onSaveImage(card, selectedImage)
      onClose()
    } catch (error) {
      alert('Failed to update image. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setSelectedImage(null)
    setImagePreview(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Change Image for "{card?.text}"
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
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logos')}
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Choose a file
                </button>
                <p className="text-sm text-gray-500 mt-1">
                  or drag and drop (max 2MB)
                </p>
              </div>
            </div>
          )}

          {/* Logo Finder Tab */}
          {activeTab === 'logos' && (
            <div className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for Company Logo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoSearch}
                    onChange={(e) => setLogoSearch(e.target.value)}
                    placeholder="Enter company name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => searchLogos(logoSearch)}
                    disabled={isSearching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchError && (
                  <p className="text-red-600 text-sm mt-1">{searchError}</p>
                )}
              </div>

              {/* Search Results */}
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    Searching...
                  </div>
                ) : (
                  searchResults.map((logo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleLogoSelect(logo)}
                      className="p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="relative w-full h-12 flex items-center justify-center">
                        <img
                          src={logo.url}
                          alt={logo.name}
                          className="w-full h-12 object-contain"
                          onError={(e) => {
                            // Show fallback placeholder when image fails to load
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        {/* Fallback placeholder for failed images */}
                        <div 
                          className="w-full h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-500 text-xs font-medium"
                          style={{ display: 'none' }}
                        >
                          {logo.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{logo.name}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 rounded-lg p-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedImage || isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangeImageModal 