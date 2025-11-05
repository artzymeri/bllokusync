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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const PMReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [properties, setProperties] = useState([]);

  // Filters
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Selection and Archive
  const [selectedIds, setSelectedIds] = useState([]);
  const [archiving, setArchiving] = useState(false);

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedProperty, selectedStatus]);

  const loadProperties = async () => {
    try {
      const response = await apiFetch('/api/properties?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProperty !== 'all') {
        params.append('property_id', selectedProperty);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await apiFetch(`/api/reports/manager?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
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
  }, [selectedProperty, selectedStatus]);

  const handleStatusUpdate = async () => {
    if (!selectedReport || !newStatus) return;

    try {
      setUpdating(true);
      const response = await apiFetch(`/api/reports/${selectedReport.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      Alert.alert('Sukses', 'Statusi i raportit u përditësua me sukses');
      setDetailModalVisible(false);
      setSelectedReport(null);
      setNewStatus('');
      fetchReports();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Gabim', 'Dështoi përditësimi i statusit');
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map(r => r.id));
    }
  };

  const handleSelectReport = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleArchiveReports = async () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      'Arkivo Raportet',
      `Jeni të sigurt që dëshironi të arkivoni ${selectedIds.length} raport(e)?`,
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Arkivo',
          style: 'destructive',
          onPress: async () => {
            try {
              setArchiving(true);
              const response = await apiFetch('/api/reports/archive', {
                method: 'POST',
                body: JSON.stringify({ ids: selectedIds }),
              });

              if (!response.ok) {
                throw new Error('Failed to archive reports');
              }

              Alert.alert('Sukses', `${selectedIds.length} raport(e) u arkivuan me sukses`);
              setSelectedIds([]);
              fetchReports();
            } catch (error) {
              console.error('Error archiving reports:', error);
              Alert.alert('Gabim', 'Dështoi arkivimi i raporteve');
            } finally {
              setArchiving(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Në pritje', color: '#f59e0b', icon: 'time-outline' },
      in_progress: { label: 'Në progres', color: '#3b82f6', icon: 'alert-circle-outline' },
      resolved: { label: 'Zgjidhur', color: '#10b981', icon: 'checkmark-circle-outline' },
      rejected: { label: 'Refuzuar', color: '#ef4444', icon: 'close-circle-outline' },
    };

    const config = statusConfig[status] || { label: status, color: '#64748b', icon: 'help-circle-outline' };

    return (
      <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const ReportCard = ({ report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      activeOpacity={0.7}
      onPress={() => {
        setSelectedReport(report);
        setNewStatus(report.status);
        setDetailModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={(e) => {
              e.stopPropagation();
              handleSelectReport(report.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[styles.checkboxInner, selectedIds.includes(report.id) && styles.checkboxChecked]}>
              {selectedIds.includes(report.id) && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.reportId}>#{report.id}</Text>
        </View>
        {getStatusBadge(report.status)}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={16} color="#64748b" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Prona:</Text>
            <Text style={styles.infoValue}>{report.property?.name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#64748b" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Banori:</Text>
            <Text style={styles.infoValue}>{report.tenant?.name} {report.tenant?.surname}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="alert-circle-outline" size={16} color="#64748b" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Problemi:</Text>
            <Text style={styles.infoValue}>{report.problemOption?.title}</Text>
          </View>
        </View>

        {report.floor !== null && (
          <View style={styles.infoRow}>
            <Ionicons name="layers-outline" size={16} color="#64748b" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Kati:</Text>
              <Text style={styles.infoValue}>Kati {report.floor}</Text>
            </View>
          </View>
        )}

        {report.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText} numberOfLines={2}>{report.description}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
          <Text style={styles.dateText}>{formatDate(report.created_at)}</Text>
          <Text style={styles.timeText}>{formatTime(report.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.topBar}>
        {reports.length > 0 && (
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
          >
            <View style={[styles.checkbox, selectedIds.length === reports.length && styles.checkboxChecked]}>
              <View style={[styles.checkboxInner, selectedIds.length === reports.length && styles.checkboxChecked]}>
                {selectedIds.length === reports.length && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </View>
            <Text style={styles.selectAllText}>
              {selectedIds.length === reports.length ? 'Çzgjidh të gjitha' : 'Zgjidh të gjitha'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color="#4f46e5" />
          <Text style={styles.filterButtonText}>Filtro</Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, selectedIds.length > 0 && { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Duke ngarkuar raportet...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Asnjë raport</Text>
            <Text style={styles.emptySubtext}>
              {selectedProperty !== 'all' || selectedStatus !== 'all'
                ? 'Provoni të rregulloni filtrat tuaj'
                : 'Raportet e banorëve do të shfaqen këtu'}
            </Text>
          </View>
        ) : (
          reports.map((report) => <ReportCard key={report.id} report={report} />)
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      {selectedIds.length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSelectedIds([])}
          >
            <Ionicons name="close-outline" size={24} color="#64748b" />
            <Text style={styles.cancelButtonText}>Anulo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingArchiveButton, archiving && styles.floatingArchiveButtonDisabled]}
            onPress={handleArchiveReports}
            disabled={archiving}
          >
            {archiving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="archive-outline" size={24} color="#fff" />
                <Text style={styles.floatingArchiveButtonText}>Arkivo ({selectedIds.length})</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
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
              <Text style={styles.filterLabel}>Prona</Text>
              <TouchableOpacity
                style={[styles.filterOption, selectedProperty === 'all' && styles.filterOptionActive]}
                onPress={() => setSelectedProperty('all')}
              >
                <Text style={[styles.filterOptionText, selectedProperty === 'all' && styles.filterOptionTextActive]}>
                  Të Gjitha Pronat
                </Text>
                {selectedProperty === 'all' && <Ionicons name="checkmark" size={20} color="#6366f1" />}
              </TouchableOpacity>
              {properties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={[styles.filterOption, selectedProperty === property.id.toString() && styles.filterOptionActive]}
                  onPress={() => setSelectedProperty(property.id.toString())}
                >
                  <Text style={[styles.filterOptionText, selectedProperty === property.id.toString() && styles.filterOptionTextActive]}>
                    {property.name}
                  </Text>
                  {selectedProperty === property.id.toString() && <Ionicons name="checkmark" size={20} color="#6366f1" />}
                </TouchableOpacity>
              ))}

              {/* Status Filter */}
              <Text style={[styles.filterLabel, { marginTop: 20 }]}>Statusi</Text>
              {[
                { value: 'all', label: 'Të Gjitha Statuset' },
                { value: 'pending', label: 'Në pritje' },
                { value: 'in_progress', label: 'Në progres' },
                { value: 'resolved', label: 'Zgjidhur' },
                { value: 'rejected', label: 'Refuzuar' },
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[styles.filterOption, selectedStatus === status.value && styles.filterOptionActive]}
                  onPress={() => setSelectedStatus(status.value)}
                >
                  <Text style={[styles.filterOptionText, selectedStatus === status.value && styles.filterOptionTextActive]}>
                    {status.label}
                  </Text>
                  {selectedStatus === status.value && <Ionicons name="checkmark" size={20} color="#6366f1" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setFilterModalVisible(false);
                  fetchReports();
                }}
              >
                <Text style={styles.applyButtonText}>Apliko Filtrat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detajet e Raportit</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>ID</Text>
                  <Text style={styles.detailValue}>#{selectedReport.id}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Prona</Text>
                  <Text style={styles.detailValue}>{selectedReport.property?.name}</Text>
                  <Text style={styles.detailSubvalue}>{selectedReport.property?.address}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Banori</Text>
                  <Text style={styles.detailValue}>
                    {selectedReport.tenant?.name} {selectedReport.tenant?.surname}
                  </Text>
                  <Text style={styles.detailSubvalue}>{selectedReport.tenant?.email}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Problemi</Text>
                  <Text style={styles.detailValue}>{selectedReport.problemOption?.title}</Text>
                </View>

                {selectedReport.floor !== null && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Kati</Text>
                    <Text style={styles.detailValue}>Kati {selectedReport.floor}</Text>
                  </View>
                )}

                {selectedReport.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Përshkrimi</Text>
                    <Text style={styles.detailValue}>{selectedReport.description}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Data</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedReport.created_at)} {formatTime(selectedReport.created_at)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Përditëso Statusin</Text>
                  {[
                    { value: 'pending', label: 'Në pritje', color: '#f59e0b' },
                    { value: 'in_progress', label: 'Në progres', color: '#3b82f6' },
                    { value: 'resolved', label: 'Zgjidhur', color: '#10b981' },
                    { value: 'rejected', label: 'Refuzuar', color: '#ef4444' },
                  ].map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.statusOption,
                        newStatus === status.value && { ...styles.statusOptionActive, borderColor: status.color },
                      ]}
                      onPress={() => setNewStatus(status.value)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          newStatus === status.value && { ...styles.statusOptionTextActive, color: status.color },
                        ]}
                      >
                        {status.label}
                      </Text>
                      {newStatus === status.value && <Ionicons name="checkmark-circle" size={20} color={status.color} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                onPress={handleStatusUpdate}
                disabled={updating || newStatus === selectedReport?.status}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updateButtonText}>Përditëso Statusin</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 4,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
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
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
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
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  filterOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#475569',
  },
  filterOptionTextActive: {
    fontWeight: '600',
    color: '#6366f1',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  applyButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  detailSubvalue: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  statusOptionActive: {
    borderWidth: 2,
    backgroundColor: '#f8fafc',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  statusOptionTextActive: {
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#6366f1',
    backgroundColor: '#4f46e5',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  floatingArchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    flex: 1,
  },
  floatingArchiveButtonDisabled: {
    opacity: 0.5,
  },
  floatingArchiveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default PMReportsScreen;
