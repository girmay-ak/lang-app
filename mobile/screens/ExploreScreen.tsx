import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { MapPin, Users, Filter, Navigation, Search } from 'lucide-react-native'
import MapScreen from './MapScreen'

interface NearbyUser {
  id: string
  name: string
  distance: string
  languages: string[]
  flag: string
  isOnline: boolean
  rating: number
}

const mockNearbyUsers: NearbyUser[] = [
  {
    id: '1',
    name: 'Maria',
    distance: '0.3 km',
    languages: ['Spanish', 'Dutch'],
    flag: '🇪🇸',
    isOnline: true,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Yuki',
    distance: '0.5 km',
    languages: ['Japanese', 'English'],
    flag: '🇯🇵',
    isOnline: true,
    rating: 5.0,
  },
  {
    id: '3',
    name: 'Pierre',
    distance: '0.8 km',
    languages: ['French', 'Dutch'],
    flag: '🇫🇷',
    isOnline: false,
    rating: 4.7,
  },
]

export default function ExploreScreen() {
  const [showMap, setShowMap] = useState(true)

  return (
    <View style={styles.container}>
      {showMap ? (
        <MapScreen />
      ) : (
        <LinearGradient
          colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
          style={styles.container}
        >
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Explore Nearby</Text>
              <TouchableOpacity style={styles.searchButton}>
                <Search size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* View Toggle */}
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
                onPress={() => setShowMap(true)}
              >
                <MapPin size={18} color={showMap ? Colors.text.primary : Colors.text.tertiary} />
                <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
                onPress={() => setShowMap(false)}
              >
                <Users size={18} color={!showMap ? Colors.text.primary : Colors.text.tertiary} />
                <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>List</Text>
              </TouchableOpacity>
            </View>

            {/* Nearby Users List */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.usersList}>
                {mockNearbyUsers.map((user) => (
                  <TouchableOpacity key={user.id} style={styles.userCard} activeOpacity={0.7}>
                    <View style={styles.userCardContent}>
                      <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{user.name[0]}</Text>
                        </View>
                        {user.isOnline && <View style={styles.onlineIndicator} />}
                      </View>
                      <View style={styles.userInfo}>
                        <View style={styles.userHeader}>
                          <Text style={styles.userName}>{user.name}</Text>
                          <View style={styles.ratingBadge}>
                            <Text style={styles.ratingText}>⭐ {user.rating}</Text>
                          </View>
                        </View>
                        <View style={styles.distanceRow}>
                          <MapPin size={12} color={Colors.accent.success} />
                          <Text style={styles.distanceText}>{user.distance} away</Text>
                        </View>
                        <View style={styles.languagesRow}>
                          {user.languages.map((lang, idx) => (
                            <View key={idx} style={styles.languageTag}>
                              <Text style={styles.languageText}>{lang}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface.glass,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  toggleTextActive: {
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  usersList: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  userCardContent: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.glass,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.secondary,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent.success,
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  ratingBadge: {
    backgroundColor: Colors.accent.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.accent.success,
  },
  languagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  languageText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
})

