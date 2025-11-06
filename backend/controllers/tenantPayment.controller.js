const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const emailService = require('../services/email.service');

// Get payments for a specific tenant
exports.getTenantPayments = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { property_id, status, year, month } = req.query;

    // If user is a tenant, they can only access their own payments
    if (req.user.role === 'tenant') {
      if (parseInt(tenantId) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own payment data'
        });
      }
    }

    const whereClause = { tenant_id: tenantId };

    if (property_id) {
      whereClause.property_id = property_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (year) {
      const yearNum = parseInt(year);
      if (month) {
        // Check if month is an array (multiple months) or a single value
        const months = Array.isArray(month) ? month : [month];

        if (months.length > 0) {
          // Create date ranges for each month
          const monthRanges = months.map(m => {
            const monthNum = parseInt(m) - 1; // month comes as 1-indexed from API
            const startDate = new Date(yearNum, monthNum, 1);
            const endDate = new Date(yearNum, monthNum + 1, 0);
            return {
              [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
            };
          });

          // Use OR condition for multiple month ranges
          whereClause.payment_month = {
            [Op.or]: monthRanges
          };
        }
      } else {
        const startDate = new Date(yearNum, 0, 1);
        const endDate = new Date(yearNum, 11, 31);
        whereClause.payment_month = {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        };
      }
    }

    const payments = await db.TenantPayment.findAll({
      where: whereClause,
      include: [
        {
          model: db.Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['payment_month', 'DESC']]
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get tenant payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant payments',
      error: error.message
    });
  }
};

// Get payments for property manager's properties
exports.getPropertyManagerPayments = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { property_id, tenant_id, status, year, month } = req.query;

    // Get properties managed by this property manager
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!manager || !manager.managedPropertiesMany || manager.managedPropertiesMany.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const managedPropertyIds = manager.managedPropertiesMany.map(p => p.id);

    const whereClause = {
      property_id: { [Op.in]: managedPropertyIds }
    };

    if (property_id) {
      if (!managedPropertyIds.includes(parseInt(property_id))) {
        return res.status(403).json({
          success: false,
          message: 'You do not manage this property'
        });
      }
      whereClause.property_id = property_id;
    }

    if (tenant_id) {
      whereClause.tenant_id = tenant_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (year) {
      const yearNum = parseInt(year);
      if (month) {
        // Check if month is an array (multiple months) or a single value
        const months = Array.isArray(month) ? month : [month];

        if (months.length > 0) {
          // Create date ranges for each month
          const monthRanges = months.map(m => {
            const monthNum = parseInt(m) - 1; // month comes as 1-indexed from API
            const startDate = new Date(yearNum, monthNum, 1);
            const endDate = new Date(yearNum, monthNum + 1, 0);
            return {
              [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
            };
          });

          // Use OR condition for multiple month ranges
          whereClause.payment_month = {
            [Op.or]: monthRanges
          };
        }
      } else {
        const startDate = new Date(yearNum, 0, 1);
        const endDate = new Date(yearNum, 11, 31);
        whereClause.payment_month = {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        };
      }
    }

    const payments = await db.TenantPayment.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'apartment_label']
        },
        {
          model: db.Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['payment_month', 'DESC']]
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get property manager payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Get payment statistics for property manager
exports.getPaymentStatistics = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { property_id, year } = req.query;

    // Get properties managed by this property manager
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!manager || !manager.managedPropertiesMany || manager.managedPropertiesMany.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0
        }
      });
    }

    const managedPropertyIds = manager.managedPropertiesMany.map(p => p.id);

    const whereClause = {
      property_id: { [Op.in]: managedPropertyIds }
    };

    if (property_id) {
      if (!managedPropertyIds.includes(parseInt(property_id))) {
        return res.status(403).json({
          success: false,
          message: 'You do not manage this property'
        });
      }
      whereClause.property_id = property_id;
    }

    if (year) {
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum, 11, 31);
      whereClause.payment_month = {
        [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      };
    }

    const payments = await db.TenantPayment.findAll({
      where: whereClause,
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
      ],
      group: ['status'],
      raw: true
    });

    const stats = {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0
    };

    payments.forEach(payment => {
      const count = parseInt(payment.count);
      const total = parseFloat(payment.total || 0);

      stats.total += count;
      stats.totalAmount += total;

      switch (payment.status) {
        case 'paid':
          stats.paid = count;
          stats.paidAmount = total;
          break;
        case 'pending':
          stats.pending = count;
          stats.pendingAmount = total;
          break;
        case 'overdue':
          stats.overdue = count;
          stats.overdueAmount = total;
          break;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics',
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const managerId = req.user.id;

    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const payment = await db.TenantPayment.findByPk(id, {
      include: [{
        model: db.Property,
        as: 'property'
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user manages this property
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        where: { id: payment.property_id },
        through: { attributes: [] },
        required: false
      }]
    });

    if (!manager || !manager.managedPropertiesMany || manager.managedPropertiesMany.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this payment'
      });
    }

    const updateData = { status };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Set payment_date when marking as paid
    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString().split('T')[0];
    } else {
      updateData.payment_date = null;
    }

    await payment.update(updateData);

    const updatedPayment = await db.TenantPayment.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'apartment_label']
        },
        {
          model: db.Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }
      ]
    });

    // Send email notification if payment was marked as paid
    if (status === 'paid' && updatedPayment.tenant && updatedPayment.property) {
      try {
        await emailService.sendSinglePaymentPaidEmail(
          updatedPayment.tenant,
          updatedPayment,
          updatedPayment.property
        );
        console.log(`✅ Payment confirmation email sent for payment ID: ${id}`);
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error('Failed to send payment confirmation email:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  }
};

// Bulk update payment statuses
exports.bulkUpdatePayments = async (req, res) => {
  try {
    const { payment_ids, status, notes } = req.body;
    const managerId = req.user.id;

    if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'payment_ids array is required'
      });
    }

    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Get all payments with tenant and property info
    const payments = await db.TenantPayment.findAll({
      where: { id: { [Op.in]: payment_ids } },
      include: [
        {
          model: db.Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: db.User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'apartment_label']
        }
      ]
    });

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payments found'
      });
    }

    // Get properties managed by this manager
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    const managedPropertyIds = manager.managedPropertiesMany.map(p => p.id);

    // Check all payments belong to managed properties
    const unauthorizedPayment = payments.find(p => !managedPropertyIds.includes(p.property_id));
    if (unauthorizedPayment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update some of these payments'
      });
    }

    const updateData = { status };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString().split('T')[0];
    } else {
      updateData.payment_date = null;
    }

    await db.TenantPayment.update(updateData, {
      where: { id: { [Op.in]: payment_ids } }
    });

    // Send email notifications if payments were marked as paid
    if (status === 'paid') {
      // Group payments by tenant to send one email per tenant
      const paymentsByTenant = {};

      payments.forEach(payment => {
        if (payment.tenant && payment.property) {
          if (!paymentsByTenant[payment.tenant_id]) {
            paymentsByTenant[payment.tenant_id] = {
              tenant: payment.tenant,
              property: payment.property,
              payments: []
            };
          }
          // Update payment with the new payment_date for email
          payment.payment_date = updateData.payment_date;
          payment.notes = notes;
          paymentsByTenant[payment.tenant_id].payments.push(payment);
        }
      });

      // Send emails to each tenant
      for (const tenantId in paymentsByTenant) {
        const { tenant, property, payments: tenantPayments } = paymentsByTenant[tenantId];

        try {
          if (tenantPayments.length === 1) {
            // Send single payment email
            await emailService.sendSinglePaymentPaidEmail(tenant, tenantPayments[0], property);
            console.log(`✅ Single payment confirmation email sent to ${tenant.email}`);
          } else {
            // Send multiple payments email
            await emailService.sendMultiplePaymentsPaidEmail(tenant, tenantPayments, property);
            console.log(`✅ Multiple payments confirmation email sent to ${tenant.email} for ${tenantPayments.length} payments`);
          }
        } catch (emailError) {
          // Log email error but don't fail the request
          console.error(`Failed to send payment confirmation email to ${tenant.email}:`, emailError.message);
        }
      }
    }

    res.json({
      success: true,
      message: `${payment_ids.length} payment(s) updated successfully`
    });
  } catch (error) {
    console.error('Bulk update payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payments',
      error: error.message
    });
  }
};

// Generate payment records for future months (manual advance payment)
exports.generateFuturePayments = async (req, res) => {
  try {
    const { tenant_id, property_id, months_ahead } = req.body;
    const managerId = req.user.id;

    if (!tenant_id || !property_id || !months_ahead) {
      return res.status(400).json({
        success: false,
        message: 'tenant_id, property_id, and months_ahead are required'
      });
    }

    // Check if user manages this property
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        where: { id: property_id },
        through: { attributes: [] },
        required: false
      }]
    });

    if (!manager || !manager.managedPropertiesMany || manager.managedPropertiesMany.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage this property'
      });
    }

    // Get tenant info
    const tenant = await db.User.findOne({
      where: {
        id: tenant_id,
        role: 'tenant',
        [Op.and]: [
          Sequelize.literal(`JSON_CONTAINS(property_ids, '${JSON.stringify([parseInt(property_id)])}')`)
        ]
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or not associated with this property'
      });
    }

    if (!tenant.monthly_rate || tenant.monthly_rate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tenant does not have a monthly rate set'
      });
    }

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const createdPayments = [];

    for (let i = 0; i < months_ahead; i++) {
      const paymentMonth = new Date(nextMonth);
      paymentMonth.setMonth(paymentMonth.getMonth() + i);
      const monthStr = paymentMonth.toISOString().split('T')[0];

      // Check if payment already exists
      const [payment, created] = await db.TenantPayment.findOrCreate({
        where: {
          tenant_id,
          property_id,
          payment_month: monthStr
        },
        defaults: {
          amount: tenant.monthly_rate,
          status: 'pending'
        }
      });

      if (created) {
        createdPayments.push(payment);
      }
    }

    res.json({
      success: true,
      message: `${createdPayments.length} future payment record(s) created`,
      data: createdPayments
    });
  } catch (error) {
    console.error('Generate future payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating future payments',
      error: error.message
    });
  }
};

// Generate or ensure payment records exist for specific month(s)
exports.ensurePaymentRecords = async (req, res) => {
  try {
    const { tenant_ids, property_id, year, month } = req.body;
    const managerId = req.user.id;

    console.log('ensurePaymentRecords called with:', { tenant_ids, property_id, year, month });

    if (!tenant_ids || !Array.isArray(tenant_ids) || tenant_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tenant_ids array is required'
      });
    }

    if (!property_id || year === undefined || month === undefined) {
      return res.status(400).json({
        success: false,
        message: 'property_id, year, and month are required'
      });
    }

    // Check if user manages this property
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        where: { id: property_id },
        through: { attributes: [] },
        required: false
      }]
    });

    if (!manager || !manager.managedPropertiesMany || manager.managedPropertiesMany.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage this property'
      });
    }

    // Handle multiple months
    const months = Array.isArray(month) ? month : [month];

    const createdPayments = [];
    const errors = [];

    for (const monthIndex of months) {
      // Create payment month date (first day of the month)
      // month is 0-indexed from frontend (0=Jan, 11=Dec), so add 1 for the actual month number
      const monthNumber = monthIndex + 1;
      const monthStr = `${year}-${String(monthNumber).padStart(2, '0')}-01`;

      console.log('Processing month:', monthStr, 'for month index:', monthIndex);

      for (const tenantId of tenant_ids) {
        try {
          // Check if ANY payment record already exists for this tenant/property/month
          const existingPayment = await db.TenantPayment.findOne({
            where: {
              tenant_id: tenantId,
              property_id: parseInt(property_id),
              payment_month: monthStr
            }
          });

          // If payment record exists (regardless of status), just return it and skip creation
          if (existingPayment) {
            console.log('Tenant', tenantId, 'already has payment record for', monthStr, 'with status:', existingPayment.status);
            createdPayments.push({
              id: existingPayment.id,
              tenant_id: tenantId,
              month: monthIndex,
              created: false
            });
            continue;
          }

          // Get tenant info
          const tenant = await db.User.findOne({
            where: {
              id: tenantId,
              role: 'tenant'
            }
          });

          console.log('Found tenant:', tenantId, tenant ? `has property_ids: ${tenant.property_ids}` : 'NOT FOUND');

          if (!tenant) {
            errors.push({ tenant_id: tenantId, month: monthIndex, error: 'Tenant not found' });
            continue;
          }

          // Check if tenant is associated with this property
          const hasProperty = tenant.property_ids && tenant.property_ids.includes(parseInt(property_id));
          console.log('Tenant', tenantId, 'has property', property_id, '?', hasProperty);

          if (!hasProperty) {
            errors.push({ tenant_id: tenantId, month: monthIndex, error: 'Tenant not associated with this property' });
            continue;
          }

          if (!tenant.monthly_rate || tenant.monthly_rate <= 0) {
            errors.push({ tenant_id: tenantId, month: monthIndex, error: 'Tenant does not have a monthly rate set' });
            continue;
          }

          console.log('Creating payment record for tenant', tenantId, 'amount:', tenant.monthly_rate, 'month:', monthStr);

          // Create payment record (we already checked it doesn't exist)
          const payment = await db.TenantPayment.create({
            tenant_id: tenantId,
            property_id: parseInt(property_id),
            payment_month: monthStr,
            amount: tenant.monthly_rate,
            status: 'pending'
          });

          console.log('Payment record CREATED with ID:', payment.id);

          createdPayments.push({
            id: payment.id,
            tenant_id: tenantId,
            month: monthIndex,
            created: true
          });
        } catch (err) {
          console.error('Error processing tenant', tenantId, 'for month', monthIndex, ':', err);
          // Check if it's a duplicate key error
          if (err.name === 'SequelizeUniqueConstraintError') {
            // If duplicate, fetch the existing payment and return it
            try {
              const existingPayment = await db.TenantPayment.findOne({
                where: {
                  tenant_id: tenantId,
                  property_id: parseInt(property_id),
                  payment_month: monthStr
                }
              });
              if (existingPayment) {
                createdPayments.push({
                  id: existingPayment.id,
                  tenant_id: tenantId,
                  month: monthIndex,
                  created: false
                });
              }
            } catch (fetchErr) {
              errors.push({ tenant_id: tenantId, month: monthIndex, error: 'Duplicate payment record' });
            }
          } else {
            errors.push({ tenant_id: tenantId, month: monthIndex, error: err.message });
          }
        }
      }
    }

    console.log('Final result - created:', createdPayments.length, 'errors:', errors.length);

    res.json({
      success: true,
      message: `Processed ${tenant_ids.length} tenant(s) for ${months.length} month(s)`,
      data: {
        payments: createdPayments,
        new_records: createdPayments.filter(p => p.created).length,
        existing_records: createdPayments.filter(p => !p.created).length,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Ensure payment records error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ensuring payment records',
      error: error.message
    });
  }
};

// Update payment date
exports.updatePaymentDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_date } = req.body;
    const managerId = req.user.id;

    if (!payment_date) {
      return res.status(400).json({
        success: false,
        message: 'payment_date is required'
      });
    }

    const payment = await db.TenantPayment.findByPk(id, {
      include: [{
        model: db.Property,
        as: 'property'
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user manages this property
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        where: { id: payment.property_id },
        through: { attributes: [] },
        required: false
      }]
    });

    if (!manager || !manager.managedPropertiesMany || manager.managedPropertiesMany.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this payment'
      });
    }

    await payment.update({ payment_date });

    const updatedPayment = await db.TenantPayment.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'apartment_label']
        },
        {
          model: db.Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Payment date updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Update payment date error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment date',
      error: error.message
    });
  }
};

// Delete payment record
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const payment = await db.TenantPayment.findByPk(id, {
      include: [{
        model: db.Property,
        as: 'property'
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user manages this property
    const manager = await db.User.findByPk(managerId, {
      include: [{
        model: db.Property,
        as: 'managedPropertiesMany',
        where: { id: payment.property_id },
        through: { attributes: [] },
        required: false
      }]
    });

    if (!manager || !manager.managedPropertiesMany || manager.managedPropertiesMany.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this payment'
      });
    }

    // Delete the payment
    await payment.destroy();

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payment',
      error: error.message
    });
  }
};
