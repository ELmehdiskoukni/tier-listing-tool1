import express from 'express';
import {
  getAllVersions,
  getRecentVersions,
  getVersionById,
  createVersion,
  deleteVersion,
  restoreToVersion,
  getVersionStats,
  searchVersions,
  getVersionsByDateRange,
  getLatestVersion,
  cleanupOldVersions,
  createVersionFromCurrentState,
  compareVersions
} from '../controllers/versionController.js';
import { validateVersion, validateId } from '../middleware/validation.js';

const router = express.Router();

// GET /api/versions - Get all versions
router.get('/', getAllVersions);

// GET /api/versions/recent - Get recent versions
router.get('/recent', getRecentVersions);

// GET /api/versions/latest - Get latest version
router.get('/latest', getLatestVersion);

// GET /api/versions/stats - Get version statistics
router.get('/stats', getVersionStats);

// GET /api/versions/search - Search versions
router.get('/search', searchVersions);

// GET /api/versions/date-range - Get versions by date range
router.get('/date-range', getVersionsByDateRange);

// GET /api/versions/:id - Get version by ID
router.get('/:id', validateId, getVersionById);

// POST /api/versions - Create new version
router.post('/', validateVersion, createVersion);

// POST /api/versions/from-current - Create version from current state
router.post('/from-current', createVersionFromCurrentState);

// DELETE /api/versions/:id - Delete version
router.delete('/:id', validateId, deleteVersion);

// POST /api/versions/:id/restore - Restore to version
router.post('/:id/restore', validateId, restoreToVersion);

// POST /api/versions/cleanup - Cleanup old versions
router.post('/cleanup', cleanupOldVersions);

// GET /api/versions/compare/:version1Id/:version2Id - Compare versions
router.get('/compare/:version1Id/:version2Id', validateId, compareVersions);

export default router; 