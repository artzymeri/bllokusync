import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import PMLayout from '../layouts/PMLayout';
import PMDashboardScreen from './pm/PMDashboardScreen';
import PMPropertiesScreen from './pm/PMPropertiesScreen';
import PMPropertyDetailsScreen from './pm/PMPropertyDetailsScreen';
import PMEditPropertyScreen from './pm/PMEditPropertyScreen';
import PMTenantsScreen from './pm/PMTenantsScreen';
import PMTenantDetailsScreen from './pm/PMTenantDetailsScreen';
import PMEditTenantScreen from './pm/PMEditTenantScreen';
import PMPaymentsScreen from './pm/PMPaymentsScreen';
import PMMonthlyReportsScreen from './pm/PMMonthlyReportsScreen';
import PMReportsScreen from './pm/PMReportsScreen';
import PMComplaintsScreen from './pm/PMComplaintsScreen';
import PMSuggestionsScreen from './pm/PMSuggestionsScreen';
import PMConfigurationsScreen from './pm/PMConfigurationsScreen';

const PropertyManagerScreen = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [routeParams, setRouteParams] = useState({});

  const handleNavigate = (route, params = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
  };

  // Create navigation object to pass to child screens
  const navigation = {
    navigate: handleNavigate
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <PMDashboardScreen navigation={navigation} user={user} />;
      case 'properties':
        return <PMPropertiesScreen navigation={navigation} />;
      case 'property-details':
        return <PMPropertyDetailsScreen navigation={navigation} propertyId={routeParams.propertyId} />;
      case 'edit-property':
        return <PMEditPropertyScreen navigation={navigation} propertyId={routeParams.propertyId} />;
      case 'tenants':
        return <PMTenantsScreen navigation={navigation} />;
      case 'tenant-details':
        return <PMTenantDetailsScreen navigation={navigation} tenantId={routeParams.tenantId} />;
      case 'edit-tenant':
        return <PMEditTenantScreen navigation={navigation} tenantId={routeParams.tenantId} />;
      case 'payments':
        return <PMPaymentsScreen navigation={navigation} />;
      case 'monthly-reports':
        return <PMMonthlyReportsScreen navigation={navigation} />;
      case 'reports':
        return <PMReportsScreen navigation={navigation} />;
      case 'complaints':
        return <PMComplaintsScreen navigation={navigation} />;
      case 'suggestions':
        return <PMSuggestionsScreen navigation={navigation} />;
      case 'configurations':
        return <PMConfigurationsScreen navigation={navigation} />;
      default:
        return <PMDashboardScreen navigation={navigation} user={user} />;
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
