import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import {
  ArrowLeft,
  Settings,
  ShoppingBag,
  Camera,
  MapPin,
  Share2,
  QrCode,
  Link as LinkIcon,
  BarChart3,
  Award,
  Star,
  Calendar,
  LogOut,
  Crown,
} from 'lucide-react-native'

import { Colors } from '../constants/Colors'
import { useNavigation } from '@react-navigation/native'
import { createClient } from '../lib/supabase'
import { useUser } from '../src/services/hooks/useUser'
import { scale } from '../utils/responsive'

type AvailabilityStatus = 'available' | 'busy' | 'offline'

interface LanguageDisplay {
  code: string
  name: string
  flag: string
  level: string
  progress: number
  description: string
}

interface Goal {
  id: string
  text: string
  completed: boolean
}

interface Badge {
  id: string
  icon: string
  name: string
  earned: boolean
}

interface Review {
  id: string
  author: string
  text: string
  timeAgo: string
  rating: number
}

interface Highlight {
  id: string
  icon: string
  title: string
  subtitle: string
}

interface Challenge {
  id: string
  text: string
  progress: number
  total: number
  xpReward: number
  completed: boolean
}

const LANGUAGE_LIBRARY: Record<
  string,
  {
    name: string
    flag: string
    nativeDescription: string
    learningDescription: string
    learningProgress: number
  }
> = {
  en: {
    name: 'English',
    flag: '🇬🇧',
    nativeDescription: 'Business English, Tech vocabulary',
    learningDescription: 'Improving storytelling and debate skills',
    learningProgress: 88,
  },
  nl: {
    name: 'Dutch',
    flag: '🇳🇱',
    nativeDescription: 'Casual chats, cultural insights',
    learningDescription: 'Daily conversations, work Dutch',
    learningProgress: 65,
  },
  es: {
    name: 'Spanish',
    flag: '🇪🇸',
    nativeDescription: 'Latin American expressions, travel Spanish',
    learningDescription: 'Small talk, travel scenarios, music lyrics',
    learningProgress: 54,
  },
  fr: {
    name: 'French',
    flag: '🇫🇷',
    nativeDescription: 'Accent coaching, professional writing',
    learningDescription: 'Conversational confidence, café culture',
    learningProgress: 42,
  },
  de: {
    name: 'German',
    flag: '🇩🇪',
    nativeDescription: 'Exam prep, pronunciation drills',
    learningDescription: 'Business meetings, job interviews',
    learningProgress: 55,
  },
  ja: {
    name: 'Japanese',
    flag: '🇯🇵',
    nativeDescription: 'Anime, pop culture, native expressions',
    learningDescription: 'Casual chats, travel essentials',
    learningProgress: 37,
  },
}

const DEFAULT_STATS = {
  trades: 47,
  streak: 30,
  rating: 5.0,
  hours: 245,
  badges: 24,
  friends: 156,
}

const DEFAULT_GOALS: Goal[] = [
  { id: 'goal-1', text: 'Have 10-minute conversation in Dutch', completed: true },
  { id: 'goal-2', text: 'Order food at restaurant', completed: true },
  { id: 'goal-3', text: 'Watch Dutch movie without subtitles', completed: false },
  { id: 'goal-4', text: 'Read Dutch newspaper', completed: false },
  { id: 'goal-5', text: 'Pass B1 Dutch exam', completed: false },
]

const DEFAULT_BADGES: Badge[] = [
  { id: 'badge-1', icon: '🎖️', name: 'Language Trader', earned: true },
  { id: 'badge-2', icon: '⭐', name: 'Early Adopter', earned: true },
  { id: 'badge-3', icon: '🔥', name: '30-Day Streak', earned: true },
  { id: 'badge-4', icon: '🌟', name: 'Verified User', earned: true },
  { id: 'badge-5', icon: '💬', name: '100 Convos', earned: true },
  { id: 'badge-6', icon: '☕', name: 'Coffee Enthusiast', earned: true },
  { id: 'badge-7', icon: '🎯', name: 'Goal Crusher', earned: true },
  { id: 'badge-8', icon: '📚', name: 'Practice Master', earned: true },
]

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'review-1',
    rating: 5,
    text: 'Great teacher! Very patient and encouraging.',
    author: 'Sarah',
    timeAgo: '2 days ago',
  },
  {
    id: 'review-2',
    rating: 5,
    text: 'Amazing conversation partner! Keeps things fun.',
    author: 'Mike',
    timeAgo: '1 week ago',
  },
]

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { id: 'highlight-1', icon: '🏆', title: 'Language Café Member', subtitle: 'Active in Den Haag community' },
  { id: 'highlight-2', icon: '🔥', title: 'Consistency Spark', subtitle: '30-day streak alive!' },
  { id: 'highlight-3', icon: '⭐', title: 'Top Rated Exchange', subtitle: '5.0 rating from 47 sessions' },
]

const DEFAULT_CHALLENGES: Challenge[] = [
  { id: 'challenge-1', text: 'Practice for 15 minutes', progress: 15, total: 15, xpReward: 20, completed: true },
  { id: 'challenge-2', text: 'Send 5 messages', progress: 3, total: 5, xpReward: 10, completed: false },
  { id: 'challenge-3', text: 'Meet someone new', progress: 0, total: 1, xpReward: 25, completed: false },
]

const AVAILABILITY_PRESETS = {
  nextWindow: 'Next 30 minutes',
  idealSession: '30m',
  bestTime: 'Evenings',
  preferredSpot: 'Centrum',
  locations: ['Coffee shops in Centrum', 'Public libraries', 'Parks when weather is nice'],
}

const XP_TRACK = {
  level: 12,
  title: 'Language Enthusiast',
  current: 420,
  target: 600,
}

function formatJoinDate(rawDate?: string | null) {
  try {
    if (!rawDate) return 'Nov 2025'
    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) return 'Nov 2025'
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
  } catch (error) {
    console.warn('[ProfileScreen] Failed to format join date:', error)
    return 'Nov 2025'
  }
}

function getLanguageDetails(codeOrName: string, type: 'native' | 'learning'): LanguageDisplay {
  const key = codeOrName?.toLowerCase?.() || codeOrName
  const libraryEntry = LANGUAGE_LIBRARY[key]
  const fallbackName = codeOrName?.length <= 3 ? codeOrName.toUpperCase() : codeOrName
  const name = libraryEntry?.name || fallbackName || 'Unknown'
  const flag = libraryEntry?.flag || '🌍'
  const description =
    type === 'native'
      ? libraryEntry?.nativeDescription || 'Happy to help with native-level nuances'
      : libraryEntry?.learningDescription || 'Excited to grow this language!'

  const progress = type === 'native' ? 100 : libraryEntry?.learningProgress || 60

  return {
    code: codeOrName,
    name,
    flag,
    level: type === 'native' ? 'NATIVE' : 'LEARNING',
    progress,
    description,
  }
}

function ChallengeProgress({ progress, total, completed }: { progress: number; total: number; completed: boolean }) {
  const width = total === 0 ? 0 : `${Math.min(100, Math.round((progress / total) * 100))}%`
  return (
    <View style={styles.challengeProgressBar}>
      <View style={[styles.challengeProgressFill, completed && styles.challengeProgressFillCompleted, { width }]} />
    </View>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  )
}

function LanguageCard({ item }: { item: LanguageDisplay }) {
  return (
    <View style={styles.languageCard}>
      <View style={styles.languageHeader}>
        <Text style={styles.languageFlag}>{item.flag}</Text>
        <View>
          <Text style={styles.languageName}>{item.name}</Text>
          <Text style={styles.languageLevel}>{item.level}</Text>
        </View>
      </View>
      <View style={styles.languageProgressBar}>
        <View style={[styles.languageProgressFill, { width: `${item.progress}%` }]} />
      </View>
      <Text style={styles.languageDescription}>"{item.description}"</Text>
    </View>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <View style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <Text style={styles.badgeName}>{badge.name}</Text>
    </View>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewStars}>{'⭐'.repeat(review.rating)}</Text>
      <Text style={styles.reviewText}>"{review.text}"</Text>
      <Text style={styles.reviewAuthor}>- {review.author}, {review.timeAgo}</Text>
    </View>
  )
}

function HighlightCard({ highlight }: { highlight: Highlight }) {
  return (
    <View style={styles.highlightCard}>
      <Text style={styles.highlightIcon}>{highlight.icon}</Text>
      <View>
        <Text style={styles.highlightTitle}>{highlight.title}</Text>
        <Text style={styles.highlightSubtitle}>{highlight.subtitle}</Text>
      </View>
    </View>
  )
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeRow}>
        <Text style={[styles.challengeText, challenge.completed && styles.challengeTextCompleted]}>
          {challenge.completed ? '✅' : '⏳'} {challenge.text} ({challenge.progress}/{challenge.total})
        </Text>
        <Text style={styles.challengeReward}>{challenge.completed ? 'COMPLETE! + XP' : `+${challenge.xpReward} XP`}</Text>
      </View>
      <ChallengeProgress progress={challenge.progress} total={challenge.total} completed={challenge.completed} />
    </View>
  )
}

export default function ProfileScreen() {
  const navigation = useNavigation()
  const { user, loading: isLoading, error } = useUser()
  const [photoUri, setPhotoUri] = useState<string | null>(user?.avatar_url ?? null)
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(user?.availability_status ?? 'available')

  useEffect(() => {
    if (user?.avatar_url) {
      setPhotoUri(user.avatar_url)
    }
  }, [user?.avatar_url])

  useEffect(() => {
    if (user?.availability_status) {
      setAvailabilityStatus(user.availability_status)
    }
  }, [user?.availability_status])

  const profileName = user?.full_name || 'Araya'
  const profileEmail = user?.email || 'girmaynl21@gmail.com'
  const profileLocation = user?.city || 'Den Haag'
  const joinedDate = formatJoinDate(user?.last_active_at)
  const isAvailable = availabilityStatus === 'available'

  const languageNative = useMemo(() => {
    if (user?.languages_speak?.length) {
      return user.languages_speak.map((code) => getLanguageDetails(code, 'native'))
    }
    return [getLanguageDetails('en', 'native')]
  }, [user?.languages_speak])

  const languageLearning = useMemo(() => {
    if (user?.languages_learn?.length) {
      return user.languages_learn.map((code) => getLanguageDetails(code, 'learning'))
    }
    return [getLanguageDetails('nl', 'learning')]
  }, [user?.languages_learn])

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home' as never)
    }
  }

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to update your avatar.')
          return
        }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      })

      if (!result.canceled) {
        const uri = result.assets[0]?.uri
        if (uri) {
          setPhotoUri(uri)
          Alert.alert('Profile photo updated', 'The new photo will be uploaded on your next sync.')
        }
      }
    } catch (err) {
      console.error('[ProfileScreen] pick image error', err)
      Alert.alert('Something went wrong', 'Unable to update your photo right now.')
    }
  }

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out my LangEx profile! Join me for language practice: https://langex.app/profile/${user?.id || 'me'}`,
      })
    } catch (err) {
      console.error('[ProfileScreen] share error', err)
    }
  }

  const handleOpenSettings = () => {
    Alert.alert('Settings', 'Profile settings coming soon!')
  }

  const handleOpenStore = () => {
    Alert.alert('Marketplace', 'Language perks store launching soon.')
  }

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing experience is coming soon.')
  }

  const handleEditLanguages = () => {
    Alert.alert('Languages', 'Manage your languages from the desktop app for now.')
  }

  const handleEditBio = () => {
    Alert.alert('Bio', 'Tap Edit Profile on web to update your bio.')
  }

  const handleEditSchedule = () => {
    Alert.alert('Schedule', 'Scheduling editor coming soon.')
  }

  const handleViewBadges = () => {
    Alert.alert('Badges', 'Full badge collection coming soon!')
  }

  const handleViewReviews = () => {
    Alert.alert('Reviews', 'Reviews hub is on the roadmap.')
  }

  const handleViewStats = () => {
    Alert.alert('Stats Dashboard', 'Detailed analytics will be available soon.')
  }

  const handleCopyLink = () => {
    Alert.alert('Copied', 'Profile link copied to clipboard.')
  }

  const handleInviteFriends = () => {
    Alert.alert('Invite Friends', 'Share your referral link to earn rewards!')
  }

  const handleQuickAction = (action: () => void) => {
    action()
  }

  const handleChangeStatus = () => {
    const order: AvailabilityStatus[] = ['available', 'busy', 'offline']
    const currentIndex = order.indexOf(availabilityStatus)
    const nextStatus = order[(currentIndex + 1) % order.length]
    setAvailabilityStatus(nextStatus)
    Alert.alert('Status updated', `You are now ${nextStatus}.`)
  }

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            const supabase = createClient()
            const { error: signOutError } = await supabase.auth.signOut()
            if (signOutError) {
              console.error('[ProfileScreen] logout error', signOutError)
              Alert.alert('Error', 'Failed to log out. Please try again.')
            }
          } catch (err) {
            console.error('[ProfileScreen] logout error', err)
            Alert.alert('Error', 'Failed to log out. Please try again.')
          }
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <LinearGradient
        colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  if (error) {
  return (
    <LinearGradient
      colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
      style={styles.container}
    >
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.errorTitle}>We hit a snag</Text>
          <Text style={styles.errorSubtitle}>Unable to load your profile right now. Please try again shortly.</Text>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  const xpPercent = Math.min(100, Math.round((XP_TRACK.current / XP_TRACK.target) * 100))

  return (
                <LinearGradient
      colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack} activeOpacity={0.8}>
            <ArrowLeft color={Colors.text.primary} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleShareProfile} activeOpacity={0.8}>
              <Share2 color={Colors.text.primary} size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleOpenStore} activeOpacity={0.8}>
              <ShoppingBag color={Colors.text.primary} size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleOpenSettings} activeOpacity={0.8}>
              <Settings color={Colors.text.primary} size={22} />
            </TouchableOpacity>
                </View>
            </View>
            
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{profileName[0]}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage} activeOpacity={0.8}>
                <Camera size={18} color={Colors.text.primary} />
              </TouchableOpacity>
              <View style={[styles.statusBadge, isAvailable ? styles.statusBadgeAvailable : styles.statusBadgeBusy]}>
                <Text style={styles.statusBadgeText}>
                  {isAvailable ? '🟢 Available' : availabilityStatus === 'busy' ? '🟠 Busy' : '⚪ Offline'}
                </Text>
              </View>
            </View>
            <View style={styles.profileTextGroup}>
              <Text style={styles.profileName}>{profileName}</Text>
              <Text style={styles.profileEmail}>{profileEmail}</Text>
              <View style={styles.profileMetaRow}>
                <MapPin size={14} color={Colors.accent.primary} />
                <Text style={styles.profileMetaText}>{profileLocation}</Text>
              </View>
              <View style={styles.profileMetaRow}>
                <Calendar size={14} color={Colors.accent.primary} />
                <Text style={styles.profileMetaText}>Joined {joinedDate}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleEditProfile} activeOpacity={0.9}>
              <Text style={styles.primaryButtonText}>✏️ EDIT PROFILE</Text>
            </TouchableOpacity>
          </View>

          <SectionCard
            title="PROGRESS & LEVEL"
            icon={<Crown size={18} color={Colors.accent.primary} />}
          >
            <View style={styles.levelCard}>
              <View style={styles.levelHeader}>
                <View style={styles.levelIcon}>
                  <Star size={20} color={Colors.text.primary} />
                </View>
                <View>
                  <Text style={styles.levelTitle}>
                    LEVEL {XP_TRACK.level} - {XP_TRACK.title}
                  </Text>
                  <Text style={styles.levelXP}>
                    {XP_TRACK.current}/{XP_TRACK.target} XP
                  </Text>
                </View>
              </View>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${xpPercent}%` }]} />
              </View>
              <Text style={styles.levelNextText}>
                {XP_TRACK.target - XP_TRACK.current} XP until Level {XP_TRACK.level + 1}!
              </Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert('Level Perks', 'Perks coming soon!')}>
                <Text style={styles.secondaryButtonText}>→ View Level Perks</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          <SectionCard title="📊 YOUR STATS">
            <View style={styles.statsGrid}>
              <StatCard value={`${DEFAULT_STATS.trades}`} label="Trades" />
              <StatCard value={`🔥${DEFAULT_STATS.streak}`} label="Streak" />
              <StatCard value={`${DEFAULT_STATS.rating.toFixed(1)}⭐`} label="Rating" />
                </View>
            <View style={styles.statsGrid}>
              <StatCard value={`⏱${DEFAULT_STATS.hours}`} label="Hours" />
              <StatCard value={`🏆${DEFAULT_STATS.badges}`} label="Badges" />
              <StatCard value={`👥${DEFAULT_STATS.friends}`} label="Friends" />
          </View>
          </SectionCard>

          <SectionCard title="🗣️ LANGUAGES YOU SPEAK">
            {languageNative.map((lang) => (
              <LanguageCard key={`native-${lang.code}`} item={lang} />
            ))}
            <SectionDivider />
            {languageLearning.map((lang) => (
              <LanguageCard key={`learning-${lang.code}`} item={lang} />
            ))}
            <TouchableOpacity style={styles.actionLinkButton} onPress={handleEditLanguages}>
              <Text style={styles.actionLinkText}>➕ Add Another Language</Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard title="👋 ABOUT ME">
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>
                "{user?.bio || 'Love tech, coffee, and meeting new people! Looking to improve my Dutch for work. Happy to help with English pronunciation! 😊'}"
              </Text>
              <TouchableOpacity style={styles.inlineEditButton} onPress={handleEditBio}>
                <Text style={styles.inlineEditText}>✏️ Edit Bio</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          <SectionCard title="🎯 LEARNING GOALS">
            {DEFAULT_GOALS.map((goal) => (
              <View key={goal.id} style={styles.goalItem}>
                <Text style={styles.goalCheckbox}>{goal.completed ? '☑️' : '☐'}</Text>
                <Text style={[styles.goalText, goal.completed && styles.goalTextCompleted]}>{goal.text}</Text>
                          </View>
            ))}
            <TouchableOpacity style={styles.actionLinkButton} onPress={() => Alert.alert('New Goal', 'Goal editor coming soon.')}>
              <Text style={styles.actionLinkText}>➕ Add New Goal</Text>
                    </TouchableOpacity>
          </SectionCard>

          <SectionCard title="⏰ AVAILABILITY">
            <Text style={styles.subsectionLabel}>Current Status:</Text>
            <View style={styles.statusCard}>
              <Text style={styles.statusCardTitle}>
                {availabilityStatus === 'available' ? '🟢 Available for practice' : availabilityStatus === 'busy' ? '🟠 Currently busy' : '⚪ Taking a break'}
              </Text>
              <Text style={styles.statusCardSubtitle}>{AVAILABILITY_PRESETS.nextWindow}</Text>
              <TouchableOpacity style={styles.changeStatusButton} onPress={handleChangeStatus}>
                <Text style={styles.changeStatusText}>Change Status ▼</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subsectionLabel}>Typical Schedule:</Text>
            <View style={styles.scheduleGrid}>
              <View style={styles.scheduleCard}>
                <Text style={styles.scheduleValue}>{AVAILABILITY_PRESETS.idealSession}</Text>
                <Text style={styles.scheduleLabel}>Ideal Session</Text>
                          </View>
              <View style={styles.scheduleCard}>
                <Text style={styles.scheduleValue}>{AVAILABILITY_PRESETS.bestTime}</Text>
                <Text style={styles.scheduleLabel}>Best Time</Text>
            </View>
              <View style={styles.scheduleCard}>
                <Text style={styles.scheduleValue}>{AVAILABILITY_PRESETS.preferredSpot}</Text>
                <Text style={styles.scheduleLabel}>Preferred Spot</Text>
                    </View>
                  </View>
            <TouchableOpacity style={styles.inlineEditButton} onPress={handleEditSchedule}>
              <Text style={styles.inlineEditText}>✏️ Edit Schedule</Text>
                </TouchableOpacity>
            <Text style={[styles.subsectionLabel, styles.subsectionLabelSpacing]}>📍 Preferred Practice Locations:</Text>
            {AVAILABILITY_PRESETS.locations.map((location) => (
              <Text key={location} style={styles.locationText}>• {location}</Text>
            ))}
          </SectionCard>

          <SectionCard title="🏆 ACHIEVEMENTS & BADGES">
            <View style={styles.badgeGrid}>
              {DEFAULT_BADGES.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
            <TouchableOpacity style={styles.actionLinkButton} onPress={handleViewBadges}>
              <Text style={styles.actionLinkText}>View All {DEFAULT_STATS.badges} Badges →</Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard title="⭐ REVIEWS RECEIVED">
            {DEFAULT_REVIEWS.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            <TouchableOpacity style={styles.actionLinkButton} onPress={handleViewReviews}>
              <Text style={styles.actionLinkText}>View All 47 Reviews →</Text>
                </TouchableOpacity>
          </SectionCard>

          <SectionCard title="🌟 HIGHLIGHTS">
            {DEFAULT_HIGHLIGHTS.map((highlight) => (
              <HighlightCard key={highlight.id} highlight={highlight} />
            ))}
          </SectionCard>

          <SectionCard title="🎯 DAILY CHALLENGES">
            <Text style={styles.challengesTitle}>TODAY'S CHALLENGES</Text>
            {DEFAULT_CHALLENGES.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
            <Text style={styles.challengesReset}>Resets in: 8h 23m</Text>
            <TouchableOpacity style={styles.actionLinkButton} onPress={() => Alert.alert('Challenges', 'More challenges coming soon!')}>
              <Text style={styles.actionLinkText}>Explore More Challenges →</Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard title="🔗 QUICK ACTIONS">
            <View style={styles.quickActionsGrid}>
              <QuickActionButton icon={<Share2 size={20} color={Colors.text.primary} />} label="Share Profile" onPress={handleShareProfile} />
              <QuickActionButton icon={<QrCode size={20} color={Colors.text.primary} />} label="QR Code" onPress={() => handleQuickAction(() => Alert.alert('QR Code', 'QR code generator coming soon.'))} />
              <QuickActionButton icon={<LinkIcon size={20} color={Colors.text.primary} />} label="Copy Link" onPress={() => handleQuickAction(handleCopyLink)} />
                          </View>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton icon={<BarChart3 size={20} color={Colors.text.primary} />} label="Stats Dashboard" onPress={handleViewStats} />
              <QuickActionButton icon={<Award size={20} color={Colors.text.primary} />} label="Badges Collection" onPress={handleViewBadges} />
              <QuickActionButton icon={<Settings size={20} color={Colors.text.primary} />} label="Settings" onPress={handleOpenSettings} />
                            </View>
          </SectionCard>

          <SectionCard title="🎁 REFERRAL PROGRAM">
            <View style={styles.referralCard}>
              <Text style={styles.referralTitle}>Invite Friends, Earn Rewards!</Text>
              <Text style={styles.referralText}>You: 100 XP per friend</Text>
              <Text style={styles.referralText}>Friend: 50 XP bonus</Text>
              <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
                <LinearGradient
                  colors={['#00FF88', '#00D9FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.inviteGradient}
                >
                  <Text style={styles.inviteButtonText}>📨 Invite Friends</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.referralStats}>Invited: 3 • Joined: 2 • Earned: 200 XP</Text>
                          </View>
          </SectionCard>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={20} color={Colors.accent.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={{ height: scale(48) }} />
        </ScrollView>
        </SafeAreaView>
    </LinearGradient>
  )
}

function QuickActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.quickActionIcon}>{icon}</View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function SectionDivider() {
  return <View style={styles.sectionDivider} />
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
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: scale(8),
    paddingBottom: scale(12),
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(16),
    gap: scale(20),
  },
  profileCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 28,
    padding: scale(24),
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.surface.glass,
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border.primary,
  },
  avatarFallbackText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface.primary,
  },
  statusBadge: {
    position: 'absolute',
    left: '50%',
    bottom: -14,
    transform: [{ translateX: -60 }],
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surface.primary,
  },
  statusBadgeAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  statusBadgeBusy: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  profileTextGroup: {
    marginTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileMetaText: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: Colors.accent.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    color: Colors.text.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 24,
    padding: scale(20),
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  levelCard: {
    gap: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  levelXP: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  levelProgressBar: {
    height: 12,
    backgroundColor: Colors.surface.glass,
    borderRadius: 6,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: 6,
  },
  levelNextText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    backgroundColor: Colors.surface.glass,
    gap: 6,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    opacity: 0.2,
  },
  languageCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    backgroundColor: Colors.surface.glass,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  languageLevel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    letterSpacing: 1,
  },
  languageProgressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surface.primary,
    overflow: 'hidden',
  },
  languageProgressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Colors.accent.primary,
  },
  languageDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  actionLinkButton: {
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  aboutCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 18,
    padding: 18,
    backgroundColor: Colors.surface.glass,
    gap: 16,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  inlineEditButton: {
    alignSelf: 'flex-start',
  },
  inlineEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalCheckbox: {
    fontSize: 20,
  },
  goalText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  goalTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  subsectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subsectionLabelSpacing: {
    marginTop: 16,
  },
  statusCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    backgroundColor: Colors.surface.glass,
  },
  statusCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusCardSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  changeStatusButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  changeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  scheduleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface.glass,
    alignItems: 'center',
    gap: 6,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  scheduleLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  locationText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '22%',
    minWidth: 72,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 11,
    textAlign: 'center',
    color: Colors.text.secondary,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 18,
    padding: 18,
    backgroundColor: Colors.surface.glass,
    gap: 8,
  },
  reviewStars: {
    fontSize: 14,
    color: Colors.accent.warning,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  reviewAuthor: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 18,
    padding: 16,
    backgroundColor: Colors.surface.glass,
  },
  highlightIcon: {
    fontSize: 24,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  highlightSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  challengesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  challengeCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    backgroundColor: Colors.surface.glass,
  },
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  challengeTextCompleted: {
    color: Colors.accent.success,
    fontWeight: '600',
  },
  challengeReward: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  challengeProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface.primary,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
  },
  challengeProgressFillCompleted: {
    backgroundColor: Colors.accent.success,
  },
  challengesReset: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 18,
    backgroundColor: Colors.surface.glass,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  referralCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    backgroundColor: Colors.surface.glass,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  referralText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  inviteButton: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  inviteGradient: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00110A',
  },
  referralStats: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.accent.error,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.error,
  },
})


