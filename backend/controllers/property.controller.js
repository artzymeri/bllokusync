const db = require('../models');
const { Op } = require('sequelize');

// Get all properties with filtering
exports.getAllProperties = async (req, res) => {
  try {
    const { search, city, managerId, myProperties, page = 1, limit = 10 } = req.query;

    const where = {};

    // Search filter (name or address)
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    // City filter
    if (city) {
      where.city_id = city;
    }

    const offset = (page - 1) * limit;

    const includeOptions = [
      {
        model: db.City,
        as: 'cityDetails',
        attributes: ['id', 'name'],
        required: false
      },
      {
        model: db.User,
        as: 'manager',
        attributes: ['id', 'name', 'surname', 'email'],
        required: false
      },
      {
        model: db.User,
        as: 'managers',
        attributes: ['id', 'name', 'surname', 'email'],
        through: { attributes: [] },
        required: !!managerId || myProperties === 'true'
      }
    ];

    // Manager filter - filter by managers in the many-to-many relationship
    if (managerId) {
      includeOptions[2].where = { id: managerId };
    }

    // If myProperties is true, filter by current user's properties (property_manager users only)
    if (myProperties === 'true' && req.user.role === 'property_manager') {
      includeOptions[2].where = { id: req.user.id };
    }

    const { count, rows } = await db.Property.findAndCountAll({
      where,
      include: includeOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    });
  }
};

// Get single property by ID
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await db.Property.findByPk(id, {
      include: [
        {
          model: db.City,
          as: 'cityDetails',
          attributes: ['id', 'name']
        },
        {
          model: db.User,
          as: 'manager',
          attributes: ['id', 'name', 'surname', 'email', 'number']
        },
        {
          model: db.User,
          as: 'managers',
          attributes: ['id', 'name', 'surname', 'email', 'number'],
          through: { attributes: [] }
        }
      ]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property',
      error: error.message
    });
  }
};

// Create new property
exports.createProperty = async (req, res) => {
  try {
    const { name, address, city_id, latitude, longitude, floors_from, floors_to, manager_ids } = req.body;

    // Validate required fields
    if (!name || !address || !city_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, and city are required'
      });
    }

    // Validate floors_from if provided
    if (floors_from !== undefined && floors_from !== null) {
      const floorsFromNum = parseInt(floors_from);
      if (isNaN(floorsFromNum) || floorsFromNum < -20 || floorsFromNum > 200) {
        return res.status(400).json({
          success: false,
          message: 'Floors from must be a number between -20 and 200'
        });
      }
    }

    // Validate floors_to if provided
    if (floors_to !== undefined && floors_to !== null) {
      const floorsToNum = parseInt(floors_to);
      if (isNaN(floorsToNum) || floorsToNum < -20 || floorsToNum > 200) {
        return res.status(400).json({
          success: false,
          message: 'Floors to must be a number between -20 and 200'
        });
      }
    }

    // Validate floor range logic
    if (floors_from !== undefined && floors_from !== null && floors_to !== undefined && floors_to !== null) {
      if (parseInt(floors_from) > parseInt(floors_to)) {
        return res.status(400).json({
          success: false,
          message: 'Floors from cannot be greater than floors to'
        });
      }
    }

    // Verify city exists
    const city = await db.City.findByPk(city_id);
    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'Invalid city ID'
      });
    }

    // Prepare manager IDs list
    let finalManagerIds = [];

    // If user is a property_manager, automatically add them to the list
    if (req.user.role === 'property_manager') {
      finalManagerIds.push(req.user.id);
    }

    // Add any additional manager_ids provided (admin can assign multiple managers)
    if (manager_ids && Array.isArray(manager_ids) && manager_ids.length > 0) {
      // Verify managers exist and have correct roles
      const managers = await db.User.findAll({
        where: {
          id: { [Op.in]: manager_ids },
          role: 'property_manager'
        }
      });

      if (managers.length !== manager_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more manager IDs are invalid or users do not have property_manager role'
        });
      }

      // Merge with existing manager IDs (avoid duplicates)
      finalManagerIds = [...new Set([...finalManagerIds, ...manager_ids])];
    }

    // Create property
    const property = await db.Property.create({
      name,
      address,
      city_id,
      latitude: latitude || null,
      longitude: longitude || null,
      floors_from: floors_from !== undefined && floors_from !== null ? parseInt(floors_from) : null,
      floors_to: floors_to !== undefined && floors_to !== null ? parseInt(floors_to) : null,
      show_monthly_reports_to_tenants: show_monthly_reports_to_tenants !== undefined ? show_monthly_reports_to_tenants : true,
      property_manager_user_id: null // Deprecated field, kept for backward compatibility
    });

    // Assign managers through junction table
    if (finalManagerIds.length > 0) {
      await property.setManagers(finalManagerIds);
    }

    // Fetch the created property with manager details
    const createdProperty = await db.Property.findByPk(property.id, {
      include: [
        {
          model: db.City,
          as: 'cityDetails',
          attributes: ['id', 'name']
        },
        {
          model: db.User,
          as: 'managers',
          attributes: ['id', 'name', 'surname', 'email'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: createdProperty
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating property',
      error: error.message
    });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city_id, latitude, longitude, floors_from, floors_to, manager_ids, show_monthly_reports_to_tenants } = req.body;

    const property = await db.Property.findByPk(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Validate floors_from if provided
    if (floors_from !== undefined && floors_from !== null) {
      const floorsFromNum = parseInt(floors_from);
      if (isNaN(floorsFromNum) || floorsFromNum < -20 || floorsFromNum > 200) {
        return res.status(400).json({
          success: false,
          message: 'Floors from must be a number between -20 and 200'
        });
      }
    }

    // Validate floors_to if provided
    if (floors_to !== undefined && floors_to !== null) {
      const floorsToNum = parseInt(floors_to);
      if (isNaN(floorsToNum) || floorsToNum < -20 || floorsToNum > 200) {
        return res.status(400).json({
          success: false,
          message: 'Floors to must be a number between -20 and 200'
        });
      }
    }

    // Validate floor range logic
    if (floors_from !== undefined && floors_from !== null && floors_to !== undefined && floors_to !== null) {
      if (parseInt(floors_from) > parseInt(floors_to)) {
        return res.status(400).json({
          success: false,
          message: 'Floors from cannot be greater than floors to'
        });
      }
    }

    // Verify city exists if provided
    if (city_id) {
      const city = await db.City.findByPk(city_id);
      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'Invalid city ID'
        });
      }
    }

    // Verify managers exist and have correct roles if provided
    if (manager_ids !== undefined) {
      if (Array.isArray(manager_ids) && manager_ids.length > 0) {
        const managers = await db.User.findAll({
          where: {
            id: { [Op.in]: manager_ids },
            role: 'property_manager'
          }
        });

        if (managers.length !== manager_ids.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more manager IDs are invalid or users do not have property_manager role'
          });
        }
      }
    }

    // Update property fields
    await property.update({
      name: name || property.name,
      address: address || property.address,
      city_id: city_id !== undefined ? city_id : property.city_id,
      latitude: latitude !== undefined ? latitude : property.latitude,
      longitude: longitude !== undefined ? longitude : property.longitude,
      floors_from: floors_from !== undefined ? (floors_from !== null ? parseInt(floors_from) : null) : property.floors_from,
      floors_to: floors_to !== undefined ? (floors_to !== null ? parseInt(floors_to) : null) : property.floors_to,
      show_monthly_reports_to_tenants: show_monthly_reports_to_tenants !== undefined ? show_monthly_reports_to_tenants : property.show_monthly_reports_to_tenants
    });

    // Update managers through junction table if provided
    if (manager_ids !== undefined) {
      if (Array.isArray(manager_ids)) {
        await property.setManagers(manager_ids);
      }
    }

    // Fetch updated property with manager details
    const updatedProperty = await db.Property.findByPk(id, {
      include: [{
        model: db.User,
        as: 'managers',
        attributes: ['id', 'name', 'surname', 'email'],
        through: { attributes: [] }
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating property',
      error: error.message
    });
  }
};

// Delete property
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await db.Property.findByPk(id, {
      include: [{
        model: db.User,
        as: 'managers',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // If user is a property_manager, verify they're assigned to this property
    if (req.user.role === 'property_manager') {
      const isAssigned = property.managers.some(manager => manager.id === req.user.id);
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete properties you manage.'
        });
      }
    }

    await property.destroy();

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting property',
      error: error.message
    });
  }
};

// Get all managers (property_manager users) for dropdown
exports.getManagers = async (req, res) => {
  try {
    const managers = await db.User.findAll({
      where: {
        role: 'property_manager'
      },
      attributes: ['id', 'name', 'surname', 'email'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: managers
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching managers',
      error: error.message
    });
  }
};
