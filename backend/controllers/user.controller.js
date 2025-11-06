const db = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { generatePaymentRecords } = require('../utils/paymentUtils');

// Create user directly (for admin/property_manager)
exports.createUser = async (req, res) => {
  try {
    const { name, surname, email, password, number, role, property_ids, expiry_date, floor_assigned, monthly_rate, apartment_label, notice_day } = req.body;

    // Validate required fields
    if (!name || !surname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, surname, email, and password are required'
      });
    }

    // Check if email already exists in users
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already used'
      });
    }

    // Check if email already exists in register_requests
    const existingRequest = await db.RegisterRequest.findOne({ where: { email } });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Email is already used'
      });
    }

    // Check if phone number already exists (if provided)
    if (number) {
      const existingUserByPhone = await db.User.findOne({ where: { number } });
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }

      const existingRequestByPhone = await db.RegisterRequest.findOne({ where: { number } });
      if (existingRequestByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      name,
      surname,
      email,
      password: hashedPassword,
      number: number || null,
      role: role || 'tenant',
      property_ids: property_ids || []
    };

    // Add expiry_date for property_manager
    if (userData.role === 'property_manager') {
      userData.expiry_date = expiry_date || null;
    }

    // Add floor_assigned for tenant
    if (userData.role === 'tenant') {
      userData.floor_assigned = floor_assigned || null;
      userData.monthly_rate = monthly_rate || null;
      userData.apartment_label = apartment_label || null;
      userData.notice_day = notice_day !== undefined ? notice_day : 1;
    }

    // Create user
    const user = await db.User.create(userData);

    // Generate payment records for tenant
    if (userData.role === 'tenant' && userData.monthly_rate && userData.property_ids && userData.property_ids.length > 0) {
      for (const propertyId of userData.property_ids) {
        try {
          await generatePaymentRecords(user.id, propertyId, userData.monthly_rate);
        } catch (paymentError) {
          console.error(`Failed to generate payments for property ${propertyId}:`, paymentError);
        }
      }
    }

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Get all users with filtering
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const where = {};

    // Search filter (name, surname, or email)
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { surname: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role filter - supports multiple roles (comma-separated)
    if (role) {
      const roles = role.split(',').filter(r => r.trim());
      if (roles.length > 0) {
        where.role = roles.length === 1 ? roles[0] : { [Op.in]: roles };
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, surname, email, password, number, role, property_ids, expiry_date, floor_assigned, monthly_rate, apartment_label, notice_day } = req.body;

    const user = await db.User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      // Check in users table
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used'
        });
      }

      // Check in register_requests table
      const existingRequest = await db.RegisterRequest.findOne({ where: { email } });
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used'
        });
      }
    }

    // Check if phone number is being changed and if it already exists
    if (number && number !== user.number) {
      // Check in users table
      const existingUserByPhone = await db.User.findOne({ where: { number } });
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }

      // Check in register_requests table
      const existingRequestByPhone = await db.RegisterRequest.findOne({ where: { number } });
      if (existingRequestByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || user.name,
      surname: surname || user.surname,
      email: email || user.email,
      number: number !== undefined ? number : user.number,
      role: role || user.role,
      property_ids: property_ids !== undefined ? property_ids : user.property_ids
    };

    // Handle expiry_date - only for property_manager users
    if (role === 'property_manager' || (user.role === 'property_manager' && !role)) {
      updateData.expiry_date = expiry_date !== undefined ? expiry_date : user.expiry_date;
    } else {
      // Clear expiry_date if user is not property_manager
      updateData.expiry_date = null;
    }

    // Handle floor_assigned, monthly_rate, and apartment_label - only for tenant users
    if (role === 'tenant' || (user.role === 'tenant' && !role)) {
      updateData.floor_assigned = floor_assigned !== undefined ? floor_assigned : user.floor_assigned;
      updateData.monthly_rate = monthly_rate !== undefined ? monthly_rate : user.monthly_rate;
      updateData.apartment_label = apartment_label !== undefined ? apartment_label : user.apartment_label;
      updateData.notice_day = notice_day !== undefined ? notice_day : user.notice_day;
    } else {
      // Clear floor_assigned, monthly_rate, and apartment_label if user is not tenant
      updateData.floor_assigned = null;
      updateData.monthly_rate = null;
      updateData.apartment_label = null;
    }

    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    await user.update(updateData);

    // Generate payment records for tenant if properties or monthly_rate changed
    if ((role === 'tenant' || user.role === 'tenant') && updateData.monthly_rate) {
      const oldPropertyIds = user.property_ids || [];
      const newPropertyIds = updateData.property_ids || [];

      // Generate payment records for newly added properties
      const addedProperties = newPropertyIds.filter(id => !oldPropertyIds.includes(id));
      for (const propertyId of addedProperties) {
        try {
          await generatePaymentRecords(user.id, propertyId, updateData.monthly_rate);
        } catch (paymentError) {
          console.error(`Failed to generate payments for property ${propertyId}:`, paymentError);
        }
      }

      // If monthly_rate changed, update existing payment records
      if (monthly_rate !== undefined && monthly_rate !== user.monthly_rate) {
        const { updatePaymentRecordsAmount } = require('../utils/paymentUtils');
        for (const propertyId of newPropertyIds) {
          try {
            await updatePaymentRecordsAmount(user.id, propertyId, updateData.monthly_rate);
          } catch (paymentError) {
            console.error(`Failed to update payment amounts for property ${propertyId}:`, paymentError);
          }
        }
      }
    }

    // Return user without password
    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userData
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (req.user && req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Update own profile (for authenticated users)
exports.updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated token
    const { name, surname, email, password, number, currentPassword } = req.body;

    const user = await db.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If changing password, verify current password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }

      const existingRequest = await db.RegisterRequest.findOne({ where: { email } });
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    // Check if phone number is being changed and if it already exists
    if (number && number !== user.number) {
      const existingUserByPhone = await db.User.findOne({ where: { number } });
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use'
        });
      }

      const existingRequestByPhone = await db.RegisterRequest.findOne({ where: { number } });
      if (existingRequestByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use'
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || user.name,
      surname: surname || user.surname,
      email: email || user.email,
      number: number !== undefined ? number : user.number
    };

    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    await user.update(updateData);

    // Return user without password
    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Get tenants for property manager (filtered by their managed properties)
exports.getTenantsForPropertyManager = async (req, res) => {
  try {
    const propertyManagerId = req.user.id;
    const { search, page = 1, limit = 10, property_id } = req.query;

    // Check if user is property manager
    const propertyManager = await db.User.findByPk(propertyManagerId);

    if (!propertyManager || propertyManager.role !== 'property_manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Property Manager privileges required.'
      });
    }

    // Get the property IDs from the property_managers junction table
    const managedProperties = await db.PropertyManager.findAll({
      where: { user_id: propertyManagerId },
      attributes: ['property_id']
    });

    let managedPropertyIds = managedProperties.map(pm => pm.property_id);

    console.log('Property Manager ID:', propertyManagerId);
    console.log('Managed Property IDs:', managedPropertyIds);

    // If property_id filter is provided, validate and use only that property
    if (property_id) {
      const requestedPropertyId = parseInt(property_id);
      if (!managedPropertyIds.includes(requestedPropertyId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not manage this property'
        });
      }
      // Filter to only this specific property
      managedPropertyIds = [requestedPropertyId];
      console.log('Filtering by specific property:', requestedPropertyId);
    }

    if (managedPropertyIds.length === 0) {
      console.log('No properties found for this property manager');
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      });
    }

    // Build where clause using raw SQL for JSON_CONTAINS (MySQL compatible)
    // We need to use Sequelize.literal for proper JSON querying in MySQL
    const jsonContainsConditions = managedPropertyIds.map(propId =>
      db.sequelize.literal(`JSON_CONTAINS(property_ids, '${propId}', '$')`)
    );

    const where = {
      role: 'tenant',
      [Op.or]: jsonContainsConditions
    };

    // Search filter (name, surname, or email)
    if (search) {
      where[Op.and] = [
        {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { surname: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
          ]
        }
      ];
    }

    const offset = (page - 1) * limit;

    console.log('Querying tenants for properties:', managedPropertyIds);

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    console.log('Found tenants count:', count);
    console.log('Tenants:', rows.map(r => `${r.name} ${r.surname} (${r.email}) - Monthly Rate: ${r.monthly_rate || 'NOT SET'}`));

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
    console.error('Get tenants for property manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenants',
      error: error.message
    });
  }
};

// Get single tenant by ID for property manager (must be linked to their properties)
exports.getTenantByIdForPropertyManager = async (req, res) => {
  try {
    const propertyManagerId = req.user.id;
    const tenantId = parseInt(req.params.id);

    // Check if user is property manager
    const propertyManager = await db.User.findByPk(propertyManagerId);

    if (!propertyManager || propertyManager.role !== 'property_manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Property Manager privileges required.'
      });
    }

    // Get the property IDs from the property_managers junction table
    const managedProperties = await db.PropertyManager.findAll({
      where: { user_id: propertyManagerId },
      attributes: ['property_id']
    });

    const managedPropertyIds = managedProperties.map(pm => pm.property_id);

    if (managedPropertyIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or invalid tenant ID.'
      });
    }

    // Find the tenant
    const tenant = await db.User.findOne({
      where: {
        id: tenantId,
        role: 'tenant'
      },
      attributes: { exclude: ['password'] }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or invalid tenant ID.'
      });
    }

    // Check if tenant is assigned to any of the manager's properties
    const tenantPropertyIds = tenant.property_ids || [];
    const hasAccessToTenant = tenantPropertyIds.some(propId =>
      managedPropertyIds.includes(propId)
    );

    if (!hasAccessToTenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or invalid tenant ID.'
      });
    }

    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Get tenant by ID for property manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant',
      error: error.message
    });
  }
};

// Update tenant for property manager (must be linked to their properties)
exports.updateTenantForPropertyManager = async (req, res) => {
  try {
    const propertyManagerId = req.user.id;
    const tenantId = parseInt(req.params.id);
    const { name, surname, email, password, number, property_ids, floor_assigned, monthly_rate, apartment_label, notice_day } = req.body;

    // Check if user is property manager
    const propertyManager = await db.User.findByPk(propertyManagerId);

    if (!propertyManager || propertyManager.role !== 'property_manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Property Manager privileges required.'
      });
    }

    // Get the property IDs from the property_managers junction table
    const managedProperties = await db.PropertyManager.findAll({
      where: { user_id: propertyManagerId },
      attributes: ['property_id']
    });

    const managedPropertyIds = managedProperties.map(pm => pm.property_id);

    if (managedPropertyIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or invalid tenant ID.'
      });
    }

    // Find the tenant
    const tenant = await db.User.findOne({
      where: {
        id: tenantId,
        role: 'tenant'
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or invalid tenant ID.'
      });
    }

    // Check if tenant is currently assigned to any of the manager's properties
    const tenantPropertyIds = tenant.property_ids || [];
    const hasAccessToTenant = tenantPropertyIds.some(propId =>
      managedPropertyIds.includes(propId)
    );

    if (!hasAccessToTenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or invalid tenant ID.'
      });
    }

    // Validate new property assignment - must be one of manager's properties
    if (property_ids && property_ids.length > 0) {
      const allPropertiesManaged = property_ids.every(propId =>
        managedPropertyIds.includes(propId)
      );

      if (!allPropertiesManaged) {
        return res.status(403).json({
          success: false,
          message: 'You can only assign tenants to properties you manage.'
        });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== tenant.email) {
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used'
        });
      }

      const existingRequest = await db.RegisterRequest.findOne({ where: { email } });
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used'
        });
      }
    }

    // Check if phone number is being changed and if it already exists
    if (number && number !== tenant.number) {
      const existingUserByPhone = await db.User.findOne({ where: { number } });
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }

      const existingRequestByPhone = await db.RegisterRequest.findOne({ where: { number } });
      if (existingRequestByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || tenant.name,
      surname: surname || tenant.surname,
      email: email || tenant.email,
      number: number !== undefined ? number : tenant.number,
      property_ids: property_ids !== undefined ? property_ids : tenant.property_ids,
      floor_assigned: floor_assigned !== undefined ? floor_assigned : tenant.floor_assigned,
      monthly_rate: monthly_rate !== undefined ? monthly_rate : tenant.monthly_rate,
      apartment_label: apartment_label !== undefined ? apartment_label : tenant.apartment_label,
      notice_day: notice_day !== undefined ? notice_day : tenant.notice_day
    };

    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    await tenant.update(updateData);

    // Generate payment records for tenant if properties or monthly_rate changed
    if ((role === 'tenant' || tenant.role === 'tenant') && updateData.monthly_rate) {
      const oldPropertyIds = tenant.property_ids || [];
      const newPropertyIds = updateData.property_ids || [];

      // Generate payment records for newly added properties
      const addedProperties = newPropertyIds.filter(id => !oldPropertyIds.includes(id));
      for (const propertyId of addedProperties) {
        try {
          await generatePaymentRecords(tenant.id, propertyId, updateData.monthly_rate);
        } catch (paymentError) {
          console.error(`Failed to generate payments for property ${propertyId}:`, paymentError);
        }
      }

      // If monthly_rate changed, update existing payment records
      if (monthly_rate !== undefined && monthly_rate !== tenant.monthly_rate) {
        const { updatePaymentRecordsAmount } = require('../utils/paymentUtils');
        for (const propertyId of newPropertyIds) {
          try {
            await updatePaymentRecordsAmount(tenant.id, propertyId, updateData.monthly_rate);
          } catch (paymentError) {
            console.error(`Failed to update payment amounts for property ${propertyId}:`, paymentError);
          }
        }
      }
    }

    // Return tenant without password
    const tenantData = tenant.toJSON();
    delete tenantData.password;

    res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenantData
    });
  } catch (error) {
    console.error('Update tenant for property manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tenant',
      error: error.message
    });
  }
};

// Delete tenant for property manager
exports.deleteTenantForPropertyManager = async (req, res) => {
  try {
    const propertyManagerId = req.user.id;
    const tenantId = parseInt(req.params.id);

    // Check if user is property manager or admin
    const propertyManager = await db.User.findByPk(propertyManagerId);

    if (!propertyManager || (propertyManager.role !== 'property_manager' && propertyManager.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Property Manager or Admin privileges required.'
      });
    }

    // Get the property IDs that this property manager manages
    const managedProperties = await db.PropertyManager.findAll({
      where: { user_id: propertyManagerId },
      attributes: ['property_id']
    });

    const managedPropertyIds = managedProperties.map(pm => pm.property_id);

    // Admins can delete any tenant without property checks
    if (propertyManager.role !== 'admin') {
      if (managedPropertyIds.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found or you do not have permission to delete this tenant.'
        });
      }
    }

    // Find the tenant
    const tenant = await db.User.findOne({
      where: {
        id: tenantId,
        role: 'tenant'
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or invalid tenant ID.'
      });
    }

    // Prevent deleting yourself
    if (propertyManagerId === tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // For property managers (not admins), check if tenant is assigned to any of their properties
    if (propertyManager.role !== 'admin') {
      const tenantPropertyIds = tenant.property_ids || [];
      const hasAccessToTenant = tenantPropertyIds.some(propId =>
        managedPropertyIds.includes(propId)
      );

      if (!hasAccessToTenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found or you do not have permission to delete this tenant.'
        });
      }
    }

    // Delete the tenant
    await tenant.destroy();

    res.status(200).json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant for property manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tenant',
      error: error.message
    });
  }
};
