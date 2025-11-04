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

const PMEditPropertyScreen = ({ navigation, propertyId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState(null);
  const [floorsFrom, setFloorsFrom] = useState('');
  const [floorsTo, setFloorsTo] = useState('');

  const [originalProperty, setOriginalProperty] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
    fetchCities();
  }, [propertyId]);

  useEffect(() => {
    if (originalProperty) {
      checkForChanges();
    }
  }, [name, address, cityId, floorsFrom, floorsTo]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/properties/${propertyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }

      const data = await response.json();

      if (data.success) {
        const property = data.data;
        setOriginalProperty(property);
        setName(property.name || '');
        setAddress(property.address || '');
        setCityId(property.city_id || null);
        setFloorsFrom(property.floors_from !== null ? String(property.floors_from) : '');
        setFloorsTo(property.floors_to !== null ? String(property.floors_to) : '');
      } else {
        throw new Error(data.message || 'Failed to load property details');
      }
    } catch (err) {
      console.error('Property details fetch error:', err);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen detajet e pronës.');
      navigation?.navigate('properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const response = await apiFetch('/api/cities');

      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }

      const data = await response.json();

      if (data.success) {
        setCities(data.data);
      } else {
        throw new Error(data.message || 'Failed to load cities');
      }
    } catch (err) {
      console.error('Cities fetch error:', err);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen qytetet.');
    } finally {
      setLoadingCities(false);
    }
  };

  const checkForChanges = () => {
    if (!originalProperty) return;

    const hasChanged =
      name !== (originalProperty.name || '') ||
      address !== (originalProperty.address || '') ||
      cityId !== (originalProperty.city_id || null) ||
      floorsFrom !== (originalProperty.floors_from !== null ? String(originalProperty.floors_from) : '') ||
      floorsTo !== (originalProperty.floors_to !== null ? String(originalProperty.floors_to) : '');

    setHasChanges(hasChanged);
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Gabim', 'Emri i pronës është i detyrueshëm');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Gabim', 'Adresa është e detyrueshme');
      return false;
    }

    if (cityId === null) {
      Alert.alert('Gabim', 'Qyteti është i detyrueshëm');
      return false;
    }

    // Validate floors if provided
    if (floorsFrom !== '' || floorsTo !== '') {
      const fromNum = floorsFrom !== '' ? parseInt(floorsFrom) : null;
      const toNum = floorsTo !== '' ? parseInt(floorsTo) : null;

      if (floorsFrom !== '' && (isNaN(fromNum) || fromNum < -20 || fromNum > 200)) {
        Alert.alert('Gabim', 'Kati nga duhet të jetë një numër midis -20 dhe 200');
        return false;
      }

      if (floorsTo !== '' && (isNaN(toNum) || toNum < -20 || toNum > 200)) {
        Alert.alert('Gabim', 'Kati deri duhet të jetë një numër midis -20 dhe 200');
        return false;
      }

      if (fromNum !== null && toNum !== null && fromNum > toNum) {
        Alert.alert('Gabim', 'Kati nga nuk mund të jetë më i madh se kati deri');
        return false;
      }
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
        address: address.trim(),
        city_id: cityId,
        floors_from: floorsFrom !== '' ? parseInt(floorsFrom) : null,
        floors_to: floorsTo !== '' ? parseInt(floorsTo) : null,
      };

      const response = await apiFetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update property');
      }

      const data = await response.json();

      if (data.success) {
        Alert.alert('Sukses', 'Prona u përditësua me sukses', [
          {
            text: 'OK',
            onPress: () => navigation?.navigate('properties'),
          },
        ]);
      } else {
        throw new Error(data.message || 'Failed to update property');
      }
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Gabim', err.message || 'Dështoi përditësimi i pronës');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await apiFetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete property');
      }

      const data = await response.json();

      if (data.success) {
        setDeleteModalVisible(false);
        Alert.alert('Sukses', 'Prona u fshi me sukses', [
          {
            text: 'OK',
            onPress: () => navigation?.navigate('properties'),
          },
        ]);
      } else {
        throw new Error(data.message || 'Failed to delete property');
      }
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Gabim', err.message || 'Dështoi fshirja e pronës');
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
            onPress: () => navigation?.navigate('properties'),
          },
        ]
      );
    } else {
      navigation?.navigate('properties');
    }
  };

  const openDeleteModal = () => {
    setDeleteModalVisible(true);
  };

  const openCityModal = () => {
    setCityModalVisible(true);
  };

  const closeCityModal = () => {
    setCityModalVisible(false);
  };

  const handleCitySelect = (city) => {
    setCityId(city.id);
    setCityModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ndrysho Pronën</Text>
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
        <Text style={styles.headerTitle}>Ndrysho Pronën</Text>
        <View style={styles.hiddenButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formCard}>
          {/* Property Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Emri i Pronës <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh. Pallati ABC"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#616061"
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Adresa <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#616061" />
              <TextInput
                style={styles.input}
                placeholder="p.sh. Rruga e Durrësit, Nr. 123"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#616061"
                multiline
              />
            </View>
          </View>

          {/* City Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Qyteti <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.citySelector}
              onPress={openCityModal}
              disabled={loadingCities}
            >
              <Ionicons name="map-outline" size={18} color="#616061" />
              <Text style={[styles.citySelectorText, !cityId && styles.placeholderText]}>
                {cityId ? cities.find(city => city.id === cityId)?.name : 'Zgjidhni qytetin'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#616061" />
            </TouchableOpacity>
          </View>

          {/* Floors Range */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Katetë</Text>
            <View style={styles.floorsRow}>
              <View style={styles.floorInputContainer}>
                <Text style={styles.floorLabel}>Nga kati</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="arrow-up-outline" size={18} color="#616061" />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={floorsFrom}
                    onChangeText={setFloorsFrom}
                    keyboardType="numeric"
                    placeholderTextColor="#616061"
                  />
                </View>
              </View>

              <View style={styles.floorInputContainer}>
                <Text style={styles.floorLabel}>Deri në kat</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="arrow-down-outline" size={18} color="#616061" />
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    value={floorsTo}
                    onChangeText={setFloorsTo}
                    keyboardType="numeric"
                    placeholderTextColor="#616061"
                  />
                </View>
              </View>
            </View>
            <View style={styles.helperTextWrapper}>
              <Ionicons name="information-circle-outline" size={14} color="#616061" />
              <Text style={styles.helperText}>
                Lëreni bosh nëse nuk dëshironi të specifikoni katetë
              </Text>
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
            <Text style={styles.deleteButtonText}>Fshi Pronën</Text>
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
              A jeni i sigurt që dëshironi të fshini pronën{'\n'}
              <Text style={styles.modalPropertyName}>{name}</Text>?
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

      {/* City Selector Modal - Bottom Sheet */}
      <Modal
        visible={cityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCityModal}
      >
        <TouchableOpacity 
          style={styles.cityModalOverlay}
          activeOpacity={1}
          onPress={closeCityModal}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.citySheetContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.citySheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.citySheetTitle}>Zgjidhni Qytetin</Text>
              <TouchableOpacity onPress={closeCityModal} style={styles.sheetCloseButton}>
                <Ionicons name="close" size={24} color="#616061" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.citySheetList}>
              {loadingCities ? (
                <View style={styles.loadingCitiesContainer}>
                  <ActivityIndicator size="large" color="#1d1c1d" />
                  <Text style={styles.loadingCitiesText}>Duke ngarkuar qytetet...</Text>
                </View>
              ) : (
                cities.map((city, index) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.citySheetItem,
                      cityId === city.id && styles.citySheetItemSelected,
                      index === cities.length - 1 && styles.citySheetItemLast
                    ]}
                    onPress={() => handleCitySelect(city)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cityItemContent}>
                      <View style={[styles.cityItemIcon, cityId === city.id && styles.cityItemIconSelected]}>
                        <Ionicons 
                          name="location"
                          size={16}
                          color={cityId === city.id ? '#ffffff' : '#616061'}
                        />
                      </View>
                      <Text style={[
                        styles.citySheetItemText,
                        cityId === city.id && styles.citySheetItemTextSelected
                      ]}>
                        {city.name}
                      </Text>
                    </View>
                    {cityId === city.id && (
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
  citySelector: {
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
  citySelectorText: {
    flex: 1,
    fontSize: 15,
    color: '#1d1c1d',
    fontWeight: '400',
  },
  placeholderText: {
    color: '#616061',
  },
  floorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  floorInputContainer: {
    flex: 1,
  },
  floorLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#616061',
    marginBottom: 8,
  },
  helperTextWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: '#616061',
    lineHeight: 18,
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
  modalPropertyName: {
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
  cityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  citySheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  citySheetHeader: {
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
  citySheetTitle: {
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
  citySheetList: {
    maxHeight: 400,
  },
  loadingCitiesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingCitiesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#616061',
  },
  citySheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  citySheetItemSelected: {
    backgroundColor: '#f8f8f8',
  },
  citySheetItemLast: {
    borderBottomWidth: 0,
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cityItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityItemIconSelected: {
    backgroundColor: '#1d1c1d',
  },
  citySheetItemText: {
    fontSize: 15,
    color: '#1d1c1d',
    fontWeight: '400',
  },
  citySheetItemTextSelected: {
    fontWeight: '700',
  },
});

export default PMEditPropertyScreen;
