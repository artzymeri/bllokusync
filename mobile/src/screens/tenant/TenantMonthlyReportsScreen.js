import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TenantService from '../../services/tenant.service';
import MonthlyReportPDFViewer from '../../components/MonthlyReportPDFViewer';

const TenantMonthlyReportsScreen = ({ hasAccess: initialAccess }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(initialAccess || false);
  const [reports, setReports] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);

  // Fetch monthly reports
  const fetchMonthlyReports = useCallback(async () => {
    try {
      const response = await TenantService.getTenantDashboardData({ year: selectedYear });
      if (response.success) {
        const monthlyReports = response.data?.monthlyReports || [];
        setReports(monthlyReports);
        // If we have reports, user has access
        if (monthlyReports.length > 0) {
          setHasAccess(true);
        }
      }
    } catch (error) {
      console.error('Error fetching monthly reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchMonthlyReports();
  }, [fetchMonthlyReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMonthlyReports();
  }, [fetchMonthlyReports]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') {
      return '€0.00';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '€0.00';
    }
    return `€${numAmount.toFixed(2)}`;
  };

  // Format month and year
  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    const months = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate total budget
  const totalBudget = reports.reduce((sum, report) => {
    return sum + (parseFloat(report.total_budget) || 0);
  }, 0);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setPdfModalVisible(true);
  };

  const handleClosePdfModal = () => {
    setPdfModalVisible(false);
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Duke ngarkuar raportet...</Text>
      </View>
    );
  }

  // Show access restricted message if tenant doesn't have access
  if (!hasAccess && reports.length === 0) {
    return (
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        <View style={styles.blockedAccessCard}>
          <View style={styles.blockedIconContainer}>
            <Ionicons name="lock-closed" size={64} color="#64748b" />
          </View>
          <Text style={styles.blockedTitle}>Aksesi i Kufizuar</Text>
          <Text style={styles.blockedDescription}>
            Menaxheri i pronës ka çaktivizuar aksesin në raportet mujore për këtë pronë.
          </Text>
          <Text style={styles.blockedSubtext}>
            Nëse mendoni se ky është gabim, ju lutemi kontaktoni menaxherin e pronës.
          </Text>
        </View>
      </ScrollView>
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
      {/* Header with Statistics */}
      <View style={styles.header}>
        <Text style={styles.title}>Raportet Mujore</Text>
        <Text style={styles.subtitle}>Vitin {selectedYear}</Text>
      </View>

      {reports.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="document-text" size={24} color="#059669" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Raporte Totale</Text>
              <Text style={styles.statValue}>{reports.length}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="cash" size={24} color="#3b82f6" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Buxheti Total</Text>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                {formatCurrency(totalBudget)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Reports List */}
      <View style={styles.reportsSection}>
        <Text style={styles.sectionTitle}>Raportet për {selectedYear}</Text>
        
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Asnjë raport mujor</Text>
            <Text style={styles.emptySubtext}>
              Nuk ka raporte mujore të disponueshme për vitin {selectedYear}
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              formatCurrency={formatCurrency}
              formatMonthYear={formatMonthYear}
              onViewReport={handleViewReport}
            />
          ))
        )}
      </View>

      {/* PDF Viewer Modal */}
      <MonthlyReportPDFViewer
        visible={pdfModalVisible}
        report={selectedReport}
        onClose={handleClosePdfModal}
      />
    </ScrollView>
  );
};

const ReportCard = ({ report, formatCurrency, formatMonthYear, onViewReport }) => {
  return (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => onViewReport(report)}
      activeOpacity={0.7}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportIconContainer}>
          <Ionicons name="calendar" size={24} color="#059669" />
        </View>
        <View style={styles.reportHeaderContent}>
          <Text style={styles.reportMonth}>{formatMonthYear(report.report_month)}</Text>
          <Text style={styles.reportProperty}>{report.property?.name || 'Prona'}</Text>
        </View>
        <View style={styles.viewButtonContainer}>
          <Ionicons name="eye" size={20} color="#059669" />
        </View>
      </View>

      <View style={styles.reportDivider} />

      <View style={styles.reportDetails}>
        {/* Total Budget */}
        <View style={styles.reportDetailRow}>
          <View style={styles.reportDetailLabel}>
            <Ionicons name="cash-outline" size={18} color="#64748b" />
            <Text style={styles.reportDetailText}>Buxheti Total</Text>
          </View>
          <Text style={styles.reportDetailValue}>{formatCurrency(report.total_budget)}</Text>
        </View>

        {/* Notes */}
        {report.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.reportDetailLabel}>
              <Ionicons name="document-text-outline" size={18} color="#64748b" />
              <Text style={styles.reportDetailText}>Shënime</Text>
            </View>
            <Text style={styles.notesText} numberOfLines={3}>
              {report.notes}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.viewReportFooter}>
        <Text style={styles.viewReportText}>Trokit për të parë PDF-në</Text>
        <Ionicons name="chevron-forward" size={20} color="#059669" />
      </View>
    </TouchableOpacity>
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
  centerContainer: {
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  reportsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportHeaderContent: {
    flex: 1,
  },
  reportMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  reportProperty: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  reportDetails: {
    padding: 16,
  },
  reportDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportDetailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  reportDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 8,
    marginLeft: 26,
  },
  blockedAccessCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 40,
  },
  blockedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  blockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  blockedDescription: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  blockedSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  viewButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewReportFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewReportText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});

export default TenantMonthlyReportsScreen;
