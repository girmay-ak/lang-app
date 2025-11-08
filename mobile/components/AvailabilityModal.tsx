import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { X, Clock, MapPin, Zap } from 'lucide-react-native'
import { Colors } from '../constants/Colors'
import { scale, wp, hp } from '../utils/responsive'

interface AvailabilityModalProps {
  visible: boolean
  onClose: () => void
  onSave: (isAvailable: boolean, duration?: number, location?: string) => void
}

export default function AvailabilityModal({ visible, onClose, onSave }: AvailabilityModalProps) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [duration, setDuration] = useState<number>(60) // minutes
  const [location, setLocation] = useState<string>('Current Location')

  const handleSave = () => {
    onSave(isAvailable, duration, location)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={[Colors.background.gradientStart, Colors.background.gradientMiddle, Colors.background.gradientEnd]}
          style={styles.modalContent}
        >
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Set Availability</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Availability Toggle */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Zap size={20} color={isAvailable ? Colors.accent.success : Colors.text.tertiary} />
                    <Text style={styles.sectionTitle}>Available Now</Text>
                  </View>
                  <Switch
                    value={isAvailable}
                    onValueChange={setIsAvailable}
                    trackColor={{ false: Colors.surface.secondary, true: Colors.accent.success }}
                    thumbColor={isAvailable ? Colors.text.primary : Colors.text.tertiary}
                  />
                </View>
                <Text style={styles.sectionDescription}>
                  When enabled, other users can see you're available for language exchange
                </Text>
              </View>

              {/* Duration Selection */}
              {isAvailable && (
                <>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Clock size={20} color={Colors.text.secondary} />
                      <Text style={styles.sectionTitle}>Duration</Text>
                    </View>
                    <View style={styles.durationButtons}>
                      {[30, 60, 90, 120].map((mins) => (
                        <TouchableOpacity
                          key={mins}
                          style={[
                            styles.durationButton,
                            duration === mins && styles.durationButtonActive,
                          ]}
                          onPress={() => setDuration(mins)}
                        >
                          <Text
                            style={[
                              styles.durationButtonText,
                              duration === mins && styles.durationButtonTextActive,
                            ]}
                          >
                            {mins}m
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Location */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <MapPin size={20} color={Colors.text.secondary} />
                      <Text style={styles.sectionTitle}>Location</Text>
                    </View>
                    <TouchableOpacity style={styles.locationButton}>
                      <Text style={styles.locationText}>{location}</Text>
                      <Text style={styles.locationChangeText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Status Message */}
              <View style={styles.statusMessage}>
                {isAvailable ? (
                  <View style={styles.statusMessageSuccess}>
                    <Text style={styles.statusMessageText}>
                      ✓ You'll be visible to nearby users for {duration} minutes
                    </Text>
                  </View>
                ) : (
                  <View style={styles.statusMessageInactive}>
                    <Text style={styles.statusMessageText}>
                      You're currently unavailable
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveButton, !isAvailable && styles.saveButtonInactive]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={[styles.saveButtonText, !isAvailable && styles.saveButtonTextInactive]}>
                  {isAvailable ? 'Set as Available' : 'Set as Unavailable'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 0.85,
    borderTopLeftRadius: scale(32),
    borderTopRightRadius: scale(32),
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerTitle: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
    gap: scale(12),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  sectionDescription: {
    fontSize: scale(14),
    color: Colors.text.tertiary,
    lineHeight: scale(20),
  },
  durationButtons: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: scale(8),
  },
  durationButton: {
    flex: 1,
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    backgroundColor: Colors.surface.glass,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  durationButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  durationButtonTextActive: {
    color: Colors.text.primary,
  },
  locationButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(16),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    backgroundColor: Colors.surface.glass,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginTop: scale(8),
  },
  locationText: {
    fontSize: scale(14),
    color: Colors.text.primary,
  },
  locationChangeText: {
    fontSize: scale(14),
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  statusMessage: {
    marginHorizontal: scale(24),
    marginVertical: scale(20),
  },
  statusMessageSuccess: {
    padding: scale(16),
    borderRadius: scale(12),
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // green-500/20
    borderWidth: 1,
    borderColor: Colors.accent.success,
  },
  statusMessageInactive: {
    padding: scale(16),
    borderRadius: scale(12),
    backgroundColor: Colors.surface.glass,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statusMessageText: {
    fontSize: scale(14),
    color: Colors.text.primary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  saveButton: {
    paddingVertical: scale(16),
    borderRadius: scale(16),
    backgroundColor: Colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonInactive: {
    backgroundColor: Colors.surface.secondary,
  },
  saveButtonText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButtonTextInactive: {
    color: Colors.text.tertiary,
  },
})

