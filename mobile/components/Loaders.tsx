import React, { useEffect } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

interface LoaderProps {
  size?: number
  color?: string
  style?: ViewStyle
}

const AnimatedView = Animated.createAnimatedComponent(View)

// Spinning dots loader
export function SpinningDotsLoader({ size = 40, color = '#8b5cf6', style }: LoaderProps) {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  return (
    <AnimatedView style={[styles.spinnerContainer, { width: size, height: size }, style]}>
      <AnimatedView style={[animatedStyle, styles.spinner]}>
        {[0, 1, 2].map((i) => {
          const dotStyle = useAnimatedStyle(() => {
            const angle = (rotation.value + i * 120) % 360
            const radians = (angle * Math.PI) / 180
            const radius = size * 0.3
            const x = Math.cos(radians) * radius
            const y = Math.sin(radians) * radius

            return {
              transform: [{ translateX: x }, { translateY: y }],
            }
          })

          return (
            <AnimatedView
              key={i}
              style={[
                styles.dot,
                { width: size * 0.15, height: size * 0.15, backgroundColor: color },
                dotStyle,
              ]}
            />
          )
        })}
      </AnimatedView>
    </AnimatedView>
  )
}

// Pulse loader
export function PulseLoader({ size = 40, color = '#8b5cf6', style }: LoaderProps) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    )
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })

  return (
    <AnimatedView
      style={[
        styles.pulse,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
        style,
      ]}
    />
  )
}

// Wave loader
export function WaveLoader({ size = 40, color = '#8b5cf6', style }: LoaderProps) {
  return (
    <View style={[styles.waveContainer, { height: size }, style]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const delay = i * 100
        const scale = useSharedValue(0.3)

        useEffect(() => {
          scale.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 400 }),
              withTiming(0.3, { duration: 400 })
            ),
            -1,
            false
          )
        }, [])

        const animatedStyle = useAnimatedStyle(() => {
          return {
            transform: [{ scaleY: scale.value }],
          }
        })

        return (
          <AnimatedView
            key={i}
            style={[
              styles.waveBar,
              {
                width: size * 0.15,
                height: size,
                backgroundColor: color,
              },
              animatedStyle,
            ]}
          />
        )
      })}
    </View>
  )
}

// Shimmer loader
export function ShimmerLoader({ size = 40, color = '#8b5cf6', style }: LoaderProps) {
  const translateX = useSharedValue(-100)

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 1000 }),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return (
    <View
      style={[
        styles.shimmerContainer,
        { width: size * 2, height: size, backgroundColor: `${color}20` },
        style,
      ]}
    >
      <AnimatedView
        style={[
          styles.shimmerBar,
          { width: size, height: size, backgroundColor: color },
          animatedStyle,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    top: '50%',
    left: '50%',
    marginTop: -999,
    marginLeft: -999,
  },
  pulse: {
    alignSelf: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  waveBar: {
    borderRadius: 2,
  },
  shimmerContainer: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  shimmerBar: {
    borderRadius: 8,
    opacity: 0.6,
  },
})

