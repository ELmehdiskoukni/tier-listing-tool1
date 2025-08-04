import { body, param, validationResult } from 'express-validator';

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('🔍 Backend: Validation errors:', errors.array())
    console.log('🔍 Backend: Request body:', req.body)
    console.log('🔍 Backend: Request params:', req.params)
    console.log('🔍 Backend: Request method:', req.method)
    console.log('🔍 Backend: Request URL:', req.url)
    
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// Tier validation rules
export const validateTier = [
  (req, res, next) => {
    console.log('🔍 Backend: validateTier middleware called')
    console.log('🔍 Backend: validateTier req.body:', req.body)
    console.log('🔍 Backend: validateTier req.params:', req.params)
    next()
  },
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tier name must be between 1 and 50 characters'),
  body('color')
    .optional(),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
];

// Tier update validation rules (more permissive for partial updates)
export const validateTierUpdate = [
  (req, res, next) => {
    console.log('🔍 Backend: validateTierUpdate middleware called')
    console.log('🔍 Backend: validateTierUpdate req.body:', req.body)
    console.log('🔍 Backend: validateTierUpdate req.params:', req.params)
    console.log('🔍 Backend: validateTierUpdate method:', req.method)
    console.log('🔍 Backend: validateTierUpdate url:', req.url)
    next()
  },
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tier name must be between 1 and 50 characters'),
  body('color')
    .optional(),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
];

// Tier movement validation rules
export const validateTierMovement = [
  body('direction')
    .isIn(['up', 'down'])
    .withMessage('Direction must be either "up" or "down"'),
  handleValidationErrors
];

// Card validation rules
export const validateCard = [
  body('text')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Card text must be between 2 and 255 characters'),
  body('type')
    .isIn(['image', 'text', 'page', 'personas', 'competitor'])
    .withMessage('Invalid card type'),
  body('subtype')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // If value is provided, it must be one of the allowed values
      if (!['image', 'text'].includes(value)) {
        throw new Error('Invalid card subtype');
      }
      return true;
    })
    .withMessage('Invalid card subtype'),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // If value is provided, it must be a valid URL
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(value)) {
        throw new Error('Invalid image URL');
      }
      return true;
    })
    .withMessage('Invalid image URL'),
  body('hidden')
    .optional()
    .isBoolean()
    .withMessage('Hidden must be a boolean'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
];

// Source card validation rules
export const validateSourceCard = [
  body('text')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Card text must be between 2 and 255 characters'),
  body('type')
    .isIn(['image', 'text', 'page', 'personas', 'competitor'])
    .withMessage('Invalid card type'),
  body('subtype')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // If value is provided, it must be one of the allowed values
      if (!['image', 'text'].includes(value)) {
        throw new Error('Invalid card subtype');
      }
      return true;
    })
    .withMessage('Invalid card subtype'),
  body('sourceCategory')
    .isIn(['competitors', 'pages', 'personas'])
    .withMessage('Invalid source category'),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // If value is provided, it must be a valid URL
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(value)) {
        throw new Error('Invalid image URL');
      }
      return true;
    })
    .withMessage('Invalid image URL'),
  handleValidationErrors
];

// Comment validation rules
export const validateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment text must be between 1 and 1000 characters'),
  handleValidationErrors
];

// Version validation rules
export const validateVersion = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('tiersData')
    .isArray()
    .withMessage('Tiers data must be an array'),
  body('sourceCardsData')
    .isObject()
    .withMessage('Source cards data must be an object'),
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  (req, res, next) => {
    console.log('🔍 Backend: validateId middleware called')
    console.log('🔍 Backend: validateId req.params:', req.params)
    console.log('🔍 Backend: validateId req.body:', req.body)
    next()
  },
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID parameter is required'),
  handleValidationErrors
];

// Bulk operations validation
export const validateBulkOperation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs must be a non-empty array'),
  body('ids.*')
    .isLength({ min: 1 })
    .withMessage('Each ID must be non-empty'),
  handleValidationErrors
];

// Move card validation rules
export const validateMoveCard = [
  body('targetTierId')
    .isLength({ min: 1 })
    .withMessage('Target tier ID is required'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
]; 