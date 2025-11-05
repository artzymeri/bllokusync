import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const TenantReportProblemScreen = ({ user }) => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myReports, setMyReports] = useState([]);
  
  // Modal states
  const [problemModalVisible, setProblemModalVisible] = useState(false);
  const [floorModalVisible, setFloorModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchProblemOptions(), fetchMyReports()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemOptions = async () => {
    try {
      const response = await apiFetch('/api/reports/problem-options');
      
      if (!response.ok) {
        throw new Error('Failed to fetch problem options');
      }

      const data = await response.json();
      setProperties(data.properties || []);
      if (data.properties && data.properties.length > 0) {
        setSelectedProperty(data.properties[0]);
      }
    } catch (error) {
      console.error('Error fetching problem options:', error);
      Alert.alert('Gabim', 'Nuk u arrit të ngarkohen opsionet e problemeve');
    }
  };

  const fetchMyReports = async () => {
    try {
      const response = await apiFetch('/api/reports/my-reports');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      // Filter out archived reports
      const nonArchivedReports = (data.reports || []).filter(
        report => !report.archived || report.archived === false
      );
      setMyReports(nonArchivedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const generateFloorOptions = () => {
    if (!selectedProperty || selectedProperty.floors_from === null || selectedProperty.floors_to === null) {
      return [];
    }

    const floors = [];
    for (let i = selectedProperty.floors_from; i <= selectedProperty.floors_to; i++) {
      floors.push(i);
    }
    return floors;
  };

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem);
    setProblemModalVisible(false);
  };

  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
    setFloorModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!selectedProperty || !selectedProblem) {
      Alert.alert('Gabim', 'Ju lutem zgjidhni një pronë dhe llojin e problemit');
      return;
    }

    Alert.alert(
      'Konfirmo',
      'A jeni i sigurt që dëshironi të raportoni këtë problem?',
      [
        {
          text: 'Anulo',
          style: 'cancel',
        },
        {
          text: 'Dërgo',
          onPress: async () => {
            setSubmitting(true);

            try {
              const response = await apiFetch('/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                  property_id: selectedProperty.id,
                  problem_option_id: selectedProblem.id,
                  floor: selectedFloor,
                  description: null,
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Sukses', 'Problemi u raportua me sukses!');
                setSelectedProblem(null);
                setSelectedFloor(null);
                await fetchMyReports();
              } else {
                Alert.alert('Gabim', data.message || 'Gabim në dërgimin e raportit');
              }
            } catch (error) {
              console.error('Error submitting report:', error);
              Alert.alert('Gabim', 'Gabim në dërgimin e raportit');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { color: '#f59e0b', icon: 'time-outline', text: 'Në Pritje' };
      case 'in_progress':
        return { color: '#3b82f6', icon: 'sync-outline', text: 'Në Proces' };
      case 'resolved':
        return { color: '#059669', icon: 'checkmark-circle', text: 'E Zgjidhur' };
      case 'rejected':
        return { color: '#dc2626', icon: 'close-circle', text: 'E Refuzuar' };
      default:
        return { color: '#64748b', icon: 'help-circle-outline', text: status };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Duke ngarkuar...</Text>
      </View>
    );
  }

  const problemOptions = selectedProperty?.problemOptions || [];
  const floorOptions = generateFloorOptions();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
      }
    >
      {/* Report Form */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="alert-circle-outline" size={24} color="#059669" />
          <Text style={styles.cardTitle}>Raport i Ri</Text>
        </View>
        <Text style={styles.cardDescription}>
          Plotësoni formularin më poshtë për të raportuar një problem
        </Text>

        <View style={styles.form}>
          {/* Property Display */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Prona</Text>
            <View style={styles.displayField}>
              <Ionicons name="business-outline" size={18} color="#64748b" />
              <Text style={styles.displayFieldText}>
                {selectedProperty ? `${selectedProperty.name} - ${selectedProperty.address}` : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Problem Type Selector */}
          {problemOptions.length > 0 && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Lloji i Problemit <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setProblemModalVisible(true)}
              >
                <Ionicons name="alert-circle-outline" size={18} color="#64748b" />
                <Text style={[styles.selectorText, !selectedProblem && styles.placeholderText]}>
                  {selectedProblem ? selectedProblem.title : 'Zgjidhni llojin e problemit'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>
              {selectedProblem && selectedProblem.description && (
                <View style={styles.helperTextWrapper}>
                  <Ionicons name="information-circle-outline" size={14} color="#64748b" />
                  <Text style={styles.helperText}>{selectedProblem.description}</Text>
                </View>
              )}
            </View>
          )}

          {/* Floor Selector */}
          {floorOptions.length > 0 && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kati (Opsionale)</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setFloorModalVisible(true)}
              >
                <Ionicons name="layers-outline" size={18} color="#64748b" />
                <Text style={[styles.selectorText, selectedFloor === null && styles.placeholderText]}>
                  {selectedFloor !== null ? `Kati ${selectedFloor}` : 'Zgjidhni katin'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedProperty || !selectedProblem || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedProperty || !selectedProblem || submitting}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Duke Dërguar...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Dërgo Raportin</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* My Reports */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="list-outline" size={24} color="#059669" />
          <Text style={styles.cardTitle}>Raportet e Mia</Text>
        </View>
        <Text style={styles.cardDescription}>Ndiqni raportet tuaja të dërguara</Text>

        <View style={styles.reportsList}>
          {myReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nuk ka raporte të dërguara ende</Text>
            </View>
          ) : (
            myReports.map((report) => {
              const statusInfo = getStatusBadge(report.status);
              return (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportTitle}>
                        {report.problemOption.title}
                      </Text>
                      <Text style={styles.reportProperty}>
                        {report.property.name}
                      </Text>
                      {report.floor && (
                        <Text style={styles.reportFloor}>Kati {report.floor}</Text>
                      )}
                      <Text style={styles.reportDate}>
                        {formatDate(report.created_at)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusInfo.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={statusInfo.icon}
                        size={14}
                        color={statusInfo.color}
                      />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                      </Text>
                    </View>
                  </View>
                  {report.description && (
                    <Text style={styles.reportDescription}>{report.description}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Problem Type Selector Modal */}
      <Modal
        visible={problemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProblemModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProblemModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.sheetContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Zgjidhni Llojin e Problemit</Text>
              <TouchableOpacity 
                onPress={() => setProblemModalVisible(false)} 
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetList}>
              {problemOptions.map((problem, index) => (
                <TouchableOpacity
                  key={problem.id}
                  style={[
                    styles.sheetItem,
                    selectedProblem?.id === problem.id && styles.sheetItemSelected,
                    index === problemOptions.length - 1 && styles.sheetItemLast
                  ]}
                  onPress={() => handleProblemSelect(problem)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    <View style={[
                      styles.itemIcon, 
                      selectedProblem?.id === problem.id && styles.itemIconSelected
                    ]}>
                      <Ionicons 
                        name="alert-circle"
                        size={16}
                        color={selectedProblem?.id === problem.id ? '#ffffff' : '#64748b'}
                      />
                    </View>
                    <View style={styles.itemTextContainer}>
                      <Text style={[
                        styles.sheetItemText,
                        selectedProblem?.id === problem.id && styles.sheetItemTextSelected
                      ]}>
                        {problem.title}
                      </Text>
                      {problem.description && (
                        <Text style={styles.itemDescription}>{problem.description}</Text>
                      )}
                    </View>
                  </View>
                  {selectedProblem?.id === problem.id && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Floor Selector Modal */}
      <Modal
        visible={floorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFloorModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFloorModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.sheetContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Zgjidhni Katin</Text>
              <TouchableOpacity 
                onPress={() => setFloorModalVisible(false)} 
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetList}>
              {floorOptions.map((floor, index) => (
                <TouchableOpacity
                  key={floor}
                  style={[
                    styles.sheetItem,
                    selectedFloor === floor && styles.sheetItemSelected,
                    index === floorOptions.length - 1 && styles.sheetItemLast
                  ]}
                  onPress={() => handleFloorSelect(floor)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    <View style={[
                      styles.itemIcon, 
                      selectedFloor === floor && styles.itemIconSelected
                    ]}>
                      <Ionicons 
                        name="layers"
                        size={16}
                        color={selectedFloor === floor ? '#ffffff' : '#64748b'}
                      />
                    </View>
                    <Text style={[
                      styles.sheetItemText,
                      selectedFloor === floor && styles.sheetItemTextSelected
                    ]}>
                      Kati {floor}
                    </Text>
                  </View>
                  {selectedFloor === floor && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  required: {
    color: '#dc2626',
  },
  displayField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  displayFieldText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  helperTextWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
  },
  helperText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reportsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  reportCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportInfo: {
    flex: 1,
    gap: 4,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  reportProperty: {
    fontSize: 13,
    color: '#64748b',
  },
  reportFloor: {
    fontSize: 12,
    color: '#64748b',
  },
  reportDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetHandle: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  sheetCloseButton: {
    padding: 4,
  },
  sheetList: {
    paddingHorizontal: 20,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetItemSelected: {
    backgroundColor: '#f0fdf4',
  },
  sheetItemLast: {
    borderBottomWidth: 0,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconSelected: {
    backgroundColor: '#059669',
  },
  itemTextContainer: {
    flex: 1,
  },
  sheetItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  sheetItemTextSelected: {
    fontWeight: '600',
    color: '#059669',
  },
  itemDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});

export default TenantReportProblemScreen;
