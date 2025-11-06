import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const PMDashboardScreen = ({ navigation, user }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await apiFetch('/api/property-manager-dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        // Debug logging to see what data we're receiving
        console.log('[PMDashboard] Overview data:', JSON.stringify(data.data.overview, null, 2));
        console.log('[PMDashboard] Payments data:', JSON.stringify(data.data.payments.currentMonth, null, 2));
        console.log('[PMDashboard] Total tenants:', data.data.overview.totalTenants);
        console.log('[PMDashboard] Unpaid payments:', data.data.payments.currentMonth.unpaid);
        
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen të dhënat e panelit.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Duke ngarkuar...</Text>
      </View>
    );
  }

  if (error || !dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Gabim në ngarkim</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Provo Përsëri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { overview, payments, reports, complaints, suggestions } = dashboardData;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>Mirë se vini</Text>
        {user && (
          <Text style={styles.userName}>{user.name} {user.surname}</Text>
        )}
      </View>

      {/* Main Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="business" size={24} color="#4f46e5" />
          </View>
          <Text style={styles.statValue}>{overview.totalProperties}</Text>
          <Text style={styles.statLabel}>Pronat</Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="people" size={24} color="#10b981" />
          </View>
          <Text style={styles.statValue}>{overview.totalTenants}</Text>
          <Text style={styles.statLabel}>Banorët</Text>
        </View>
      </View>

      {/* Revenue Card */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <View>
            <Text style={styles.revenueLabel}>Të Ardhurat e Muajit</Text>
            <Text style={styles.revenueAmount}>€{payments.currentMonth.revenue.toLocaleString()}</Text>
          </View>
          <View style={styles.collectionBadge}>
            <Text style={styles.collectionText}>{payments.currentMonth.collectionRate}%</Text>
          </View>
        </View>
        
        <View style={styles.paymentBreakdown}>
          <View style={styles.paymentItem}>
            <View style={[styles.paymentDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.paymentLabel}>Paguar: </Text>
            <Text style={styles.paymentValue}>{payments.currentMonth.paid}</Text>
          </View>
          <View style={styles.paymentItem}>
            <View style={[styles.paymentDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.paymentLabel}>Papaguar: </Text>
            <Text style={styles.paymentValue}>{payments.currentMonth.unpaid}</Text>
          </View>
          {payments.overdue.length > 0 && (
            <View style={styles.paymentItem}>
              <View style={[styles.paymentDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.paymentLabel}>Të vonuara: </Text>
              <Text style={styles.paymentValue}>{payments.overdue.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Alerts Section - Only show if there are urgent items */}
      {(payments.overdue.length > 0 || reports.statistics.pending > 0 || complaints.statistics.pending > 0) && (
        <View style={styles.alertsCard}>
          <View style={styles.alertsHeader}>
            <Ionicons name="notifications" size={20} color="#ef4444" />
            <Text style={styles.alertsTitle}>Vëmendje e Nevojshme</Text>
          </View>
          
          {payments.overdue.length > 0 && (
            <TouchableOpacity 
              style={styles.alertItem}
              onPress={() => navigation?.navigate && navigation.navigate('payments')}
            >
              <View style={styles.alertContent}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.alertText}>Pagesa të vonuara</Text>
              </View>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{payments.overdue.length}</Text>
              </View>
            </TouchableOpacity>
          )}

          {reports.statistics.pending > 0 && (
            <TouchableOpacity 
              style={styles.alertItem}
              onPress={() => navigation?.navigate && navigation.navigate('reports')}
            >
              <View style={styles.alertContent}>
                <Ionicons name="construct" size={20} color="#f59e0b" />
                <Text style={styles.alertText}>Raportet në pritje</Text>
              </View>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{reports.statistics.pending}</Text>
              </View>
            </TouchableOpacity>
          )}

          {complaints.statistics.pending > 0 && (
            <TouchableOpacity 
              style={styles.alertItem}
              onPress={() => navigation?.navigate && navigation.navigate('complaints')}
            >
              <View style={styles.alertContent}>
                <Ionicons name="chatbox-ellipses" size={20} color="#f59e0b" />
                <Text style={styles.alertText}>Ankesat në pritje</Text>
              </View>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{complaints.statistics.pending}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Veprime</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('properties')}
          >
            <Ionicons name="business-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Pronat</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('tenants')}
          >
            <Ionicons name="people-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Banorët</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('payments')}
          >
            <Ionicons name="cash-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Pagesat</Text>
            {payments.overdue.length > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{payments.overdue.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('monthly-reports')}
          >
            <Ionicons name="bar-chart-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Raportet Mujore</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('reports')}
          >
            <Ionicons name="document-text-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Raportet</Text>
            {reports.statistics.pending > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{reports.statistics.pending}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('complaints')}
          >
            <Ionicons name="chatbox-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Ankesat</Text>
            {complaints.statistics.pending > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{complaints.statistics.pending}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('suggestions')}
          >
            <Ionicons name="bulb-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Sugjerimet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate && navigation.navigate('configurations')}
          >
            <Ionicons name="settings-outline" size={28} color="#4f46e5" />
            <Text style={styles.actionText}>Konfigurimet</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
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
  revenueCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
  },
  collectionBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  collectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  },
  paymentBreakdown: {
    gap: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  alertsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  alertBadge: {
    backgroundColor: '#ef4444',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    position: 'relative',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
  },
  actionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default PMDashboardScreen;
