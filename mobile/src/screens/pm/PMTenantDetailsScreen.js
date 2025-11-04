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

const PMTenantDetailsScreen = ({ navigation, tenantId }) => {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/api/users/tenants/${tenantId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
      }

      const data = await response.json();

      if (data.success) {
        setTenant(data.data);
      } else {
        throw new Error(data.message || 'Failed to load tenant details');
      }
    } catch (err) {
      console.error('Tenant details fetch error:', err);
      setError(err.message);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen detajet e banorit.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation?.navigate) {
      navigation.navigate('tenants');
    }
  };

  const handleEdit = () => {
    navigation?.navigate('edit-tenant', { tenantId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detajet e Banorit</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d1c1d" />
          <Text style={styles.loadingText}>Duke ngarkuar detajet...</Text>
        </View>
      </View>
    );
  }

  if (error || !tenant) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detajet e Banorit</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e01e5a" />
          <Text style={styles.errorText}>Gabim në ngarkim</Text>
          <Text style={styles.errorSubtext}>Nuk mund të ngarkohen detajet e banorit</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTenantDetails}>
            <Text style={styles.retryButtonText}>Provo Përsëri</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1d1c1d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detajet e Banorit</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Ionicons name="create-outline" size={22} color="#1d1c1d" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Tenant Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconWrapper}>
            <Ionicons name="person" size={48} color="#1d1c1d" />
          </View>
          <Text style={styles.tenantName}>{tenant.name} {tenant.surname}</Text>
          {tenant.apartment_label && (
            <View style={styles.apartmentBadge}>
              <Ionicons name="home" size={14} color="#616061" />
              <Text style={styles.apartmentBadgeText}>{tenant.apartment_label}</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacioni i Kontaktit</Text>
          <View style={styles.infoCard}>
            {tenant.email && (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#616061" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{tenant.email}</Text>
                  </View>
                </View>
                {tenant.number && <View style={styles.infoDivider} />}
              </>
            )}

            {tenant.number && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="call-outline" size={18} color="#616061" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Telefon</Text>
                  <Text style={styles.infoValue}>{tenant.number}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Property Information */}
        {tenant.property && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacioni i Pronës</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="business-outline" size={18} color="#616061" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Prona</Text>
                  <Text style={styles.infoValue}>{tenant.property.name}</Text>
                </View>
              </View>

              {tenant.property.address && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="location-outline" size={18} color="#616061" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Adresa</Text>
                      <Text style={styles.infoValue}>{tenant.property.address}</Text>
                    </View>
                  </View>
                </>
              )}

              {tenant.apartment_label && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="home-outline" size={18} color="#616061" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Apartamenti</Text>
                      <Text style={styles.infoValue}>{tenant.apartment_label}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Payment Information */}
        {tenant.monthly_rate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacioni i Pagesës</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="cash-outline" size={18} color="#616061" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tarifa Mujore</Text>
                  <Text style={styles.infoValue}>{tenant.monthly_rate}</Text>
                </View>
              </View>

              {tenant.expiry_date && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="calendar-outline" size={18} color="#616061" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Data e Skadencës</Text>
                      <Text style={styles.infoValue}>
                        {new Date(tenant.expiry_date).toLocaleDateString('sq-AL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </>
              )}
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
                  {new Date(tenant.created_at).toLocaleDateString('sq-AL', {
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
                  {new Date(tenant.updated_at).toLocaleDateString('sq-AL', {
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
            <Text style={styles.primaryButtonText}>Ndrysho Banorin</Text>
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
  tenantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1c1d',
    textAlign: 'center',
    marginBottom: 8,
  },
  apartmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apartmentBadgeText: {
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

export default PMTenantDetailsScreen;
