import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/auth.service';

const LoginScreen = ({ onLoginSuccess }) => {
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validate inputs
    if (!emailOrPhone || !password) {
      Alert.alert('Gabim', 'Ju lutem plotësoni të gjitha fushat');
      return;
    }

    setIsLoading(true);

    try {
      const method = isPhoneMode ? 'phone' : 'email';
      const response = await AuthService.login(emailOrPhone, password, method);
      
      if (response.success) {
        Alert.alert('Sukses', 'Hyrja u krye me sukses!');
        onLoginSuccess(response.data);
      } else {
        Alert.alert('Gabim', response.message || 'Hyrja dështoi');
      }
    } catch (error) {
      Alert.alert(
        'Gabim',
        error.message || 'Ndodhi një gabim gjatë hyrjes. Ju lutem provoni përsëri.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsPhoneMode(!isPhoneMode);
    setEmailOrPhone('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/app_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Mirë se vini përsëri</Text>
        </View>

        <View style={styles.form}>
          {/* Toggle Switch for Email/Phone */}
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, !isPhoneMode && styles.activeToggleLabel]}>
              Email
            </Text>
            <Switch
              value={isPhoneMode}
              onValueChange={toggleMode}
              trackColor={{ false: '#3b82f6', true: '#3b82f6' }}
              thumbColor="#fff"
              ios_backgroundColor="#d1d5db"
              disabled={isLoading}
            />
            <Text style={[styles.toggleLabel, isPhoneMode && styles.activeToggleLabel]}>
              Telefon
            </Text>
          </View>

          {/* Email or Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {isPhoneMode ? 'Numri i Telefonit' : 'Email'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={isPhoneMode ? 'Vendosni numrin tuaj të telefonit' : 'Vendosni email-in tuaj'}
              placeholderTextColor="#9ca3af"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType={isPhoneMode ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              autoComplete={isPhoneMode ? 'tel' : 'email'}
              textContentType={isPhoneMode ? 'telephoneNumber' : 'emailAddress'}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fjalëkalimi</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Vendosni fjalëkalimin tuaj"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeButton}
                disabled={isLoading}
              >
                <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotPassword} disabled={isLoading}>
            <Text style={styles.forgotPasswordText}>Keni harruar fjalëkalimin?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Hyni</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Nuk keni llogari? </Text>
            <TouchableOpacity disabled={isLoading}>
              <Text style={styles.signupLink}>Regjistrohuni</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginHorizontal: 12,
  },
  activeToggleLabel: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeButton: {
    padding: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
