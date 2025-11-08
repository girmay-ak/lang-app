import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { Languages, Users, MapPin, ArrowRight, Check } from 'lucide-react-native'
import { scale, wp, hp } from '../utils/responsive'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingSlide {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: <Languages size={scale(80)} color="#60a5fa" strokeWidth={1.5} />,
    title: 'Learn Languages Together',
    description: 'Connect with native speakers and practice languages through real conversations.',
    color: '#60a5fa',
  },
  {
    id: 2,
    icon: <Users size={scale(80)} color="#22c55e" strokeWidth={1.5} />,
    title: 'Find Nearby Partners',
    description: 'Discover language exchange partners in your area and meet up in person or online.',
    color: '#22c55e',
  },
  {
    id: 3,
    icon: <MapPin size={scale(80)} color="#f59e0b" strokeWidth={1.5} />,
    title: 'Explore & Connect',
    description: 'See who\'s available nearby and start meaningful language exchange sessions.',
    color: '#f59e0b',
  },
]

interface OnboardingScreenProps {
  onComplete: () => void
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      })
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / SCREEN_WIDTH)
    setCurrentIndex(index)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    })
  }

  return (
    <LinearGradient
      colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Skip Button */}
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <View style={styles.slideContent}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  {slide.icon}
                </View>

                {/* Title */}
                <Text style={styles.title}>{slide.title}</Text>

                {/* Description */}
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Indicators */}
        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.indicatorActive,
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={currentIndex === slides.length - 1 ? ['#22c55e', '#16a34a'] : ['#60a5fa', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              {currentIndex === slides.length - 1 ? (
                <Check size={scale(20)} color="#ffffff" style={styles.nextButtonIcon} />
              ) : (
                <ArrowRight size={scale(20)} color="#ffffff" style={styles.nextButtonIcon} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    zIndex: 10,
  },
  skipText: {
    fontSize: scale(16),
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: wp(85),
  },
  iconContainer: {
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(48),
    borderWidth: 2,
    borderColor: Colors.border.primary,
  },
  title: {
    fontSize: scale(32),
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: scale(24),
    lineHeight: scale(40),
  },
  description: {
    fontSize: scale(18),
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: scale(26),
    paddingHorizontal: scale(16),
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(32),
  },
  indicator: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  indicatorActive: {
    width: scale(24),
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  footer: {
    paddingHorizontal: scale(24),
    paddingBottom: hp(5),
  },
  nextButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(18),
    paddingHorizontal: scale(32),
    gap: scale(8),
  },
  nextButtonText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#ffffff',
  },
  nextButtonIcon: {
    marginLeft: scale(4),
  },
})

