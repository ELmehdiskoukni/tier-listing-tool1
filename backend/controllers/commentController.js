import { Comment } from '../models/Comment.js';
import { Card } from '../models/Card.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get all comments
export const getAllComments = asyncHandler(async (req, res) => {
  const comments = await Comment.getAll();
  
  res.json({
    success: true,
    data: comments
  });
});

// Get comment by ID
export const getCommentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.getById(id);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      error: 'Comment not found'
    });
  }
  
  res.json({
    success: true,
    data: comment
  });
});

// Get comments by card ID
export const getCommentsByCardId = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  
  // Check if card exists
  const card = await Card.getById(cardId);
  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }
  
  const comments = await Comment.getByCardId(cardId);
  
  res.json({
    success: true,
    data: comments
  });
});

// Create new comment
export const createComment = asyncHandler(async (req, res) => {
  const { text, cardId } = req.body;
  
  // Check if card exists
  const card = await Card.getById(cardId);
  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }
  
  // Generate unique ID
  const id = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const commentData = {
    id,
    text,
    cardId
  };
  
  const newComment = await Comment.create(commentData);
  
  res.status(201).json({
    success: true,
    data: newComment
  });
});

// Update comment
export const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const updatedComment = await Comment.update(id, updateData);
  
  res.json({
    success: true,
    data: updatedComment
  });
});

// Delete comment
export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await Comment.delete(id);
  
  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

// Get recent comments
export const getRecentComments = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const comments = await Comment.getRecent(parseInt(limit));
  
  res.json({
    success: true,
    data: comments
  });
});

// Search comments
export const searchComments = asyncHandler(async (req, res) => {
  const { query, limit = 50 } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }
  
  const comments = await Comment.search(query, parseInt(limit));
  
  res.json({
    success: true,
    data: comments
  });
});

// Get comment count for a card
export const getCommentCount = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  
  // Check if card exists
  const card = await Card.getById(cardId);
  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }
  
  const count = await Comment.getCountByCardId(cardId);
  
  res.json({
    success: true,
    data: { count }
  });
});

// Bulk create comments
export const bulkCreateComments = asyncHandler(async (req, res) => {
  const { comments } = req.body;
  
  if (!Array.isArray(comments) || comments.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Comments array is required and must not be empty'
    });
  }
  
  // Validate all comments have required fields
  for (const comment of comments) {
    if (!comment.text || !comment.cardId) {
      return res.status(400).json({
        success: false,
        error: 'All comments must have text and cardId'
      });
    }
    
    // Check if card exists
    const card = await Card.getById(comment.cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        error: `Card with ID ${comment.cardId} not found`
      });
    }
  }
  
  // Generate IDs for comments
  const commentsToCreate = comments.map(comment => {
    const id = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      text: comment.text,
      cardId: comment.cardId
    };
  });
  
  const createdComments = await Comment.bulkCreate(commentsToCreate);
  
  res.status(201).json({
    success: true,
    data: createdComments
  });
});

// Bulk delete comments
export const bulkDeleteComments = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Comment IDs array is required and must not be empty'
    });
  }
  
  const deletedComments = await Comment.bulkDelete(ids);
  
  res.json({
    success: true,
    message: `Deleted ${deletedComments.length} comments`,
    data: deletedComments
  });
});

// Delete all comments for a card
export const deleteCommentsByCardId = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  
  // Check if card exists
  const card = await Card.getById(cardId);
  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }
  
  const deletedComments = await Comment.deleteByCardId(cardId);
  
  res.json({
    success: true,
    message: `Deleted ${deletedComments.length} comments for card`,
    data: deletedComments
  });
}); 