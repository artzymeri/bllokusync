const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { verifyToken, isAdmin, isAdminOrPropertyManager } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Get managers (property_manager users) for dropdown - MUST be before /:id route
router.get('/managers/list', isAdmin, propertyController.getManagers);

// Get all properties
router.get('/', propertyController.getAllProperties);

// Get single property by ID
router.get('/:id', propertyController.getPropertyById);

// Create property (admin or property_manager can create)
router.post('/', isAdminOrPropertyManager, propertyController.createProperty);

// Update property (admin or assigned property_manager)
router.put('/:id', isAdminOrPropertyManager, propertyController.updateProperty);

// Delete property (admin or assigned property_manager)
router.delete('/:id', isAdminOrPropertyManager, propertyController.deleteProperty);

module.exports = router;
