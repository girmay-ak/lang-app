import React, { useEffect } from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

interface TextRevealProps {
  text: string
  style?: TextStyle
  delay?: number
  duration?: number
  animationType?: 'fade' | 'slide' | 'scale' | 'glitch'
  onComplete?: () => void
}

const AnimatedText = Animated.createAnimatedComponent(Text)

export default function TextReveal({
  text,
  style,
  delay = 0,
  duration = 800,
  animationType = 'fade',
  onComplete,
}: TextRevealProps) {
  const progress = useSharedValue(0)
  const glitchOffset = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration }, (finished) => {
        if (finished && onComplete) {
          onComplete()
        }
      })
    )

    if (animationType === 'glitch') {
      glitchOffset.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(2, { duration: 50 }),
            withTiming(-2, { duration: 50 }),
            withTiming(0, { duration: 50 })
          ),
          3,
          false
        )
      )
    }
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    )

    switch (animationType) {
      case 'slide':
        const translateY = interpolate(
          progress.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
        return {
          opacity,
          transform: [{ translateY }],
        }

      case 'scale':
        const scale = interpolate(
          progress.value,
          [0, 0.5, 1],
          [0.8, 1.1, 1],
          Extrapolate.CLAMP
        )
        return {
          opacity,
          transform: [{ scale }],
        }

      case 'glitch':
        return {
          opacity,
          transform: [{ translateX: glitchOffset.value }],
        }

      default:
        return { opacity }
    }
  })

  return (
    <AnimatedText style={[styles.text, style, animatedStyle]}>
      {text}
    </AnimatedText>
  )
}

const styles = StyleSheet.create({
  text: {
    color: '#ffffff',
  },
})

