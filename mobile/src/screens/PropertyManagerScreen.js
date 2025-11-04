import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import PMLayout from '../layouts/PMLayout';
import PMDashboardScreen from './pm/PMDashboardScreen';
import PMPropertiesScreen from './pm/PMPropertiesScreen';
import PMTenantsScreen from './pm/PMTenantsScreen';
import PMPaymentsScreen from './pm/PMPaymentsScreen';
import PMMonthlyReportsScreen from './pm/PMMonthlyReportsScreen';
import PMReportsScreen from './pm/PMReportsScreen';
import PMComplaintsScreen from './pm/PMComplaintsScreen';
import PMSuggestionsScreen from './pm/PMSuggestionsScreen';
import PMConfigurationsScreen from './pm/PMConfigurationsScreen';

const PropertyManagerScreen = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  const handleNavigate = (route) => {
    setCurrentRoute(route);
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <PMDashboardScreen />;
      case 'properties':
        return <PMPropertiesScreen />;
      case 'tenants':
        return <PMTenantsScreen />;
      case 'payments':
        return <PMPaymentsScreen />;
      case 'monthly-reports':
        return <PMMonthlyReportsScreen />;
      case 'reports':
        return <PMReportsScreen />;
      case 'complaints':
        return <PMComplaintsScreen />;
      case 'suggestions':
        return <PMSuggestionsScreen />;
      case 'configurations':
        return <PMConfigurationsScreen />;
      default:
        return <PMDashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <PMLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          user={user}
          onLogout={onLogout}
        >
          {renderScreen()}
        </PMLayout>
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

export default PropertyManagerScreen;
