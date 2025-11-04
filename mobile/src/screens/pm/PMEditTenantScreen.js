import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const PMEditTenantScreen = ({ navigation, tenantId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [propertyId, setPropertyId] = useState(null);
  const [apartmentLabel, setApartmentLabel] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [originalTenant, setOriginalTenant] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchTenantDetails();
    fetchProperties();
  }, [tenantId]);

  useEffect(() => {
    if (originalTenant) {
      checkForChanges();
    }
  }, [name, surname, email, number, propertyId, apartmentLabel, monthlyRate, expiryDate]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/users/tenants/${tenantId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
      }

      const data = await response.json();

      if (data.success) {
        const tenant = data.data;
        setOriginalTenant(tenant);
        setName(tenant.name || '');
        setSurname(tenant.surname || '');
        setEmail(tenant.email || '');
        setNumber(tenant.number || '');
        setPropertyId(tenant.property_id || null);
        setApartmentLabel(tenant.apartment_label || '');
        setMonthlyRate(tenant.monthly_rate ? String(tenant.monthly_rate) : '');
        setExpiryDate(tenant.expiry_date || '');
      } else {
        throw new Error(data.message || 'Failed to load tenant details');
      }
    } catch (err) {
      console.error('Tenant details fetch error:', err);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen detajet e banorit.');
      navigation?.navigate('tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await apiFetch('/api/properties?myProperties=true&limit=100');

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();

      if (data.success) {
        setProperties(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load properties');
      }
    } catch (err) {
      console.error('Properties fetch error:', err);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen pronat.');
    } finally {
      setLoadingProperties(false);
    }
  };

  const checkForChanges = () => {
    if (!originalTenant) return;

    const hasChanged =
      name !== (originalTenant.name || '') ||
      surname !== (originalTenant.surname || '') ||
      email !== (originalTenant.email || '') ||
      number !== (originalTenant.number || '') ||
      propertyId !== (originalTenant.property_id || null) ||
      apartmentLabel !== (originalTenant.apartment_label || '') ||
      monthlyRate !== (originalTenant.monthly_rate ? String(originalTenant.monthly_rate) : '') ||
      expiryDate !== (originalTenant.expiry_date || '');

    setHasChanges(hasChanged);
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Gabim', 'Emri është i detyrueshëm');
      return false;
    }

    if (!surname.trim()) {
      Alert.alert('Gabim', 'Mbiemri është i detyrueshëm');
      return false;
    }

    if (email && !email.includes('@')) {
      Alert.alert('Gabim', 'Email-i nuk është valid');
      return false;
    }

    if (monthlyRate && (isNaN(Number(monthlyRate)) || Number(monthlyRate) < 0)) {
      Alert.alert('Gabim', 'Tarifa mujore duhet të jetë një numër pozitiv');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!hasChanges) {
      Alert.alert('Info', 'Nuk ka ndryshime për të ruajtur');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim() || null,
        number: number.trim() || null,
        property_id: propertyId,
        apartment_label: apartmentLabel.trim() || null,
        monthly_rate: monthlyRate ? Number(monthlyRate) : null,
        expiry_date: expiryDate || null,
      };

      const response = await apiFetch(`/api/users/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update tenant');
      }

      const data = await response.json();

      if (data.success) {
        Alert.alert('Sukses', 'Banori u përditësua me sukses', [
          {
            text: 'OK',
            onPress: () => navigation?.navigate('tenants'),
          },
        ]);
      } else {
        throw new Error(data.message || 'Failed to update tenant');
      }
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Gabim', err.message || 'Dështoi përditësimi i banorit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await apiFetch(`/api/users/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete tenant');
      }

      const data = await response.json();

      if (data.success) {
        setDeleteModalVisible(false);
        Alert.alert('Sukses', 'Banori u fshi me sukses', [
          {
            text: 'OK',
            onPress: () => navigation?.navigate('tenants'),
          },
        ]);
      } else {
        throw new Error(data.message || 'Failed to delete tenant');
      }
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Gabim', err.message || 'Dështoi fshirja e banorit');
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Ndryshime të paruajtura',
        'Keni ndryshime të paruajtura. A jeni i sigurt që dëshironi të dilni?',
        [
          {
            text: 'Anulo',
            style: 'cancel',
          },
          {
            text: 'Dil',
            style: 'destructive',
            onPress: () => navigation?.navigate('tenants'),
          },
        ]
      );
    } else {
      navigation?.navigate('tenants');
    }
  };

  const openDeleteModal = () => {
    setDeleteModalVisible(true);
  };

  const openPropertyModal = () => {
    setPropertyModalVisible(true);
  };

  const closePropertyModal = () => {
    setPropertyModalVisible(false);
  };

  const handlePropertySelect = (property) => {
    setPropertyId(property.id);
    setPropertyModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ndrysho Banorin</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d1c1d" />
          <Text style={styles.loadingText}>Duke ngarkuar...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ndrysho Banorin</Text>
        <View style={styles.hiddenButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formCard}>
          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Emri <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh. Ardit"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#616061"
              />
            </View>
          </View>

          {/* Surname */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Mbiemri <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh. Hoxha"
                value={surname}
                onChangeText={setSurname}
                placeholderTextColor="#616061"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh. ardit@example.com"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#616061"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh. +355 69 123 4567"
                value={number}
                onChangeText={setNumber}
                placeholderTextColor="#616061"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Property Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Prona</Text>
            <TouchableOpacity
              style={styles.propertySelector}
              onPress={openPropertyModal}
              disabled={loadingProperties}
            >
              <Ionicons name="business-outline" size={18} color="#616061" />
              <Text style={[styles.propertySelectorText, !propertyId && styles.placeholderText]}>
                {propertyId ? properties.find(p => p.id === propertyId)?.name : 'Zgjidhni pronën'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#616061" />
            </TouchableOpacity>
          </View>

          {/* Apartment Label */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Apartamenti</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="home-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh. A101 ose Kati 1, Ap 5"
                value={apartmentLabel}
                onChangeText={setApartmentLabel}
                placeholderTextColor="#616061"
              />
            </View>
          </View>

          {/* Monthly Rate */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tarifa Mujore</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="cash-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh 13"
                value={monthlyRate}
                onChangeText={setMonthlyRate}
                placeholderTextColor="#616061"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={hasChanges ? "#fff" : "#616061"} />
                <Text style={[styles.saveButtonText, (!hasChanges || saving) && styles.saveButtonTextDisabled]}>
                  Ruaj Ndryshimet
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={openDeleteModal}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color="#e01e5a" />
            <Text style={styles.deleteButtonText}>Fshi Banorin</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="alert-circle" size={48} color="#e01e5a" />
            </View>
            
            <Text style={styles.modalTitle}>Konfirmo Fshirjen</Text>
            <Text style={styles.modalMessage}>
              A jeni i sigurt që dëshironi të fshini banorin{'\n'}
              <Text style={styles.modalTenantName}>{name} {surname}</Text>?
            </Text>
            <Text style={styles.modalWarning}>Ky veprim nuk mund të zhbëhet.</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Anulo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    <Text style={styles.confirmDeleteButtonText}>Fshi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Property Selector Modal - Bottom Sheet */}
      <Modal
        visible={propertyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePropertyModal}
      >
        <TouchableOpacity 
          style={styles.propertyModalOverlay}
          activeOpacity={1}
          onPress={closePropertyModal}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.propertySheetContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.propertySheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.propertySheetTitle}>Zgjidhni Pronën</Text>
              <TouchableOpacity onPress={closePropertyModal} style={styles.sheetCloseButton}>
                <Ionicons name="close" size={24} color="#616061" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.propertySheetList}>
              {loadingProperties ? (
                <View style={styles.loadingPropertiesContainer}>
                  <ActivityIndicator size="large" color="#1d1c1d" />
                  <Text style={styles.loadingPropertiesText}>Duke ngarkuar pronat...</Text>
                </View>
              ) : (
                properties.map((property, index) => (
                  <TouchableOpacity
                    key={property.id}
                    style={[
                      styles.propertySheetItem,
                      propertyId === property.id && styles.propertySheetItemSelected,
                      index === properties.length - 1 && styles.propertySheetItemLast
                    ]}
                    onPress={() => handlePropertySelect(property)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.propertyItemContent}>
                      <View style={[styles.propertyItemIcon, propertyId === property.id && styles.propertyItemIconSelected]}>
                        <Ionicons 
                          name="business"
                          size={16}
                          color={propertyId === property.id ? '#ffffff' : '#616061'}
                        />
                      </View>
                      <Text style={[
                        styles.propertySheetItemText,
                        propertyId === property.id && styles.propertySheetItemTextSelected
                      ]}>
                        {property.name}
                      </Text>
                    </View>
                    {propertyId === property.id && (
                      <Ionicons name="checkmark" size={20} color="#1d1c1d" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1c1d',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 16,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1c1d',
    marginBottom: 8,
  },
  required: {
    color: '#e01e5a',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1d1c1d',
    fontWeight: '400',
  },
  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  propertySelectorText: {
    flex: 1,
    fontSize: 15,
    color: '#1d1c1d',
    fontWeight: '400',
  },
  placeholderText: {
    color: '#616061',
  },
  actionsContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#1d1c1d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButtonTextDisabled: {
    color: '#616061',
  },
  deleteButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e01e5a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '400',
    color: '#616061',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrapper: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1c1d',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#616061',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalTenantName: {
    fontWeight: '700',
    color: '#1d1c1d',
  },
  modalWarning: {
    fontSize: 14,
    color: '#e01e5a',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1c1d',
  },
  confirmDeleteButton: {
    backgroundColor: '#e01e5a',
    flexDirection: 'row',
    gap: 6,
  },
  confirmDeleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  propertyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  propertySheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  propertySheetHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    alignItems: 'center',
    position: 'relative',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#d1d2d3',
    borderRadius: 2,
    marginBottom: 16,
  },
  propertySheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1c1d',
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
  loadingPropertiesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingPropertiesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#616061',
  },
  propertySheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  propertySheetItemSelected: {
    backgroundColor: '#f8f8f8',
  },
  propertySheetItemLast: {
    borderBottomWidth: 0,
  },
  propertyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  propertyItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyItemIconSelected: {
    backgroundColor: '#1d1c1d',
  },
  propertySheetItemText: {
    fontSize: 15,
    color: '#1d1c1d',
    fontWeight: '400',
  },
  propertySheetItemTextSelected: {
    fontWeight: '700',
  },
});

export default PMEditTenantScreen;

