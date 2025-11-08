import React, { useEffect } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

interface OrbitingItem {
  id: string
  component: React.ReactNode
  radius?: number
  speed?: number
  delay?: number
}

interface OrbitingSkillsProps {
  items: OrbitingItem[]
  centerComponent?: React.ReactNode
  size?: number
  style?: ViewStyle
}

const AnimatedView = Animated.createAnimatedComponent(View)

export default function OrbitingSkills({
  items,
  centerComponent,
  size = 200,
  style,
}: OrbitingSkillsProps) {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    )
  }, [])

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Center component */}
      {centerComponent && (
        <View style={styles.center}>{centerComponent}</View>
      )}

      {/* Orbiting items */}
      {items.map((item, index) => {
        const angle = (360 / items.length) * index
        const radius = item.radius || size * 0.35
        const speed = item.speed || 1
        const delay = item.delay || 0

        const animatedStyle = useAnimatedStyle(() => {
          const currentAngle = (rotation.value * speed + angle + delay) % 360
          const radians = (currentAngle * Math.PI) / 180

          const x = Math.cos(radians) * radius
          const y = Math.sin(radians) * radius

          return {
            transform: [{ translateX: x }, { translateY: y }],
          }
        })

        return (
          <AnimatedView
            key={item.id}
            style={[styles.orbitingItem, animatedStyle]}
          >
            {item.component}
          </AnimatedView>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitingItem: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

