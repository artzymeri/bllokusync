import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TenantService from '../../services/tenant.service';

const TenantDashboardScreen = ({ user, onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Get current year and month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await TenantService.getTenantDashboardData({ year: currentYear });
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get current month payment
  const getCurrentMonthPayment = () => {
    if (!dashboardData?.payments) return null;
    
    return dashboardData.payments.find(p => {
      const paymentDate = new Date(p.payment_month);
      return paymentDate.getMonth() + 1 === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `€${numAmount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get current month name in Albanian
  const getMonthName = () => {
    const months = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
    ];
    return `${months[currentMonth - 1]} ${currentYear}`;
  };

  const currentMonthPayment = getCurrentMonthPayment();

  const InfoCard = ({ icon, iconColor, title, value, status, statusColor }) => (
    <View style={styles.infoCard}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const QuickActionCard = ({ icon, title, description, color, onPress }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Duke ngarkuar...</Text>
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
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Mirë se vini</Text>
        <Text style={styles.welcomeTitle}>
          {user?.name} {user?.surname}
        </Text>
      </View>

      {/* Overview Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Përmbledhje</Text>
        <InfoCard
          icon="cash-outline"
          iconColor="#059669"
          title={`Pagesa për ${getMonthName()}`}
          value={currentMonthPayment ? formatCurrency(currentMonthPayment.amount) : '€0.00'}
          status={
            currentMonthPayment 
              ? currentMonthPayment.status === 'paid' 
                ? `Paguar më ${formatDate(currentMonthPayment.payment_date)}`
                : currentMonthPayment.status === 'overdue'
                ? 'E vonuar'
                : 'I papaguar'
              : 'Nuk ka të dhëna'
          }
          statusColor={
            currentMonthPayment
              ? currentMonthPayment.status === 'paid'
                ? '#059669'
                : currentMonthPayment.status === 'overdue'
                ? '#dc2626'
                : '#f59e0b'
              : '#64748b'
          }
        />
        <InfoCard
          icon="home-outline"
          iconColor="#3b82f6"
          title="Apartamenti"
          value={user?.apartment_label || 'N/A'}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veprime të Shpejta</Text>
        <QuickActionCard
          icon="alert-circle-outline"
          title="Raportet"
          description="Raporto një problem në apartamentin tuaj"
          color="#ef4444"
          onPress={() => onNavigate && onNavigate('reports')}
        />
        <QuickActionCard
          icon="cash-outline"
          title="Shiko Pagesat"
          description="Historiku i pagesave dhe detajet"
          color="#059669"
          onPress={() => onNavigate && onNavigate('payments')}
        />
        <QuickActionCard
          icon="chatbox-outline"
          title="Ankesat"
          description="Dërgo një ankesë te menaxheri"
          color="#f59e0b"
          onPress={() => onNavigate && onNavigate('complaints')}
        />
        <QuickActionCard
          icon="bulb-outline"
          title="Sugjerimet"
          description="Ndaj mendimet dhe idetë tuaja"
          color="#8b5cf6"
          onPress={() => onNavigate && onNavigate('suggestions')}
        />
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
  welcomeSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});

export default TenantDashboardScreen;
