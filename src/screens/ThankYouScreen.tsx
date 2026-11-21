import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { Order } from '../types';

interface Props {
  order: Order;
  onTrackOrders: () => void;
  onContinueShopping: () => void;
}

export const ThankYouScreen: React.FC<Props> = ({
  order,
  onTrackOrders,
  onContinueShopping,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Checkmark Banner */}
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark-circle" size={64} color={colors.status.success} />
      </View>

      <Text style={styles.heading}>Order Placed Successfully!</Text>
      <Text style={styles.orderNumber}>Order #{order.id}</Text>

      {/* SLA Countdown Card */}
      <View style={styles.slaCard}>
        <View style={styles.slaIconWrap}>
          <Ionicons name="flash" size={24} color={colors.status.deliveryText} />
        </View>
        <Text style={styles.slaTitle}>Estimated Delivery</Text>
        <Text style={styles.slaTime}>30–45 Minutes</Text>
        <Text style={styles.slaSub}>Our courier has been dispatched in Sydney, NSW</Text>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Destination</Text>
          <Text style={styles.val} numberOfLines={2}>{order.deliveryAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Status</Text>
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-done" size={13} color="#15803D" />
            <Text style={styles.paidText}>Paid via Stripe</Text>
          </View>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalVal}>${order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* 18+ Reminder */}
      <View style={styles.ageNotice}>
        <Ionicons name="alert-circle-outline" size={16} color="#94A3B8" />
        <Text style={styles.ageNoticeText}>
          Please have your valid 18+ Australian Photo ID ready for verification at doorstep.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionCol}>
        <TouchableOpacity style={styles.trackBtn} onPress={onTrackOrders} activeOpacity={0.88}>
          <Ionicons name="receipt-outline" size={18} color={colors.gold.primary} />
          <Text style={styles.trackBtnText}>Track in My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueBtn} onPress={onContinueShopping} activeOpacity={0.7}>
          <Text style={styles.continueBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.light,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    paddingTop: spacing.xxl * 1.5,
  },
  iconCircle: {
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold.dark,
    marginBottom: spacing.xl,
  },
  slaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  slaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.status.deliveryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  slaTime: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.status.deliveryText,
    marginTop: 2,
  },
  slaSub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.lg,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text.primary,
  },
  ageNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  ageNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  actionCol: {
    width: '100%',
    gap: spacing.md,
  },
  trackBtn: {
    backgroundColor: colors.dark.bg,
    borderRadius: radii.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  trackBtnText: {
    color: colors.gold.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  continueBtn: {
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  continueBtnText: {
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
});
