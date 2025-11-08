import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/Colors'
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Mic, Send, Play } from 'lucide-react-native'
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated'
import { useConversation } from '../src/services/hooks/useChat'

interface Message {
  id: string
  text?: string
  type: 'text' | 'voice'
  sender: 'me' | 'them'
  timestamp: string
  voiceDuration?: string
}

interface ChatConversationScreenProps {
  chat: {
    id: string
    name: string
    avatar?: string
    online: boolean
  }
  onBack: () => void
}

export default function ChatConversationScreen({ chat, onBack }: ChatConversationScreenProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)

  // Use real backend hook
  const { messages: dbMessages, loading: messagesLoading, sendMessage, error: messagesError } = useConversation(chat.id)

  // Get current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // Transform database messages to UI format
  const messages = React.useMemo(() => {
    return dbMessages.map((msg) => {
      const isMe = msg.sender_id === currentUserId
      return {
        id: msg.id,
        text: msg.content,
        type: msg.message_type === 'voice' ? 'voice' : 'text',
        sender: isMe ? 'me' : 'them',
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        voiceDuration: msg.voice_duration ? `${Math.floor(msg.voice_duration / 60)}:${String(msg.voice_duration % 60).padStart(2, '0')}` : undefined,
      }
    })
  }, [dbMessages, currentUserId])

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true)
    })
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const handleSend = async () => {
    if (newMessage.trim()) {
      try {
        await sendMessage(newMessage)
        setNewMessage('')
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient
        colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <LinearGradient
            colors={['#1e293b', '#334155']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <ArrowLeft size={20} color={Colors.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.headerUser}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(chat.name)}</Text>
                  </View>
                  {chat.online && (
                    <View style={styles.onlineIndicator} />
                  )}
                </View>
                <View>
                  <Text style={styles.headerName}>{chat.name}</Text>
                  <Text style={styles.headerStatus}>{chat.online ? 'Online' : 'Offline'}</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Phone size={18} color={Colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Video size={18} color={Colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionButton}>
                  <MoreVertical size={18} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Date separator */}
            <View style={styles.dateSeparator}>
              <Text style={styles.dateText}>10 March 2022</Text>
            </View>

            {messages.map((message, index) => (
              <Animated.View
                key={message.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
                style={[
                  styles.messageRow,
                  message.sender === 'me' && styles.messageRowMe,
                ]}
              >
                <View style={[
                  styles.messageAvatar,
                  message.sender === 'me' && styles.messageAvatarMe,
                ]}>
                  <Text style={styles.messageAvatarText}>
                    {message.sender === 'me' ? 'M' : chat.name[0]}
                  </Text>
                </View>

                <View style={[
                  styles.messageContent,
                  message.sender === 'me' && styles.messageContentMe,
                ]}>
                  {message.type === 'text' ? (
                    <View style={[
                      styles.messageBubble,
                      message.sender === 'me' ? styles.messageBubbleMe : styles.messageBubbleThem,
                    ]}>
                      <Text style={[
                        styles.messageText,
                        message.sender === 'me' && styles.messageTextMe,
                      ]}>
                        {message.text}
                      </Text>
                    </View>
                  ) : (
                    <View style={[
                      styles.voiceBubble,
                      message.sender === 'me' ? styles.messageBubbleMe : styles.messageBubbleThem,
                    ]}>
                      <TouchableOpacity style={styles.voiceButton}>
                        <Play size={16} color={message.sender === 'me' ? Colors.text.primary : Colors.text.secondary} fill={message.sender === 'me' ? Colors.text.primary : Colors.text.secondary} />
                      </TouchableOpacity>
                      <View style={styles.voiceWaveform}>
                        {[...Array(8)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.voiceBar,
                              {
                                height: Math.random() * 16 + 8,
                                backgroundColor: message.sender === 'me' ? 'rgba(255,255,255,0.4)' : Colors.text.secondary,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[
                        styles.voiceDuration,
                        message.sender === 'me' && styles.messageTextMe,
                      ]}>
                        {message.voiceDuration}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.messageTimestamp}>{message.timestamp}</Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, isKeyboardVisible && styles.inputContainerKeyboardVisible]}>
            <TouchableOpacity style={styles.inputButton} onPress={() => inputRef.current?.focus()}>
              <Smile size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Enter your message"
              placeholderTextColor={Colors.text.muted}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim()}
            >
              {newMessage.trim() ? (
                <Send size={20} color={Colors.text.primary} />
              ) : (
                <Mic size={20} color={Colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent.success,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarMe: {
    backgroundColor: '#ec4899',
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
    alignItems: 'flex-start',
  },
  messageContentMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
  },
  messageBubbleMe: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: Colors.surface.glass,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text.secondary,
  },
  messageTextMe: {
    color: Colors.text.primary,
  },
  voiceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    gap: 12,
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  voiceBar: {
    width: 2,
    borderRadius: 1,
  },
  voiceDuration: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  messageTimestamp: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    gap: 8,
    minHeight: 60,
  },
  inputContainerKeyboardVisible: {
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
  },
  inputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface.glass,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface.glass,
    opacity: 0.5,
  },
})

