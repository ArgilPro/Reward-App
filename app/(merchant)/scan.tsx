import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { CustomerSummary } from '../../types';
import { merchantService } from '../../services/merchant';

interface MerchantScanProps {
  onCustomerIdentified: (customer: CustomerSummary) => void;
  onCancel: () => void;
}

export default function MerchantScanScreen({
  onCustomerIdentified,
  onCancel,
}: MerchantScanProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const handleScanSuccess = async (scannedPayload: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const customerSummary = await merchantService.verifyCustomer(scannedPayload);
      onCustomerIdentified(customerSummary);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid customer QR code.');
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Customer QR</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Viewfinder Area */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {isVerifying ? (
              <View style={styles.verifyingOverlay}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.verifyingText}>Verifying Customer...</Text>
              </View>
            ) : (
              <View style={styles.scanPrompt}>
                <Text style={styles.scanPromptIcon}>📸</Text>
                <Text style={styles.scanPromptText}>Align customer QR within frame</Text>
              </View>
            )}
          </View>
        </View>

        {/* Manual Code Input / Fallback for accessibility and testing */}
        <View style={styles.fallbackBox}>
          <Text style={styles.fallbackLabel}>Customer Identifier (or Test UUID):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. a1111111-1111-4111-8111-111111111111"
              placeholderTextColor="#64748b"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.verifyButton, !manualCode.trim() && styles.verifyButtonDisabled]}
              onPress={() => handleScanSuccess(manualCode)}
              disabled={!manualCode.trim() || isVerifying}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>
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
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1e3b',
  },
  body: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  viewfinder: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#0b1e3b',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanPrompt: {
    alignItems: 'center',
  },
  scanPromptIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  scanPromptText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  verifyingOverlay: {
    alignItems: 'center',
  },
  verifyingText: {
    color: '#0b1e3b',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  fallbackBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fallbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0b1e3b',
    fontSize: 13,
  },
  verifyButton: {
    backgroundColor: '#0b1e3b',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
