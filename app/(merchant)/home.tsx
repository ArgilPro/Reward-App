import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LoyaltyTransaction, MerchantStats, Profile } from '../../types';
import { merchantService } from '../../services/merchant';
import { authService } from '../../services/auth';

interface MerchantHomeProps {
  profile: Profile;
  onOpenScanner: () => void;
  onLogout: () => void;
}

export default function MerchantHomeScreen({
  profile,
  onOpenScanner,
  onLogout,
}: MerchantHomeProps) {
  const [stats, setStats] = useState<MerchantStats>({
    points_awarded_today: 0,
    transactions_today: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile.full_name || 'Merchant';
    if (hour < 12) {
      return `Good morning, ${name}`;
    } else if (hour < 18) {
      return `Good afternoon, ${name}`;
    } else {
      return `Good evening, ${name}`;
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, txs] = await Promise.all([
        merchantService.getMerchantStats(profile.id),
        merchantService.getRecentTransactions(profile.id, 20),
      ]);
      setStats(statsData);
      setRecentTransactions(txs);
    } catch (err) {
      console.error('Failed to load merchant dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderTransactionItem = ({ item }: { item: LoyaltyTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.txInfo}>
        <Text style={styles.customerName}>{item.customer_name || 'Customer'}</Text>
        <Text style={styles.txTimestamp}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.txPoints}>+{item.points} pts</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.portalSubtitle}>Merchant Terminal</Text>
          </View>
          <TouchableOpacity
            style={styles.headerLogout}
            onPress={async () => {
              await authService.signOut();
              onLogout();
            }}
          >
            <Text style={styles.headerLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={recentTransactions}
        keyExtractor={(item: LoyaltyTransaction) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.scrollList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListHeaderComponent={
          <>
            {/* Today's Statistics */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Points Awarded Today</Text>
                {loading ? (
                  <ActivityIndicator color="#38bdf8" style={{ marginVertical: 6 }} />
                ) : (
                  <Text style={styles.statValuePoints}>{stats.points_awarded_today}</Text>
                )}
                <Text style={styles.statUnit}>Points</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Transactions Today</Text>
                {loading ? (
                  <ActivityIndicator color="#a855f7" style={{ marginVertical: 6 }} />
                ) : (
                  <Text style={styles.statValueCount}>{stats.transactions_today}</Text>
                )}
                <Text style={styles.statUnit}>Transactions</Text>
              </View>
            </View>

            {/* Scan Customer QR Button */}
            <TouchableOpacity
              style={styles.scanButton}
              onPress={onOpenScanner}
              activeOpacity={0.85}
            >
              <Text style={styles.scanButtonIcon}>📷</Text>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.scanButtonText}>Scan Customer QR</Text>
                <Text style={styles.scanButtonSubtext}>Tap to open camera scanner</Text>
              </View>
            </TouchableOpacity>

            {/* Recent Transactions Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions yet.</Text>
              <Text style={styles.emptySubtext}>
                Transactions you award today will appear here in real-time.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b1e3b',
    letterSpacing: -0.5,
  },
  portalSubtitle: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2,
  },
  headerLogout: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerLogoutText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '700',
  },
  scrollList: {
    padding: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 6,
  },
  statValuePoints: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0b1e3b',
  },
  statValueCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#143b73',
  },
  statUnit: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  scanButton: {
    backgroundColor: '#0b1e3b',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#0b1e3b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonIcon: {
    fontSize: 28,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scanButtonSubtext: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1e3b',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b1e3b',
  },
  txTimestamp: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  txPoints: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 12,
  },
  centered: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
});
