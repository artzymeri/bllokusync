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
  getAllMyReports,
  getPropertyReports,
  deleteMonthlyReport,
  getMonthlyReportDetail,
} from '../../services/monthly-report.service';
import { getMyProperties } from '../../services/payment.service';

const PMMonthlyReportsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [properties, setProperties] = useState([]);

  // Filters
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [reportDetailModalVisible, setReportDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetailData, setReportDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const MONTHS = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedProperty, selectedYear]);

  const loadProperties = async () => {
    try {
      const props = await getMyProperties();
      setProperties(props);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);

      let reportsData;
      if (selectedProperty === 'all') {
        const response = await getAllMyReports(selectedYear);
        reportsData = response.reports || [];
      } else {
        const response = await getPropertyReports(parseInt(selectedProperty), selectedYear);
        reportsData = response.reports || [];
      }

      // Sort by month descending (newest first)
      reportsData.sort((a, b) => new Date(b.report_month) - new Date(a.report_month));

      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Gabim', 'Dështoi ngarkimi i raporteve');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [selectedProperty, selectedYear]);

  const handleViewReport = async (report) => {
    try {
      setSelectedReport(report);
      setReportDetailModalVisible(true);
      setLoadingDetail(true);

      const response = await getMonthlyReportDetail(report.id);
      setReportDetailData(response);
    } catch (error) {
      console.error('Error loading report details:', error);
      Alert.alert('Gabim', 'Dështoi ngarkimi i detajeve të raportit');
      setReportDetailModalVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteReport = (report) => {
    Alert.alert(
      'Fshi Raportin',
      `Jeni i sigurt që dëshironi të fshini raportin për ${formatMonthYear(report.report_month)}?`,
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMonthlyReport(report.id);
              Alert.alert('Sukses', 'Raporti u fshi me sukses');
              fetchReports();
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Gabim', 'Dështoi fshirja e raportit');
            }
          },
        },
      ]
    );
  };

  const formatAmount = (amount) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL');
  };

  const getCollectionRate = (report) => {
    if (report.total_tenants === 0) return '0';
    return ((report.paid_tenants / report.total_tenants) * 100).toFixed(1);
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

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtro Raportet</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Property Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Prona</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedProperty === 'all' && styles.filterOptionSelected,
                ]}
                onPress={() => setSelectedProperty('all')}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedProperty === 'all' && styles.filterOptionTextSelected,
                  ]}
                >
                  Të gjitha pronat
                </Text>
                {selectedProperty === 'all' && (
                  <Ionicons name="checkmark-circle" size={20} color="#4f46e5" />
                )}
              </TouchableOpacity>

              {properties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={[
                    styles.filterOption,
                    selectedProperty === property.id.toString() && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedProperty(property.id.toString())}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedProperty === property.id.toString() && styles.filterOptionTextSelected,
                    ]}
                  >
                    {property.name}
                  </Text>
                  {selectedProperty === property.id.toString() && (
                    <Ionicons name="checkmark-circle" size={20} color="#4f46e5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Year Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Viti</Text>
              {getAvailableYears().map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.filterOption,
                    selectedYear === year && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedYear === year && styles.filterOptionTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <Ionicons name="checkmark-circle" size={20} color="#4f46e5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={() => {
                setFilterModalVisible(false);
                fetchReports();
              }}
            >
              <Text style={styles.modalButtonPrimaryText}>Apliko</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderReportDetailModal = () => (
    <Modal
      visible={reportDetailModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setReportDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.reportDetailModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detajet e Raportit</Text>
            <TouchableOpacity onPress={() => setReportDetailModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={true}
          >
            {loadingDetail ? (
              <View style={styles.detailLoadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
              </View>
            ) : reportDetailData && selectedReport ? (
              <View style={styles.reportDetailContent}>
                {/* Header Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    {formatMonthYear(selectedReport.report_month)}
                  </Text>
                  {selectedReport.property && (
                    <View style={styles.propertyBadge}>
                      <Ionicons name="business-outline" size={14} color="#4f46e5" />
                      <Text style={styles.propertyBadgeText}>{selectedReport.property.name}</Text>
                    </View>
                  )}
                </View>

                {/* Statistics */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Statistikat</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>Buxheti Total</Text>
                      <Text style={styles.statBoxValue}>
                        {formatAmount(selectedReport.total_budget)}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>Në pritje</Text>
                      <Text style={[styles.statBoxValue, styles.statBoxValueOrange]}>
                        {formatAmount(selectedReport.pending_amount)}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>Banorë Paguar</Text>
                      <Text style={styles.statBoxValue}>
                        {selectedReport.paid_tenants} / {selectedReport.total_tenants}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxLabel}>Norma e Mbledhjes</Text>
                      <Text style={[styles.statBoxValue, styles.statBoxValueGreen]}>
                        {getCollectionRate(selectedReport)}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Spending Breakdown */}
                {selectedReport.spending_breakdown && selectedReport.spending_breakdown.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionLabel}>Alokimi i Buxhetit</Text>
                    {selectedReport.spending_breakdown.map((item, index) => (
                      <View key={index} style={styles.spendingItem}>
                        <View style={styles.spendingItemHeader}>
                          <Text style={styles.spendingItemTitle}>{item.config_title}</Text>
                          <Text style={styles.spendingItemAmount}>
                            {formatAmount(item.allocated_amount || 0)}
                          </Text>
                        </View>
                        <View style={styles.spendingItemFooter}>
                          <Text style={styles.spendingItemPercentage}>
                            {item.percentage != null ? (typeof item.percentage === 'string' ? item.percentage : item.percentage.toFixed(1)) : '0.0'}%
                          </Text>
                          {item.description && (
                            <Text style={styles.spendingItemDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Notes */}
                {selectedReport.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionLabel}>Shënime</Text>
                    <Text style={styles.notesText}>{selectedReport.notes}</Text>
                  </View>
                )}

                {/* Metadata */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Informacion</Text>
                  <View style={styles.metadataRow}>
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text style={styles.metadataText}>
                      Krijuar: {formatDate(selectedReport.created_at)}
                    </Text>
                  </View>
                  <View style={styles.metadataRow}>
                    <Ionicons name="refresh-outline" size={16} color="#64748b" />
                    <Text style={styles.metadataText}>
                      Përditësuar: {formatDate(selectedReport.updated_at)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {!loadingDetail && selectedReport && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonDanger}
                onPress={() => {
                  setReportDetailModalVisible(false);
                  handleDeleteReport(selectedReport);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonDangerText}>Fshi Raportin</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderReportCard = (report) => (
    <TouchableOpacity
      key={report.id}
      style={styles.reportCard}
      onPress={() => handleViewReport(report)}
    >
      <View style={styles.reportCardHeader}>
        <View style={styles.reportCardHeaderLeft}>
          <Text style={styles.reportMonth}>{formatMonthYear(report.report_month)}</Text>
          <View style={styles.reportCardSubInfo}>
            <Ionicons name="trending-up-outline" size={14} color="#64748b" />
            <Text style={styles.reportSubText}>
              {report.paid_tenants} nga {report.total_tenants} banorë ({getCollectionRate(report)}%)
            </Text>
          </View>
        </View>
        {report.property && (
          <View style={styles.propertyBadgeSmall}>
            <Ionicons name="business-outline" size={12} color="#4f46e5" />
            <Text style={styles.propertyBadgeTextSmall} numberOfLines={1}>
              {report.property.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.reportCardBody}>
        <View style={styles.reportAmountRow}>
          <View style={styles.reportAmountItem}>
            <Text style={styles.reportAmountLabel}>Buxheti Total</Text>
            <Text style={styles.reportAmountValue}>
              {formatAmount(report.total_budget)}
            </Text>
          </View>
          <View style={styles.reportAmountItem}>
            <Text style={styles.reportAmountLabel}>Në pritje</Text>
            <Text style={[styles.reportAmountValue, styles.reportAmountValueOrange]}>
              {formatAmount(report.pending_amount)}
            </Text>
          </View>
        </View>

        {report.spending_breakdown && report.spending_breakdown.length > 0 && (
          <View style={styles.reportSpendingPreview}>
            <Text style={styles.reportSpendingPreviewLabel}>Alokimi i Buxhetit</Text>
            <View style={styles.reportSpendingPreviewList}>
              {report.spending_breakdown.slice(0, 2).map((item, index) => (
                <View key={index} style={styles.reportSpendingPreviewItem}>
                  <Text style={styles.reportSpendingPreviewItemTitle} numberOfLines={1}>
                    {item.config_title}
                  </Text>
                  <Text style={styles.reportSpendingPreviewItemAmount}>
                    {formatAmount(item.allocated_amount || 0)}
                  </Text>
                </View>
              ))}
              {report.spending_breakdown.length > 2 && (
                <Text style={styles.reportSpendingMoreText}>
                  +{report.spending_breakdown.length - 2} më shumë...
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.reportCardFooter}>
        <TouchableOpacity
          style={styles.reportCardButton}
          onPress={() => handleViewReport(report)}
        >
          <Ionicons name="eye-outline" size={16} color="#4f46e5" />
          <Text style={styles.reportCardButtonText}>Shiko</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportCardButton}
          onPress={() => handleDeleteReport(report)}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={[styles.reportCardButtonText, styles.reportCardButtonTextDanger]}>
            Fshi
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Duke ngarkuar raportet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Raportet Mujore</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color="#4f46e5" />
            <Text style={styles.filterButtonText}>Filtro</Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters Summary */}
        {(selectedProperty !== 'all' || selectedYear !== new Date().getFullYear()) && (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersText}>
              Filtrat aktiv:{' '}
              {selectedProperty !== 'all' &&
                properties.find((p) => p.id.toString() === selectedProperty)?.name}
              {selectedProperty !== 'all' && selectedYear !== new Date().getFullYear() && ', '}
              {selectedYear !== new Date().getFullYear() && `${selectedYear}`}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedProperty('all');
                setSelectedYear(new Date().getFullYear());
              }}
            >
              <Text style={styles.clearFiltersText}>Pastro</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Asnjë raport mujor</Text>
            <Text style={styles.emptySubtext}>
              Nuk ka raporte të gjeneruara për filtrat e zgjedhur
            </Text>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {reports.map((report) => renderReportCard(report))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderFilterModal()}
      {renderReportDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
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
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  activeFiltersText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  reportCardHeaderLeft: {
    flex: 1,
  },
  reportMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  reportCardSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportSubText: {
    fontSize: 12,
    color: '#64748b',
  },
  propertyBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    maxWidth: 120,
  },
  propertyBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4f46e5',
  },
  reportCardBody: {
    marginBottom: 12,
  },
  reportAmountRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportAmountItem: {
    flex: 1,
  },
  reportAmountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  reportAmountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  reportAmountValueOrange: {
    color: '#ea580c',
  },
  reportSpendingPreview: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reportSpendingPreviewLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  reportSpendingPreviewList: {
    gap: 6,
  },
  reportSpendingPreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportSpendingPreviewItemTitle: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  reportSpendingPreviewItemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  reportSpendingMoreText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  reportCardFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reportCardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reportCardButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  reportCardButtonTextDanger: {
    color: '#ef4444',
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
    maxHeight: '80%',
  },
  reportDetailModal: {
    maxHeight: '95%',
    height: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  detailLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#4f46e5',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#475569',
  },
  filterOptionTextSelected: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  modalButtonPrimary: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
  },
  modalButtonDangerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Report Detail Styles
  reportDetailContent: {
    gap: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  detailSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  propertyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  statBoxValueOrange: {
    color: '#ea580c',
  },
  statBoxValueGreen: {
    color: '#10b981',
  },
  spendingItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  spendingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  spendingItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  spendingItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4f46e5',
    marginLeft: 8,
  },
  spendingItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spendingItemPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  spendingItemDescription: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 13,
    color: '#64748b',
  },
});

export default PMMonthlyReportsScreen;

