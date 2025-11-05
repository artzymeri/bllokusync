const { Complaint, Property, User } = require('../models');
const { Op } = require('sequelize');

// Create a new complaint (Tenant)
exports.createComplaint = async (req, res) => {
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

    // Create the complaint
    const complaint = await Complaint.create({
      tenant_user_id,
      property_id,
      title,
      description,
      status: 'pending'
    });

    const complaintWithDetails = await Complaint.findByPk(complaint.id, {
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'surname', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Complaint created successfully',
      complaint: complaintWithDetails
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: 'Error creating complaint', error: error.message });
  }
};

// Get complaints for tenant
exports.getTenantComplaints = async (req, res) => {
  try {
    const tenant_user_id = req.user.id;

    const complaints = await Complaint.findAll({
      where: { tenant_user_id },
      include: [
        { model: Property, as: 'property' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ complaints });
  } catch (error) {
    console.error('Error fetching tenant complaints:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

// Get tenant's properties for complaint creation
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

// Get all complaints for property manager
exports.getPropertyManagerComplaints = async (req, res) => {
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
      return res.json({ complaints: [] });
    }

    // Build where clause
    const whereClause = {
      property_id: { [Op.in]: managedPropertyIds },
      archived: false // Exclude archived complaints by default
    };

    if (property_id) {
      whereClause.property_id = property_id;
    }

    if (status) {
      whereClause.status = status;
    }

    const complaints = await Complaint.findAll({
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

    res.json({ complaints });
  } catch (error) {
    console.error('Error fetching property manager complaints:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

// Update complaint status (Property Manager)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;
    const user_id = req.user.id;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the complaint
    const complaint = await Complaint.findByPk(id, {
      include: [{ model: Property, as: 'property' }]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
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
    if (!managedPropertyIds.includes(complaint.property_id)) {
      return res.status(403).json({ message: 'You do not manage this property' });
    }

    // Update the complaint status and response
    complaint.status = status;
    if (response !== undefined) {
      complaint.response = response;
    }
    await complaint.save();

    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'surname', 'email', 'number'] }
      ]
    });

    res.json({
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ message: 'Error updating complaint status', error: error.message });
  }
};

// Archive complaints (Property Manager)
exports.archiveComplaints = async (req, res) => {
  try {
    const { ids } = req.body;
    const user_id = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Complaint IDs are required' });
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

    // Get complaints to verify ownership
    const complaints = await Complaint.findAll({
      where: {
        id: { [Op.in]: ids }
      }
    });

    // Verify all complaints belong to managed properties
    for (const complaint of complaints) {
      if (!managedPropertyIds.includes(complaint.property_id)) {
        return res.status(403).json({ message: 'You do not manage all selected complaints' });
      }
    }

    // Archive the complaints
    await Complaint.update(
      { archived: true },
      {
        where: {
          id: { [Op.in]: ids },
          property_id: { [Op.in]: managedPropertyIds }
        }
      }
    );

    res.json({
      message: `${ids.length} complaint(s) archived successfully`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error archiving complaints:', error);
    res.status(500).json({ message: 'Error archiving complaints', error: error.message });
  }
};

// Unarchive complaints (Property Manager)
exports.unarchiveComplaints = async (req, res) => {
  try {
    const { ids } = req.body;
    const user_id = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Complaint IDs are required' });
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

    // Unarchive the complaints
    await Complaint.update(
      { archived: false },
      {
        where: {
          id: { [Op.in]: ids },
          property_id: { [Op.in]: managedPropertyIds }
        }
      }
    );

    res.json({
      message: `${ids.length} complaint(s) unarchived successfully`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error unarchiving complaints:', error);
    res.status(500).json({ message: 'Error unarchiving complaints', error: error.message });
  }
};

module.exports = exports;
