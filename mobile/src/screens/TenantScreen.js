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

const TenantScreen = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  const handleNavigate = (route) => {
    setCurrentRoute(route);
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <TenantDashboardScreen />;
      case 'payments':
        return <TenantPaymentsScreen />;
      case 'report-problem':
        return <TenantReportProblemScreen />;
      case 'complaints':
        return <TenantComplaintsScreen />;
      case 'suggestions':
        return <TenantSuggestionsScreen />;
      case 'monthly-reports':
        return <TenantMonthlyReportsScreen />;
      default:
        return <TenantDashboardScreen />;
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
