import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getPropertyManagerPayments,
  getPaymentStatistics,
  updatePaymentStatus,
  bulkUpdatePayments,
  ensurePaymentRecords,
  updatePaymentDate,
  getTenantsForProperty,
  getMyProperties,
} from '../../services/payment.service';

const PMPaymentsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [properties, setProperties] = useState([]);

  // Filters
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Bulk mark modal
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkModalLoading, setBulkModalLoading] = useState(false);
  const [selectedDialogProperty, setSelectedDialogProperty] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantIds, setSelectedTenantIds] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [existingPayments, setExistingPayments] = useState([]);

  // Payment detail modal
  const [paymentDetailModalVisible, setPaymentDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Edit date modal
  const [editDateModalVisible, setEditDateModalVisible] = useState(false);
  const [editPaymentDate, setEditPaymentDate] = useState('');

  // Expanded months state - track which months are expanded
  const [expandedMonths, setExpandedMonths] = useState({});

  // Property selector modal
  const [propertySelectorVisible, setPropertySelectorVisible] = useState(false);

  const MONTHS = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedProperty, selectedStatus, selectedYear]);

  useEffect(() => {
    if (selectedMonths.length > 0 && selectedDialogProperty) {
      fetchExistingPaymentsForMonth();
    }
  }, [selectedMonths, selectedDialogProperty, selectedYear]);

  // Add new useEffect to fetch existing payments when property is selected initially
  useEffect(() => {
    if (selectedDialogProperty && tenants.length > 0) {
      // Fetch existing payments for all months to show status initially
      fetchAllPaymentsForProperty();
    }
  }, [selectedDialogProperty, tenants, selectedYear]);

  const loadProperties = async () => {
    try {
      const props = await getMyProperties();
      setProperties(props);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const filters = { year: selectedYear };
      if (selectedProperty !== 'all') {
        filters.property_id = parseInt(selectedProperty);
      }
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      const [paymentsData, statsData] = await Promise.all([
        getPropertyManagerPayments(filters),
        getPaymentStatistics(
          selectedProperty !== 'all'
            ? { property_id: parseInt(selectedProperty), year: selectedYear }
            : { year: selectedYear }
        ),
      ]);

      setPayments(paymentsData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      Alert.alert('Gabim', 'Dështoi ngarkimi i të dhënave të pagesave');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [selectedProperty, selectedStatus, selectedYear]);

  const fetchTenantsForProperty = async (propertyId) => {
    if (!propertyId) return;

    try {
      setTenantsLoading(true);
      const tenantsData = await getTenantsForProperty(propertyId);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      Alert.alert('Gabim', 'Dështoi ngarkimi i banorëve');
    } finally {
      setTenantsLoading(false);
    }
  };

  const fetchExistingPaymentsForMonth = async () => {
    if (selectedMonths.length === 0 || !selectedDialogProperty) return;

    try {
      setBulkModalLoading(true);

      const propertyId = parseInt(selectedDialogProperty);
      const paymentsData = await getPropertyManagerPayments({
        property_id: propertyId,
        month: selectedMonths,
        year: selectedYear,
      });

      setExistingPayments(paymentsData);

      setSelectedTenantIds(prevSelected =>
        prevSelected.filter(id => !paymentsData.some(p => p.tenant_id === id && p.status === 'paid'))
      );
    } catch (error) {
      console.error('Error fetching existing payments:', error);
    } finally {
      setBulkModalLoading(false);
    }
  };

  // New function to fetch all payments for the property to show initial status
  const fetchAllPaymentsForProperty = async () => {
    if (!selectedDialogProperty) return;

    try {
      const propertyId = parseInt(selectedDialogProperty);
      const paymentsData = await getPropertyManagerPayments({
        property_id: propertyId,
        year: selectedYear,
      });

      setExistingPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching all payments for property:', error);
    }
  };

  const handleDialogPropertyChange = (propertyId) => {
    setSelectedDialogProperty(propertyId);
    setSelectedTenantIds([]);
    setTenants([]);
    setSelectedMonths([]);
    setExistingPayments([]);

    if (propertyId) {
      fetchTenantsForProperty(propertyId);
    }
  };

  const handleTenantToggle = (tenantId) => {
    setSelectedTenantIds(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSelectAllTenants = () => {
    if (selectedTenantIds.length === tenants.length) {
      setSelectedTenantIds([]);
    } else {
      setSelectedTenantIds(tenants.map(t => t.id));
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedMonths.length === 0 || !selectedDialogProperty || selectedTenantIds.length === 0) {
      Alert.alert('Gabim', 'Ju lutem zgjidhni muajin, pronën dhe të paktën një banorë');
      return;
    }

    try {
      setBulkModalLoading(true);

      const propertyId = parseInt(selectedDialogProperty);

      const ensureResult = await ensurePaymentRecords(
        selectedTenantIds,
        propertyId,
        selectedYear,
        selectedMonths
      );

      if (ensureResult.errors && ensureResult.errors.length > 0) {
        console.error('Errors creating payment records:', ensureResult.errors);
        ensureResult.errors.forEach((err) => {
          Alert.alert('Gabim', `Banori ${err.tenant_id}: ${err.error}`);
        });
      }

      const paymentIds = ensureResult.payments.map(p => p.id);

      if (paymentIds.length === 0) {
        Alert.alert('Gabim', 'Nuk mund të krijohen regjistrime pagese');
        return;
      }

      await bulkUpdatePayments(paymentIds, 'paid');

      Alert.alert('Sukses', `U shënuan me sukses ${paymentIds.length} pagesë(a) si të paguar!`);

      setBulkModalVisible(false);
      setSelectedMonths([]);
      setSelectedDialogProperty('');
      setSelectedTenantIds([]);
      setTenants([]);
      fetchData();
    } catch (error) {
      console.error('Error marking payments:', error);
      Alert.alert('Gabim', error.message || 'Dështoi shënimi i pagesave si të paguara');
    } finally {
      setBulkModalLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (paymentId, newStatus) => {
    try {
      await updatePaymentStatus(paymentId, newStatus);
      Alert.alert('Sukses', 'Statusi i pagesës u përditësua');
      setPaymentDetailModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Gabim', 'Dështoi përditësimi i pagesës');
    }
  };

  const handleEditPaymentDate = async () => {
    if (!selectedPayment || !editPaymentDate) return;

    try {
      await updatePaymentDate(selectedPayment.id, editPaymentDate);
      Alert.alert('Sukses', 'Data e pagesës u përditësua');
      setEditDateModalVisible(false);
      setSelectedPayment(null);
      setEditPaymentDate('');
      fetchData();
    } catch (error) {
      console.error('Error updating payment date:', error);
      Alert.alert('Gabim', 'Dështoi përditësimi i datës së pagesës');
    }
  };

  const formatAmount = (amount) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const groupPaymentsByMonth = () => {
    const grouped = {};

    for (let i = 0; i < 12; i++) {
      grouped[i] = [];
    }

    payments.forEach((payment) => {
      const [year, month] = payment.payment_month.split('-').map(Number);
      const monthIndex = month - 1;
      grouped[monthIndex].push(payment);
    });

    return grouped;
  };

  const getMonthStatistics = (monthPayments) => {
    const total = monthPayments.length;
    const paid = monthPayments.filter(p => p.status === 'paid').length;
    const pending = monthPayments.filter(p => p.status === 'pending').length;
    const overdue = monthPayments.filter(p => p.status === 'overdue').length;

    const totalAmount = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const paidAmount = monthPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return { total, paid, pending, overdue, totalAmount, paidAmount };
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'paid':
        return styles.statusBadgePaid;
      case 'pending':
        return styles.statusBadgePending;
      case 'overdue':
        return styles.statusBadgeOverdue;
      default:
        return styles.statusBadgeDefault;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paguar';
      case 'pending':
        return 'Në pritje';
      case 'overdue':
        return 'Vonuar';
      default:
        return status;
    }
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 2; i >= 1; i--) {
      years.push(currentYear + i);
    }
    years.push(currentYear);
    for (let i = 1; i <= 2; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  const toggleMonth = (monthIndex) => {
    setSelectedMonths(prev =>
      prev.includes(monthIndex)
        ? prev.filter(m => m !== monthIndex)
        : [...prev, monthIndex]
    );
  };

  const toggleMonthExpanded = (monthIndex) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthIndex]: !prev[monthIndex]
    }));
  };

  const renderStatisticsCards = () => {
    if (!statistics) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardTotal]}>
            <Ionicons name="cash-outline" size={20} color="#4f46e5" />
            <Text style={styles.statValue}>{statistics.total}</Text>
            <Text style={styles.statLabel}>Totali</Text>
            <Text style={styles.statAmount}>{formatAmount(statistics.totalAmount)}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardPaid]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
            <Text style={styles.statValue}>{statistics.paid}</Text>
            <Text style={styles.statLabel}>Paguar</Text>
            <Text style={styles.statAmount}>{formatAmount(statistics.paidAmount)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPending]}>
            <Ionicons name="time-outline" size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{statistics.pending}</Text>
            <Text style={styles.statLabel}>Në pritje</Text>
            <Text style={styles.statAmount}>{formatAmount(statistics.pendingAmount)}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardOverdue]}>
            <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
            <Text style={styles.statValue}>{statistics.overdue}</Text>
            <Text style={styles.statLabel}>Vonuar</Text>
            <Text style={styles.statAmount}>{formatAmount(statistics.overdueAmount)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentCard = (payment) => (
    <TouchableOpacity
      key={payment.id}
      style={styles.paymentCard}
      onPress={() => {
        setSelectedPayment(payment);
        setPaymentDetailModalVisible(true);
      }}
    >
      <View style={styles.paymentCardHeader}>
        <View style={styles.paymentCardInfo}>
          <Text style={styles.paymentTenantName} numberOfLines={1}>
            {payment.tenant?.name} {payment.tenant?.surname}
          </Text>
          {payment.tenant?.apartment_label && (
            <Text style={styles.paymentApartment} numberOfLines={1}>
              {payment.tenant.apartment_label}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(payment.status)]}>
          <Ionicons name={getStatusIcon(payment.status)} size={14} color="#fff" />
          <Text style={styles.statusBadgeText}>{getStatusText(payment.status)}</Text>
        </View>
      </View>

      <View style={styles.paymentCardDetails}>
        <View style={styles.paymentDetailRow}>
          <Ionicons name="cash-outline" size={16} color="#64748b" />
          <Text style={styles.paymentDetailText}>{formatAmount(payment.amount)}</Text>
        </View>
        {payment.payment_date && (
          <View style={styles.paymentDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.paymentDetailText}>{formatDate(payment.payment_date)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMonthSection = (monthIndex, monthPayments) => {
    const monthStats = getMonthStatistics(monthPayments);
    const hasPayments = monthPayments.length > 0;
    const expanded = expandedMonths[monthIndex] || false;

    return (
      <View key={monthIndex} style={styles.monthSection}>
        <TouchableOpacity
          style={styles.monthHeader}
          onPress={() => toggleMonthExpanded(monthIndex)}
          activeOpacity={0.7}
        >
          <View style={styles.monthHeaderLeft}>
            <Text style={styles.monthTitle}>
              {MONTHS[monthIndex]} {selectedYear}
            </Text>
            {hasPayments && (
              <View style={styles.monthBadges}>
                <View style={[styles.monthBadge, styles.monthBadgePaid]}>
                  <Text style={styles.monthBadgeText}>{monthStats.paid} Paguar</Text>
                </View>
                {monthStats.pending > 0 && (
                  <View style={[styles.monthBadge, styles.monthBadgePending]}>
                    <Text style={styles.monthBadgeText}>{monthStats.pending} Në pritje</Text>
                  </View>
                )}
                {monthStats.overdue > 0 && (
                  <View style={[styles.monthBadge, styles.monthBadgeOverdue]}>
                    <Text style={styles.monthBadgeText}>{monthStats.overdue} Vonuar</Text>
                  </View>
                )}
              </View>
            )}
            {!hasPayments && (
              <Text style={styles.noPaymentsText}>Nuk ka pagesa</Text>
            )}
          </View>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#64748b"
          />
        </TouchableOpacity>

        {expanded && hasPayments && (
          <View style={styles.monthPayments}>
            {monthPayments.map(payment => renderPaymentCard(payment))}
          </View>
        )}
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtro Pagesat</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Year Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Viti</Text>
              <View style={styles.filterOptions}>
                {getAvailableYears().map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.filterOption,
                      selectedYear === year && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedYear === year && styles.filterOptionTextActive
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Property Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Prona</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  styles.filterOptionFull,
                  selectedProperty === 'all' && styles.filterOptionActive
                ]}
                onPress={() => setSelectedProperty('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedProperty === 'all' && styles.filterOptionTextActive
                ]}>
                  Të Gjitha Pronat
                </Text>
              </TouchableOpacity>
              {properties.map(property => (
                <TouchableOpacity
                  key={property.id}
                  style={[
                    styles.filterOption,
                    styles.filterOptionFull,
                    selectedProperty === property.id.toString() && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedProperty(property.id.toString())}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedProperty === property.id.toString() && styles.filterOptionTextActive
                  ]} numberOfLines={1}>
                    {property.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Statusi</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'all', label: 'Të Gjitha' },
                  { value: 'paid', label: 'Paguar' },
                  { value: 'pending', label: 'Në pritje' },
                  { value: 'overdue', label: 'Vonuar' },
                ].map(status => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.filterOption,
                      selectedStatus === status.value && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedStatus(status.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedStatus === status.value && styles.filterOptionTextActive
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={() => {
                setFilterModalVisible(false);
                fetchData();
              }}
            >
              <Text style={styles.modalButtonPrimaryText}>Apliko Filtrat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBulkMarkModal = () => (
    <Modal
      visible={bulkModalVisible && !propertySelectorVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setBulkModalVisible(false);
        // Reset state to prevent scroll lock
        setSelectedDialogProperty('');
        setSelectedMonths([]);
        setSelectedTenantIds([]);
        setTenants([]);
      }}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          setBulkModalVisible(false);
          setSelectedDialogProperty('');
          setSelectedMonths([]);
          setSelectedTenantIds([]);
          setTenants([]);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Shëno Pagesat si të Paguara</Text>
            <TouchableOpacity onPress={() => setBulkModalVisible(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Property Selection */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Zgjidhni Pronën</Text>
              <TouchableOpacity
                style={styles.propertySelector}
                onPress={() => setPropertySelectorVisible(true)}
              >
                <Ionicons name="business-outline" size={18} color="#64748b" />
                <Text style={[
                  styles.propertySelectorText,
                  !selectedDialogProperty && styles.propertySelectorPlaceholder
                ]}>
                  {selectedDialogProperty 
                    ? properties.find(p => p.id.toString() === selectedDialogProperty)?.name 
                    : 'Zgjidhni pronën'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Month Selection */}
            {selectedDialogProperty && tenants.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Zgjidhni Muajt</Text>
                {MONTHS.map((month, index) => {
                  const monthPayments = existingPayments.filter(p => {
                    const [year, monthNum] = p.payment_month.split('-').map(Number);
                    return monthNum - 1 === index && p.status === 'paid';
                  });

                  const paidTenantIds = new Set(monthPayments.map(p => p.tenant_id));
                  const allTenantsPaid = tenants.every(t => paidTenantIds.has(t.id));
                  const someTenantsPaid = monthPayments.length > 0;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.monthOption,
                        selectedMonths.includes(index) && styles.monthOptionActive,
                        allTenantsPaid && styles.monthOptionDisabled
                      ]}
                      onPress={() => !allTenantsPaid && toggleMonth(index)}
                      disabled={allTenantsPaid}
                    >
                      <View style={styles.monthOptionLeft}>
                        <View style={[
                          styles.checkbox,
                          selectedMonths.includes(index) && styles.checkboxActive
                        ]}>
                          {selectedMonths.includes(index) && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <View>
                          <Text style={[
                            styles.monthOptionText,
                            allTenantsPaid && styles.monthOptionTextDisabled
                          ]}>
                            {month} {selectedYear}
                          </Text>
                          {allTenantsPaid ? (
                            <Text style={styles.monthOptionSubtext}>
                              ✓ Të gjithë kanë paguar ({tenants.length}/{tenants.length})
                            </Text>
                          ) : someTenantsPaid ? (
                            <Text style={styles.monthOptionSubtextWarning}>
                              {paidTenantIds.size}/{tenants.length} kanë paguar
                            </Text>
                          ) : (
                            <Text style={styles.monthOptionSubtext}>
                              0/{tenants.length} kanë paguar
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Tenant Selection */}
            {selectedDialogProperty && selectedMonths.length > 0 && (
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.filterLabel}>Zgjidhni Banorët</Text>
                  {tenants.length > 0 && (
                    <TouchableOpacity onPress={handleSelectAllTenants}>
                      <Text style={styles.selectAllText}>
                        {selectedTenantIds.length === tenants.length ? 'Çzgjidh të Gjithë' : 'Zgjidh të Gjithë'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {tenantsLoading ? (
                  <ActivityIndicator size="small" color="#4f46e5" style={styles.loader} />
                ) : tenants.length === 0 ? (
                  <Text style={styles.emptyText}>Nuk u gjetën banorë</Text>
                ) : (
                  tenants.map(tenant => {
                    const hasMonthlyRate = tenant.monthly_rate && tenant.monthly_rate > 0;

                    const paidMonths = selectedMonths.filter(monthIndex => {
                      return existingPayments.some(payment => {
                        const [year, month] = payment.payment_month.split('-').map(Number);
                        return payment.tenant_id === tenant.id &&
                          payment.status === 'paid' &&
                          month - 1 === monthIndex;
                      });
                    });

                    const alreadyPaidAllMonths = paidMonths.length === selectedMonths.length;
                    const isDisabled = !hasMonthlyRate || alreadyPaidAllMonths;

                    return (
                      <TouchableOpacity
                        key={tenant.id}
                        style={[
                          styles.tenantOption,
                          selectedTenantIds.includes(tenant.id) && styles.tenantOptionActive,
                          isDisabled && styles.tenantOptionDisabled
                        ]}
                        onPress={() => !isDisabled && handleTenantToggle(tenant.id)}
                        disabled={isDisabled}
                      >
                        <View style={[
                          styles.checkbox,
                          selectedTenantIds.includes(tenant.id) && styles.checkboxActive
                        ]}>
                          {selectedTenantIds.includes(tenant.id) && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <View style={styles.tenantOptionInfo}>
                          <Text style={[
                            styles.tenantOptionName,
                            isDisabled && styles.tenantOptionNameDisabled
                          ]}>
                            {tenant.name} {tenant.surname}
                          </Text>
                          <Text style={styles.tenantOptionEmail}>{tenant.email}</Text>
                          {!hasMonthlyRate ? (
                            <Text style={styles.tenantWarning}>⚠ Nuk ka tarifë mujore</Text>
                          ) : alreadyPaidAllMonths ? (
                            <Text style={styles.tenantSuccess}>✓ Ka paguar për të gjithë muajt</Text>
                          ) : paidMonths.length > 0 ? (
                            <Text style={styles.tenantPartial}>
                              Ka paguar {paidMonths.length}/{selectedMonths.length} muaj
                            </Text>
                          ) : (
                            <Text style={styles.tenantRate}>Tarifa: {formatAmount(tenant.monthly_rate)}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* Summary */}
            {selectedTenantIds.length > 0 && selectedMonths.length > 0 && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  Zgjedhur: {selectedTenantIds.length} banorë për {selectedMonths.length} muaj
                </Text>
                <Text style={styles.summarySubtext}>
                  Muajt: {selectedMonths.map(m => MONTHS[m]).join(', ')}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setBulkModalVisible(false)}
              disabled={bulkModalLoading}
            >
              <Text style={styles.modalButtonSecondaryText}>Anulo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButtonPrimary,
                (bulkModalLoading || selectedMonths.length === 0 || !selectedDialogProperty || selectedTenantIds.length === 0) && styles.modalButtonDisabled
              ]}
              onPress={handleBulkMarkAsPaid}
              disabled={bulkModalLoading || selectedMonths.length === 0 || !selectedDialogProperty || selectedTenantIds.length === 0}
            >
              {bulkModalLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonPrimaryText}>
                  Shëno {selectedTenantIds.length} si të Paguar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderPaymentDetailModal = () => (
    <Modal
      visible={paymentDetailModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setPaymentDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detajet e Pagesës</Text>
            <TouchableOpacity onPress={() => setPaymentDetailModalVisible(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {selectedPayment && (
            <View style={styles.modalBody}>
              <View style={styles.paymentDetailSection}>
                <Text style={styles.paymentDetailLabel}>Banori</Text>
                <Text style={styles.paymentDetailValue}>
                  {selectedPayment.tenant?.name} {selectedPayment.tenant?.surname}
                </Text>
              </View>

              <View style={styles.paymentDetailSection}>
                <Text style={styles.paymentDetailLabel}>Prona</Text>
                <Text style={styles.paymentDetailValue}>
                  {selectedPayment.property?.name}
                </Text>
              </View>

              <View style={styles.paymentDetailSection}>
                <Text style={styles.paymentDetailLabel}>Muaji</Text>
                <Text style={styles.paymentDetailValue}>
                  {MONTHS[new Date(selectedPayment.payment_month).getMonth()]} {new Date(selectedPayment.payment_month).getFullYear()}
                </Text>
              </View>

              <View style={styles.paymentDetailSection}>
                <Text style={styles.paymentDetailLabel}>Statusi</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(selectedPayment.status)]}>
                  <Ionicons name={getStatusIcon(selectedPayment.status)} size={14} color="#fff" />
                  <Text style={styles.statusBadgeText}>{getStatusText(selectedPayment.status)}</Text>
                </View>
              </View>

              <View style={styles.paymentDetailSection}>
                <Text style={styles.paymentDetailLabel}>Shuma</Text>
                <Text style={styles.paymentDetailValueAmount}>
                  {formatAmount(selectedPayment.amount)}
                </Text>
              </View>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSuccess]}
                  onPress={() => handleQuickStatusUpdate(selectedPayment.id, 'paid')}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Shëno si të Paguar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonWarning]}
                  onPress={() => handleQuickStatusUpdate(selectedPayment.id, 'pending')}
                >
                  <Ionicons name="time" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Shëno si në Pritje</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderEditDateModal = () => (
    <Modal
      visible={editDateModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditDateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ndrysho Datën e Pagesës</Text>
            <TouchableOpacity onPress={() => setEditDateModalVisible(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.paymentDetailSection}>
              <Text style={styles.paymentDetailLabel}>Banori</Text>
              <Text style={styles.paymentDetailValue}>
                {selectedPayment?.tenant?.name} {selectedPayment?.tenant?.surname}
              </Text>
            </View>

            <View style={styles.paymentDetailSection}>
              <Text style={styles.paymentDetailLabel}>Muaji</Text>
              <Text style={styles.paymentDetailValue}>
                {MONTHS[new Date(selectedPayment?.payment_month).getMonth()]} {new Date(selectedPayment?.payment_month).getFullYear()}
              </Text>
            </View>

            <View style={styles.paymentDetailSection}>
              <Text style={styles.paymentDetailLabel}>Data e Re</Text>
              <TextInput
                style={styles.input}
                value={editPaymentDate}
                onChangeText={setEditPaymentDate}
                placeholder="Shkruani datën e re (YYYY-MM-DD)"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handleEditPaymentDate}
              >
                <Ionicons name="save" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Ruaj Ndryshimet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPropertySelectorModal = () => (
    <Modal
      visible={propertySelectorVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setPropertySelectorVisible(false)}
    >
      <TouchableOpacity
        style={styles.propertySelectorModalOverlay}
        activeOpacity={1}
        onPress={() => setPropertySelectorVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.propertySheetContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Zgjidhni Pronën</Text>
            <TouchableOpacity onPress={() => setPropertySelectorVisible(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.propertySheetList}>
            {properties.length === 0 ? (
              <View style={styles.emptyPropertiesContainer}>
                <Ionicons name="business-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyPropertiesText}>Asnjë pronë e disponueshme</Text>
              </View>
            ) : (
              properties.map((property, index) => (
                <TouchableOpacity
                  key={property.id}
                  style={[
                    styles.propertySheetItem,
                    selectedDialogProperty === property.id.toString() && styles.propertySheetItemSelected,
                    index === properties.length - 1 && styles.propertySheetItemLast
                  ]}
                  onPress={() => {
                    handleDialogPropertyChange(property.id.toString());
                    setPropertySelectorVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.propertyItemContent}>
                    <View style={[
                      styles.propertyItemIcon,
                      selectedDialogProperty === property.id.toString() && styles.propertyItemIconSelected
                    ]}>
                      <Ionicons
                        name="business"
                        size={16}
                        color={selectedDialogProperty === property.id.toString() ? '#ffffff' : '#64748b'}
                      />
                    </View>
                    <View style={styles.propertyItemTextContainer}>
                      <Text style={[
                        styles.propertySheetItemText,
                        selectedDialogProperty === property.id.toString() && styles.propertySheetItemTextSelected
                      ]}>
                        {property.name}
                      </Text>
                      {property.address && (
                        <Text style={styles.propertySheetItemAddress}>{property.address}</Text>
                      )}
                    </View>
                  </View>
                  {selectedDialogProperty === property.id.toString() && (
                    <Ionicons name="checkmark-circle" size={24} color="#4f46e5" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const groupedPayments = groupPaymentsByMonth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Duke ngarkuar pagesat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Actions */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setBulkModalVisible(true)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.headerButtonText}>Shëno Pagesat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButtonSecondary}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options" size={20} color="#4f46e5" />
            <Text style={styles.headerButtonSecondaryText}>Filtro</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
      >
        {/* Statistics */}
        {renderStatisticsCards()}

        {/* Payments by Month */}
        <View style={styles.paymentsContainer}>
          <Text style={styles.sectionTitle}>Historiku i Pagesave - {selectedYear}</Text>
          {Object.entries(groupedPayments)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([monthIndex, monthPayments]) =>
              renderMonthSection(parseInt(monthIndex), monthPayments)
            )}
        </View>
      </ScrollView>

      {/* Modals */}
      {renderFilterModal()}
      {renderBulkMarkModal()}
      {renderPaymentDetailModal()}
      {renderEditDateModal()}
      {renderPropertySelectorModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f46e5',
    gap: 6,
  },
  headerButtonSecondaryText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statAmount: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  paymentsContainer: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  monthSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthHeaderLeft: {
    flex: 1,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  monthBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  monthBadgePaid: {
    backgroundColor: '#dcfce7',
  },
  monthBadgePending: {
    backgroundColor: '#fef3c7',
  },
  monthBadgeOverdue: {
    backgroundColor: '#fee2e2',
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1e293b',
  },
  noPaymentsText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  monthPayments: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  paymentCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  paymentCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  paymentTenantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentApartment: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgePaid: {
    backgroundColor: '#10b981',
  },
  statusBadgePending: {
    backgroundColor: '#f59e0b',
  },
  statusBadgeOverdue: {
    backgroundColor: '#ef4444',
  },
  statusBadgeDefault: {
    backgroundColor: '#64748b',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
 color: '#fff',
  },
  paymentCardDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentDetailText: {
    fontSize: 12,
    color: '#64748b',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.9,
    paddingBottom: 20,
  },
  modalContentSmall: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtonSecondaryText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  filterOptionFull: {
    width: '100%',
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  monthOptionActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#4f46e5',
  },
  monthOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#f8fafc',
  },
  monthOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  monthOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  monthOptionTextDisabled: {
    color: '#94a3b8',
  },
  monthOptionSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  monthOptionSubtextWarning: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectAllText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '600',
  },
  tenantOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginBottom: 8,
    gap: 12,
  },
  tenantOptionActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#4f46e5',
  },
  tenantOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#f8fafc',
  },
  tenantOptionInfo: {
    flex: 1,
  },
  tenantOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  tenantOptionNameDisabled: {
    color: '#94a3b8',
  },
  tenantOptionEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  tenantWarning: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  tenantSuccess: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '500',
  },
  tenantPartial: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 4,
  },
  tenantRate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    marginVertical: 20,
  },
  paymentDetailSection: {
    marginBottom: 16,
  },
  paymentDetailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  paymentDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentDetailSubvalue: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  paymentDetailValueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4f46e5',
  },
  actionButtonsContainer: {
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonSuccess: {
    backgroundColor: '#10b981',
  },
  actionButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  actionButtonPrimary: {
    backgroundColor: '#4f46e5',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  // Property Selector Styles
  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 10,
  },
  propertySelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '400',
  },
  propertySelectorPlaceholder: {
    color: '#94a3b8',
  },
  propertySelectorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  propertySheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  propertySheetHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    position: 'relative',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    marginBottom: 16,
  },
  propertySheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  sheetCloseButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    padding: 4,
  },
  propertySheetList: {
    maxHeight: 400,
  },
  propertyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  propertyItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyItemIconSelected: {
    backgroundColor: '#4f46e5',
  },
  propertyItemTextContainer: {
    flex: 1,
  },
  propertySheetItemText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1e293b',
  },
  propertySheetItemTextSelected: {
    fontWeight: '700',
  },
  propertySheetItemAddress: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  propertySheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertySheetItemSelected: {
    backgroundColor: '#f8fafc',
  },
  propertySheetItemLast: {
    borderBottomWidth: 0,
  },
  emptyPropertiesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyPropertiesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default PMPaymentsScreen;

