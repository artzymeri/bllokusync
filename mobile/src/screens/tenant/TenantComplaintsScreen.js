import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const TenantComplaintsScreen = ({ user }) => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchProperties(), fetchMyComplaints()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await apiFetch('/api/complaints/properties');
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data.properties || []);
      if (data.properties && data.properties.length > 0) {
        setSelectedProperty(data.properties[0]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      Alert.alert('Gabim', 'Nuk u arrit të ngarkohen pronat');
    }
  };

  const fetchMyComplaints = async () => {
    try {
      const response = await apiFetch('/api/complaints/my-complaints');
      
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const data = await response.json();
      // Filter out archived complaints
      const nonArchivedComplaints = (data.complaints || []).filter(
        complaint => !complaint.archived || complaint.archived === false
      );
      setMyComplaints(nonArchivedComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleSubmit = async () => {
    if (!selectedProperty || !title.trim()) {
      Alert.alert('Gabim', 'Ju lutem vendosni titullin e ankesës');
      return;
    }

    Alert.alert(
      'Konfirmo',
      'A jeni i sigurt që dëshironi të dërgoni këtë ankesë?',
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
              const response = await apiFetch('/api/complaints', {
                method: 'POST',
                body: JSON.stringify({
                  property_id: selectedProperty.id,
                  title: title.trim(),
                  description: description.trim() || null,
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Sukses', 'Ankesa u dërgua me sukses!');
                setTitle('');
                setDescription('');
                await fetchMyComplaints();
              } else {
                Alert.alert('Gabim', data.message || 'Gabim në dërgimin e ankesës');
              }
            } catch (error) {
              console.error('Error submitting complaint:', error);
              Alert.alert('Gabim', 'Gabim në dërgimin e ankesës');
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        {/* Complaint Form */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbox-outline" size={24} color="#059669" />
            <Text style={styles.cardTitle}>Dërgo Ankesë</Text>
          </View>
          <Text style={styles.cardDescription}>
            Paraqisni një ankesë për pronën tuaj
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

            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Titulli <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="text-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Përshkrim i shkurtër i ankesës suaj"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={255}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Përshkrimi (Opsional)</Text>
              <View style={styles.textAreaWrapper}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Jepni më shumë detaje rreth ankesës suaj..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedProperty || !title.trim() || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedProperty || !title.trim() || submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Duke Dërguar...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Dërgo Ankesën</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* My Complaints */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={24} color="#059669" />
            <Text style={styles.cardTitle}>Ankesat e Mia</Text>
          </View>
          <Text style={styles.cardDescription}>Ndiqni ankesat tuaja të dërguara</Text>

          <View style={styles.complaintsList}>
            {myComplaints.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbox-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>Nuk ka ankesa të dërguara ende</Text>
              </View>
            ) : (
              myComplaints.map((complaint) => {
                const statusInfo = getStatusBadge(complaint.status);
                return (
                  <View key={complaint.id} style={styles.complaintCard}>
                    <View style={styles.complaintHeader}>
                      <View style={styles.complaintInfo}>
                        <Text style={styles.complaintTitle}>
                          {complaint.title}
                        </Text>
                        <Text style={styles.complaintProperty}>
                          {complaint.property.name}
                        </Text>
                        <Text style={styles.complaintDate}>
                          {formatDate(complaint.created_at)}
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
                    {complaint.description && (
                      <Text style={styles.complaintDescription}>{complaint.description}</Text>
                    )}
                    {complaint.response && (
                      <View style={styles.responseContainer}>
                        <View style={styles.responseHeader}>
                          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#059669" />
                          <Text style={styles.responseLabel}>Përgjigje:</Text>
                        </View>
                        <Text style={styles.responseText}>{complaint.response}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
  },
  textArea: {
    fontSize: 14,
    color: '#1e293b',
    minHeight: 80,
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
  complaintsList: {
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
  complaintCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  complaintInfo: {
    flex: 1,
    gap: 4,
  },
  complaintTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  complaintProperty: {
    fontSize: 13,
    color: '#64748b',
  },
  complaintDate: {
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
  complaintDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  responseContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  responseText: {
    fontSize: 13,
    color: '#064e3b',
    lineHeight: 18,
  },
});

export default TenantComplaintsScreen;
