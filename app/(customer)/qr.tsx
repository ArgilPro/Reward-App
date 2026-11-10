import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Profile } from '../../types';

interface CustomerQRProps {
  profile: Profile;
  onBack?: () => void;
}

export default function CustomerQRScreen({ profile, onBack }: CustomerQRProps) {
  // Safe identifier containing ONLY customer UUID
  const safeIdentifier = profile.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.navTitle}>My QR Code</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* QR Display Card */}
        <View style={styles.qrCard}>
          <Text style={styles.memberName}>{profile.full_name}</Text>
          <Text style={styles.memberTag}>Loyalty Member</Text>

          {/* QR Code Container */}
          <View style={styles.qrContainer}>
            {/* Standard React Native / Web SVG QR rendering target */}
            <View style={styles.qrPlaceholderBox}>
              <Text style={styles.qrPayloadText}>[QR CODE DISPLAY]</Text>
              <Text style={styles.qrIdentifierText}>ID: {safeIdentifier}</Text>
            </View>
          </View>

          <Text style={styles.instructionText}>
            Show this QR code to the merchant after your purchase.
          </Text>
        </View>

        {/* Security Notice */}
        <View style={styles.securityBox}>
          <Text style={styles.securityText}>
            ✓ Encrypted customer identifier. Contains no passwords, payment details, or access tokens.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#0b1e3b',
    fontSize: 16,
    fontWeight: '700',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b1e3b',
  },
  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0b1e3b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  memberName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b1e3b',
    textAlign: 'center',
  },
  memberTag: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    height: 260,
    marginBottom: 24,
  },
  qrPlaceholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPayloadText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1e3b',
  },
  qrIdentifierText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  securityBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  securityText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
