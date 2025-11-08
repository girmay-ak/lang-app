import { Dimensions, PixelRatio, Platform } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Base dimensions (iPhone 14 Pro)
const baseWidth = 393
const baseHeight = 852

// Responsive scaling functions
export const scale = (size: number): number => {
  const scale = SCREEN_WIDTH / baseWidth
  return Math.round(size * scale)
}

export const verticalScale = (size: number): number => {
  const scale = SCREEN_HEIGHT / baseHeight
  return Math.round(size * scale)
}

export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / baseWidth
  return Math.round(size + (scale - 1) * size * factor)
}

// Font scaling
export const scaleFont = (size: number): number => {
  const scale = SCREEN_WIDTH / baseWidth
  const newSize = size * scale
  return Platform.select({
    ios: Math.round(PixelRatio.roundToNearestPixel(newSize)),
    android: Math.round(PixelRatio.roundToNearestPixel(newSize)),
    default: newSize,
  })
}

// Screen dimensions helpers
export const screenWidth = SCREEN_WIDTH
export const screenHeight = SCREEN_HEIGHT

// Responsive padding/margin
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100
}

export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100
}

// Check device type
export const isSmallDevice = SCREEN_WIDTH < 375
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414
export const isLargeDevice = SCREEN_WIDTH >= 414

