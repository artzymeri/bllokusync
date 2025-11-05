import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const TenantPaymentsScreen = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user?.id) {
      fetchPayments();
    }
  }, [user?.id, selectedYear]);

  const fetchPayments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await apiFetch(`/api/tenant-payments/tenant/${user.id}?year=${selectedYear}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  }, [user?.id, selectedYear]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#059669';
      case 'pending':
        return '#f59e0b';
      case 'overdue':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'E Paguar';
      case 'pending':
        return 'Në Pritje';
      case 'overdue':
        return 'E Vonuar';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time-outline';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const formatCurrency = (amount) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate statistics
  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    overdue: payments.filter((p) => p.status === 'overdue').length,
    totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    paidAmount: payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0),
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Duke ngarkuar pagesat...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
      }
    >
      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="calendar-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Pagesa Totale</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
          </View>
          <Text style={[styles.statValue, { color: '#059669' }]}>{stats.paid}</Text>
          <Text style={styles.statLabel}>Të Paguara</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time-outline" size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Në Pritje</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
          </View>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.overdue}</Text>
          <Text style={styles.statLabel}>Të Vonuara</Text>
        </View>
      </View>

      {/* Payments List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historiku i Pagesave - {selectedYear}</Text>
        
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Nuk ka pagesa për këtë periudhë</Text>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <View style={styles.paymentMonth}>
                      <Ionicons name="calendar" size={16} color="#64748b" />
                      <Text style={styles.paymentMonthText}>
                        {formatMonthYear(payment.payment_month)}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    {payment.payment_date && (
                      <View style={styles.paymentDateContainer}>
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={styles.paymentDate}>
                          Paguar më {formatDate(payment.payment_date)}
                        </Text>
                      </View>
                    )}
                    {payment.property && (
                      <View style={styles.propertyContainer}>
                        <Ionicons name="business-outline" size={14} color="#64748b" />
                        <Text style={styles.propertyName}>{payment.property.name}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                    <Ionicons 
                      name={getStatusIcon(payment.status)} 
                      size={14} 
                      color={getStatusColor(payment.status)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                      {getStatusText(payment.status)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  paymentsList: {
    gap: 12,
  },
  paymentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: {
    flex: 1,
    gap: 6,
  },
  paymentMonth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  paymentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentDate: {
    fontSize: 13,
    color: '#64748b',
  },
  propertyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyName: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TenantPaymentsScreen;
