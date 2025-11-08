import React, { useEffect } from 'react'
import { TouchableOpacity, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

interface ShimmerButtonProps {
  children: React.ReactNode
  onPress: () => void
  style?: ViewStyle
  textStyle?: TextStyle
  disabled?: boolean
  variant?: 'primary' | 'gradient' | 'glass'
  size?: 'small' | 'medium' | 'large'
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

export default function ShimmerButton({
  children,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = 'gradient',
  size = 'medium',
}: ShimmerButtonProps) {
  const shimmerTranslate = useSharedValue(-1)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  useEffect(() => {
    // Continuous shimmer animation
    shimmerTranslate.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(-1, { duration: 0 })
      ),
      -1,
      false
    )
  }, [])

  useEffect(() => {
    if (disabled) {
      opacity.value = withTiming(0.5, { duration: 200 })
    } else {
      opacity.value = withTiming(1, { duration: 200 })
    }
  }, [disabled])

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslate.value,
      [-1, 1],
      [-200, 200],
      Extrapolate.CLAMP
    )

    return {
      transform: [{ translateX }],
    }
  })

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.95, { duration: 100 })
    }
  }

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withTiming(1, { duration: 150 })
    }
  }

  const handlePress = () => {
    if (!disabled) {
      scale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 200 })
      )
      onPress()
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }
      case 'large':
        return { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }
      default:
        return { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }
    }
  }

  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return ['#8b5cf6', '#6366f1', '#3b82f6']
      case 'glass':
        return ['rgba(139, 92, 246, 0.3)', 'rgba(99, 102, 241, 0.3)']
      default:
        return ['#8b5cf6', '#6366f1', '#3b82f6', '#8b5cf6']
    }
  }

  return (
    <AnimatedTouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[buttonStyle, style]}
    >
      <AnimatedLinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          getSizeStyles(),
          variant === 'glass' && styles.glassEffect,
        ]}
      >
        {/* Shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmerOverlay,
            shimmerStyle,
            variant === 'glass' && styles.glassShimmer,
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        {/* Content */}
        <Animated.View style={styles.content}>
          {typeof children === 'string' ? (
            <Text style={[styles.text, textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </Animated.View>
      </AnimatedLinearGradient>
    </AnimatedTouchableOpacity>
  )
}

const styles = StyleSheet.create({
  gradient: {
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glassEffect: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    opacity: 0.6,
  },
  glassShimmer: {
    opacity: 0.3,
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  content: {
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})

