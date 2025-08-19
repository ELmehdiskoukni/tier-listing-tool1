import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      console.error('Resource not found');
    } else if (error.response?.status === 500) {
      console.error('Server error');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to server. Make sure the backend is running on port 4000');
    }
    
    return Promise.reject(error);
  }
);

// API functions for Tiers
export const tierAPI = {
  // Get all tiers
  getAllTiers: () => apiClient.get('/tiers'),
  
  // Get all tiers with cards
  getAllTiersWithCards: () => apiClient.get('/tiers/with-cards'),
  
  // Get tier by ID
  getTierById: (id) => apiClient.get(`/tiers/${id}`),
  
  // Get tier with cards
  getTierWithCards: (id) => apiClient.get(`/tiers/${id}/with-cards`),
  
  // Create new tier
  createTier: (tierData) => apiClient.post('/tiers', tierData),
  
  // Update tier
  updateTier: (id, tierData) => apiClient.put(`/tiers/${id}`, tierData),
  
  // Delete tier
  deleteTier: (id) => apiClient.delete(`/tiers/${id}`),
  
  // Move tier position
  moveTierPosition: (id, direction) => apiClient.post(`/tiers/${id}/move`, { direction }),
  
  // Duplicate tier
  duplicateTier: (id) => apiClient.post(`/tiers/${id}/duplicate`),
  
  // Clear tier cards
  clearTierCards: (id) => apiClient.post(`/tiers/${id}/clear`),
  
  // Get tier stats
  getTierStats: () => apiClient.get('/tiers/stats'),
};

// API functions for Source Cards
export const sourceCardAPI = {
  // Get all source cards
  getAllSourceCards: () => apiClient.get('/source-cards'),
  
  // Get all source cards grouped by category
  getAllSourceCardsGrouped: () => apiClient.get('/source-cards/grouped'),
  
  // Get source cards by category
  getSourceCardsByCategory: (category) => apiClient.get(`/source-cards/category/${category}`),
  
  // Get source card by ID
  getSourceCardById: (id) => apiClient.get(`/source-cards/${id}`),
  
  // Create new source card
  createSourceCard: (cardData) => apiClient.post('/source-cards', cardData),
  
  // Update source card
  updateSourceCard: (id, cardData) => apiClient.put(`/source-cards/${id}`, cardData),
  
  // Delete source card
  deleteSourceCard: (id) => apiClient.delete(`/source-cards/${id}`),
  
  // Duplicate source card
  duplicateSourceCard: (id) => apiClient.post(`/source-cards/${id}/duplicate`),
  
  // Search source cards
  searchSourceCards: (query) => apiClient.get('/source-cards/search', { params: { q: query } }),
  
  // Bulk create source cards
  bulkCreateSourceCards: (cardsData) => apiClient.post('/source-cards/bulk-create', cardsData),
  
  // Bulk delete source cards
  bulkDeleteSourceCards: (ids) => apiClient.delete('/source-cards/bulk-delete', { data: { ids } }),
  
  // Import cards to tier
  importCardsToTier: (importData) => apiClient.post('/source-cards/import', importData),
  
  // Get source card stats
  getSourceCardStats: () => apiClient.get('/source-cards/stats'),

  // Source card comments
  getComments: (sourceCardId) => apiClient.get(`/source-cards/${sourceCardId}/comments`),
  addComment: (sourceCardId, text) => apiClient.post(`/source-cards/${sourceCardId}/comments`, { text }),
  deleteComment: (sourceCardId, commentId) => apiClient.delete(`/source-cards/${sourceCardId}/comments/${commentId}`),

  // Toggle hidden for all tier instances of a source card
  toggleHiddenForInstances: (sourceCardId) => apiClient.post(`/source-cards/${sourceCardId}/toggle-hidden`),
};

// API functions for Cards
export const cardAPI = {
  // Get all cards
  getAllCards: () => apiClient.get('/cards'),
  
  // Get card by ID
  getCardById: (id) => apiClient.get(`/cards/${id}`),
  
  // Get card with comments
  getCardWithComments: (id) => apiClient.get(`/cards/${id}/with-comments`),
  
  // Get cards by tier ID
  getCardsByTierId: (tierId) => apiClient.get(`/cards/tier/${tierId}`),
  
  // Create new card
  createCard: (cardData) => apiClient.post('/cards', cardData),
  
  // Update card
  updateCard: (id, cardData) => apiClient.put(`/cards/${id}`, cardData),
  
  // Delete card
  deleteCard: (id) => apiClient.delete(`/cards/${id}`),
  
  // Move card
  moveCard: (id, moveData) => apiClient.post(`/cards/${id}/move`, moveData),
  
  // Duplicate card
  duplicateCard: (id) => apiClient.post(`/cards/${id}/duplicate`),
  
  // Toggle card hidden status
  toggleCardHidden: (id) => apiClient.post(`/cards/${id}/toggle-hidden`),
  
  // Bulk create cards
  bulkCreateCards: (cardsData) => apiClient.post('/cards/bulk-create', cardsData),
  
  // Bulk delete cards
  bulkDeleteCards: (ids) => apiClient.delete('/cards/bulk-delete', { data: { ids } }),
  
  // Search cards
  searchCards: (query) => apiClient.get('/cards/search', { params: { q: query } }),
  
  // Get card stats
  getCardStats: () => apiClient.get('/cards/stats'),
};

// API functions for Comments
export const commentAPI = {
  // Get comments for a card
  getCommentsByCardId: (cardId) => apiClient.get(`/comments/card/${cardId}`),
  
  // Create new comment
  createComment: (commentData) => apiClient.post('/comments', commentData),
  
  // Update comment
  updateComment: (id, commentData) => apiClient.put(`/comments/${id}`, commentData),
  
  // Delete comment
  deleteComment: (id) => apiClient.delete(`/comments/${id}`),
};

// API functions for Versions
export const versionAPI = {
  // Get all versions
  getAllVersions: () => apiClient.get('/versions'),
  
  // Get version by ID
  getVersionById: (id) => apiClient.get(`/versions/${id}`),
  
  // Create new version
  createVersion: (versionData) => apiClient.post('/versions', versionData),
  
  // Update version
  updateVersion: (id, versionData) => apiClient.put(`/versions/${id}`, versionData),
  
  // Delete version
  deleteVersion: (id) => apiClient.delete(`/versions/${id}`),
  
  // Restore version
  restoreVersion: (id) => apiClient.post(`/versions/${id}/restore`),
};

// Utility function to handle API errors
export const handleAPIError = (error, customMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return customMessage;
  }
};

// Utility function to check if server is reachable
export const checkServerHealth = async () => {
  try {
    await apiClient.get('/health');
    return true;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

export default apiClient; 