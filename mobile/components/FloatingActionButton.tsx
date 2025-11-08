import React, { useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

interface FloatingActionButtonProps {
  children: React.ReactNode
  onPress: () => void
  style?: any
  gradient?: boolean
  pulse?: boolean
}

const AnimatedView = Animated.createAnimatedComponent(View)
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

export default function FloatingActionButton({
  children,
  onPress,
  style,
  gradient = true,
  pulse = true,
}: FloatingActionButtonProps) {
  const scale = useSharedValue(1)
  const pulseScale = useSharedValue(1)
  const rotation = useSharedValue(0)
  const shadowOpacity = useSharedValue(0.3)

  useEffect(() => {
    if (pulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      )
      shadowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        false
      )
    }
  }, [pulse])

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * pulseScale.value },
        { rotate: `${rotation.value}deg` },
      ],
    }
  })

  const shadowStyle = useAnimatedStyle(() => {
    return {
      opacity: shadowOpacity.value,
    }
  })

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.85, { damping: 10 }),
      withSpring(1, { damping: 8, stiffness: 400 })
    )
    rotation.value = withSequence(
      withTiming(-15, { duration: 150 }),
      withTiming(15, { duration: 150 }),
      withTiming(0, { duration: 150 })
    )
    onPress()
  }

  return (
    <AnimatedView style={[styles.shadowContainer, shadowStyle]}>
      <AnimatedTouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={[buttonStyle, style]}
      >
        <LinearGradient
          colors={gradient ? ['#8b5cf6', '#6366f1', '#3b82f6'] : ['#1e293b', '#334155']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>
      </AnimatedTouchableOpacity>
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
})

