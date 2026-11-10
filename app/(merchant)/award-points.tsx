import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CustomerSummary, Profile } from '../../types';
import { merchantService } from '../../services/merchant';

interface AwardPointsProps {
  merchantProfile: Profile;
  customerSummary: CustomerSummary;
  onSuccess: (awardedPoints: number, newBalance: number) => void;
  onCancel: () => void;
}

export default function AwardPointsScreen({
  merchantProfile,
  customerSummary,
  onSuccess,
  onCancel,
}: AwardPointsProps) {
  const [pointsInput, setPointsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAwardPoints = async () => {
    // 1. Prevent duplicate submission
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedPoints = Number(pointsInput.trim());

    // 2. Client-side validations
    if (!pointsInput.trim() || isNaN(parsedPoints)) {
      setErrorMessage('Please enter a valid numeric points value.');
      return;
    }

    if (parsedPoints <= 0 || !Number.isInteger(parsedPoints)) {
      setErrorMessage('Points must be a positive whole number greater than 0.');
      return;
    }

    if (parsedPoints > 10000) {
      setErrorMessage('Points cannot exceed 10,000 in a single transaction.');
      return;
    }

    // 3. Lock button & show loading state
    setIsSubmitting(true);

    try {
      const result = await merchantService.awardPoints(
        merchantProfile.id,
        merchantProfile.full_name,
        customerSummary.profile.id,
        parsedPoints
      );

      setSuccessMessage('Points awarded successfully.');

      // Return to dashboard after brief acknowledgment
      setTimeout(() => {
        onSuccess(result.points_awarded, result.new_balance);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to award points. Please try again.');
      setIsSubmitting(false); // Allow retry on failure
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} disabled={isSubmitting} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Award Points</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          {/* Customer Confirmation Card */}
          <View style={styles.customerCard}>
            <Text style={styles.cardSectionTitle}>Customer</Text>
            <Text style={styles.customerName}>{customerSummary.profile.full_name}</Text>
            <Text style={styles.customerEmail}>{customerSummary.profile.email}</Text>

            <View style={styles.divider} />

            <View style={styles.pointsRow}>
              <Text style={styles.currentPointsLabel}>Current Points</Text>
              <Text style={styles.currentPointsValue}>{customerSummary.current_points}</Text>
            </View>
          </View>

          {/* Feedback messages */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ {successMessage}</Text>
            </View>
          )}

          {/* Input & Action */}
          <View style={styles.actionSection}>
            <Text style={styles.inputLabel}>Points to award</Text>
            <TextInput
              style={styles.pointsInput}
              placeholder="e.g. 10"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              value={pointsInput}
              onChangeText={setPointsInput}
              editable={!isSubmitting}
              autoFocus
            />

            {/* Quick preset buttons */}
            <View style={styles.presetsRow}>
              {[5, 10, 25, 50].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetButton}
                  onPress={() => setPointsInput(String(preset))}
                  disabled={isSubmitting}
                >
                  <Text style={styles.presetButtonText}>+{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.awardButton,
                (!pointsInput || isSubmitting) && styles.awardButtonDisabled,
              ]}
              onPress={handleAwardPoints}
              disabled={!pointsInput || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.loadingText}>Awarding points...</Text>
                </View>
              ) : (
                <Text style={styles.awardButtonText}>Award Points</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1e3b',
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0b1e3b',
    marginTop: 4,
  },
  customerEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 18,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  currentPointsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0b1e3b',
  },
  actionSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b1e3b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointsInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0b1e3b',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '800',
    color: '#0b1e3b',
    textAlign: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presetButtonText: {
    color: '#0b1e3b',
    fontSize: 14,
    fontWeight: '700',
  },
  awardButton: {
    backgroundColor: '#0b1e3b',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#0b1e3b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  awardButtonDisabled: {
    opacity: 0.5,
  },
  awardButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
});
