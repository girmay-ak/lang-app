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
import { ArrowRight, Mail, Lock, Eye, EyeOff, MessageCircle, Users } from 'lucide-react-native'
import { scale, wp, hp } from '../utils/responsive'
import { createClient } from '../lib/supabase'
import Animated, { FadeInDown, SlideInRight, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated'
import { authService } from '../src/services/api/auth.service'

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

interface LoginScreenProps {
  navigation: any
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const particleColors = ['#ec4899', '#8b5cf6', '#60a5fa', '#34d399', '#fbbf24', '#ffffff']

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
                    <MessageCircle size={32} color="#8b5cf6" />
                  </View>
                </Animated.View>
                <Animated.View entering={SlideInRight.delay(300).duration(400)} style={[styles.avatarCircle, { backgroundColor: '#34d399' }]}>
                  <View style={styles.avatar}>
                    <Users size={32} color="#ffffff" />
                  </View>
                </Animated.View>
              </View>

              {/* Speech bubble */}
              <SpeechBubble text="Let's practice!" delay={400} />

              {/* Title */}
              <Text style={styles.title}>Let's get you signed in!</Text>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.signUpPrompt}>
              <Text style={styles.signUpPromptText}>You don't have an account yet? </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Signup')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Email Input */}
            <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.inputContainer}>
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

            {/* Password Input */}
            <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.inputContainer}>
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
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Sign In Button */}
            <Animated.View entering={FadeInDown.delay(800).duration(400)}>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={async () => {
                  setIsLoading(true)
                  setError(null)
                  try {
                    if (!password) {
                      setError('Password is required')
                      setIsLoading(false)
                      return
                    }
                    await authService.signIn({ email, password })
                  } catch (err: any) {
                    setError(err.message || 'Failed to log in')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                disabled={isLoading || !email || !password}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.signInButtonText}>Sign In</Text>
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
    paddingTop: hp(8),
    paddingBottom: hp(6),
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: scale(40),
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
  signUpPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(32),
  },
  signUpPromptText: {
    fontSize: scale(14),
    color: '#94a3b8',
  },
  signUpLink: {
    fontSize: scale(14),
    color: '#8b5cf6',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: scale(20),
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
  eyeIcon: {
    padding: scale(4),
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: scale(8),
  },
  forgotPasswordText: {
    fontSize: scale(14),
    color: '#8b5cf6',
    fontWeight: '500',
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
  signInButton: {
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
  signInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(18),
    paddingHorizontal: scale(32),
    gap: scale(8),
  },
  signInButtonText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#ffffff',
  },
})
