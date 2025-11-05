const { Report, Property, ProblemOption, PropertyProblemOption, User } = require('../models');
const { Op } = require('sequelize');

// Create a new report (Tenant)
exports.createReport = async (req, res) => {
  try {
    const { property_id, problem_option_id, floor, description } = req.body;
    const tenant_user_id = req.user.id;

    // Validate that the tenant is assigned to this property
    const tenant = await User.findByPk(tenant_user_id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenantPropertyIds = tenant.property_ids || [];
    if (!tenantPropertyIds.includes(property_id)) {
      return res.status(403).json({ message: 'You are not assigned to this property' });
    }

    // Validate that the problem option exists for this property
    const propertyProblemOption = await PropertyProblemOption.findOne({
      where: {
        property_id,
        problem_option_id
      }
    });

    if (!propertyProblemOption) {
      return res.status(400).json({ message: 'This problem option is not available for this property' });
    }

    // Validate floor if provided
    if (floor !== null && floor !== undefined) {
      const property = await Property.findByPk(property_id);
      if (property && property.floors_from !== null && property.floors_to !== null) {
        if (floor < property.floors_from || floor > property.floors_to) {
          return res.status(400).json({
            message: `Floor must be between ${property.floors_from} and ${property.floors_to}`
          });
        }
      }
    }

    // Create the report
    const report = await Report.create({
      tenant_user_id,
      property_id,
      problem_option_id,
      floor,
      description,
      status: 'pending'
    });

    const reportWithDetails = await Report.findByPk(report.id, {
      include: [
        { model: Property, as: 'property' },
        { model: ProblemOption, as: 'problemOption' },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'surname', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Report created successfully',
      report: reportWithDetails
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

// Get reports for tenant
exports.getTenantReports = async (req, res) => {
  try {
    const tenant_user_id = req.user.id;

    const reports = await Report.findAll({
      where: { tenant_user_id },
      include: [
        { model: Property, as: 'property' },
        { model: ProblemOption, as: 'problemOption' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching tenant reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

// Get problem options for tenant's property
exports.getTenantProblemOptions = async (req, res) => {
  try {
    const tenant_user_id = req.user.id;

    // Get tenant's property IDs
    const tenant = await User.findByPk(tenant_user_id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const propertyIds = tenant.property_ids || [];

    if (propertyIds.length === 0) {
      return res.json({ properties: [] });
    }

    // Get properties with their problem options
    const properties = await Property.findAll({
      where: {
        id: { [Op.in]: propertyIds }
      },
      include: [
        {
          model: ProblemOption,
          as: 'problemOptions',
          through: { attributes: [] }
        }
      ]
    });

    res.json({ properties });
  } catch (error) {
    console.error('Error fetching problem options:', error);
    res.status(500).json({ message: 'Error fetching problem options', error: error.message });
  }
};

// Get all reports for property manager
exports.getPropertyManagerReports = async (req, res) => {
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
      return res.json({ reports: [] });
    }

    // Build where clause
    const whereClause = {
      property_id: { [Op.in]: managedPropertyIds },
      [Op.or]: [
        { archived: false },
        { archived: null }
      ]
    };

    if (property_id) {
      whereClause.property_id = property_id;
    }

    if (status) {
      whereClause.status = status;
    }

    const reports = await Report.findAll({
      where: whereClause,
      include: [
        {
          model: Property,
          as: 'property'
        },
        {
          model: ProblemOption,
          as: 'problemOption'
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'number']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching property manager reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

// Update report status (Property Manager)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get the report
    const report = await Report.findByPk(id, {
      include: [{ model: Property, as: 'property' }]
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user manages this property
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
    if (!managedPropertyIds.includes(report.property_id)) {
      return res.status(403).json({ message: 'You do not manage this property' });
    }

    // Update the report
    report.status = status;
    await report.save();

    const updatedReport = await Report.findByPk(id, {
      include: [
        { model: Property, as: 'property' },
        { model: ProblemOption, as: 'problemOption' },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'surname', 'email', 'number'] }
      ]
    });

    res.json({
      message: 'Report status updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Error updating report status', error: error.message });
  }
};

// Archive reports (Property Manager)
exports.archiveReports = async (req, res) => {
  try {
    const { ids } = req.body;
    const user_id = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Report IDs are required' });
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

    // Get reports to verify ownership
    const reports = await Report.findAll({
      where: {
        id: { [Op.in]: ids }
      }
    });

    // Verify all reports belong to managed properties
    for (const report of reports) {
      if (!managedPropertyIds.includes(report.property_id)) {
        return res.status(403).json({ message: 'You do not manage all selected reports' });
      }
    }

    // Archive the reports
    await Report.update(
      { archived: true },
      {
        where: {
          id: { [Op.in]: ids },
          property_id: { [Op.in]: managedPropertyIds }
        }
      }
    );

    res.json({
      message: `${ids.length} report(s) archived successfully`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error archiving reports:', error);
    res.status(500).json({ message: 'Error archiving reports', error: error.message });
  }
};

// Unarchive reports (Property Manager)
exports.unarchiveReports = async (req, res) => {
  try {
    const { ids } = req.body;
    const user_id = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Report IDs are required' });
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

    // Unarchive the reports
    await Report.update(
      { archived: false },
      {
        where: {
          id: { [Op.in]: ids },
          property_id: { [Op.in]: managedPropertyIds }
        }
      }
    );

    res.json({
      message: `${ids.length} report(s) unarchived successfully`,
      count: ids.length
    });
  } catch (error) {
    console.error('Error unarchiving reports:', error);
    res.status(500).json({ message: 'Error unarchiving reports', error: error.message });
  }
};
