import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AuthService from '../services/auth.service';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ onLoginSuccess }) => {
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animations for background grid (removed circle animations)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim1, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim1, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animated background gradient
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

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

  const floating1TranslateY = floatingAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const floating2TranslateY = floatingAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  // Background animation interpolations
  const backgroundColors = [
    { start: '#667eea', middle: '#764ba2', end: '#f093fb' },
    { start: '#f093fb', middle: '#667eea', end: '#764ba2' },
  ];

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient Layer 1 */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            opacity: backgroundAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 0.7, 1],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Animated Background Gradient Layer 2 */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            opacity: backgroundAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.6, 0],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['#f093fb', '#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Animated Background Gradient Layer 3 */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            transform: [
              {
                scale: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              },
            ],
            opacity: 0.3,
          },
        ]}
      >
        <LinearGradient
          colors={['#764ba2', '#f093fb', '#667eea']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Grid Pattern Background */}
      <Animated.View 
        style={[
          styles.gridContainer,
          {
            opacity: backgroundAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.15, 0.25],
            }),
          },
        ]}
      >
        {[...Array(10)].map((_, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {[...Array(10)].map((_, cellIndex) => (
              <View
                key={cellIndex}
                style={[
                  styles.gridCell,
                  (rowIndex + cellIndex) % 2 === 0 && styles.gridCellAlt,
                ]}
              />
            ))}
          </View>
        ))}
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Logo and Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/app_logo.png')}
                  style={[styles.logo, { tintColor: '#ffffff' }]}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Mirë se vini përsëri</Text>
              <Text style={styles.subtitle}>Hyni për të vazhduar</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Toggle Switch for Email/Phone */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, !isPhoneMode && styles.toggleButtonActive]}
                  onPress={() => !isPhoneMode || toggleMode()}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="mail"
                    size={18}
                    color={!isPhoneMode ? '#ffffff' : '#6b7280'}
                  />
                  <Text style={[styles.toggleLabel, !isPhoneMode && styles.toggleLabelActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, isPhoneMode && styles.toggleButtonActive]}
                  onPress={() => isPhoneMode || toggleMode()}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="call"
                    size={18}
                    color={isPhoneMode ? '#ffffff' : '#6b7280'}
                  />
                  <Text style={[styles.toggleLabel, isPhoneMode && styles.toggleLabelActive]}>
                    Telefon
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Email or Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name={isPhoneMode ? 'call-outline' : 'mail-outline'}
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={isPhoneMode ? 'Numri i telefonit' : 'Email'}
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
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Fjalëkalimi"
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
                    <Ionicons
                      name={isPasswordVisible ? 'eye' : 'eye-off'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Hyni</Text>
                      <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridCellAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 80,
  },
  contentContainer: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 0,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 140,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleLabelActive: {
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
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
    alignItems: 'center',
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
