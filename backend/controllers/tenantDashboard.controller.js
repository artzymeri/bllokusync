const { Complaint, Suggestion, TenantPayment, Report, Property, User, MonthlyReport } = require('../models');
const { Op } = require('sequelize');

// Get all tenant dashboard data in one call
exports.getTenantDashboardData = async (req, res) => {
  try {
    const tenant_user_id = req.user.id;
    const { year, month } = req.query;

    // Get tenant to verify existence and get property_ids
    const tenant = await User.findByPk(tenant_user_id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenantPropertyIds = tenant.property_ids || [];

    // Build date filter for payments if year is provided
    let paymentDateFilter = {};
    if (year) {
      if (month) {
        // Filter for specific month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        paymentDateFilter = {
          payment_month: {
            [Op.gte]: startDate,
            [Op.lte]: endDate
          }
        };
      } else {
        // Filter for entire year
        paymentDateFilter = {
          payment_month: {
            [Op.gte]: new Date(`${year}-01-01`),
            [Op.lte]: new Date(`${year}-12-31`)
          }
        };
      }
    }

    // Build date filter for monthly reports if year is provided
    let monthlyReportDateFilter = {};
    if (year) {
      monthlyReportDateFilter = {
        report_month: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lte]: new Date(`${year}-12-31`)
        }
      };
    }

    // Fetch all data in parallel
    const [complaints, suggestions, payments, reports, monthlyReports] = await Promise.all([
      // Fetch complaints
      Complaint.findAll({
        where: { tenant_user_id },
        include: [
          { model: Property, as: 'property' }
        ],
        order: [['created_at', 'DESC']]
      }),

      // Fetch suggestions
      Suggestion.findAll({
        where: { tenant_user_id },
        include: [
          { model: Property, as: 'property' }
        ],
        order: [['created_at', 'DESC']]
      }),

      // Fetch payments (with optional year/month filter)
      TenantPayment.findAll({
        where: {
          tenant_id: tenant_user_id,  // Changed from tenant_user_id
          ...paymentDateFilter
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address']
          }
        ],
        order: [['payment_month', 'DESC']]
      }),

      // Fetch reports (problems)
      Report.findAll({
        where: { tenant_user_id },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address']
          }
        ],
        order: [['created_at', 'DESC']]
      }),

      // Fetch monthly reports for tenant's properties
      tenantPropertyIds.length > 0 ? MonthlyReport.findAll({
        where: {
          property_id: {
            [Op.in]: tenantPropertyIds
          },
          ...monthlyReportDateFilter
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'show_monthly_reports_to_tenants'],
            where: {
              show_monthly_reports_to_tenants: true
            },
            required: true
          }
        ],
        order: [['report_month', 'DESC']]
      }) : []
    ]);

    // Calculate statistics
    const stats = {
      complaints: {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        rejected: complaints.filter(c => c.status === 'rejected').length
      },
      suggestions: {
        total: suggestions.length,
        pending: suggestions.filter(s => s.status === 'pending').length,
        underReview: suggestions.filter(s => s.status === 'under_review').length,
        approved: suggestions.filter(s => s.status === 'approved').length,
        rejected: suggestions.filter(s => s.status === 'rejected').length
      },
      payments: {
        total: payments.length,
        paid: payments.filter(p => p.status === 'paid').length,
        pending: payments.filter(p => p.status === 'pending').length,
        overdue: payments.filter(p => p.status === 'overdue').length,
        totalPaid: payments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      },
      reports: {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        resolved: reports.filter(r => r.status === 'resolved').length
      }
    };

    res.json({
      success: true,
      data: {
        complaints,
        suggestions,
        payments,
        reports,
        monthlyReports,
        stats,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          surname: tenant.surname,
          email: tenant.email,
          property_ids: tenant.property_ids
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tenant dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};
