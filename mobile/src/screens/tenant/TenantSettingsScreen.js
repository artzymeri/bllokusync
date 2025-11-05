import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import userService from '../../services/user.service';
import AuthService from '../../services/auth.service';

const TenantSettingsScreen = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    number: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        number: user.number || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.name.trim()) {
      Alert.alert('Gabim', 'Emri është i detyrueshëm');
      return false;
    }
    if (!formData.surname.trim()) {
      Alert.alert('Gabim', 'Mbiemri është i detyrueshëm');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Gabim', 'Email është i detyrueshëm');
      return false;
    }

    // Validate password fields if changing password
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        Alert.alert('Gabim', 'Fjalëkalimi aktual është i nevojshëm për të ndryshuar fjalëkalimin');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        Alert.alert('Gabim', 'Fjalëkalimet e reja nuk përputhen');
        return false;
      }
      if (formData.newPassword.length < 6) {
        Alert.alert('Gabim', 'Fjalëkalimi i ri duhet të jetë të paktën 6 karaktere');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare update data
      const updateData = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        number: formData.number,
      };

      // Add password fields if changing
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
        updateData.currentPassword = formData.currentPassword;
      }

      const updatedUser = await userService.updateOwnProfile(updateData);
      
      Alert.alert('Sukses', 'Profili u përditësua me sukses');

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Update user data in parent component
      if (onUpdateUser) {
        // Fetch fresh user data
        const userData = await AuthService.getCurrentUser();
        onUpdateUser(userData);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Gabim', error.message || 'Dështoi përditësimi i profilit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Informacioni Personal</Text>
          <Text style={styles.cardDescription}>Përditëso detajet e tua personale</Text>
        </View>

        <View style={styles.cardContent}>
          {/* Name and Surname */}
          <View style={styles.row}>
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-outline" size={16} color="#64748b" />
                <Text style={styles.label}>Emri</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Shkruaj emrin tënd"
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-outline" size={16} color="#64748b" />
                <Text style={styles.label}>Mbiemri</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.surname}
                onChangeText={(text) => handleInputChange('surname', text)}
                placeholder="Shkruaj mbiemrin tënd"
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="mail-outline" size={16} color="#64748b" />
              <Text style={styles.label}>Email</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Shkruaj email-in tënd"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text style={styles.label}>Numri i Telefonit</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.number}
              onChangeText={(text) => handleInputChange('number', text)}
              placeholder="Shkruaj numrin e telefonit"
              keyboardType="phone-pad"
              editable={!loading}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Change Password Section */}
          <View style={styles.passwordSection}>
            <View style={styles.passwordHeader}>
              <Ionicons name="lock-closed-outline" size={20} color="#1e293b" />
              <Text style={styles.passwordTitle}>Ndrysho Fjalëkalimin</Text>
            </View>
            <Text style={styles.passwordDescription}>
              Lëre bosh nëse nuk dëshiron të ndryshosh fjalëkalimin
            </Text>

            {/* Current Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fjalëkalimi Aktual</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.currentPassword}
                  onChangeText={(text) => handleInputChange('currentPassword', text)}
                  placeholder="Shkruaj fjalëkalimin aktual"
                  autoComplete="current-password"
                  textContentType="password"
                  secureTextEntry={!showPasswords.currentPassword}
                  editable={!loading}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility('currentPassword')}
                  disabled={loading}
                  style={styles.eyeIconContainer}
                >
                  <Ionicons
                    name={showPasswords.currentPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password and Confirm */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fjalëkalimi i Ri</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.newPassword}
                  onChangeText={(text) => handleInputChange('newPassword', text)}
                  placeholder="Shkruaj fjalëkalimin e ri"
                  autoComplete="password"
                  textContentType="password"
                  secureTextEntry={!showPasswords.newPassword}
                  editable={!loading}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility('newPassword')}
                  disabled={loading}
                  style={styles.eyeIconContainer}
                >
                  <Ionicons
                    name={showPasswords.newPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Konfirmo Fjalëkalimin</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  placeholder="Konfirmo fjalëkalimin e ri"
                  autoComplete="password"
                  textContentType="password"
                  secureTextEntry={!showPasswords.confirmPassword}
                  editable={!loading}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility('confirmPassword')}
                  disabled={loading}
                  style={styles.eyeIconContainer}
                >
                  <Ionicons
                    name={showPasswords.confirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Ruaj Ndryshimet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  cardContent: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroup: {
    flex: 1,
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
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
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 24,
  },
  passwordSection: {
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  passwordTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  passwordDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TenantSettingsScreen;
