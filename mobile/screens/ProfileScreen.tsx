import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { Settings, MapPin, Star, Trophy, Target, LogOut, Edit3, ChevronRight, Flame, Calendar, Clock, Users, Sparkles, Crown, MessageCircle, ArrowLeft, X } from 'lucide-react-native'
import Animated, { FadeInDown, FadeInUp, SlideInRight, ZoomIn, BounceIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate, Extrapolate, withSpring } from 'react-native-reanimated'
import { createClient } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'
import { scale } from '../utils/responsive'
import { useUser } from '../src/services/hooks/useUser'
import * as Location from 'expo-location'
import { useMap } from '../src/services/hooks/useMap'

const { width } = Dimensions.get('window')

interface User {
  id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  languages_speak: string[]
  languages_learn: string[]
  city: string | null
}

// Animated floating particles component
const FloatingParticle = ({ delay = 0, size = 4 }: { delay?: number; size?: number }) => {
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-100, { duration: 3000 + delay * 100 }),
      -1,
      false
    )
    opacity.value = withRepeat(
      withTiming(0, { duration: 3000 + delay * 100 }),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  const startLeft = Math.random() * width
  const startTop = Dimensions.get('window').height * 0.8

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.accent.primary,
          left: startLeft,
          top: startTop,
        },
        animatedStyle,
      ]}
    />
  )
}

// Animated stat card component
const AnimatedStatCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)}>
      {children}
    </Animated.View>
  )
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Helper function to get language flag emoji
// Handles both language codes (en, nl, es) and full names (English, Dutch, Spanish)
function getLanguageFlag(lang: string): string {
  const flagMap: Record<string, string> = {
    // Language codes (from database)
    'en': '🇬🇧',
    'nl': '🇳🇱',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ja': '🇯🇵',
    'ar': '🇸🇦',
    'sv': '🇸🇪',
    // Full names (fallback)
    'English': '🇬🇧',
    'Dutch': '🇳🇱',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Portuguese': '🇵🇹',
    'Japanese': '🇯🇵',
    'Arabic': '🇸🇦',
    'Swedish': '🇸🇪',
  }
  return flagMap[lang] || '🌍'
}

export default function ProfileScreen() {
  const navigation = useNavigation()
  const pulseScale = useSharedValue(1)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [languageModalVisible, setLanguageModalVisible] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  
  // Use real backend hook
  const { user, loading: isLoading, error } = useUser()
  const { users: mapNearbyUsers } = useMap({
    distance: 50,
    availableNow: false,
    languages: [],
    skillLevel: [],
  })

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    )
  }, [])

  // Get user's current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          console.log('Location permission denied')
          return
        }
        const location = await Location.getCurrentPositionAsync({})
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      } catch (error) {
        console.error('Error getting location:', error)
      }
    })()
  }, [])

  // Fetch nearby users when language is selected
  useEffect(() => {
    if (selectedLanguage && userLocation && mapNearbyUsers) {
      // Filter nearby users from map hook by selected language
      const filtered = mapNearbyUsers.filter((u: any) => 
        (u.languages_speak || []).includes(selectedLanguage) ||
        (u.languages_learn || []).includes(selectedLanguage)
      )
      setNearbyUsers(filtered)
    } else {
      setNearbyUsers([])
    }
  }, [selectedLanguage, userLocation, mapNearbyUsers])

  const handleLanguageClick = (language: string) => {
    setSelectedLanguage(language)
    setLanguageModalVisible(true)
  }

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = createClient()
              const { error } = await supabase.auth.signOut()
              if (error) {
                console.error('Logout error:', error)
                Alert.alert('Error', 'Failed to log out. Please try again.')
              } else {
                // Navigation will be handled by auth state listener in App.tsx
                console.log('Logged out successfully')
              }
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Error', 'Failed to log out. Please try again.')
            }
          },
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <LinearGradient
        colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.loadingContainer} edges={['top']}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Back Button Header */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Map' as never)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Floating Particles Background */}
          <View style={styles.particlesContainer}>
            {[...Array(15)].map((_, i) => (
              <FloatingParticle key={i} delay={i * 200} size={Math.random() * 4 + 2} />
            ))}
          </View>

          {/* Profile Header - Modern Design with Animations */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              {/* Animated rings around avatar */}
              <Animated.View style={[styles.avatarRing1, avatarAnimatedStyle]} />
              <Animated.View style={[styles.avatarRing2, avatarAnimatedStyle]} />
              <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarLarge}
                >
                  <Text style={styles.avatarLargeText}>{user?.full_name?.[0] || 'U'}</Text>
                </LinearGradient>
                {/* Online indicator */}
                <View style={styles.onlineIndicatorLarge} />
                {/* Crown badge for high level */}
                <View style={styles.crownBadge}>
                  <Crown size={16} color={Colors.accent.warning} fill={Colors.accent.warning} />
                </View>
              </Animated.View>
            </View>
            
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
              {user?.city && (
                <View style={styles.locationRow}>
                  <MapPin size={16} color={Colors.accent.primary} />
                  <Text style={styles.locationText}>{user.city}</Text>
                </View>
              )}
            </Animated.View>
            
            {user?.bio && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.bioContainer}>
                <Text style={styles.bioText}>{user.bio}</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Stats Cards - Modern Animated Design */}
          <View style={styles.statsContainer}>
            <AnimatedStatCard delay={300}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <View style={styles.statIconContainer}>
                  <Trophy size={32} color={Colors.text.primary} />
                </View>
                <Text style={styles.statValueLarge}>Level 17</Text>
                <Text style={styles.statLabelLarge}>Language Master</Text>
                <View style={styles.progressBar}>
                  <Animated.View 
                    entering={SlideInRight.delay(500).duration(800)}
                    style={[styles.progressFill, { width: '67%' }]} 
                  />
                </View>
                <Text style={styles.progressText}>2,340 / 3,500 XP to Level 18</Text>
              </LinearGradient>
            </AnimatedStatCard>

            <AnimatedStatCard delay={400}>
              <LinearGradient
                colors={['#f59e0b', '#ef4444', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <Animated.View 
                  style={[
                    styles.flameContainer,
                    { transform: [{ scale: pulseScale }] }
                  ]}
                >
                  <Flame size={48} color={Colors.text.primary} fill={Colors.accent.warning} />
                </Animated.View>
                <Text style={styles.statValueLarge}>24</Text>
                <Text style={styles.statLabelLarge}>Day Streak</Text>
                <View style={styles.streakSparkles}>
                  <Sparkles size={16} color={Colors.accent.warning} />
                  <Text style={styles.streakText}>Keep it going!</Text>
                </View>
              </LinearGradient>
            </AnimatedStatCard>
          </View>

          {/* Quick Stats - Compact Design */}
          <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.quickStats}>
            <Animated.View entering={SlideInRight.delay(600).duration(300)} style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.1)']}
                style={styles.quickStatCardGradient}
              >
                <Star size={24} color={Colors.accent.warning} fill={Colors.accent.warning} />
                <Text style={styles.quickStatValue}>4.8</Text>
                <Text style={styles.quickStatLabel}>Rating</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(700).duration(300)} style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.quickStatCardGradient}
              >
                <Trophy size={24} color={Colors.accent.secondary} fill={Colors.accent.secondary} />
                <Text style={styles.quickStatValue}>12</Text>
                <Text style={styles.quickStatLabel}>Achievements</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(800).duration(300)} style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
                style={styles.quickStatCardGradient}
              >
                <Target size={24} color={Colors.accent.success} fill={Colors.accent.success} />
                <Text style={styles.quickStatValue}>45</Text>
                <Text style={styles.quickStatLabel}>Sessions</Text>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* Languages - Animated Cards */}
          <Animated.View entering={FadeInUp.delay(900).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MessageCircle size={20} color={Colors.accent.success} />
              <Text style={styles.sectionTitle}>Languages I Speak</Text>
            </View>
            <View style={styles.languagesContainer}>
              {user?.languages_speak?.map((lang, idx) => {
                const scale = useSharedValue(1)
                const animatedStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: scale.value }],
                }))
                
                return (
                  <Animated.View
                    key={idx}
                    entering={SlideInRight.delay(1000 + idx * 100).duration(300)}
                    style={styles.languageCard}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPressIn={() => {
                        scale.value = withSpring(0.95)
                      }}
                      onPressOut={() => {
                        scale.value = withSpring(1)
                      }}
                      onPress={() => handleLanguageClick(lang)}
                    >
                      <Animated.View style={animatedStyle}>
                        <LinearGradient
                          colors={['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)']}
                          style={styles.languageBadge}
                        >
                          <Animated.View entering={ZoomIn.delay(200).duration(400)}>
                            <Text style={styles.languageEmoji}>{getLanguageFlag(lang)}</Text>
                          </Animated.View>
                          <Text style={styles.languageText}>{lang}</Text>
                          <View style={styles.languageBadgeTag}>
                            <Text style={styles.languageBadgeTagText}>CAN TEACH</Text>
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                )
              }) || (
                <Text style={styles.emptyText}>No languages added</Text>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(1200).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={20} color={Colors.accent.primary} />
              <Text style={styles.sectionTitle}>Languages I'm Learning</Text>
            </View>
            <View style={styles.languagesContainer}>
              {user?.languages_learn?.map((lang, idx) => {
                const scale = useSharedValue(1)
                const animatedStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: scale.value }],
                }))
                
                return (
                  <Animated.View
                    key={idx}
                    entering={SlideInRight.delay(1300 + idx * 100).duration(300)}
                    style={styles.languageCard}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPressIn={() => {
                        scale.value = withSpring(0.95)
                      }}
                      onPressOut={() => {
                        scale.value = withSpring(1)
                      }}
                      onPress={() => handleLanguageClick(lang)}
                    >
                      <Animated.View style={animatedStyle}>
                        <LinearGradient
                          colors={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)']}
                          style={[styles.languageBadge, styles.languageBadgeLearning]}
                        >
                          <Animated.View entering={ZoomIn.delay(200).duration(400)}>
                            <Text style={styles.languageEmoji}>{getLanguageFlag(lang)}</Text>
                          </Animated.View>
                          <Text style={styles.languageText}>{lang}</Text>
                          <View style={[styles.languageBadgeTag, styles.languageBadgeTagLearning]}>
                            <Text style={[styles.languageBadgeTagText, styles.languageBadgeTagTextLearning]}>LEARNING</Text>
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                )
              }) || (
                <Text style={styles.emptyText}>No languages added</Text>
              )}
            </View>
          </Animated.View>

          {/* Menu Items - Animated with Icons */}
          <Animated.View entering={FadeInUp.delay(1500).duration(400)} style={styles.menuSection}>
            {[
              { icon: Edit3, label: 'Edit Profile', color: Colors.accent.primary, delay: 1600 },
              { icon: Target, label: 'Progress', color: Colors.accent.success, delay: 1700 },
              { icon: Trophy, label: 'Challenges', color: Colors.accent.secondary, delay: 1800 },
              { icon: Settings, label: 'Settings', color: Colors.text.secondary, delay: 1900 },
            ].map((item, idx) => (
              <Animated.View
                key={idx}
                entering={SlideInRight.delay(item.delay).duration(300)}
              >
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconContainer, { backgroundColor: `${item.color}20` }]}>
                      <item.icon size={20} color={item.color} />
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </View>
                  <ChevronRight size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Logout Button */}
          <Animated.View entering={FadeInUp.delay(2000).duration(400)}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
              <LogOut size={20} color={Colors.accent.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Language Details Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setLanguageModalVisible(false)}
          >
            <Animated.View 
              entering={ZoomIn.springify().damping(20).stiffness(300)}
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setLanguageModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <Text style={styles.modalTitle}>{selectedLanguage}</Text>
                <View style={styles.modalFlagContainer}>
                  <Text style={styles.modalFlag}>{getLanguageFlag(selectedLanguage || '')}</Text>
                </View>
              </Animated.View>

            {userLocation && nearbyUsers.length > 0 ? (
              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.modalUsersList}>
                <Text style={styles.modalSubtitle}>
                  {nearbyUsers.length} {nearbyUsers.length === 1 ? 'person' : 'people'} nearby speak {selectedLanguage}
                </Text>
                <ScrollView style={styles.usersScrollView}>
                  {nearbyUsers.map((nearbyUser, idx) => {
                    const distance = userLocation 
                      ? calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          nearbyUser.latitude || 0,
                          nearbyUser.longitude || 0
                        )
                      : 0
                    
                    return (
                      <Animated.View
                        key={nearbyUser.id}
                        entering={SlideInRight.delay(300 + idx * 100).duration(300)}
                        style={styles.modalUserCard}
                      >
                        <View style={styles.modalUserInfo}>
                          <View style={styles.modalUserAvatar}>
                            <Text style={styles.modalUserAvatarText}>
                              {nearbyUser.full_name?.[0] || 'U'}
                            </Text>
                          </View>
                          <View style={styles.modalUserDetails}>
                            <Text style={styles.modalUserName}>{nearbyUser.full_name || 'User'}</Text>
                            <View style={styles.modalUserLocation}>
                              <MapPin size={14} color={Colors.text.tertiary} />
                              <Text style={styles.modalUserLocationText}>{nearbyUser.city || 'Unknown'}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.modalDistanceBadge}>
                          <Text style={styles.modalDistanceText}>{formatDistance(distance)}</Text>
                        </View>
                      </Animated.View>
                    )
                  })}
                </ScrollView>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.modalEmptyState}>
                <Text style={styles.modalEmptyText}>
                  {userLocation 
                    ? 'No nearby users found for this language'
                    : 'Enable location to find nearby users'}
                </Text>
              </Animated.View>
            )}
            </Animated.View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(8),
    paddingBottom: scale(8),
    zIndex: 10,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    zIndex: 3,
  },
  avatarRing1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    zIndex: 1,
  },
  avatarRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    zIndex: 0,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.text.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  onlineIndicatorLarge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent.success,
    borderWidth: 3,
    borderColor: Colors.text.primary,
    zIndex: 4,
  },
  crownBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent.warning,
    zIndex: 4,
  },
  bioContainer: {
    marginTop: 12,
    paddingHorizontal: 32,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  bioText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 16,
  },
  statCardGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  flameContainer: {
    marginBottom: 12,
  },
  streakSparkles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  streakText: {
    fontSize: 12,
    color: Colors.text.primary,
    opacity: 0.9,
    fontWeight: '600',
  },
  statValueLarge: {
    fontSize: 56,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  statLabelLarge: {
    fontSize: 18,
    color: Colors.text.primary,
    opacity: 0.9,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.text.primary,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: Colors.text.primary,
    opacity: 0.8,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  quickStatCardGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageCard: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  languageBadge: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    gap: 8,
  },
  languageBadgeLearning: {
    // Different gradient for learning
  },
  languageEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  languageBadgeTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  languageBadgeTagLearning: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  languageBadgeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent.success,
    letterSpacing: 0.5,
  },
  languageBadgeTagTextLearning: {
    color: Colors.accent.primary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface.glass,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.glass,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent.error,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalFlagContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalFlag: {
    fontSize: 64,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalUsersList: {
    flex: 1,
  },
  usersScrollView: {
    maxHeight: 300,
  },
  modalUserCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface.glass,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  modalUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalUserAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  modalUserDetails: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  modalUserLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalUserLocationText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  modalDistanceBadge: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalDistanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalEmptyState: {
    padding: 32,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
})
