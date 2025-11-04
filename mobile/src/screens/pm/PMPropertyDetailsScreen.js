import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const PMPropertyDetailsScreen = ({ navigation, propertyId }) => {
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/api/properties/${propertyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }

      const data = await response.json();
      
      if (data.success) {
        setProperty(data.data);
      } else {
        throw new Error(data.message || 'Failed to load property details');
      }
    } catch (err) {
      console.error('Property details fetch error:', err);
      setError(err.message);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen detajet e pronës.');
    } finally {
      setLoading(false);
    }
  };

  const calculateFloorsCount = (floorsFrom, floorsTo) => {
    if (floorsFrom === null || floorsTo === null) {
      return null;
    }
    return floorsTo - floorsFrom + 1;
  };

  const handleBack = () => {
    if (navigation?.navigate) {
      navigation.navigate('properties');
    }
  };

  const handleEdit = () => {
    navigation?.navigate('edit-property', { propertyId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detajet e Pronës</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d1c1d" />
          <Text style={styles.loadingText}>Duke ngarkuar detajet...</Text>
        </View>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detajet e Pronës</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e01e5a" />
          <Text style={styles.errorText}>Gabim në ngarkim</Text>
          <Text style={styles.errorSubtext}>Nuk mund të ngarkohen detajet e pronës</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPropertyDetails}>
            <Text style={styles.retryButtonText}>Provo Përsëri</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const floorsCount = calculateFloorsCount(property.floors_from, property.floors_to);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detajet e Pronës</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Ionicons name="create-outline" size={22} color="#1d1c1d" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Property Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconWrapper}>
            <Ionicons name="business" size={48} color="#1d1c1d" />
          </View>
          <Text style={styles.propertyName}>{property.name}</Text>
          {property.cityDetails?.name && (
            <View style={styles.cityBadge}>
              <Ionicons name="location" size={14} color="#616061" />
              <Text style={styles.cityBadgeText}>{property.cityDetails.name}</Text>
            </View>
          )}
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokacioni</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location-outline" size={18} color="#616061" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adresa</Text>
                <Text style={styles.infoValue}>{property.address}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="business-outline" size={18} color="#616061" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Qyteti</Text>
                <Text style={styles.infoValue}>{property.cityDetails?.name || 'N/A'}</Text>
              </View>
            </View>

            {(property.latitude && property.longitude) && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrapper}>
                    <Ionicons name="map-outline" size={18} color="#616061" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Koordinatat GPS</Text>
                    <Text style={styles.infoValue}>
                      {Number(property.latitude).toFixed(6)}, {Number(property.longitude).toFixed(6)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Building Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ndërtesa</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="layers-outline" size={18} color="#616061" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Numri i Kateve</Text>
                <Text style={styles.infoValue}>
                  {floorsCount !== null ? `${floorsCount} ${floorsCount === 1 ? 'kat' : 'kate'}` : 'N/A'}
                </Text>
              </View>
            </View>

            {property.floors_from !== null && property.floors_to !== null && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrapper}>
                    <Ionicons name="arrow-down-outline" size={18} color="#616061" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Kati i Parë</Text>
                    <Text style={styles.infoValue}>{property.floors_from}</Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrapper}>
                    <Ionicons name="arrow-up-outline" size={18} color="#616061" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Kati i Fundit</Text>
                    <Text style={styles.infoValue}>{property.floors_to}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Managers Information */}
        {property.managers && property.managers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Menaxherët</Text>
            <View style={styles.infoCard}>
              {property.managers.map((manager, index) => (
                <View key={manager.id}>
                  {index > 0 && <View style={styles.infoDivider} />}
                  <View style={styles.managerItem}>
                    <View style={styles.managerIconWrapper}>
                      <Ionicons name="person" size={20} color="#1d1c1d" />
                    </View>
                    <View style={styles.managerInfo}>
                      <Text style={styles.managerName}>{manager.name} {manager.surname}</Text>
                      {manager.email && (
                        <View style={styles.managerDetailRow}>
                          <Ionicons name="mail-outline" size={14} color="#616061" />
                          <Text style={styles.managerDetail}>{manager.email}</Text>
                        </View>
                      )}
                      {manager.number && (
                        <View style={styles.managerDetailRow}>
                          <Ionicons name="call-outline" size={14} color="#616061" />
                          <Text style={styles.managerDetail}>{manager.number}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacion Shtesë</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="calendar-outline" size={18} color="#616061" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data e Krijimit</Text>
                <Text style={styles.infoValue}>
                  {new Date(property.created_at).toLocaleDateString('sq-AL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="time-outline" size={18} color="#616061" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Përditësimi i Fundit</Text>
                <Text style={styles.infoValue}>
                  {new Date(property.updated_at).toLocaleDateString('sq-AL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Ndrysho Pronën</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1c1d',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1c1d',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 15,
    color: '#616061',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1d1c1d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  propertyName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1c1d',
    textAlign: 'center',
    marginBottom: 8,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityBadgeText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#616061',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d1c1d',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#616061',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#1d1c1d',
    fontWeight: '400',
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f8f8f8',
    marginVertical: 12,
  },
  managerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  managerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerInfo: {
    flex: 1,
    gap: 4,
  },
  managerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d1c1d',
    marginBottom: 4,
  },
  managerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  managerDetail: {
    fontSize: 14,
    color: '#616061',
    fontWeight: '400',
  },
  actionsSection: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#1d1c1d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default PMPropertyDetailsScreen;
