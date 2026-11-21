import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { useCart } from '../context/CartContext';

interface Props {
  onBack: () => void;
  onProceedCheckout: () => void;
  onExploreVendors: () => void;
}

export const CartScreen: React.FC<Props> = ({
  onBack,
  onProceedCheckout,
  onExploreVendors,
}) => {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Your Cart</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={48} color={colors.gold.primary} />
          </View>
          <Text style={styles.emptyHeading}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>Add bottles from your favourite licensed cellar to get started.</Text>

          <TouchableOpacity style={styles.exploreBtn} onPress={onExploreVendors} activeOpacity={0.85}>
            <Text style={styles.exploreBtnText}>Explore Liquor Stores</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.dark.darkest} />
          </TouchableOpacity>
        </View>
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
        <Text style={styles.topBarTitle}>Your Cart ({cart.itemCount})</Text>
        <TouchableOpacity onPress={clearCart} style={{ padding: 4 }}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Vendor Lock Header Banner */}
      {cart.vendor && (
        <View style={styles.vendorLockBanner}>
          <Ionicons name="storefront" size={16} color={colors.gold.dark} />
          <View style={styles.vendorLockTextCol}>
            <Text style={styles.vendorLockTitle}>Delivering from: {cart.vendor.name}</Text>
            <Text style={styles.vendorLockSub}>30–45 min express delivery in Sydney, NSW</Text>
          </View>
        </View>
      )}

      {/* Cart Items List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.itemsList}>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {/* Thumbnail */}
              <View style={styles.thumbnailWrap}>
                <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="contain" />
              </View>

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.selectedVolume} • SKU: {item.sku}</Text>
                <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)}</Text>
              </View>

              {/* Stepper & Delete */}
              <View style={styles.stepperCol}>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={15} color={colors.text.muted} />
                </TouchableOpacity>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={14} color={colors.text.primary} />
                  </TouchableOpacity>

                  <Text style={styles.stepNum}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={14} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Guarantee Card */}
        <View style={styles.slaCard}>
          <Ionicons name="flash" size={16} color={colors.status.deliveryText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.slaTitle}>Express Delivery Guaranteed</Text>
            <Text style={styles.slaDesc}>Couriers verify 18+ Photo ID at doorstep. 100% Genuine stock.</Text>
          </View>
        </View>

        {/* Bill Breakdown */}
        <View style={styles.billCard}>
          <Text style={styles.billHeading}>Order Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Subtotal</Text>
            <Text style={styles.billVal}>${cart.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.billLabel}>Express Delivery Fee</Text>
              {cart.subtotal >= 100 && <Text style={styles.freeBadge}>FREE</Text>}
            </View>
            <Text style={styles.billVal}>
              {cart.deliveryFee === 0 ? '$0.00' : `$${cart.deliveryFee.toFixed(2)}`}
            </Text>
          </View>

          {cart.subtotal < 100 && (
            <Text style={styles.freeDeliveryHint}>
              Add ${(100 - cart.subtotal).toFixed(2)} more for FREE delivery!
            </Text>
          )}

          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total to Pay</Text>
            <Text style={styles.totalVal}>${cart.total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalVal}>${cart.total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn} onPress={onProceedCheckout} activeOpacity={0.88}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.dark.darkest} />
        </TouchableOpacity>
      </View>
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
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.status.badgeDanger,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.surface.light,
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13.5,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radii.md,
  },
  exploreBtnText: {
    color: colors.dark.darkest,
    fontWeight: '800',
    fontSize: 14,
  },
  vendorLockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.gold.soft,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  vendorLockTextCol: {
    flex: 1,
  },
  vendorLockTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.gold.dark,
  },
  vendorLockSub: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
  },
  itemsList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  itemMeta: {
    fontSize: 11.5,
    color: colors.text.muted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 4,
  },
  stepperCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.primary,
    minWidth: 20,
    textAlign: 'center',
  },
  slaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.status.deliveryBg,
    padding: 12,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  slaTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.status.deliveryText,
  },
  slaDesc: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  billHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  billVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text.primary,
  },
  freeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.status.success,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freeDeliveryHint: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.gold.dark,
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: colors.text.muted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  bottomTotalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text.primary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.dark.darkest,
  },
});
