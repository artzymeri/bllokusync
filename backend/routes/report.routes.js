const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// Tenant routes
router.post(
  '/',
  authenticateToken,
  authorizeRoles('tenant'),
  reportController.createReport
);

router.get(
  '/my-reports',
  authenticateToken,
  authorizeRoles('tenant'),
  reportController.getTenantReports
);

router.get(
  '/problem-options',
  authenticateToken,
  authorizeRoles('tenant'),
  reportController.getTenantProblemOptions
);

// Property Manager routes
router.get(
  '/manager',
  authenticateToken,
  authorizeRoles('property_manager'),
  reportController.getPropertyManagerReports
);

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('property_manager'),
  reportController.updateReportStatus
);

router.post(
  '/archive',
  authenticateToken,
  authorizeRoles('property_manager'),
  reportController.archiveReports
);

router.post(
  '/unarchive',
  authenticateToken,
  authorizeRoles('property_manager'),
  reportController.unarchiveReports
);

module.exports = router;
