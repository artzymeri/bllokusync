import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TenantService from '../../services/tenant.service';

const TenantMonthlyReportsScreen = ({ hasAccess: initialAccess }) => {
  const [loading, setLoading] = useState(!initialAccess);
  const [hasAccess, setHasAccess] = useState(initialAccess || false);

  useEffect(() => {
    // Double-check access if not provided initially
    if (!initialAccess) {
      checkAccess();
    }
  }, [initialAccess]);

  const checkAccess = async () => {
    try {
      const access = await TenantService.hasMonthlyReportsAccess();
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Duke kontrolluar aksesin...</Text>
      </View>
    );
  }

  // Show access restricted message if tenant doesn't have access
  if (!hasAccess) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.blockedAccessCard}>
          <View style={styles.blockedIconContainer}>
            <Ionicons name="lock-closed" size={64} color="#64748b" />
          </View>
          <Text style={styles.blockedTitle}>Aksesi i Kufizuar</Text>
          <Text style={styles.blockedDescription}>
            Menaxheri i pronës ka çaktivizuar aksesin në raportet mujore për këtë pronë.
          </Text>
          <Text style={styles.blockedSubtext}>
            Nëse mendoni se ky është gabim, ju lutemi kontaktoni menaxherin e pronës.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Show monthly reports (empty state for now - will be implemented later)
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Raportet Mujore</Text>

      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyText}>Asnjë raport mujor</Text>
        <Text style={styles.emptySubtext}>Raportet mujore do të shfaqen këtu</Text>
      </View>
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
  centerContainer: {
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  blockedAccessCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 40,
  },
  blockedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  blockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  blockedDescription: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  blockedSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
});

export default TenantMonthlyReportsScreen;
