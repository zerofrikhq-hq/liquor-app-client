import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order } from '../types';

interface Props {
  onBack: () => void;
  onExploreVendors: () => void;
}

export const MyOrdersScreen: React.FC<Props> = ({ onBack, onExploreVendors }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.fetchUserOrders(user.id);
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn('[Orders] fetch error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return { label: 'Order Placed', bg: '#FEF3C7', text: '#B45309' };
      case 'preparing':
        return { label: 'Store Preparing', bg: '#E0E7FF', text: '#3730A3' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', bg: '#FEF9C3', text: '#854D0E' };
      case 'delivered':
        return { label: 'Delivered', bg: '#DCFCE7', text: '#15803D' };
      default:
        return { label: status, bg: colors.surface.subtle, text: colors.text.secondary };
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
        <Text style={styles.loadingText}>Fetching your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Orders</Text>
        <View style={{ width: 36 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={48} color={colors.gold.primary} />
          </View>
          <Text style={styles.emptyHeading}>No Orders Yet</Text>
          <Text style={styles.emptySub}>When you place an order, it will appear here with live tracking.</Text>

          <TouchableOpacity style={styles.exploreBtn} onPress={onExploreVendors} activeOpacity={0.85}>
            <Text style={styles.exploreBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold.primary} />}
        >
          {orders.map((ord) => {
            const statusBadge = getStatusBadge(ord.status);
            const dateStr = new Date(ord.createdAt).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={ord.id} style={styles.orderCard}>
                {/* Order Top Bar */}
                <View style={styles.orderTopRow}>
                  <View>
                    <Text style={styles.orderId}>Order #{ord.id}</Text>
                    <Text style={styles.orderDate}>{dateStr}</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                    <Text style={[styles.statusText, { color: statusBadge.text }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>

                {/* Vendor Store Tag */}
                <View style={styles.storeRow}>
                  <Ionicons name="storefront-outline" size={14} color={colors.gold.dark} />
                  <Text style={styles.storeName}>{ord.vendorName}</Text>
                </View>

                {/* Items Summary */}
                <View style={styles.itemsBlock}>
                  {ord.items.map((item, idx) => (
                    <View key={idx} style={styles.itemLine}>
                      <Text style={styles.itemLineText} numberOfLines={1}>
                        <Text style={styles.itemQty}>{item.quantity}x </Text>
                        {item.productName} {item.selectedVolume ? `(${item.selectedVolume})` : ''}
                      </Text>
                      <Text style={styles.itemPrice}>${item.subtotal.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.addressLabel}>Delivered to</Text>
                    <Text style={styles.addressVal} numberOfLines={1}>{ord.deliveryAddress}</Text>
                  </View>

                  <View style={styles.totalBlock}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalVal}>${ord.totalAmount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.light,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold.soft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: colors.gold.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  exploreBtnText: {
    color: colors.dark.darkest,
    fontWeight: '800',
    fontSize: 14,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  orderDate: {
    fontSize: 11.5,
    color: colors.text.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold.soft,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  storeName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.gold.dark,
  },
  itemsBlock: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surface.border,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 10,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLineText: {
    fontSize: 13,
    color: colors.text.primary,
    flex: 1,
    marginRight: 10,
  },
  itemQty: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 10.5,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  addressVal: {
    fontSize: 12,
    color: colors.text.secondary,
    maxWidth: 200,
    marginTop: 1,
  },
  totalBlock: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10.5,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text.primary,
  },
});
