import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import problemOptionService from '../../services/problem-option.service';
import spendingConfigService from '../../services/spending-config.service';
import propertyService from '../../services/property.service';

const PMConfigurationsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [problemOptions, setProblemOptions] = useState([]);
  const [spendingConfigs, setSpendingConfigs] = useState([]);
  const [properties, setProperties] = useState([]);

  // Problem Options modals
  const [createProblemModalVisible, setCreateProblemModalVisible] = useState(false);
  const [editProblemModalVisible, setEditProblemModalVisible] = useState(false);
  const [assignProblemModalVisible, setAssignProblemModalVisible] = useState(false);
  const [selectedProblemOption, setSelectedProblemOption] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);

  // Spending Config modals
  const [createSpendingModalVisible, setCreateSpendingModalVisible] = useState(false);
  const [editSpendingModalVisible, setEditSpendingModalVisible] = useState(false);
  const [assignSpendingModalVisible, setAssignSpendingModalVisible] = useState(false);
  const [selectedSpendingConfig, setSelectedSpendingConfig] = useState(null);
  const [selectedSpendingProperty, setSelectedSpendingProperty] = useState(null);
  const [selectedSpendingIds, setSelectedSpendingIds] = useState([]);

  // Form data
  const [problemFormData, setProblemFormData] = useState({ title: '', description: '' });
  const [spendingFormData, setSpendingFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProblemOptions(),
        fetchSpendingConfigs(),
        fetchProperties(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Gabim', 'Gabim në ngarkimin e të dhënave');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const fetchProblemOptions = async () => {
    try {
      const data = await problemOptionService.getMyProblemOptions();
      setProblemOptions(data);
    } catch (error) {
      console.error('Error fetching problem options:', error);
    }
  };

  const fetchSpendingConfigs = async () => {
    try {
      const data = await spendingConfigService.getMySpendingConfigs();
      setSpendingConfigs(data);
    } catch (error) {
      console.error('Error fetching spending configs:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await propertyService.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    }
  };

  // Problem Options handlers
  const handleCreateProblemOption = async () => {
    if (!problemFormData.title.trim()) {
      Alert.alert('Gabim', 'Titulli është i detyrueshëm');
      return;
    }

    try {
      await problemOptionService.createProblemOption(problemFormData);
      Alert.alert('Sukses', 'Opsioni i problemit u krijua me sukses');
      setCreateProblemModalVisible(false);
      setProblemFormData({ title: '', description: '' });
      fetchProblemOptions();
    } catch (error) {
      Alert.alert('Gabim', error.message || 'Gabim në krijimin e opsionit të problemit');
    }
  };

  const handleUpdateProblemOption = async () => {
    if (!selectedProblemOption || !problemFormData.title.trim()) {
      Alert.alert('Gabim', 'Titulli është i detyrueshëm');
      return;
    }

    try {
      await problemOptionService.updateProblemOption(selectedProblemOption.id, problemFormData);
      Alert.alert('Sukses', 'Opsioni i problemit u përditësua me sukses');
      setEditProblemModalVisible(false);
      setSelectedProblemOption(null);
      setProblemFormData({ title: '', description: '' });
      fetchProblemOptions();
    } catch (error) {
      Alert.alert('Gabim', error.message || 'Gabim në përditësimin e opsionit të problemit');
    }
  };

  const handleDeleteProblemOption = (option) => {
    Alert.alert(
      'Konfirmo Fshirjen',
      'Jeni të sigurt që dëshironi të fshini këtë opsion problemi?',
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: async () => {
            try {
              await problemOptionService.deleteProblemOption(option.id);
              Alert.alert('Sukses', 'Opsioni i problemit u fshi me sukses');
              fetchProblemOptions();
            } catch (error) {
              Alert.alert('Gabim', error.message || 'Gabim në fshirjen e opsionit të problemit');
            }
          },
        },
      ]
    );
  };

  const openEditProblemDialog = (option) => {
    setSelectedProblemOption(option);
    setProblemFormData({
      title: option.title,
      description: option.description || '',
    });
    setEditProblemModalVisible(true);
  };

  const openAssignProblemDialog = async (property) => {
    setSelectedProperty(property);
    try {
      const data = await problemOptionService.getPropertyProblemOptions(property.id);
      setSelectedProblemIds(data.map((opt) => opt.id));
    } catch (error) {
      console.error('Error fetching property problem options:', error);
      setSelectedProblemIds([]);
    }
    setAssignProblemModalVisible(true);
  };

  const handleAssignProblemsToProperty = async () => {
    if (!selectedProperty) {
      Alert.alert('Gabim', 'Ju lutem zgjidhni një pronë');
      return;
    }

    try {
      await problemOptionService.assignProblemOptionsToProperty(selectedProperty.id, {
        problemOptionIds: selectedProblemIds,
      });
      Alert.alert('Sukses', 'Opsionet e problemeve u caktuan me sukses');
      setAssignProblemModalVisible(false);
      setSelectedProperty(null);
      setSelectedProblemIds([]);
      fetchProblemOptions();
    } catch (error) {
      Alert.alert('Gabim', error.message || 'Gabim në caktimin e opsioneve të problemeve');
    }
  };

  const toggleProblemSelection = (id) => {
    if (selectedProblemIds.includes(id)) {
      setSelectedProblemIds(selectedProblemIds.filter((pid) => pid !== id));
    } else {
      setSelectedProblemIds([...selectedProblemIds, id]);
    }
  };

  // Spending Config handlers
  const handleCreateSpendingConfig = async () => {
    if (!spendingFormData.title.trim()) {
      Alert.alert('Gabim', 'Titulli është i detyrueshëm');
      return;
    }

    try {
      await spendingConfigService.createSpendingConfig(spendingFormData);
      Alert.alert('Sukses', 'Konfigurimi i shpenzimeve u krijua me sukses');
      setCreateSpendingModalVisible(false);
      setSpendingFormData({ title: '', description: '' });
      fetchSpendingConfigs();
    } catch (error) {
      Alert.alert('Gabim', error.message || 'Gabim në krijimin e konfigurimit të shpenzimeve');
    }
  };

  const handleUpdateSpendingConfig = async () => {
    if (!selectedSpendingConfig || !spendingFormData.title.trim()) {
      Alert.alert('Gabim', 'Titulli është i detyrueshëm');
      return;
    }

    try {
      await spendingConfigService.updateSpendingConfig(selectedSpendingConfig.id, spendingFormData);
      Alert.alert('Sukses', 'Konfigurimi i shpenzimeve u përditësua me sukses');
      setEditSpendingModalVisible(false);
      setSelectedSpendingConfig(null);
      setSpendingFormData({ title: '', description: '' });
      fetchSpendingConfigs();
    } catch (error) {
      Alert.alert('Gabim', error.message || 'Gabim në përditësimin e konfigurimit të shpenzimeve');
    }
  };

  const handleDeleteSpendingConfig = (config) => {
    Alert.alert(
      'Konfirmo Fshirjen',
      'Jeni të sigurt që dëshironi të fshini këtë konfigurim shpenzimesh?',
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: async () => {
            try {
              await spendingConfigService.deleteSpendingConfig(config.id);
              Alert.alert('Sukses', 'Konfigurimi i shpenzimeve u fshi me sukses');
              fetchSpendingConfigs();
            } catch (error) {
              Alert.alert('Gabim', error.message || 'Gabim në fshirjen e konfigurimit të shpenzimeve');
            }
          },
        },
      ]
    );
  };

  const openEditSpendingDialog = (config) => {
    setSelectedSpendingConfig(config);
    setSpendingFormData({
      title: config.title,
      description: config.description || '',
    });
    setEditSpendingModalVisible(true);
  };

  const openAssignSpendingDialog = async (property) => {
    setSelectedSpendingProperty(property);
    try {
      const data = await spendingConfigService.getPropertySpendingConfigs(property.id);
      setSelectedSpendingIds(data.map((config) => config.id));
    } catch (error) {
      console.error('Error fetching property spending configs:', error);
      setSelectedSpendingIds([]);
    }
    setAssignSpendingModalVisible(true);
  };

  const handleAssignSpendingsToProperty = async () => {
    if (!selectedSpendingProperty) {
      Alert.alert('Gabim', 'Ju lutem zgjidhni një pronë');
      return;
    }

    try {
      await spendingConfigService.assignSpendingConfigsToProperty(selectedSpendingProperty.id, {
        spendingConfigIds: selectedSpendingIds,
      });
      Alert.alert('Sukses', 'Konfigurimet e shpenzimeve u caktuan me sukses');
      setAssignSpendingModalVisible(false);
      setSelectedSpendingProperty(null);
      setSelectedSpendingIds([]);
      fetchSpendingConfigs();
    } catch (error) {
      Alert.alert('Gabim', error.message || 'Gabim në caktimin e konfigurimeve të shpenzimeve');
    }
  };

  const toggleSpendingSelection = (id) => {
    if (selectedSpendingIds.includes(id)) {
      setSelectedSpendingIds(selectedSpendingIds.filter((sid) => sid !== id));
    } else {
      setSelectedSpendingIds([...selectedSpendingIds, id]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Po ngarkohet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
      }
    >
      {/* Problem Options Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Opsionet e Problemeve</Text>
            <Text style={styles.sectionDescription}>
              Krijoni dhe menaxhoni llojet e problemeve që banorët mund të raportojnë
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateProblemModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {problemOptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nuk ka opsione problemeësh</Text>
            <Text style={styles.emptyText}>Filloni duke krijuar një opsion problemi.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {problemOptions.map((option) => (
              <View key={option.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  {option.description && (
                    <Text style={styles.cardDescription}>{option.description}</Text>
                  )}
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {option.properties?.length || 0} Prona
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openEditProblemDialog(option)}
                    >
                      <Ionicons name="pencil" size={18} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteProblemOption(option)}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Spending Configurations Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Konfigurimet e Shpenzimeve</Text>
            <Text style={styles.sectionDescription}>
              Menaxhoni limitet e shpenzimeve dhe konfigurimet për pronat
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateSpendingModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {spendingConfigs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nuk ka konfigurime shpenzimesh</Text>
            <Text style={styles.emptyText}>Filloni duke krijuar një konfigurim shpenzimesh.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {spendingConfigs.map((config) => (
              <View key={config.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{config.title}</Text>
                  {config.description && (
                    <Text style={styles.cardDescription}>{config.description}</Text>
                  )}
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {config.properties?.length || 0} Prona
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openEditSpendingDialog(config)}
                    >
                      <Ionicons name="pencil" size={18} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteSpendingConfig(config)}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Property Assignment Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Cakto te Pronat</Text>
            <Text style={styles.sectionDescription}>
              Konfiguroni cilat opsione problemesh dhe konfigurime shpenzimesh janë në dispozicion për çdo pronë
            </Text>
          </View>
        </View>

        {properties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nuk ka prona të disponueshme</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {properties.map((property) => (
              <View key={property.id} style={styles.propertyCard}>
                <View style={styles.propertyHeader}>
                  <View style={styles.propertyIconContainer}>
                    <Ionicons name="business" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyName} numberOfLines={1}>
                      {property.name}
                    </Text>
                    <Text style={styles.propertyAddress} numberOfLines={1}>
                      {property.address}
                    </Text>
                  </View>
                </View>
                <View style={styles.propertyActions}>
                  <TouchableOpacity
                    style={[styles.propertyButton, styles.problemButton]}
                    onPress={() => openAssignProblemDialog(property)}
                  >
                    <Text style={styles.propertyButtonText}>Opsionet e Problemeve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.propertyButton, styles.spendingButton]}
                    onPress={() => openAssignSpendingDialog(property)}
                  >
                    <Ionicons name="cash-outline" size={16} color="#10b981" />
                    <Text style={[styles.propertyButtonText, { color: '#10b981' }]}>
                      Shpenzimet
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Create Problem Option Modal */}
      <Modal
        visible={createProblemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateProblemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Krijo Opsion Problemi</Text>
              <TouchableOpacity onPress={() => setCreateProblemModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Shtoni një lloj të ri problemi që banorët mund të zgjedhin kur raportojnë çështje
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titulli *</Text>
              <TextInput
                style={styles.input}
                value={problemFormData.title}
                onChangeText={(text) => setProblemFormData({ ...problemFormData, title: text })}
                placeholder="p.sh., Problem Hidraulik"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Përshkrimi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={problemFormData.description}
                onChangeText={(text) => setProblemFormData({ ...problemFormData, description: text })}
                placeholder="Përshkrim opsional..."
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setCreateProblemModalVisible(false);
                  setProblemFormData({ title: '', description: '' });
                }}
              >
                <Text style={styles.buttonSecondaryText}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleCreateProblemOption}
              >
                <Text style={styles.buttonPrimaryText}>Krijo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Problem Option Modal */}
      <Modal
        visible={editProblemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditProblemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ndrysho Opsionin e Problemit</Text>
              <TouchableOpacity onPress={() => setEditProblemModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>Përditësoni detajet e opsionit të problemit</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titulli *</Text>
              <TextInput
                style={styles.input}
                value={problemFormData.title}
                onChangeText={(text) => setProblemFormData({ ...problemFormData, title: text })}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Përshkrimi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={problemFormData.description}
                onChangeText={(text) => setProblemFormData({ ...problemFormData, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setEditProblemModalVisible(false);
                  setSelectedProblemOption(null);
                  setProblemFormData({ title: '', description: '' });
                }}
              >
                <Text style={styles.buttonSecondaryText}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleUpdateProblemOption}
              >
                <Text style={styles.buttonPrimaryText}>Përditëso</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Problem Options Modal */}
      <Modal
        visible={assignProblemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignProblemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentLarge]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cakto Opsionet e Problemeve</Text>
              <TouchableOpacity onPress={() => setAssignProblemModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Zgjidhni cilat opsione problemesh janë në dispozicion për:{' '}
              <Text style={styles.propertyNameBold}>{selectedProperty?.name}</Text>
            </Text>
            <ScrollView style={styles.checkboxList}>
              {problemOptions.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nuk ka opsione problemesh në dispozicion. Krijoni disa fillimisht.
                </Text>
              ) : (
                problemOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.checkboxItem}
                    onPress={() => toggleProblemSelection(option.id)}
                  >
                    <Ionicons
                      name={selectedProblemIds.includes(option.id) ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedProblemIds.includes(option.id) ? '#6366f1' : '#94a3b8'}
                    />
                    <View style={styles.checkboxLabel}>
                      <Text style={styles.checkboxTitle}>{option.title}</Text>
                      {option.description && (
                        <Text style={styles.checkboxDescription}>{option.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setAssignProblemModalVisible(false);
                  setSelectedProperty(null);
                  setSelectedProblemIds([]);
                }}
              >
                <Text style={styles.buttonSecondaryText}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleAssignProblemsToProperty}
              >
                <Text style={styles.buttonPrimaryText}>Ruaj Caktimin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Spending Config Modal */}
      <Modal
        visible={createSpendingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateSpendingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Krijo Konfigurim Shpenzimesh</Text>
              <TouchableOpacity onPress={() => setCreateSpendingModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Vendosni një konfigurim të ri shpenzimesh për një pronë
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titulli *</Text>
              <TextInput
                style={styles.input}
                value={spendingFormData.title}
                onChangeText={(text) => setSpendingFormData({ ...spendingFormData, title: text })}
                placeholder="p.sh., Buxheti i Mirëmbajtjes"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Përshkrimi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={spendingFormData.description}
                onChangeText={(text) => setSpendingFormData({ ...spendingFormData, description: text })}
                placeholder="Përshkrim opsional..."
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setCreateSpendingModalVisible(false);
                  setSpendingFormData({ title: '', description: '' });
                }}
              >
                <Text style={styles.buttonSecondaryText}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleCreateSpendingConfig}
              >
                <Text style={styles.buttonPrimaryText}>Krijo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Spending Config Modal */}
      <Modal
        visible={editSpendingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditSpendingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ndrysho Konfigurimin e Shpenzimeve</Text>
              <TouchableOpacity onPress={() => setEditSpendingModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>Përditësoni detajet e konfigurimit të shpenzimeve</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titulli *</Text>
              <TextInput
                style={styles.input}
                value={spendingFormData.title}
                onChangeText={(text) => setSpendingFormData({ ...spendingFormData, title: text })}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Përshkrimi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={spendingFormData.description}
                onChangeText={(text) => setSpendingFormData({ ...spendingFormData, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setEditSpendingModalVisible(false);
                  setSelectedSpendingConfig(null);
                  setSpendingFormData({ title: '', description: '' });
                }}
              >
                <Text style={styles.buttonSecondaryText}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleUpdateSpendingConfig}
              >
                <Text style={styles.buttonPrimaryText}>Përditëso</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Spending Configs Modal */}
      <Modal
        visible={assignSpendingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignSpendingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentLarge]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cakto Konfigurimet e Shpenzimeve</Text>
              <TouchableOpacity onPress={() => setAssignSpendingModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Zgjidhni cilat konfigurime shpenzimesh janë në dispozicion për:{' '}
              <Text style={styles.propertyNameBold}>{selectedSpendingProperty?.name}</Text>
            </Text>
            <ScrollView style={styles.checkboxList}>
              {spendingConfigs.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nuk ka konfigurime shpenzimesh në dispozicion. Krijoni disa fillimisht.
                </Text>
              ) : (
                spendingConfigs.map((config) => (
                  <TouchableOpacity
                    key={config.id}
                    style={styles.checkboxItem}
                    onPress={() => toggleSpendingSelection(config.id)}
                  >
                    <Ionicons
                      name={selectedSpendingIds.includes(config.id) ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedSpendingIds.includes(config.id) ? '#6366f1' : '#94a3b8'}
                    />
                    <View style={styles.checkboxLabel}>
                      <Text style={styles.checkboxTitle}>{config.title}</Text>
                      {config.description && (
                        <Text style={styles.checkboxDescription}>{config.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setAssignSpendingModalVisible(false);
                  setSelectedSpendingProperty(null);
                  setSelectedSpendingIds([]);
                }}
              >
                <Text style={styles.buttonSecondaryText}>Anulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleAssignSpendingsToProperty}
              >
                <Text style={styles.buttonPrimaryText}>Ruaj Caktimin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    maxWidth: '80%',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#64748b',
  },
  propertyActions: {
    gap: 8,
  },
  propertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  problemButton: {
    borderColor: '#c7d2fe',
    backgroundColor: '#f8faff',
  },
  spendingButton: {
    borderColor: '#a7f3d0',
    backgroundColor: '#f0fdf9',
  },
  propertyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
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
    padding: 20,
    maxHeight: '90%',
  },
  modalContentLarge: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  propertyNameBold: {
    fontWeight: '600',
    color: '#1e293b',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#6366f1',
  },
  buttonSecondary: {
    backgroundColor: '#f1f5f9',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  checkboxList: {
    maxHeight: 300,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default PMConfigurationsScreen;

