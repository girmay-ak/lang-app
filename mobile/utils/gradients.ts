// Gradient utilities matching web app
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode } from 'react'

export const BackgroundGradient = ({ children }: { children: ReactNode }) => {
  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {children}
    </LinearGradient>
  )
}

export const GlassCard = ({ children, style }: { children: ReactNode; style?: any }) => {
  return (
    <LinearGradient
      colors={['rgba(30, 41, 59, 0.5)', 'rgba(30, 41, 59, 0.3)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  )
}












