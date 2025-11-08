import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { Heart, MessageCircle, UserPlus, Bell, ArrowLeft } from 'lucide-react-native'

interface Notification {
  id: string
  type: 'likes' | 'comment' | 'follow'
  users: string[]
  message: string
  time: string
  isToday: boolean
  postImage?: string
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'likes' | 'comments' | 'requests'>('all')

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setIsLoading(true)
        // Fetch from database - using mock for now
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'likes',
            users: ['Sandra B.', 'Christian Wig'],
            message: 'and 2,355 others loved your post',
            time: '54s',
            isToday: true,
          },
          {
            id: '2',
            type: 'comment',
            users: ['Maria Garcia'],
            message: 'commented: Look so cool! 😎',
            time: '2 mins',
            isToday: true,
          },
          {
            id: '3',
            type: 'follow',
            users: ['Peter Orlický'],
            message: 'started following you!',
            time: '5 mins',
            isToday: true,
          },
        ]
        
        setNotifications(mockNotifications)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'likes') return notif.type === 'likes'
    if (activeFilter === 'comments') return notif.type === 'comment'
    if (activeFilter === 'requests') return notif.type === 'follow'
    return true
  })

  const todayNotifications = filteredNotifications.filter((n) => n.isToday)
  const olderNotifications = filteredNotifications.filter((n) => !n.isToday)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'likes':
        return <Heart size={16} color={Colors.accent.error} fill={Colors.accent.error} />
      case 'comment':
        return <MessageCircle size={16} color={Colors.accent.primary} fill={Colors.accent.primary} />
      case 'follow':
        return <UserPlus size={16} color={Colors.accent.warning} />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <LinearGradient
        colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.loadingContainer} edges={['top']}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
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
        {/* Header - matching web */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {/* Filters - matching web */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            {['All', 'Loves', 'Comments', 'Requests'].map((filter) => {
              const filterKey = filter.toLowerCase() as typeof activeFilter
              const isActive =
                (filterKey === 'all' && activeFilter === 'all') ||
                (filterKey === 'loves' && activeFilter === 'likes') ||
                (filterKey === 'comments' && activeFilter === 'comments') ||
                (filterKey === 'requests' && activeFilter === 'requests')

              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => {
                    if (filterKey === 'all') setActiveFilter('all')
                    else if (filterKey === 'loves') setActiveFilter('likes')
                    else if (filterKey === 'comments') setActiveFilter('comments')
                    else if (filterKey === 'requests') setActiveFilter('requests')
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Notifications List - matching web */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>You'll see notifications here when people interact with you!</Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {todayNotifications.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today</Text>
                  {todayNotifications.map((notif) => (
                    <View key={notif.id} style={styles.notificationCard}>
                      <View style={styles.notificationIconContainer}>
                        {notif.postImage ? (
                          <View style={styles.postImagePlaceholder}>
                            <Text style={styles.postImageText}>📷</Text>
                          </View>
                        ) : (
                          <View style={styles.userAvatarPlaceholder}>
                            <Text style={styles.userAvatarText}>{notif.users[0]?.[0] || 'U'}</Text>
                          </View>
                        )}
                        <View style={styles.notificationIconBadge}>
                          {getNotificationIcon(notif.type)}
                        </View>
                      </View>

                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationText}>
                          <Text style={styles.notificationUsers}>{notif.users.join(', ')}</Text>{' '}
                          <Text style={styles.notificationMessage}>{notif.message}</Text>
                        </Text>

                        {notif.type === 'follow' && (
                          <View style={styles.notificationActions}>
                            <TouchableOpacity style={styles.actionButtonOutline}>
                              <Text style={styles.actionButtonTextOutline}>Discard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}>
                              <Text style={styles.actionButtonText}>Follow Back</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      <Text style={styles.notificationTime}>{notif.time}</Text>
                    </View>
                  ))}
                </View>
              )}

              {olderNotifications.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Last 7 Days</Text>
                  {olderNotifications.map((notif) => (
                    <View key={notif.id} style={styles.notificationCard}>
                      <View style={styles.notificationIconContainer}>
                        {notif.postImage ? (
                          <View style={styles.postImagePlaceholder}>
                            <Text style={styles.postImageText}>📷</Text>
                          </View>
                        ) : (
                          <View style={styles.userAvatarPlaceholder}>
                            <Text style={styles.userAvatarText}>{notif.users[0]?.[0] || 'U'}</Text>
                          </View>
                        )}
                        <View style={styles.notificationIconBadge}>
                          {getNotificationIcon(notif.type)}
                        </View>
                      </View>

                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationText}>
                          <Text style={styles.notificationUsers}>{notif.users.join(', ')}</Text>{' '}
                          <Text style={styles.notificationMessage}>{notif.message}</Text>
                        </Text>
                      </View>

                      <Text style={styles.notificationTime}>{notif.time}</Text>
                    </View>
                  ))}
                </View>
              )}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.surface.glass,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface.glass,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  filtersContainer: {
    backgroundColor: Colors.surface.glass,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  filtersContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.surface.secondary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  filterTextActive: {
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.glass,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  postImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImageText: {
    fontSize: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  notificationIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.primary,
  },
  notificationUsers: {
    fontWeight: '600',
  },
  notificationMessage: {
    color: Colors.text.secondary,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface.secondary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  actionButtonOutline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  actionButtonTextOutline: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  notificationTime: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginLeft: 8,
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
