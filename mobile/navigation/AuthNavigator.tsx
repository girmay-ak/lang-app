import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import OnboardingScreen from '../screens/OnboardingScreen'
import LoginScreen from '../screens/LoginScreen'
import SignUpScreen from '../screens/SignUpScreen'

const Stack = createNativeStackNavigator()

interface AuthNavigatorProps {
  onComplete: () => void
  initialRoute?: 'Onboarding' | 'Login'
}

export default function AuthNavigator({ onComplete, initialRoute = 'Onboarding' }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding">
        {(props) => (
          <OnboardingScreen
            {...props}
            onComplete={() => {
              onComplete()
              props.navigation.navigate('Login')
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignUpScreen} />
    </Stack.Navigator>
  )
}

