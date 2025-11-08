import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Phone, Globe, Users } from 'lucide-react-native'
import { scale, wp, hp } from '../utils/responsive'
import { createClient } from '../lib/supabase'
import Animated, { FadeInDown, SlideInRight, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

// Floating particle component
const FloatingParticle = ({ delay = 0, size = 4, color = '#8b5cf6' }: { delay?: number; size?: number; color?: string }) => {
  const translateY = useSharedValue(height * 0.8)
  const translateX = useSharedValue(Math.random() * width)
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-100, { duration: 4000 + delay * 100 }),
      -1,
      false
    )
    translateX.value = withRepeat(
      withTiming(translateX.value + (Math.random() - 0.5) * 100, { duration: 4000 + delay * 100 }),
      -1,
      true
    )
    opacity.value = withRepeat(
      withTiming(0, { duration: 4000 + delay * 100 }),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  )
}

// Speech bubble component
const SpeechBubble = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500)}
      style={styles.speechBubble}
    >
      <Text style={styles.speechBubbleText}>{text}</Text>
      <View style={styles.speechBubbleTail} />
    </Animated.View>
  )
}

interface SignUpScreenProps {
  navigation: any
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const particleColors = ['#ec4899', '#8b5cf6', '#60a5fa', '#34d399', '#fbbf24', '#ffffff']

  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
        },
      })

      if (signUpError) throw signUpError

      // Success - navigation handled by auth state listener
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Dark background */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating particles */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 200}
            size={Math.random() * 6 + 3}
            color={particleColors[i % particleColors.length]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header with illustrations */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
              {/* Character avatars */}
              <View style={styles.avatarsContainer}>
                <Animated.View entering={SlideInRight.delay(100).duration(400)} style={[styles.avatarCircle, { backgroundColor: '#ec4899' }]}>
                  <View style={styles.avatar}>
                    <Users size={32} color="#ffffff" />
                  </View>
                </Animated.View>
                <Animated.View entering={SlideInRight.delay(200).duration(400)} style={[styles.avatarCircle, { backgroundColor: '#ffffff' }]}>
                  <View style={styles.avatar}>
                    <Globe size={32} color="#8b5cf6" />
                  </View>
                </Animated.View>
                <Animated.View entering={SlideInRight.delay(300).duration(400)} style={[styles.avatarCircle, { backgroundColor: '#34d399' }]}>
                  <View style={styles.avatar}>
                    <Users size={32} color="#ffffff" />
                  </View>
                </Animated.View>
              </View>

              {/* Speech bubble */}
              <SpeechBubble text="Join our community!" delay={400} />

              {/* Title */}
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Start your language exchange journey</Text>
            </Animated.View>

            {/* Sign In Link */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.signInPrompt}>
              <Text style={styles.signInPromptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Name Input */}
            <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color="#ffffff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </Animated.View>

            {/* Email Input */}
            <Animated.View entering={FadeInDown.delay(650).duration(400)} style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#ffffff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </Animated.View>

            {/* Phone Input */}
            <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Phone size={20} color="#ffffff" style={styles.inputIcon} />
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇺🇸 +1</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    placeholder="Phone number"
                    placeholderTextColor="#94a3b8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                </View>
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View entering={FadeInDown.delay(750).duration(400)} style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#ffffff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#ffffff" />
                  ) : (
                    <Eye size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Confirm Password Input */}
            <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#ffffff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#ffffff" />
                  ) : (
                    <Eye size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Sign Up Button */}
            <Animated.View entering={FadeInDown.delay(850).duration(400)}>
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
                disabled={isLoading || !name || !email || !password || !confirmPassword}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signUpButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.signUpButtonText}>Create Account</Text>
                      <ArrowRight size={20} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingTop: hp(6),
    paddingBottom: hp(6),
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: scale(32),
    marginTop: scale(20),
  },
  avatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(20),
    marginBottom: scale(24),
    position: 'relative',
  },
  avatarCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechBubble: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: scale(20),
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    marginBottom: scale(24),
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  speechBubbleText: {
    color: '#ffffff',
    fontSize: scale(14),
    fontWeight: '500',
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(30, 41, 59, 0.8)',
  },
  title: {
    fontSize: scale(32),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: scale(8),
  },
  subtitle: {
    fontSize: scale(16),
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: scale(8),
  },
  signInPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  signInPromptText: {
    fontSize: scale(14),
    color: '#94a3b8',
  },
  signInLink: {
    fontSize: scale(14),
    color: '#8b5cf6',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: scale(16),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(16),
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: scale(12),
  },
  inputIcon: {
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: scale(16),
    color: '#ffffff',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  countryCode: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(8),
  },
  countryCodeText: {
    fontSize: scale(14),
    color: '#ffffff',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
  },
  eyeIcon: {
    padding: scale(4),
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(16),
  },
  errorText: {
    fontSize: scale(14),
    color: '#ef4444',
    textAlign: 'center',
  },
  signUpButton: {
    borderRadius: scale(16),
    marginTop: scale(8),
    marginBottom: scale(16),
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(18),
    paddingHorizontal: scale(32),
    gap: scale(8),
  },
  signUpButtonText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#ffffff',
  },
})

