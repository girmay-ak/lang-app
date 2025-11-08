import React, { useEffect } from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

interface AnimatedButtonProps {
  children: React.ReactNode
  onPress: () => void
  style?: ViewStyle
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'glass' | 'gradient'
  size?: 'small' | 'medium' | 'large'
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)
const AnimatedView = Animated.createAnimatedComponent(View)

export default function AnimatedButton({
  children,
  onPress,
  style,
  disabled = false,
  variant = 'primary',
  size = 'medium',
}: AnimatedButtonProps) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const rotation = useSharedValue(0)
  const glow = useSharedValue(0)

  useEffect(() => {
    if (disabled) {
      opacity.value = withTiming(0.5, { duration: 200 })
    } else {
      opacity.value = withTiming(1, { duration: 200 })
      // Subtle glow pulse
      glow.value = withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      )
    }
  }, [disabled])

  const animatedStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      glow.value,
      [0, 1],
      [0.3, 0.6],
      Extrapolate.CLAMP
    )

    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
      shadowOpacity: glowOpacity,
    }
  })

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.92, {
        damping: 12,
        stiffness: 400,
      })
      rotation.value = withSequence(
        withTiming(-3, { duration: 80 }),
        withTiming(3, { duration: 80 }),
        withTiming(0, { duration: 80 })
      )
    }
  }

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      })
    }
  }

  const handlePress = () => {
    if (!disabled) {
      scale.value = withSequence(
        withSpring(0.88, { damping: 8 }),
        withSpring(1.05, { damping: 6 }),
        withSpring(1, { damping: 10, stiffness: 500 })
      )
      onPress()
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }
      case 'gradient':
        return {}
      case 'secondary':
        return {
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
        }
      default:
        return {}
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }
      case 'large':
        return { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }
      default:
        return { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }
    }
  }

  const buttonContent = (
    <AnimatedView style={[animatedStyle, getSizeStyles(), getVariantStyles(), style]}>
      {variant === 'gradient' ? (
        <LinearGradient
          colors={['#8b5cf6', '#6366f1', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </AnimatedView>
  )

  return (
    <AnimatedTouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={styles.container}
    >
      {buttonContent}
    </AnimatedTouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    zIndex: 1,
  },
})

