import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { MessageCircle, Search, ArrowLeft } from 'lucide-react-native'
import { scale, wp, hp } from '../utils/responsive'
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated'
import ChatConversationScreen from './ChatConversationScreen'
import { useNavigation } from '@react-navigation/native'
import { useChat } from '../src/services/hooks/useChat'
import { createClient } from '../lib/supabase'

interface Chat {
  id: string
  name: string
  lastMessage: string
  timeAgo: string
  online: boolean
  unread: boolean
  badges?: { label: string; variant: string }[]
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function ChatsScreen() {
  const navigation = useNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }
    getCurrentUser()
  }, [])
  
  // Use real backend hook
  const { conversations, loading: isLoading, error } = useChat()

  // Transform conversations to Chat format
  const chats = React.useMemo(() => {
    if (!currentUserId) return []
    
    return conversations.map((conv) => {
      const otherUser = conv.other_user
      // Determine which user is the current user to get correct unread count
      const unreadCount = conv.user1_id === currentUserId 
        ? (conv.unread_count_user1 || 0)
        : (conv.unread_count_user2 || 0)
      
      return {
        id: conv.id,
        name: otherUser?.full_name || 'Unknown',
        lastMessage: conv.last_message?.content || 'No messages yet',
        timeAgo: conv.last_message?.created_at 
          ? formatTimeAgo(new Date(conv.last_message.created_at))
          : 'Just now',
        online: otherUser?.is_online || false,
        unread: unreadCount > 0,
        badges: unreadCount > 0 ? [{ label: unreadCount.toString(), variant: 'default' }] : undefined,
      }
    })
  }, [conversations, currentUserId])

  if (isLoading) {
    return (
      <LinearGradient
        colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.loadingContainer} edges={['top']}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (selectedChat) {
    return (
      <ChatConversationScreen
        chat={{
          id: selectedChat.id,
          name: selectedChat.name,
          online: selectedChat.online,
        }}
        onBack={() => setSelectedChat(null)}
      />
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
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Map' as never)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.requestsRow}>
            <Text style={styles.requestsLabel}>Requests</Text>
            {/* Requests avatars would go here */}
          </View>
        </View>

        {/* Search - matching web */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={18} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Chat List - matching web card style */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredChats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageCircle size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation from the map or feed!</Text>
            </View>
          ) : (
            <View style={styles.chatList}>
              {filteredChats.map((chat, index) => (
                <Animated.View
                  key={chat.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <TouchableOpacity
                    style={styles.chatCard}
                    activeOpacity={0.7}
                    onPress={() => setSelectedChat(chat)}
                  >
                  <View style={styles.chatCardContent}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{chat.name[0]}</Text>
                      </View>
                      {chat.online && (
                        <View style={styles.onlineIndicator} />
                      )}
                    </View>

                    <View style={styles.chatInfo}>
                      <View style={styles.chatInfoHeader}>
                        <Text style={styles.chatName} numberOfLines={1}>
                          {chat.name}
                        </Text>
                        <Text style={styles.chatTime}>{chat.timeAgo}</Text>
                      </View>

                      <Text style={styles.chatMessage} numberOfLines={1}>
                        {chat.lastMessage}
                      </Text>

                      {chat.badges && chat.badges.length > 0 && (
                        <View style={styles.badgesRow}>
                          {chat.badges.map((badge, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.badge,
                                badge.variant === 'default' && styles.badgeYellow,
                                badge.variant === 'secondary' && styles.badgeOrange,
                                badge.variant === 'destructive' && styles.badgeRed,
                              ]}
                            >
                              <Text style={styles.badgeText}>{badge.label}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(24),
    paddingBottom: scale(16),
    gap: scale(12),
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
  },
  headerTitle: {
    fontSize: scale(32),
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
  },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  requestsLabel: {
    fontSize: scale(14),
    color: Colors.text.tertiary,
  },
  searchContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: scale(16),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.glass,
    borderRadius: scale(24),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: Colors.border.secondary,
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(16),
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  chatList: {
    paddingHorizontal: scale(24),
    paddingBottom: hp(8),
  },
  chatCard: {
    marginBottom: scale(8),
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  chatCardContent: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.glass,
    borderRadius: scale(20),
    padding: scale(12),
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scale(10),
  },
  avatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.secondary,
  },
  avatarText: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: scale(-2),
    right: scale(-2),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: Colors.accent.success,
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  chatInfo: {
    flex: 1,
  },
  chatInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  chatName: {
    fontSize: scale(15),
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: scale(8),
  },
  chatTime: {
    fontSize: scale(11),
    color: Colors.text.muted,
  },
  chatMessage: {
    fontSize: scale(13),
    color: Colors.text.tertiary,
    marginBottom: scale(4),
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeYellow: {
    backgroundColor: Colors.accent.yellow,
  },
  badgeOrange: {
    backgroundColor: Colors.accent.warning,
  },
  badgeRed: {
    backgroundColor: Colors.accent.error,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
