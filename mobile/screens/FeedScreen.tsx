import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { MessageCircle, MapPin, ThumbsUp, ThumbsDown, Clock, Search, ChevronRight, Users } from 'lucide-react-native'

interface User {
  id: string
  name: string
  username: string
  avatar: string
  mutualInterests: number
  distance: string
  bio: string
  interests: { emoji: string; name: string }[]
  flag: string
  online: boolean
}

interface Conversation {
  id: string
  user: User
  timeAgo: string
  content: string
  image?: string
  replies: number
  distance: string
  upvotes: number
  downvotes: number
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sandra B.',
    username: '@sandra.b',
    avatar: '/diverse-woman-portrait.png',
    mutualInterests: 23,
    distance: '200m away',
    bio: 'Speaks Dutch 🇳🇱 — Learning English 🇬🇧. Looking for someone to practice English over coffee ☕',
    interests: [
      { emoji: '🇳🇱', name: 'Dutch' },
      { emoji: '🇬🇧', name: 'English' },
      { emoji: '☕', name: 'Coffee Chats' },
      { emoji: '📚', name: 'Reading' },
    ],
    flag: '🇳🇱',
    online: true,
  },
  {
    id: '2',
    name: 'Chris M.',
    username: '@chris',
    avatar: '/man-with-stylish-glasses.png',
    mutualInterests: 5,
    distance: '450m away',
    bio: 'Speaks English 🇬🇧 — Learning Spanish 🇪🇸. Available for language exchange!',
    interests: [
      { emoji: '🇬🇧', name: 'English' },
      { emoji: '🇪🇸', name: 'Spanish' },
    ],
    flag: '🇬🇧',
    online: true,
  },
]

const mockConversations: Conversation[] = [
  {
    id: '1',
    user: mockUsers[0],
    timeAgo: '6 hrs',
    content: 'Anyone want to practice Dutch conversation this weekend? I can help with English too! ☕',
    image: '/happy-golden-retriever.png',
    replies: 12,
    distance: '20ft',
    upvotes: 25,
    downvotes: 0,
  },
  {
    id: '2',
    user: mockUsers[1],
    timeAgo: '8 hrs',
    content: 'Looking for Spanish conversation partner! I\'m intermediate level. Can meet at Cambridge Commons café.',
    replies: 12,
    distance: '20ft',
    upvotes: 2359,
    downvotes: 39,
  },
]

export default function FeedScreen() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <LinearGradient
      colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header - matching web */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nearby Language Partners</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* People Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>People</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View all</Text>
                <ChevronRight size={16} color={Colors.accent.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {mockUsers.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user.name[0]}</Text>
                      </View>
                      {user.online && <View style={styles.onlineIndicator} />}
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <MessageCircle size={14} color={Colors.accent.success} />
                      </View>
                      <Text style={styles.username}>{user.username}</Text>
                      <Text style={styles.mutualText}>{user.mutualInterests} mutual interests</Text>
                    </View>
                  </View>

                  <View style={styles.distanceRow}>
                    <MapPin size={12} color={Colors.accent.success} />
                    <Text style={styles.distanceText}>{user.distance}</Text>
                  </View>

                  <Text style={styles.userBio} numberOfLines={2}>
                    {user.bio}
                  </Text>

                  <View style={styles.interestsRow}>
                    {user.interests.slice(0, 3).map((interest, idx) => (
                      <View key={idx} style={styles.interestBadge}>
                        <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                        <Text style={styles.interestText}>{interest.name}</Text>
                      </View>
                    ))}
                    {user.interests.length > 3 && (
                      <View style={styles.interestBadge}>
                        <Text style={styles.interestText}>+{user.interests.length - 3}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Language Exchanges Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Language Exchanges Nearby</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View all</Text>
                <ChevronRight size={16} color={Colors.accent.secondary} />
              </TouchableOpacity>
            </View>

            {mockConversations.map((conversation) => (
              <View key={conversation.id} style={styles.postCard}>
                <View style={styles.postTimeRow}>
                  <Clock size={14} color={Colors.text.tertiary} />
                  <Text style={styles.postTime}>{conversation.timeAgo}</Text>
                </View>

                {conversation.image && (
                  <View style={styles.postImageContainer}>
                    <View style={styles.postImagePlaceholder}>
                      <Text style={styles.postImageText}>📷</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.postContent}>{conversation.content}</Text>

                <View style={styles.postFooter}>
                  <View style={styles.postFooterLeft}>
                    <View style={styles.postFooterItem}>
                      <MessageCircle size={14} color={Colors.text.tertiary} />
                      <Text style={styles.postFooterText}>{conversation.replies} replies</Text>
                    </View>
                    <View style={styles.postFooterItem}>
                      <MapPin size={14} color={Colors.text.tertiary} />
                      <Text style={styles.postFooterText}>{conversation.distance}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <ThumbsUp size={16} color={Colors.accent.success} />
                    <Text style={styles.actionCount}>{conversation.upvotes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <ThumbsDown size={16} color={Colors.accent.error} />
                    <Text style={styles.actionCount}>{conversation.downvotes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface.glass,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.glass,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.accent.secondary,
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingHorizontal: 16,
  },
  userCard: {
    width: 280,
    backgroundColor: Colors.surface.glass,
    borderRadius: 24,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  userCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.secondary,
  },
  avatarText: {
    fontSize: 18,
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
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  username: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  mutualText: {
    fontSize: 11,
    color: Colors.text.muted,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.accent.success,
  },
  userBio: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  interestEmoji: {
    fontSize: 12,
  },
  interestText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  postCard: {
    backgroundColor: Colors.surface.glass,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  postTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  postTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  postImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  postImagePlaceholder: {
    height: 160,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImageText: {
    fontSize: 48,
  },
  postContent: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  postFooter: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  postFooterLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  postFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postFooterText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
})
