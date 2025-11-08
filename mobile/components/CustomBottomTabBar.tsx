import React from 'react'
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native'
import { MapPin, MessageSquare, Bell, User, Plus } from 'lucide-react-native'
import { Colors } from '../constants/Colors'
import { wp, hp, scale } from '../utils/responsive'

interface CustomBottomTabBarProps {
  state: any
  descriptors: any
  navigation: any
  onAvailabilityPress?: () => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export function CustomBottomTabBar({ state, descriptors, navigation, onAvailabilityPress }: CustomBottomTabBarProps) {
  // Filter out the Plus spacer route
  const visibleRoutes = state.routes.filter((route: any) => route.name !== 'Plus')
  const tabOrder = ['Map', 'Chats', 'Notifications', 'Profile']
  const orderedRoutes = tabOrder.map(name => visibleRoutes.find((r: any) => r.name === name)).filter(Boolean)
  
  // Get current route to check if we should hide the tab bar
  const currentRoute = state.routes[state.index]
  const currentRouteOptions = descriptors[currentRoute?.key]?.options
  const shouldHideTabBar = currentRouteOptions?.tabBarStyle?.display === 'none'
  
  // Hide tab bar if current screen requests it
  if (shouldHideTabBar) {
    return null
  }
  
  const getIcon = (routeName: string, isFocused: boolean) => {
    const iconSize = scale(24)
    const iconColor = isFocused ? Colors.accent.primary : Colors.navigation.inactive
    
    switch (routeName) {
      case 'Map':
        return <MapPin size={iconSize} color={iconColor} strokeWidth={1.5} />
      case 'Chats':
        return <MessageSquare size={iconSize} color={iconColor} strokeWidth={1.5} />
      case 'Notifications':
        return <Bell size={iconSize} color={iconColor} strokeWidth={1.5} />
      case 'Profile':
        return <User size={iconSize} color={iconColor} strokeWidth={1.5} />
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      {/* Glassmorphic background bar - matching image design */}
      <View style={styles.tabBar}>
        <View style={styles.tabBarContent}>
          {/* Map */}
          {orderedRoutes.slice(0, 1).map((route: any) => {
            const { options } = descriptors[route.key]
            const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key)
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name)
                  }
                }}
                style={styles.tabButton}
              >
                {getIcon(route.name, isFocused)}
              </TouchableOpacity>
            )
          })}

          {/* Chats */}
          {orderedRoutes.slice(1, 2).map((route: any) => {
            const { options } = descriptors[route.key]
            const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key)
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name)
                  }
                }}
                style={styles.tabButton}
              >
                {getIcon(route.name, isFocused)}
              </TouchableOpacity>
            )
          })}

          {/* Center spacer for Plus button */}
          <View style={styles.centerSpacer} />

          {/* Notifications, Profile */}
          {orderedRoutes.slice(2).map((route: any) => {
            const { options } = descriptors[route.key]
            const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key)
            
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name)
                  }
                }}
                style={styles.tabButton}
              >
                {getIcon(route.name, isFocused)}
                {route.name === 'Notifications' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>5</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Green Plus Button - matching image design */}
      <TouchableOpacity
        style={styles.plusButton}
        onPress={onAvailabilityPress}
        activeOpacity={0.8}
      >
        <View style={styles.plusButtonInner}>
          <Plus size={scale(28)} color="#ffffff" strokeWidth={3} />
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: hp(3),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  tabBar: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: scale(28),
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.4,
    shadowRadius: scale(20),
    elevation: 12,
    width: wp(92),
    maxWidth: 400,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerSpacer: {
    width: scale(60), // Space for Plus button
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: scale(44),
    minHeight: scale(44),
  },
  badge: {
    position: 'absolute',
    top: scale(-6),
    right: scale(-6),
    backgroundColor: Colors.accent.primary, // Blue badge like in image
    borderRadius: scale(10),
    minWidth: scale(20),
    height: scale(20),
    paddingHorizontal: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: scale(11),
    fontWeight: '600',
    color: '#ffffff',
  },
  plusButton: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -scale(32) }, { translateY: -scale(32) }],
    zIndex: 51,
  },
  plusButtonInner: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32), // Perfect circle
    backgroundColor: '#22c55e', // Green like in image
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.5,
    shadowRadius: scale(16),
    elevation: 16,
    borderWidth: scale(4),
    borderColor: Colors.background.primary,
  },
})
