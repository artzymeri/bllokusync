const { Property, User, TenantPayment, Report, Complaint, Suggestion, MonthlyReport, PropertyManager } = require('../models');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database').sequelize;

// Get comprehensive Property Manager dashboard data
exports.getPropertyManagerDashboardData = async (req, res) => {
  try {
    const property_manager_id = req.user.id;

    // Get all properties managed by this property manager using the junction table
    const propertyManagerRecords = await PropertyManager.findAll({
      where: { user_id: property_manager_id },
      attributes: ['property_id']
    });

    const propertyIds = propertyManagerRecords.map(pm => pm.property_id);

    // Get all properties with their details
    const properties = await Property.findAll({
      where: {
        id: { [Op.in]: propertyIds }
      }
    });

    // Get all tenants across managed properties using JSON_CONTAINS (same approach as tenants list)
    // Build where clause using raw SQL for JSON_CONTAINS (MySQL compatible)
    const jsonContainsConditions = propertyIds.map(propId =>
      sequelize.literal(`JSON_CONTAINS(property_ids, '${propId}', '$')`)
    );

    const allTenants = await User.findAll({
      where: {
        role: 'tenant',
        [Op.or]: jsonContainsConditions
      },
      attributes: ['id', 'name', 'surname', 'email', 'number', 'property_ids']
    });

    // Debug logging for tenant count
    console.log('[PM Dashboard] Property IDs:', propertyIds);
    console.log('[PM Dashboard] Total tenants found:', allTenants.length);
    console.log('[PM Dashboard] Tenants:', allTenants.map(t => ({ id: t.id, name: `${t.name} ${t.surname}`, property_ids: t.property_ids })));

    // Calculate total apartments and occupied apartments
    let totalApartments = 0;
    let occupiedApartments = 0;

    properties.forEach(property => {
      const floors = property.floors || [];
      floors.forEach(floor => {
        const apartments = floor.apartments || [];
        totalApartments += apartments.length;

        apartments.forEach(apt => {
          if (apt.tenant_id) {
            occupiedApartments++;
          }
        });
      });
    });

    // Get pending reports (maintenance requests)
    const pendingReports = await Report.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: { [Op.in]: ['pending', 'in_progress'] },
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'number']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get recent complaints
    const recentComplaints = await Complaint.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: { [Op.in]: ['pending', 'in_progress'] },
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get recent suggestions
    const recentSuggestions = await Suggestion.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: 'pending',
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get payment statistics for current month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const currentMonthPayments = await TenantPayment.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        payment_month: {
          [Op.gte]: firstDayOfMonth,
          [Op.lte]: lastDayOfMonth
        }
      }
    });

    const paidCount = currentMonthPayments.filter(p => p.status === 'paid').length;
    const unpaidCount = currentMonthPayments.length - paidCount; // Count all non-paid payments
    const totalRevenue = currentMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Debug logging for payment data
    console.log('[PM Dashboard] First day of month:', firstDayOfMonth);
    console.log('[PM Dashboard] Last day of month:', lastDayOfMonth);
    console.log('[PM Dashboard] Total payments this month:', currentMonthPayments.length);
    console.log('[PM Dashboard] Paid:', paidCount, 'Unpaid:', unpaidCount);
    console.log('[PM Dashboard] Payment details:', currentMonthPayments.map(p => ({ 
      id: p.id, 
      status: p.status, 
      amount: p.amount, 
      payment_month: p.payment_month,
      property_id: p.property_id,
      tenant_id: p.tenant_id
    })));

    // Get overdue payments
    const overduePayments = await TenantPayment.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: 'unpaid',
        payment_month: {
          [Op.lt]: firstDayOfMonth
        }
      },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'number']
        }
      ],
      order: [['payment_month', 'ASC']],
      limit: 10
    });

    // Get recent monthly reports
    const recentMonthlyReports = await MonthlyReport.findAll({
      where: {
        property_id: { [Op.in]: propertyIds }
      },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['report_month', 'DESC']],
      limit: 5
    });

    // Calculate report statistics
    const reportStats = await Report.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const reportStatusCounts = {
      pending: 0,
      in_progress: 0,
      resolved: 0
    };

    reportStats.forEach(stat => {
      reportStatusCounts[stat.status] = parseInt(stat.get('count'));
    });

    // Calculate complaint statistics
    const complaintStats = await Complaint.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const complaintStatusCounts = {
      pending: 0,
      in_progress: 0,
      resolved: 0
    };

    complaintStats.forEach(stat => {
      complaintStatusCounts[stat.status] = parseInt(stat.get('count'));
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = {
      newReports: await Report.count({
        where: {
          property_id: { [Op.in]: propertyIds },
          created_at: { [Op.gte]: sevenDaysAgo }
        }
      }),
      newComplaints: await Complaint.count({
        where: {
          property_id: { [Op.in]: propertyIds },
          created_at: { [Op.gte]: sevenDaysAgo }
        }
      }),
      newSuggestions: await Suggestion.count({
        where: {
          property_id: { [Op.in]: propertyIds },
          created_at: { [Op.gte]: sevenDaysAgo }
        }
      }),
      paymentsReceived: await TenantPayment.count({
        where: {
          property_id: { [Op.in]: propertyIds },
          status: 'paid',
          updated_at: { [Op.gte]: sevenDaysAgo }
        }
      })
    };

    // Calculate occupancy rate
    const occupancyRate = totalApartments > 0
      ? ((occupiedApartments / totalApartments) * 100).toFixed(1)
      : 0;

    // Return comprehensive dashboard data
    res.json({
      success: true,
      data: {
        overview: {
          totalProperties: properties.length,
          totalTenants: allTenants.length,
          totalApartments,
          occupiedApartments,
          vacantApartments: totalApartments - occupiedApartments,
          occupancyRate: parseFloat(occupancyRate)
        },
        payments: {
          currentMonth: {
            paid: paidCount,
            unpaid: unpaidCount,
            total: currentMonthPayments.length,
            revenue: parseFloat(totalRevenue.toFixed(2)),
            collectionRate: currentMonthPayments.length > 0
              ? ((paidCount / currentMonthPayments.length) * 100).toFixed(1)
              : 0
          },
          overdue: overduePayments.map(p => ({
            id: p.id,
            tenant: p.tenant ? {
              id: p.tenant.id,
              name: `${p.tenant.name} ${p.tenant.surname}`,
              email: p.tenant.email,
              number: p.tenant.number
            } : null,
            property: p.property ? {
              id: p.property.id,
              name: p.property.name,
              address: p.property.address
            } : null,
            amount: parseFloat(p.amount || 0),
            paymentMonth: p.payment_month,
            daysOverdue: Math.floor((currentDate - new Date(p.payment_month)) / (1000 * 60 * 60 * 24))
          }))
        },
        reports: {
          statistics: reportStatusCounts,
          pending: pendingReports.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            status: r.status,
            problemOptions: r.problem_options,
            urgency: r.urgency || 'medium',
            tenant: r.tenant ? {
              id: r.tenant.id,
              name: `${r.tenant.name} ${r.tenant.surname}`,
              email: r.tenant.email,
              number: r.tenant.number
            } : null,
            property: r.property ? {
              id: r.property.id,
              name: r.property.name,
              address: r.property.address
            } : null,
            createdAt: r.created_at
          }))
        },
        complaints: {
          statistics: complaintStatusCounts,
          recent: recentComplaints.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            status: c.status,
            tenant: c.tenant ? {
              id: c.tenant.id,
              name: `${c.tenant.name} ${c.tenant.surname}`,
              email: c.tenant.email
            } : null,
            property: c.property ? {
              id: c.property.id,
              name: c.property.name,
              address: c.property.address
            } : null,
            createdAt: c.created_at
          }))
        },
        suggestions: {
          recent: recentSuggestions.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            status: s.status,
            tenant: s.tenant ? {
              id: s.tenant.id,
              name: `${s.tenant.name} ${s.tenant.surname}`,
              email: s.tenant.email
            } : null,
            property: s.property ? {
              id: s.property.id,
              name: s.property.name,
              address: s.property.address
            } : null,
            createdAt: s.created_at
          }))
        },
        monthlyReports: {
          recent: recentMonthlyReports.map(mr => ({
            id: mr.id,
            reportMonth: mr.report_month,
            totalRevenue: parseFloat(mr.total_revenue || 0),
            totalExpenses: parseFloat(mr.total_expenses || 0),
            netIncome: parseFloat(mr.net_income || 0),
            property: mr.property ? {
              id: mr.property.id,
              name: mr.property.name,
              address: mr.property.address
            } : null,
            createdAt: mr.created_at
          }))
        },
        recentActivity,
        properties: properties.map(p => {
          // Calculate actual number of floors
          const floorsCount = (p.floors_from !== null && p.floors_to !== null)
            ? (p.floors_to - p.floors_from + 1)
            : null;

          // Count tenants for this property
          const propertyTenants = allTenants.filter(tenant =>
            tenant.property_ids && tenant.property_ids.includes(p.id)
          );

          return {
            id: p.id,
            name: p.name,
            address: p.address,
            floors: floorsCount,
            totalApartments: (p.floors || []).reduce((sum, floor) =>
              sum + (floor.apartments || []).length, 0),
            occupiedApartments: (p.floors || []).reduce((sum, floor) =>
              sum + (floor.apartments || []).filter(apt => apt.tenant_id).length, 0),
            tenantCount: propertyTenants.length
          };
        })
      }
    });

  } catch (error) {
    console.error('Error fetching property manager dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Get sidebar badge counts for Property Manager
exports.getSidebarCounts = async (req, res) => {
  try {
    const property_manager_id = req.user.id;

    // Get all properties managed by this property manager using the junction table
    const propertyManagerRecords = await PropertyManager.findAll({
      where: { user_id: property_manager_id },
      attributes: ['property_id']
    });

    const propertyIds = propertyManagerRecords.map(pm => pm.property_id);

    if (propertyIds.length === 0) {
      return res.json({
        success: true,
        data: {
          pendingReports: 0,
          pendingComplaints: 0,
          pendingSuggestions: 0
        }
      });
    }

    // Count pending reports
    const pendingReports = await Report.count({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: 'pending',
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      }
    });

    // Count pending complaints
    const pendingComplaints = await Complaint.count({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: 'pending',
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      }
    });

    // Debug: Log the actual complaints being counted
    const complaintsDebug = await Complaint.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: 'pending'
      },
      attributes: ['id', 'title', 'status', 'archived', 'property_id']
    });
    console.log('[DEBUG] All pending complaints:', JSON.stringify(complaintsDebug.map(c => ({ id: c.id, title: c.title, archived: c.archived, status: c.status }))));
    console.log('[DEBUG] Pending count (archived=false or null):', pendingComplaints);

    // Count pending suggestions
    const pendingSuggestions = await Suggestion.count({
      where: {
        property_id: { [Op.in]: propertyIds },
        status: 'pending',
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      }
    });

    res.json({
      success: true,
      data: {
        pendingReports,
        pendingComplaints,
        pendingSuggestions
      }
    });

  } catch (error) {
    console.error('Error fetching sidebar counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sidebar counts',
      error: error.message
    });
  }
};

// Get detailed payments data for property manager
exports.getPropertyManagerPayments = async (req, res) => {
  try {
    const property_manager_id = req.user.id;
    const { status, month } = req.query;

    // Get all properties managed by this property manager
    const propertyManagerRecords = await PropertyManager.findAll({
      where: { user_id: property_manager_id },
      attributes: ['property_id']
    });

    const propertyIds = propertyManagerRecords.map(pm => pm.property_id);

    if (propertyIds.length === 0) {
      return res.json({
        success: true,
        data: {
          currentMonth: {
            paid: 0,
            unpaid: 0,
            total: 0,
            revenue: 0,
            collectionRate: '0'
          },
          payments: [],
          stats: {
            totalRevenue: 0,
            averagePayment: 0,
            onTimePayments: 0,
            latePayments: 0
          }
        }
      });
    }

    // Calculate date range based on month filter
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let dateFilter = {};
    let statsDateFilter = {};

    if (month === 'current') {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      dateFilter = {
        payment_month: {
          [Op.gte]: firstDayOfMonth,
          [Op.lte]: lastDayOfMonth
        }
      };
      statsDateFilter = dateFilter;
    } else if (month === 'last3') {
      const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
      dateFilter = {
        payment_month: {
          [Op.gte]: threeMonthsAgo
        }
      };
      statsDateFilter = {
        payment_month: {
          [Op.gte]: new Date(currentYear, currentMonth, 1),
          [Op.lte]: new Date(currentYear, currentMonth + 1, 0)
        }
      };
    } else if (month === 'last6') {
      const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
      dateFilter = {
        payment_month: {
          [Op.gte]: sixMonthsAgo
        }
      };
      statsDateFilter = {
        payment_month: {
          [Op.gte]: new Date(currentYear, currentMonth, 1),
          [Op.lte]: new Date(currentYear, currentMonth + 1, 0)
        }
      };
    }

    // Build where clause for payments query
    const whereClause = {
      property_id: { [Op.in]: propertyIds },
      ...dateFilter
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get all payments
    const payments = await TenantPayment.findAll({
      where: whereClause,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'surname', 'email', 'number']
        }
      ],
      order: [['payment_month', 'DESC'], ['created_at', 'DESC']]
    });

    // Get current month stats
    const currentMonthPayments = await TenantPayment.findAll({
      where: {
        property_id: { [Op.in]: propertyIds },
        ...statsDateFilter
      }
    });

    const paidCount = currentMonthPayments.filter(p => p.status === 'paid').length;
    const unpaidCount = currentMonthPayments.length - paidCount; // Count all non-paid payments
    const totalRevenue = currentMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Calculate overall stats
    const allPayments = await TenantPayment.findAll({
      where: {
        property_id: { [Op.in]: propertyIds }
      }
    });

    const totalPaidRevenue = allPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const averagePayment = allPayments.length > 0
      ? totalPaidRevenue / allPayments.filter(p => p.status === 'paid').length
      : 0;

    const onTimePayments = allPayments.filter(p => {
      if (p.status === 'paid' && p.payment_date && p.payment_month) {
        const paymentMonth = new Date(p.payment_month);
        const paymentDate = new Date(p.payment_date);
        const dueDate = new Date(paymentMonth.getFullYear(), paymentMonth.getMonth() + 1, 5);
        return paymentDate <= dueDate;
      }
      return false;
    }).length;

    const latePayments = allPayments.filter(p => p.status === 'overdue' || p.status === 'unpaid').length;

    // Format payments for response
    const formattedPayments = payments.map(p => {
      let daysOverdue = null;
      if (p.status === 'overdue' || (p.status === 'unpaid' && new Date(p.payment_month) < new Date())) {
        const paymentMonth = new Date(p.payment_month);
        const dueDate = new Date(paymentMonth.getFullYear(), paymentMonth.getMonth() + 1, 5);
        const today = new Date();
        daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      }

      return {
        id: p.id,
        tenant: p.tenant ? {
          id: p.tenant.id,
          name: `${p.tenant.name} ${p.tenant.surname}`,
          email: p.tenant.email,
          phone: p.tenant.number
        } : null,
        property: p.property ? {
          id: p.property.id,
          name: p.property.name,
          address: p.property.address
        } : null,
        amount: parseFloat(p.amount || 0),
        paymentMonth: p.payment_month,
        paymentDate: p.payment_date,
        status: p.status,
        notes: p.notes,
        daysOverdue
      };
    });

    res.json({
      success: true,
      data: {
        currentMonth: {
          paid: paidCount,
          unpaid: unpaidCount,
          total: currentMonthPayments.length,
          revenue: parseFloat(totalRevenue.toFixed(2)),
          collectionRate: currentMonthPayments.length > 0
            ? ((paidCount / currentMonthPayments.length) * 100).toFixed(1)
            : '0'
        },
        payments: formattedPayments,
        stats: {
          totalRevenue: parseFloat(totalPaidRevenue.toFixed(2)),
          averagePayment: parseFloat(averagePayment.toFixed(2)),
          onTimePayments,
          latePayments
        }
      }
    });
  } catch (error) {
    console.error('Error fetching property manager payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments data',
      error: error.message
    });
  }
};
