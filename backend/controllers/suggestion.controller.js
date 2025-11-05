const { Suggestion, Property, User } = require('../models');
const { Op } = require('sequelize');

// Create a new suggestion (Tenant)
exports.createSuggestion = async (req, res) => {
  try {
    const { property_id, title, description } = req.body;
    const tenant_user_id = req.user.id;

    // Validate required fields
    if (!property_id || !title) {
      return res.status(400).json({ message: 'Property and title are required' });
    }

    // Validate that the tenant is assigned to this property
    const tenant = await User.findByPk(tenant_user_id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenantPropertyIds = tenant.property_ids || [];
    if (!tenantPropertyIds.includes(property_id)) {
      return res.status(403).json({ message: 'You are not assigned to this property' });
    }

    // Create the suggestion
    const suggestion = await Suggestion.create({
      tenant_user_id,
      property_id,
      title,
      description,
      status: 'pending'
    });

    const suggestionWithDetails = await Suggestion.findByPk(suggestion.id, {
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'surname', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Suggestion created successfully',
      suggestion: suggestionWithDetails
    });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ message: 'Error creating suggestion', error: error.message });
  }
};

// Get suggestions for tenant
exports.getTenantSuggestions = async (req, res) => {
  try {
    const tenant_user_id = req.user.id;

    const suggestions = await Suggestion.findAll({
      where: { tenant_user_id },
      include: [
        { model: Property, as: 'property' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching tenant suggestions:', error);
    res.status(500).json({ message: 'Error fetching suggestions', error: error.message });
  }
};

// Get tenant's properties for suggestion creation
exports.getTenantProperties = async (req, res) => {
  try {
    const tenant_user_id = req.user.id;

    const tenant = await User.findByPk(tenant_user_id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const propertyIds = tenant.property_ids || [];

    if (propertyIds.length === 0) {
      return res.json({ properties: [] });
    }

    const properties = await Property.findAll({
      where: {
        id: { [Op.in]: propertyIds }
      }
    });

    res.json({ properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
};

// Get all suggestions for property manager
exports.getPropertyManagerSuggestions = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { property_id, status } = req.query;

    // Get properties managed by this user
    const user = await User.findByPk(user_id, {
      include: [
        {
          model: Property,
          as: 'managedPropertiesMany',
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const managedPropertyIds = user.managedPropertiesMany.map(p => p.id);

    if (managedPropertyIds.length === 0) {
      return res.json({ suggestions: [] });
    }

    // Build where clause
    const whereClause = {
      property_id: { [Op.in]: managedPropertyIds },
      archived: false // Exclude archived suggestions by default
    };

    if (property_id) {
      whereClause.property_id = property_id;
    }

    if (status) {
      whereClause.status = status;
    }

    const suggestions = await Suggestion.findAll({
      where: whereClause,
      include: [
        {
          model: Property,
          as: 'property'
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'number', 'floor_assigned']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching property manager suggestions:', error);
    res.status(500).json({ message: 'Error fetching suggestions', error: error.message });
  }
};

// Update suggestion status (Property Manager)
exports.updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;
    const user_id = req.user.id;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the suggestion
    const suggestion = await Suggestion.findByPk(id, {
      include: [{ model: Property, as: 'property' }]
    });

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    // Verify that the property manager manages this property
    const user = await User.findByPk(user_id, {
      include: [
        {
          model: Property,
          as: 'managedPropertiesMany',
          through: { attributes: [] }
        }
      ]
    });

    const managedPropertyIds = user.managedPropertiesMany.map(p => p.id);
    if (!managedPropertyIds.includes(suggestion.property_id)) {
      return res.status(403).json({ message: 'You do not manage this property' });
    }

    // Update the suggestion status and response
    suggestion.status = status;
    if (response !== undefined) {
      suggestion.response = response;
    }
    await suggestion.save();

    const updatedSuggestion = await Suggestion.findByPk(id, {
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'surname', 'email', 'number'] }
      ]
    });

    res.json({
      message: 'Suggestion status updated successfully',
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    res.status(500).json({ message: 'Error updating suggestion status', error: error.message });
  }
};

// Archive suggestions (Property Manager)
exports.archiveSuggestions = async (req, res) => {
  try {
    const { ids } = req.body;
    const user_id = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Suggestion IDs are required' });
    }

    // Get user's managed properties
    const user = await User.findByPk(user_id, {
      include: [
        {
          model: Property,
          as: 'managedPropertiesMany',
          through: { attributes: [] }
        }
      ]
    });

    const managedPropertyIds = user.managedPropertiesMany.map(p => p.id);

    // Get suggestions to verify ownership
    const suggestions = await Suggestion.findAll({
      where: {
        id: { [Op.in]: ids }
      }
    });

    // Verify all suggestions belong to managed properties
    for (const suggestion of suggestions) {
      if (!managedPropertyIds.includes(suggestion.property_id)) {
        return res.status(403).json({ message: 'You do not manage all selected suggestions' });
      }
    }

    // Archive the suggestions
    await Suggestion.update(
      { archived: true },
      {
        where: {
          id: { [Op.in]: ids },
          property_id: { [Op.in]: managedPropertyIds }
        }
      }
    );

    res.json({
      message: `${ids.length} suggestion(s) archived successfully`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error archiving suggestions:', error);
    res.status(500).json({ message: 'Error archiving suggestions', error: error.message });
  }
};

// Unarchive suggestions (Property Manager)
exports.unarchiveSuggestions = async (req, res) => {
  try {
    const { ids } = req.body;
    const user_id = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Suggestion IDs are required' });
    }

    // Get user's managed properties
    const user = await User.findByPk(user_id, {
      include: [
        {
          model: Property,
          as: 'managedPropertiesMany',
          through: { attributes: [] }
        }
      ]
    });

    const managedPropertyIds = user.managedPropertiesMany.map(p => p.id);

    // Unarchive the suggestions
    await Suggestion.update(
      { archived: false },
      {
        where: {
          id: { [Op.in]: ids },
          property_id: { [Op.in]: managedPropertyIds }
        }
      }
    );

    res.json({
      message: `${ids.length} suggestion(s) unarchived successfully`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error unarchiving suggestions:', error);
    res.status(500).json({ message: 'Error unarchiving suggestions', error: error.message });
  }
};

module.exports = exports;
