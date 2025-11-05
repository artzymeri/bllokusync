import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/auth.service';
import TenantService from '../services/tenant.service';

const TenantLayout = ({ children, currentRoute, onNavigate, user, onLogout }) => {
  const [menuVisible, setMenuVisible] = useState(false);
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

  // Base navigation items
  const baseNavigationItems = [
    { id: 'dashboard', icon: 'home', label: 'Paneli Kryesor', route: 'dashboard' },
    { id: 'payments', icon: 'cash', label: 'Pagesat e Mia', route: 'payments' },
    { id: 'reports', icon: 'alert-circle', label: 'Raportet', route: 'reports' },
    { id: 'complaints', icon: 'chatbox', label: 'Ankesat', route: 'complaints' },
    { id: 'suggestions', icon: 'bulb', label: 'Sugjerimet', route: 'suggestions' },
  ];

  // Conditionally add monthly reports if tenant has access
  const navigationItems = hasMonthlyReportsAccess
    ? [
        ...baseNavigationItems,
        { id: 'monthly-reports', icon: 'document-text', label: 'Raportet Mujore', route: 'monthly-reports' },
      ]
    : baseNavigationItems;

  // Add settings at the end
  navigationItems.push({ id: 'settings', icon: 'settings', label: 'Cilësimet', route: 'settings' });

  const handleLogout = () => {
    Alert.alert(
      'Dil',
      'A jeni i sigurt që dëshironi të dilni?',
      [
        {
          text: 'Anulo',
          style: 'cancel',
        },
        {
          text: 'Dil',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              onLogout();
            } catch (error) {
              console.error('Logout error:', error);
              onLogout();
            }
          },
        },
      ]
    );
  };

  const handleNavigation = (route) => {
    setMenuVisible(false);
    onNavigate(route);
  };

  const getCurrentPageTitle = () => {
    const allItems = [
      ...baseNavigationItems,
      { id: 'monthly-reports', icon: 'document-text', label: 'Raportet Mujore', route: 'monthly-reports' },
      { id: 'settings', icon: 'settings', label: 'Cilësimet', route: 'settings' },
    ];
    const item = allItems.find(item => item.route === currentRoute);
    return item ? item.label : 'Paneli Kryesor';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getCurrentPageTitle()}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Sidebar Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.sidebarSafeArea}>
            <View style={styles.sidebar}>
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.sidebarHeaderContent}>
                  <Text style={styles.sidebarTitle}>BllokuSync</Text>
                  <View style={styles.sidebarBadge}>
                    <Text style={styles.sidebarBadgeText}>Tenant</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setMenuVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sidebarContent}>
                {/* Navigation Items */}
                <View style={styles.navSection}>
                  {navigationItems.map((item) => {
                    const isActive = currentRoute === item.route;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.navItem,
                          isActive && styles.navItemActive,
                        ]}
                        onPress={() => handleNavigation(item.route)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={isActive ? '#065f46' : '#d1fae5'}
                        />
                        <Text
                          style={[
                            styles.navItemText,
                            isActive && styles.navItemTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* User Profile Section */}
              <View style={styles.sidebarFooter}>
                <TouchableOpacity 
                  style={styles.userInfo}
                  onPress={() => {
                    setMenuVisible(false);
                    onNavigate('settings');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {user?.name?.[0]}{user?.surname?.[0]}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user?.name} {user?.surname}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user?.email}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1fae5" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color="#f87171" />
                  <Text style={styles.logoutText}>Dil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  sidebarSafeArea: {
    width: 280,
    backgroundColor: '#047857',
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#047857',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#065f46',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#059669',
  },
  sidebarHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  sidebarBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sidebarBadgeText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
  },
  navSection: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#fff',
  },
  navItemText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#d1fae5',
  },
  navItemTextActive: {
    color: '#065f46',
    fontWeight: '600',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#059669',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#065f46',
    padding: 12,
    borderRadius: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#d1fae5',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#065f46',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f87171',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#f87171',
  },
});

export default TenantLayout;
