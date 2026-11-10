import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LoyaltyTransaction, Profile } from '../../types';
import { loyaltyService } from '../../services/loyalty';

interface PointsScreenProps {
  profile: Profile;
}

export default function CustomerPointsScreen({ profile }: PointsScreenProps) {
  const [points, setPoints] = useState<number>(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [currentPoints, history] = await Promise.all([
        loyaltyService.getCustomerPoints(profile.id),
        loyaltyService.getCustomerTransactions(profile.id),
      ]);
      setPoints(currentPoints);
      setTransactions(history);
    } catch (err) {
      console.error('Failed to load points history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const renderItem = ({ item }: { item: LoyaltyTransaction }) => (
    <View style={styles.transactionRow}>
      <View style={styles.txLeft}>
        <Text style={styles.merchantName}>{item.merchant_name || 'Merchant'}</Text>
        <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.pointsEarned}>+{item.points} pts</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Points & Rewards</Text>
      </View>

      {/* Current Points Banner */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Points</Text>
        {loading ? (
          <ActivityIndicator color="#ffffff" style={{ marginVertical: 6 }} />
        ) : (
          <Text style={styles.balanceValue}>{points}</Text>
        )}
      </View>

      {/* History Section */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Points History</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No points transactions yet.</Text>
            <Text style={styles.emptySubtext}>
              When you make a purchase and scan your QR, points will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item: LoyaltyTransaction) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
            }
          />
        )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0b1e3b',
  },
  balanceCard: {
    margin: 20,
    marginTop: 10,
    backgroundColor: '#0b1e3b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#143b73',
    alignItems: 'center',
    shadowColor: '#0b1e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1e3b',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  transactionRow: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  txLeft: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b1e3b',
  },
  txDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  txRight: {
    marginLeft: 12,
  },
  pointsEarned: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1e3b',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
