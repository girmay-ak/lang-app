# 🏗️ Language Exchange App - Architecture Guide

## 📐 Recommended Architecture Pattern

**Clean Architecture + Feature-Based Organization**

This architecture separates concerns into distinct layers:
- **Presentation Layer** (Screens, Components)
- **Business Logic Layer** (Services, Hooks)
- **Data Layer** (Database, API, Storage)
- **Utils Layer** (Helpers, Constants)

---

## 📁 Folder Structure

```
mobile/
├── app.json                    # Expo configuration
├── package.json
├── eas.json                    # EAS Build configuration
│
├── src/                        # Source code (NEW)
│   ├── app/                    # App configuration
│   │   ├── App.tsx
│   │   └── navigation/
│   │       ├── AuthNavigator.tsx
│   │       └── MainNavigator.tsx
│   │
│   ├── screens/                # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignUpScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── map/
│   │   │   └── MapScreen.tsx
│   │   ├── chat/
│   │   │   ├── ChatsScreen.tsx
│   │   │   └── ChatConversationScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │   └── feed/
│   │       └── FeedScreen.tsx
│   │
│   ├── components/             # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Card.tsx
│   │   ├── map/
│   │   │   ├── UserMarker.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ChatInput.tsx
│   │   └── profile/
│   │       ├── StatCard.tsx
│   │       └── LanguageBadge.tsx
│   │
│   ├── services/               # Business logic & API calls
│   │   ├── api/
│   │   │   ├── supabase.ts     # Supabase client
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── map.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── storage.service.ts
│   │   │
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useUser.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useLocation.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── useRealtime.ts
│   │   │
│   │   └── stores/             # State management (optional)
│   │       ├── authStore.ts
│   │       ├── userStore.ts
│   │       └── chatStore.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── distance.ts          # Haversine formula
│   │   ├── date.ts             # Date formatting
│   │   ├── validation.ts       # Input validation
│   │   ├── storage.ts          # AsyncStorage helpers
│   │   └── constants.ts        # App constants
│   │
│   ├── types/                  # TypeScript types
│   │   ├── user.types.ts
│   │   ├── chat.types.ts
│   │   ├── map.types.ts
│   │   └── api.types.ts
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── UserContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   └── config/                 # Configuration files
│       ├── constants/
│       │   ├── Colors.ts
│       │   └── Styles.ts
│       └── env.ts              # Environment variables
│
├── assets/                     # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
└── __tests__/                  # Tests (optional)
    ├── services/
    └── components/
```

---

## 🏛️ Architecture Layers

### 1. **Presentation Layer** (Screens & Components)
- **Responsibility**: UI rendering, user interactions
- **Dependencies**: Services, Hooks, Components
- **No direct database access**

```typescript
// Example: MapScreen.tsx
import { useNearbyUsers } from '../services/hooks/useMap'
import { UserMarker } from '../components/map/UserMarker'

export default function MapScreen() {
  const { users, loading } = useNearbyUsers()
  // UI logic only
}
```

### 2. **Business Logic Layer** (Services & Hooks)
- **Responsibility**: Data fetching, transformations, business rules
- **Dependencies**: API services, Utils
- **Reusable across screens**

```typescript
// Example: services/hooks/useMap.ts
export function useNearbyUsers() {
  const [users, setUsers] = useState([])
  const { data, error } = useQuery(['nearbyUsers'], mapService.getNearbyUsers)
  // Business logic here
  return { users, loading, error }
}
```

### 3. **Data Layer** (API Services)
- **Responsibility**: Direct database/API communication
- **Dependencies**: Supabase client
- **Pure data operations**

```typescript
// Example: services/api/map.service.ts
export const mapService = {
  async getNearbyUsers(lat, lng, radius) {
    return supabase.rpc('find_nearby_users', { lat, lng, radius })
  }
}
```

### 4. **Utils Layer** (Helpers)
- **Responsibility**: Pure functions, calculations, formatting
- **No dependencies** (or minimal)
- **Fully testable**

---

## 🔧 Service Layer Pattern

### **Recommended Structure:**

```typescript
// services/api/user.service.ts
import { createClient } from '../supabase'

export const userService = {
  // Get current user
  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data, error } = await supabase
      .from('users')
      .select('*, user_languages(*)')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    return data
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update location
  async updateLocation(userId, lat, lng) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .update({
        latitude: lat,
        longitude: lng,
        location_point: `POINT(${lng} ${lat})`,
        location_updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) throw error
    return data
  }
}
```

---

## 🎣 Custom Hooks Pattern

### **Recommended Pattern:**

```typescript
// services/hooks/useUser.ts
import { useState, useEffect } from 'react'
import { userService } from '../api/user.service'
import { useAuth } from './useAuth'

export function useUser() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    async function fetchUser() {
      try {
        setLoading(true)
        const userData = await userService.getCurrentUser()
        setUser(userData)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [authUser])

  const updateProfile = async (updates) => {
    try {
      const updated = await userService.updateProfile(authUser.id, updates)
      setUser(updated)
      return updated
    } catch (err) {
      setError(err)
      throw err
    }
  }

  return { user, loading, error, updateProfile, refetch: () => fetchUser() }
}
```

---

## 🔄 Real-time Pattern (Supabase Realtime)

### **Recommended Pattern:**

```typescript
// services/hooks/useRealtime.ts
import { useEffect, useState } from 'react'
import { createClient } from '../api/supabase'

export function useRealtimeChannel(channelName, table, filter, callback) {
  const supabase = createClient()
  const [status, setStatus] = useState('disconnected')

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter
      }, callback)
      .subscribe((status) => {
        setStatus(status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, table, filter])

  return { status }
}

// Usage:
useRealtimeChannel(
  'messages',
  'messages',
  `conversation_id=eq.${conversationId}`,
  (payload) => {
    // Handle new message
  }
)
```

---

## 📦 State Management Options

### **Option 1: React Context + Hooks (Recommended for MVP)**
- Simple and built-in
- Good for authentication state
- Easy to implement

```typescript
// context/AuthContext.tsx
export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // ... auth logic
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}
```

### **Option 2: Zustand (Recommended for Scale)**
- Lightweight
- Simple API
- Good performance

```typescript
// stores/authStore.ts
import create from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}))
```

### **Option 3: React Query (Recommended for Server State)**
- Automatic caching
- Background updates
- Error handling

---

## 🔐 Error Handling Pattern

```typescript
// utils/errorHandler.ts
export class AppError extends Error {
  constructor(message, code, status) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function handleError(error) {
  if (error instanceof AppError) {
    // Handle known errors
    return { message: error.message, code: error.code }
  }
  
  // Handle unknown errors
  console.error('Unexpected error:', error)
  return { message: 'Something went wrong', code: 'UNKNOWN' }
}

// Usage in services
try {
  const data = await userService.getCurrentUser()
} catch (error) {
  const handled = handleError(error)
  // Show error to user
}
```

---

## 📱 Navigation Pattern

```typescript
// navigation/types.ts
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type MainTabParamList = {
  Map: undefined
  Chats: undefined
  Notifications: undefined
  Profile: undefined
}

export type ChatStackParamList = {
  ChatsList: undefined
  ChatConversation: { chatId: string }
}
```

---

## 🎨 Component Organization

### **Atomic Design Pattern:**

```
components/
├── atoms/           # Smallest components (Button, Input, Icon)
├── molecules/       # Combinations (FormField, AvatarBadge)
├── organisms/       # Complex (Header, ChatList, UserCard)
└── templates/      # Page layouts
```

### **Feature-Based Organization (Recommended):**

```
components/
├── map/
│   ├── UserMarker.tsx
│   └── FilterPanel.tsx
├── chat/
│   ├── MessageBubble.tsx
│   └── ChatInput.tsx
└── common/          # Shared across features
    ├── Button.tsx
    └── Avatar.tsx
```

---

## 🚀 Recommended Implementation Order

### **Phase 1: Foundation (Week 1)**
1. ✅ Create service layer structure
2. ✅ Create custom hooks
3. ✅ Set up error handling
4. ✅ Create types/interfaces

### **Phase 2: Core Features (Week 2-3)**
1. ✅ User service & hooks
2. ✅ Map service & hooks
3. ✅ Chat service & hooks
4. ✅ Real-time subscriptions

### **Phase 3: Advanced Features (Week 4+)**
1. ✅ Notifications service
2. ✅ File upload service
3. ✅ Push notifications
4. ✅ Caching & offline support

---

## 📋 Best Practices

### **1. Separation of Concerns**
- Screens = UI only
- Services = Data operations
- Hooks = Business logic
- Utils = Pure functions

### **2. Single Responsibility**
- Each service handles one domain
- Each hook has one purpose
- Each component does one thing

### **3. Reusability**
- Extract common logic to hooks
- Create reusable components
- Share utilities across features

### **4. Error Handling**
- Always handle errors
- Show user-friendly messages
- Log errors for debugging

### **5. Performance**
- Use React.memo for expensive components
- Implement pagination
- Cache data when appropriate
- Optimize images

### **6. Type Safety**
- Use TypeScript throughout
- Define interfaces for all data
- Type your API responses

---

## 🔄 Data Flow Example

```
User Action (Screen)
    ↓
Custom Hook (useNearbyUsers)
    ↓
Service (mapService.getNearbyUsers)
    ↓
Supabase API
    ↓
Database
    ↓
Response flows back up
    ↓
State updated in Hook
    ↓
Screen re-renders
```

---

## 📝 Example: Complete Feature Implementation

### **Map Feature Architecture:**

```
screens/map/MapScreen.tsx
    ↓ uses
hooks/useMap.ts
    ↓ uses
services/api/map.service.ts
    ↓ uses
lib/supabase.ts
    ↓
Supabase Database
```

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Easy testing
- ✅ Scalability
- ✅ Maintainability
- ✅ Reusability

---

## 🎯 Next Steps

1. **Create the folder structure**
2. **Set up service layer**
3. **Create custom hooks**
4. **Migrate existing screens to use new architecture**
5. **Implement real database connections**

Would you like me to start implementing this architecture?

