# 🏗️ Complete Architecture Design - Language Exchange App

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (React Native/Expo)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Screens    │  │  Components  │  │  Navigation   │         │
│  │  (UI Layer)  │  │   (Shared)   │  │   (Routes)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │  Custom Hooks   │                            │
│                  │ (Business Logic)│                            │
│                  └────────┬────────┘                            │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │  Service Layer  │                            │
│                  │  (API Calls)    │                            │
│                  └────────┬────────┘                            │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    SUPABASE BACKEND                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Auth API    │  │  Database    │  │   Storage    │         │
│  │  (Auth)      │  │  (PostgreSQL)│  │  (Files)     │         │
│  └──────────────┘  └──────┬───────┘  └──────────────┘         │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │  PostGIS       │                            │
│                  │  (Location)    │                            │
│                  └────────┬────────┘                            │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │  Realtime      │                            │
│                  │  (WebSocket)   │                            │
│                  └────────────────┘                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  DATABASE TABLES                          │  │
│  │  • users                                                   │  │
│  │  • user_languages                                          │  │
│  │  • conversations                                           │  │
│  │  • messages                                                │  │
│  │  • notifications                                           │  │
│  │  • user_connections                                        │  │
│  │  • practice_sessions                                       │  │
│  │  • user_gamification                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture Layers

### **Layer 1: Presentation Layer (UI)**
**Location**: `screens/`, `components/`

**Responsibility**: User interface, user interactions, visual feedback

```typescript
// Example: MapScreen.tsx
export default function MapScreen() {
  const { users, loading } = useMap()  // ← Uses Hook Layer
  return <MapView users={users} />      // ← Pure UI
}
```

**Key Principles**:
- ✅ No direct database calls
- ✅ No business logic
- ✅ Only UI rendering and user input handling
- ✅ Uses hooks for data

---

### **Layer 2: Hook Layer (Business Logic)**
**Location**: `src/services/hooks/`

**Responsibility**: State management, data fetching, business rules

```typescript
// Example: useMap.ts
export function useMap() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    mapService.findNearbyUsers()  // ← Uses Service Layer
      .then(setUsers)
  }, [])
  
  return { users, loading }  // ← Provides to UI
}
```

**Key Principles**:
- ✅ Manages component state
- ✅ Handles side effects (useEffect)
- ✅ Calls services for data
- ✅ Transforms data for UI
- ✅ Handles loading/error states

---

### **Layer 3: Service Layer (API Communication)**
**Location**: `src/services/api/`

**Responsibility**: Direct Supabase API calls, data formatting

```typescript
// Example: map.service.ts
export const mapService = {
  async findNearbyUsers(lat, lng, radius) {
    const { data } = await supabase
      .rpc('find_nearby_users', {  // ← Calls Supabase
        user_lat: lat,
        user_lng: lng,
        radius_km: radius
      })
    return data
  }
}
```

**Key Principles**:
- ✅ Pure data operations
- ✅ No UI logic
- ✅ Handles Supabase-specific code
- ✅ Error handling
- ✅ Type-safe responses

---

### **Layer 4: Data Layer (Supabase Client)**
**Location**: `lib/supabase.ts`

**Responsibility**: Supabase client initialization, configuration

```typescript
// lib/supabase.ts
export function createClient() {
  return createSupabaseClient(url, key, {
    auth: { storage: AsyncStorage },
    realtime: { ... }
  })
}
```

**Key Principles**:
- ✅ Single source of truth for Supabase client
- ✅ Centralized configuration
- ✅ Auth storage setup
- ✅ Realtime configuration

---

## 🔄 Data Flow Example: Finding Nearby Users

```
1. User opens MapScreen
   │
   ▼
2. MapScreen calls useMap() hook
   │
   ▼
3. useMap hook calls mapService.findNearbyUsers()
   │
   ▼
4. mapService creates Supabase client
   │
   ▼
5. Calls Supabase RPC function: find_nearby_users()
   │
   ▼
6. Supabase executes PostGIS query
   │
   │   SELECT * FROM users
   │   WHERE ST_DWithin(
   │     location_point,
   │     ST_MakePoint(lng, lat),
   │     radius_km * 1000
   │   )
   │
   ▼
7. Database returns results
   │
   ▼
8. Supabase formats response
   │
   ▼
9. mapService returns data to hook
   │
   ▼
10. useMap updates state
    │
    ▼
11. MapScreen re-renders with users
```

---

## 🔌 Backend Integration (Supabase)

### **1. Authentication Flow**

```
Mobile App                    Supabase Auth
    │                              │
    ├── signIn() ────────────────►│
    │                              │
    │◄── session token ────────────┤
    │                              │
    ├── store in AsyncStorage      │
    │                              │
    ├── onAuthStateChange ◄────────┤ (WebSocket)
    │                              │
```

**Implementation**:
```typescript
// services/hooks/useAuth.ts
const supabase = createClient()
const { data: { session } } = await supabase.auth.signInWithPassword({...})

// services/api/auth.service.ts
export const authService = {
  async signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }
}
```

---

### **2. Database Queries Flow**

```
Mobile App                    Supabase DB
    │                              │
    ├── query() ──────────────────►│
    │  .from('users')              │
    │  .select('*')                │
    │                              │
    │◄── data ─────────────────────┤
    │                              │
```

**Implementation**:
```typescript
// services/api/user.service.ts
const { data, error } = await supabase
  .from('users')
  .select('*, user_languages(*)')
  .eq('id', userId)
  .single()
```

---

### **3. Real-time Subscriptions Flow**

```
Mobile App                    Supabase Realtime
    │                              │
    ├── subscribe() ──────────────►│
    │  .channel('messages')         │
    │  .on('postgres_changes')      │
    │                              │
    │◄── WebSocket connection ──────┤
    │                              │
    │◄── real-time updates ─────────┤ (when DB changes)
    │                              │
```

**Implementation**:
```typescript
// services/hooks/useChat.ts
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload) => {
      setMessages(prev => [...prev, payload.new])
    })
    .subscribe()
  
  return () => supabase.removeChannel(channel)
}, [])
```

---

### **4. File Upload Flow**

```
Mobile App                    Supabase Storage
    │                              │
    ├── upload() ─────────────────►│
    │  .storage('avatars')         │
    │  .upload('file.jpg', blob)   │
    │                              │
    │◄── public URL ───────────────┤
    │                              │
    ├── update DB with URL ────────►│
    │                              │
```

**Implementation**:
```typescript
// services/api/storage.service.ts
export const storageService = {
  async uploadAvatar(userId, imageUri) {
    const blob = await fetch(imageUri).then(r => r.blob())
    const { data } = await supabase
      .storage
      .from('avatars')
      .upload(`${userId}/avatar.jpg`, blob)
    
    const { data: { publicUrl } } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(data.path)
    
    return publicUrl
  }
}
```

---

## 📊 Complete Feature Architecture Examples

### **Example 1: Map Feature**

```
┌─────────────────────────────────────────────────────────────┐
│ MapScreen.tsx (UI Layer)                                     │
│  - Renders map with markers                                  │
│  - Handles user interactions                                 │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ uses
               ▼
┌─────────────────────────────────────────────────────────────┐
│ useMap() hook (Hook Layer)                                   │
│  - Manages users state                                       │
│  - Handles location updates                                  │
│  - Applies filters                                           │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ calls
               ▼
┌─────────────────────────────────────────────────────────────┐
│ mapService (Service Layer)                                   │
│  - findNearbyUsers(lat, lng, radius)                         │
│  - calculateDistance()                                       │
│  - formatDistance()                                          │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ queries
               ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase RPC: find_nearby_users()                            │
│  - PostGIS spatial query                                     │
│  - Returns nearby users                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### **Example 2: Chat Feature**

```
┌─────────────────────────────────────────────────────────────┐
│ ChatsScreen.tsx (UI Layer)                                   │
│  - Lists conversations                                       │
│  - Shows unread counts                                       │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ uses
               ▼
┌─────────────────────────────────────────────────────────────┐
│ useChat() hook (Hook Layer)                                   │
│  - Manages conversations state                               │
│  - Sets up real-time subscription                            │
│  - Refetches on changes                                      │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ calls & subscribes
               ▼
┌─────────────────────────────────────────────────────────────┐
│ chatService (Service Layer)                                   │
│  - getConversations()                                        │
│  - getMessages()                                             │
│  - sendMessage()                                             │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ queries & subscribes
               ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase Database + Realtime                                 │
│  - conversations table                                       │
│  - messages table                                            │
│  - Real-time WebSocket updates                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Authentication

### **Row Level Security (RLS) Policies**

```
User Request
    │
    ▼
Supabase Auth (checks session)
    │
    ▼
RLS Policy Evaluation
    │
    ├── ALLOW ──► Query executes
    │
    └── DENY ───► Error returned
```

**Example Policy**:
```sql
-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = user1_id OR 
  auth.uid() = user2_id
);
```

---

## 🗄️ Database Schema Integration

### **Key Tables & Relationships**

```
users (1) ──┬── (many) user_languages
            ├── (many) conversations (as user1)
            ├── (many) conversations (as user2)
            ├── (many) messages
            ├── (many) user_connections
            └── (1) user_gamification
```

### **Service Mapping**

```
user.service.ts
  ├── users table
  ├── user_languages table
  └── user_gamification table

chat.service.ts
  ├── conversations table
  ├── messages table
  └── message_reactions table

map.service.ts
  └── users table (with PostGIS location)

notification.service.ts
  └── notifications table
```

---

## 🔄 Real-time Architecture

### **Subscription Pattern**

```typescript
// 1. Create channel
const channel = supabase.channel('messages')

// 2. Subscribe to changes
channel.on('postgres_changes', {
  event: '*',  // INSERT, UPDATE, DELETE
  schema: 'public',
  table: 'messages',
  filter: 'conversation_id=eq.123'
}, (payload) => {
  // Handle real-time update
  handleMessageUpdate(payload)
})

// 3. Subscribe
channel.subscribe()

// 4. Cleanup
return () => supabase.removeChannel(channel)
```

### **Real-time Features**

| Feature | Table | Event | Channel Name |
|---------|-------|-------|--------------|
| New Messages | `messages` | INSERT | `messages:{conversationId}` |
| User Status | `users` | UPDATE | `user_status` |
| New Notifications | `notifications` | INSERT | `notifications:{userId}` |
| Location Updates | `users` | UPDATE | `location_updates` |

---

## 📁 Complete File Structure

```
mobile/
├── lib/
│   └── supabase.ts              # Supabase client (Layer 4)
│
├── src/
│   ├── services/
│   │   ├── api/                 # Service Layer (Layer 3)
│   │   │   ├── user.service.ts
│   │   │   ├── map.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── storage.service.ts
│   │   │
│   │   └── hooks/               # Hook Layer (Layer 2)
│   │       ├── useAuth.ts
│   │       ├── useUser.ts
│   │       ├── useMap.ts
│   │       ├── useChat.ts
│   │       └── useNotifications.ts
│   │
│   ├── types/                   # TypeScript types
│   │   ├── user.types.ts
│   │   ├── chat.types.ts
│   │   └── api.types.ts
│   │
│   └── utils/                   # Utility functions
│       ├── distance.ts
│       └── date.ts
│
├── screens/                      # Presentation Layer (Layer 1)
│   ├── MapScreen.tsx
│   ├── ChatsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ...
│
└── components/                   # Shared UI components
    ├── common/
    └── ...
```

---

## 🎯 Best Practices

### **1. Service Layer Pattern**
```typescript
// ✅ GOOD: Service handles all Supabase logic
export const userService = {
  async getCurrentUser() {
    const supabase = createClient()
    return supabase.from('users').select('*').single()
  }
}

// ❌ BAD: Direct Supabase calls in components
export default function ProfileScreen() {
  const supabase = createClient()  // ❌ Don't do this
  const { data } = await supabase.from('users')...
}
```

### **2. Hook Pattern**
```typescript
// ✅ GOOD: Hook manages state and calls service
export function useUser() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    userService.getCurrentUser().then(setUser)
  }, [])
  return { user }
}

// ❌ BAD: Service directly in component
export default function ProfileScreen() {
  const user = await userService.getCurrentUser()  // ❌ Don't do this
}
```

### **3. Real-time Pattern**
```typescript
// ✅ GOOD: Hook manages subscription lifecycle
export function useChat(conversationId) {
  useEffect(() => {
    const channel = supabase.channel(...)
    channel.subscribe()
    return () => supabase.removeChannel(channel)  // ✅ Cleanup
  }, [conversationId])
}

// ❌ BAD: Subscription in component without cleanup
export default function ChatScreen() {
  supabase.channel(...).subscribe()  // ❌ Memory leak
}
```

---

## 🚀 Implementation Checklist

### **Phase 1: Foundation**
- [x] Create service layer structure
- [x] Create hook layer structure
- [x] Set up Supabase client
- [ ] Create TypeScript types

### **Phase 2: Core Services**
- [x] User service
- [x] Map service
- [x] Chat service
- [ ] Notification service
- [ ] Storage service

### **Phase 3: Real-time**
- [x] Chat real-time subscriptions
- [ ] User status subscriptions
- [ ] Notification subscriptions
- [ ] Location updates

### **Phase 4: Integration**
- [ ] Migrate MapScreen to use hooks
- [ ] Migrate ChatsScreen to use hooks
- [ ] Migrate ProfileScreen to use hooks
- [ ] Add error boundaries
- [ ] Add loading states

---

## 📚 Key Concepts

### **1. Separation of Concerns**
- **Screens**: UI only
- **Hooks**: Business logic
- **Services**: Data operations
- **Supabase**: Database

### **2. Data Flow**
```
User Action → Hook → Service → Supabase → Database
                                      ↓
User Update ← Hook ← Service ← Supabase ← Database
```

### **3. Real-time Flow**
```
Database Change → Supabase Realtime → WebSocket → Hook → UI Update
```

---

This architecture provides:
✅ **Clear separation** between UI, logic, and data
✅ **Easy testing** (mock services/hooks)
✅ **Scalability** (add features without breaking existing code)
✅ **Real-time ready** (Supabase subscriptions built-in)
✅ **Type-safe** (TypeScript throughout)
✅ **Maintainable** (clear structure, easy to navigate)

