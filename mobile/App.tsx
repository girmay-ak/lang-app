import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityIndicator, View } from 'react-native'
import MapScreen from './screens/MapScreen'
import ChatsScreen from './screens/ChatsScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import ProfileScreen from './screens/ProfileScreen'
import { CustomBottomTabBar } from './components/CustomBottomTabBar'
import AvailabilityModal from './components/AvailabilityModal'
import AuthNavigator from './navigation/AuthNavigator'
import { createClient } from './lib/supabase'
import { Colors } from './constants/Colors'

const Tab = createBottomTabNavigator()

const ONBOARDING_KEY = '@lang-exchange:onboarding-completed'
const AUTH_STATE_KEY = '@lang-exchange:auth-state'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAvailabilityModalVisible, setIsAvailabilityModalVisible] = useState(false)

  useEffect(() => {
    checkAuthAndOnboarding()
    
    // Set up auth state listener
    try {
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State changed:', event, !!session)
        setIsAuthenticated(!!session)
        
        if (session) {
          await AsyncStorage.setItem(AUTH_STATE_KEY, 'authenticated')
        } else {
          await AsyncStorage.removeItem(AUTH_STATE_KEY)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.warn('[App] Could not set up auth listener:', error)
      // Continue without auth listener if Supabase is not configured
    }
  }, [])

  const checkAuthAndOnboarding = async () => {
    try {
      // Check if user has seen onboarding
      const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_KEY)
      const hasSeenOnboarding = onboardingStatus === 'true'
      setHasSeenOnboarding(hasSeenOnboarding)

      // Check if user is authenticated
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)

        if (session) {
          await AsyncStorage.setItem(AUTH_STATE_KEY, 'authenticated')
        }
      } catch (supabaseError: any) {
        // If Supabase config is missing, treat as not authenticated
        console.warn('[App] Supabase not configured:', supabaseError.message)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('[App] Error checking auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    setHasSeenOnboarding(true)
  }

  const handleAvailabilityPress = () => {
    setIsAvailabilityModalVisible(true)
  }

  const handleSaveAvailability = (isAvailable: boolean, duration?: number, location?: string) => {
    console.log('Availability set:', { isAvailable, duration, location })
    // TODO: Save to backend/database
  }

  // Show loading screen
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: Colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
        </View>
      </SafeAreaProvider>
    )
  }

  // Show onboarding or login if not authenticated
  if (!hasSeenOnboarding || !isAuthenticated) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthNavigator
            initialRoute={hasSeenOnboarding ? 'Login' : 'Onboarding'}
            onComplete={async () => {
              if (!hasSeenOnboarding) {
                await handleOnboardingComplete()
              }
            }}
          />
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    )
  }

  // Show main app if authenticated
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
          }}
          tabBar={(props) => (
            <CustomBottomTabBar {...props} onAvailabilityPress={handleAvailabilityPress} />
          )}
        >
          <Tab.Screen name="Map" component={MapScreen} />
          {/* Center spacer screen for the Plus button */}
          <Tab.Screen 
            name="Plus" 
            options={{ tabBarButton: () => null }}
          >
            {() => null}
          </Tab.Screen>
          <Tab.Screen 
            name="Chats" 
            component={ChatsScreen}
            options={{
              tabBarStyle: { display: 'none' },
            }}
          />
          <Tab.Screen name="Notifications" component={NotificationsScreen} />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              tabBarStyle: { display: 'none' },
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <AvailabilityModal
        visible={isAvailabilityModalVisible}
        onClose={() => setIsAvailabilityModalVisible(false)}
        onSave={handleSaveAvailability}
      />
      <StatusBar style="light" />
    </SafeAreaProvider>
  )
}
