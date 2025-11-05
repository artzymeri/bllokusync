import React, { useState } from 'react';
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

const TenantScreen = ({ user, onLogout, onUpdateUser }) => {
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  const handleNavigate = (route) => {
    setCurrentRoute(route);
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <TenantDashboardScreen user={user} />;
      case 'payments':
        return <TenantPaymentsScreen user={user} />;
      case 'reports':
        return <TenantReportProblemScreen user={user} />;
      case 'complaints':
        return <TenantComplaintsScreen user={user} />;
      case 'suggestions':
        return <TenantSuggestionsScreen user={user} />;
      case 'monthly-reports':
        return <TenantMonthlyReportsScreen />;
      case 'settings':
        return <TenantSettingsScreen user={user} onUpdateUser={onUpdateUser} />;
      default:
        return <TenantDashboardScreen user={user} />;
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
