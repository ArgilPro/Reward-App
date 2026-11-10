import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Profile } from '../../types';
import { loyaltyService } from '../../services/loyalty';

interface CustomerHomeProps {
  profile: Profile;
  onShowQR: () => void;
}

export default function CustomerHomeScreen({ profile, onShowQR }: CustomerHomeProps) {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'there';
    if (hour < 12) {
      return `Good morning, ${firstName}`;
    } else if (hour < 18) {
      return `Good afternoon, ${firstName}`;
    } else {
      return `Good evening, ${firstName}`;
    }
  };

  const fetchBalance = useCallback(async () => {
    try {
      const balance = await loyaltyService.getCustomerPoints(profile.id);
      setPoints(balance);
    } catch (err) {
      console.error('Failed to load customer points balance:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBalance();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Dynamic Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subGreeting}>Welcome back to your member rewards</Text>
        </View>

        {/* Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardBrand}>LOYALTYPASS</Text>
            <Text style={styles.cardTier}>VIP MEMBER</Text>
          </View>

          <View style={styles.cardCenter}>
            <Text style={styles.pointsLabel}>Current Points</Text>
            {loading ? (
              <ActivityIndicator color="#ffffff" style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.pointsValue}>{points ?? 0}</Text>
            )}
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardHolderLabel}>MEMBER NAME</Text>
              <Text style={styles.cardHolderName}>{profile.full_name || 'Member'}</Text>
            </View>
            <View style={styles.chipGraphic} />
          </View>
        </View>

        {/* Show My QR Action Button */}
        <TouchableOpacity
          style={styles.showQRButton}
          onPress={onShowQR}
          activeOpacity={0.85}
        >
          <Text style={styles.showQRButtonText}>Show My QR</Text>
          <Text style={styles.showQRSubtext}>Tap to present for points</Text>
        </TouchableOpacity>

        {/* Quick Instructions */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoBody}>
            Present your QR code at checkout. The merchant will scan it and your points balance updates immediately.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0b1e3b',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  loyaltyCard: {
    backgroundColor: '#0b1e3b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#143b73',
    marginBottom: 24,
    shadowColor: '#0b1e3b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#93c5fd',
    letterSpacing: 1.5,
  },
  cardTier: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
    letterSpacing: 1,
  },
  cardCenter: {
    marginVertical: 28,
  },
  pointsLabel: {
    fontSize: 13,
    color: '#bfdbfe',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
    marginTop: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolderLabel: {
    fontSize: 9,
    color: '#93c5fd',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardHolderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  chipGraphic: {
    width: 36,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#d97706',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  showQRButton: {
    backgroundColor: '#0b1e3b',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0b1e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  showQRButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  showQRSubtext: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 2,
  },
  infoBanner: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b1e3b',
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});
