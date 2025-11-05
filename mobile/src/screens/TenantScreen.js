import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import TenantLayout from '../layouts/TenantLayout';
import TenantDashboardScreen from './tenant/TenantDashboardScreen';
import TenantPaymentsScreen from './tenant/TenantPaymentsScreen';
import TenantReportProblemScreen from './tenant/TenantReportProblemScreen';
import TenantComplaintsScreen from './tenant/TenantComplaintsScreen';
import TenantSuggestionsScreen from './tenant/TenantSuggestionsScreen';
import TenantMonthlyReportsScreen from './tenant/TenantMonthlyReportsScreen';
import TenantSettingsScreen from './tenant/TenantSettingsScreen';
import TenantService from '../services/tenant.service';

const TenantScreen = ({ user, onLogout, onUpdateUser }) => {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [hasMonthlyReportsAccess, setHasMonthlyReportsAccess] = useState(false);

  // Check monthly reports access when component mounts
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const hasAccess = await TenantService.hasMonthlyReportsAccess();
        setHasMonthlyReportsAccess(hasAccess);
      } catch (error) {
        console.error('Error checking monthly reports access:', error);
        setHasMonthlyReportsAccess(false);
      }
    };

    checkAccess();
  }, []);

  const handleNavigate = (route) => {
    // Prevent navigation to monthly reports if access is denied
    if (route === 'monthly-reports' && !hasMonthlyReportsAccess) {
      return;
    }
    setCurrentRoute(route);
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <TenantDashboardScreen user={user} onNavigate={handleNavigate} />;
      case 'payments':
        return <TenantPaymentsScreen user={user} />;
      case 'reports':
        return <TenantReportProblemScreen user={user} />;
      case 'complaints':
        return <TenantComplaintsScreen user={user} />;
      case 'suggestions':
        return <TenantSuggestionsScreen user={user} />;
      case 'monthly-reports':
        // Only show monthly reports if tenant has access
        return hasMonthlyReportsAccess ? (
          <TenantMonthlyReportsScreen hasAccess={hasMonthlyReportsAccess} />
        ) : (
          <TenantDashboardScreen user={user} onNavigate={handleNavigate} />
        );
      case 'settings':
        return <TenantSettingsScreen user={user} onUpdateUser={onUpdateUser} />;
      default:
        return <TenantDashboardScreen user={user} onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TenantLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          user={user}
          onLogout={onLogout}
        >
          {renderScreen()}
        </TenantLayout>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
});

export default TenantScreen;
