import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { Search, MapPin, MessageCircle, Clock, ThumbsUp, ThumbsDown, Users } from 'lucide-react-native'
import { scale, wp, hp } from '../utils/responsive'

interface Post {
  id: string
  user: {
    name: string
    avatar: string
    location: string
  }
  content: string
  image?: string
  timeAgo: string
  likes: number
  comments: number
  distance: string
}

const mockPosts: Post[] = [
  {
    id: '1',
    user: {
      name: 'Sandra B.',
      avatar: '',
      location: 'Amsterdam',
    },
    content: 'Looking for someone to practice Dutch conversation this weekend! I can help with English too! ☕',
    image: '/happy-golden-retriever.png',
    timeAgo: '2h',
    likes: 25,
    comments: 12,
    distance: '200m',
  },
  {
    id: '2',
    user: {
      name: 'Chris M.',
      avatar: '',
      location: 'The Hague',
    },
    content: 'Anyone interested in Spanish conversation practice? I\'m intermediate level and would love to meet for coffee!',
    timeAgo: '4h',
    likes: 18,
    comments: 8,
    distance: '450m',
  },
]

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <LinearGradient
      colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
              placeholderTextColor={Colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Posts Feed */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.postsContainer}>
            {mockPosts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                  <View style={styles.postUserInfo}>
                    <View style={styles.postAvatar}>
                      <Text style={styles.postAvatarText}>{post.user.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.postUserName}>{post.user.name}</Text>
                      <View style={styles.postMetaRow}>
                        <Clock size={12} color={Colors.text.tertiary} />
                        <Text style={styles.postMeta}>{post.timeAgo} • </Text>
                        <MapPin size={12} color={Colors.text.tertiary} />
                        <Text style={styles.postMeta}>{post.distance}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Post Content */}
                <Text style={styles.postContent}>{post.content}</Text>

                {/* Post Image */}
                {post.image && (
                  <View style={styles.postImageContainer}>
                    <View style={styles.postImagePlaceholder}>
                      <Text style={styles.postImageText}>📸</Text>
                    </View>
                  </View>
                )}

                {/* Post Actions */}
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.postActionButton}>
                    <ThumbsUp size={18} color={Colors.accent.success} />
                    <Text style={styles.postActionText}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postActionButton}>
                    <ThumbsDown size={18} color={Colors.accent.error} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postActionButton}>
                    <MessageCircle size={18} color={Colors.text.tertiary} />
                    <Text style={styles.postActionText}>{post.comments}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.postActionButton, styles.postActionButtonRight]}>
                    <Users size={18} color={Colors.text.tertiary} />
                    <Text style={styles.postActionText}>Connect</Text>
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
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    paddingBottom: scale(12),
  },
  headerTitle: {
    fontSize: scale(32),
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: scale(16),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.glass,
    borderRadius: scale(24),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(16),
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  postsContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: hp(15),
  },
  postCard: {
    backgroundColor: Colors.surface.glass,
    borderRadius: scale(24),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  postAvatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.secondary,
  },
  postAvatarText: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  postUserName: {
    fontSize: scale(16),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: scale(4),
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  postMeta: {
    fontSize: scale(12),
    color: Colors.text.tertiary,
  },
  postContent: {
    fontSize: scale(15),
    color: Colors.text.primary,
    lineHeight: scale(22),
    marginBottom: scale(12),
  },
  postImageContainer: {
    borderRadius: scale(16),
    overflow: 'hidden',
    marginBottom: scale(12),
  },
  postImagePlaceholder: {
    height: scale(200),
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImageText: {
    fontSize: scale(48),
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  postActionButtonRight: {
    marginLeft: 'auto',
  },
  postActionText: {
    fontSize: scale(14),
    color: Colors.text.secondary,
  },
})

