import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../services/api-client';

const PMTenantsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTenants(tenants);
    } else {
      const filtered = tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.apartment_label || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTenants(filtered);
    }
  }, [searchQuery, tenants]);

  const fetchTenants = async () => {
    try {
      setError(null);
      const response = await apiFetch('/api/tenants?myTenants=true&limit=100');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }

      const data = await response.json();
      
      if (data.success) {
        setTenants(data.data || []);
        setFilteredTenants(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load tenants');
      }
    } catch (err) {
      console.error('Tenants fetch error:', err);
      setError(err.message);
      Alert.alert('Gabim', 'Nuk mund të ngarkohen banorët.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenants();
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    try {
      setDeleting(true);
      const response = await apiFetch(`/api/tenants/${tenantToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tenant');
      }

      Alert.alert('Sukses', 'Banori u fshi me sukses');
      setDeleteModalVisible(false);
      setTenantToDelete(null);
      fetchTenants();
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Gabim', 'Dështoi fshirja e banorit');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (tenant) => {
    setTenantToDelete(tenant);
    setDeleteModalVisible(true);
    setMenuVisible(null);
  };

  const handleEdit = (tenantId) => {
    setMenuVisible(null);
    navigation?.navigate('edit-tenant', { tenantId });
  };

  const handleCardPress = (tenantId) => {
    if (navigation?.navigate) {
      navigation.navigate('tenant-details', { tenantId });
    }
  };

  const TenantCard = ({ tenant }) => {
    const isMenuOpen = menuVisible === tenant.id;
    
    return (
      <View style={styles.tenantCardWrapper}>
        <TouchableOpacity 
          style={styles.tenantCard}
          activeOpacity={0.6}
          onPress={() => handleCardPress(tenant.id)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.tenantMainInfo}>
              <View style={styles.tenantIconWrapper}>
                <Ionicons name="person" size={20} color="#1d1c1d" />
              </View>
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantName} numberOfLines={1}>
                  {tenant.name} {tenant.surname}
                </Text>
                {tenant.apartment_label && (
                  <View style={styles.apartmentBadge}>
                    <Ionicons name="home" size={12} color="#616061" />
                    <Text style={styles.apartmentBadgeText}>{tenant.apartment_label}</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={(e) => {
                e.stopPropagation();
                setMenuVisible(isMenuOpen ? null : tenant.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#616061" />
            </TouchableOpacity>
          </View>

          <View style={styles.tenantDetails}>
            {tenant.email && (
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={16} color="#616061" />
                <Text style={styles.detailText} numberOfLines={1}>{tenant.email}</Text>
              </View>
            )}

            {tenant.number && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color="#616061" />
                <Text style={styles.detailText}>{tenant.number}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {isMenuOpen && (
          <View style={styles.contextMenu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(tenant.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#1d1c1d" />
              <Text style={styles.menuItemText}>Ndrysho</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={(e) => {
                e.stopPropagation();
                openDeleteModal(tenant);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#e01e5a" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Fshi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d1c1d" />
        <Text style={styles.loadingText}>Duke ngarkuar banorët...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#616061" />
          <TextInput
            style={styles.searchInput}
            placeholder="Kërko banor..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#616061"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#616061" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d1c1d']} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#e01e5a" />
            <Text style={styles.errorText}>Gabim në ngarkim</Text>
            <Text style={styles.errorSubtext}>Nuk mund të ngarkohen banorët</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTenants}>
              <Text style={styles.retryButtonText}>Provo Përsëri</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTenants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d2d3" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Asnjë banor nuk u gjet' : 'Asnjë banor'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Provoni një kërkim tjetër' : 'Nuk keni banorë të regjistruar'}
            </Text>
          </View>
        ) : (
          <View style={styles.tenantsList}>
            {filteredTenants.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} />
            ))}
          </View>
        )}
      </ScrollView>

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
              <Text style={styles.modalTenantName}>
                {tenantToDelete?.name} {tenantToDelete?.surname}
              </Text>?
            </Text>
            <Text style={styles.modalWarning}>Ky veprim nuk mund të zhbëhet.</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setTenantToDelete(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Anulo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteTenant}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    <Text style={styles.deleteButtonText}>Fshi</Text>
                  </>
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
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '400',
    color: '#616061',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1d1c1d',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1c1d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#616061',
    textAlign: 'center',
  },
  tenantsList: {
    gap: 12,
  },
  tenantCardWrapper: {
    position: 'relative',
  },
  tenantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tenantMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  tenantIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1c1d',
    marginBottom: 4,
  },
  apartmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  apartmentBadgeText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#616061',
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f8f8',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#616061',
    fontWeight: '400',
  },
  contextMenu: {
    position: 'absolute',
    top: 52,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10003,
    minWidth: 160,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1d1c1d',
  },
  menuItemTextDanger: {
    color: '#e01e5a',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f8f8f8',
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
  deleteButton: {
    backgroundColor: '#e01e5a',
    flexDirection: 'row',
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default PMTenantsScreen;
