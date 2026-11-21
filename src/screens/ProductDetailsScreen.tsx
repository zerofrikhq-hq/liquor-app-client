import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  product: Product;
  vendorName: string;
  onBack: () => void;
  onOpenCart: () => void;
  onRequireAuth?: () => void;
}

export const ProductDetailsScreen: React.FC<Props> = ({
  product,
  vendorName,
  onBack,
  onOpenCart,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();

  const [selectedVolume, setSelectedVolume] = useState<string>(
    product.volumeOptions?.[0]?.size || product.size || '700mL'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Find price for selected volume
  const currentVolumeOption = product.volumeOptions?.find((v) => v.size === selectedVolume);
  const unitPrice = currentVolumeOption ? currentVolumeOption.price : product.price;
  const totalPrice = unitPrice * quantity;

  const isOutOfStock = !product.isInStock || product.qty <= 0;

  const handleIncrement = () => {
    if (quantity < product.qty) {
      setQuantity((q) => q + 1);
    } else {
      Alert.alert('Stock Limit', `Only ${Math.floor(product.qty)} bottles available.`);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      onRequireAuth?.();
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product, vendorName, quantity, selectedVolume);
      setIsAdded(true);
      setToastMessage(`✓ ${quantity}x "${product.name}" added to cart!`);
      setTimeout(() => setIsAdded(false), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      Alert.alert('Cart Error', err.message || 'Could not add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Floating Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.circleBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.vendorPill}>
            <Text style={styles.vendorPillText} numberOfLines={1}>{vendorName}</Text>
          </View>

          <TouchableOpacity style={styles.circleBtn} onPress={onOpenCart}>
            <Ionicons name="cart" size={18} color={colors.text.primary} />
            {cart.itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Scrollable Body */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Bottle View */}
          <View style={styles.bottleContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.bottleImage} resizeMode="contain" />
          </View>

          <View style={styles.detailsCard}>
            {/* Brand & Genuine Badge */}
            <View style={styles.metaRow}>
              <Text style={styles.brand}>{product.brand.toUpperCase()}</Text>
              <View style={styles.genuineBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.gold.primary} />
                <Text style={styles.genuineText}>100% Genuine</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.sku}>SKU: {product.sku}</Text>

            {/* Spec Chips (ABV, Size, Origin) */}
            <View style={styles.specsRow}>
              <View style={styles.specChip}>
                <Ionicons name="water-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.specChipText}>{product.abv}</Text>
              </View>
              <View style={styles.specChip}>
                <Ionicons name="flask-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.specChipText}>{product.size}</Text>
              </View>
              <View style={styles.specChip}>
                <Ionicons name="globe-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.specChipText}>{product.origin}</Text>
              </View>
            </View>

            {/* Price Row */}
            <View style={styles.priceRow}>
              <View style={styles.priceBlock}>
                <Text style={styles.price}>${unitPrice.toFixed(2)}</Text>
                {product.specialPrice && (
                  <Text style={styles.strikePrice}>${product.specialPrice.toFixed(2)}</Text>
                )}
              </View>

              {/* Live Inventory Status */}
              <View style={[styles.stockPill, isOutOfStock ? styles.stockPillOut : styles.stockPillIn]}>
                <View style={[styles.stockDot, isOutOfStock ? styles.stockDotOut : styles.stockDotIn]} />
                <Text style={[styles.stockText, isOutOfStock ? styles.stockTextOut : styles.stockTextIn]}>
                  {isOutOfStock ? 'Currently Out of Stock' : `In Stock: ${Math.floor(product.qty)} bottles`}
                </Text>
              </View>
            </View>

            {/* Volume Variants */}
            {product.volumeOptions && product.volumeOptions.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Select Bottle Size / Option</Text>
                <View style={styles.variantRow}>
                  {product.volumeOptions.map((opt) => {
                    const isSelected = selectedVolume === opt.size;
                    return (
                      <TouchableOpacity
                        key={opt.size}
                        style={[styles.variantPill, isSelected ? styles.variantPillActive : null]}
                        onPress={() => setSelectedVolume(opt.size)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.variantSize, isSelected ? styles.variantSizeActive : null]}>
                          {opt.size}
                        </Text>
                        <Text style={[styles.variantPrice, isSelected ? styles.variantPriceActive : null]}>
                          ${opt.price.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Product Overview</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>

            {/* Store & Express Assurance */}
            <View style={styles.assuranceBox}>
              <Ionicons name="flash" size={24} color={colors.gold.primary} />
              <View style={styles.assuranceTextCol}>
                <Text style={styles.assuranceTitle}>30–45 Minute Express Delivery</Text>
                <Text style={styles.assuranceSubtitle}>Dispatched cold from {vendorName}. 18+ ID check upon arrival.</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating Added to Cart Toast */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.toastText} numberOfLines={1}>{toastMessage}</Text>
          </View>
        )}

        {/* Sticky Bottom Touch Action Bar */}
        <View style={styles.bottomBar}>
          {/* Stepper */}
          <View style={styles.stepperWrap}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={handleDecrement}
              disabled={quantity <= 1 || isOutOfStock}
            >
              <Ionicons name="remove" size={18} color={quantity <= 1 ? colors.text.muted : colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.stepCount}>{quantity}</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={handleIncrement}
              disabled={isOutOfStock}
            >
              <Ionicons name="add" size={18} color={isOutOfStock ? colors.text.muted : colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Add to Cart CTA */}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              isOutOfStock ? styles.ctaButtonDisabled : null,
              isAdded ? styles.ctaButtonSuccess : null,
            ]}
            onPress={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            activeOpacity={0.85}
          >
            {isAdding ? (
              <ActivityIndicator color={colors.dark.darkest} />
            ) : isAdded ? (
              <>
                <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
                <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>Added to Cart!</Text>
              </>
            ) : (
              <>
                <Ionicons name="cart" size={18} color={colors.dark.darkest} />
                <Text style={styles.ctaText}>
                  {isOutOfStock ? 'Sold Out' : `Add to Cart • $${totalPrice.toFixed(2)}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    position: 'absolute',
    top: 12,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorPill: {
    backgroundColor: 'rgba(22, 25, 30, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    maxWidth: '55%',
  },
  vendorPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.status.badgeDanger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  bottleContainer: {
    height: 320,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  bottleImage: {
    width: '80%',
    height: '80%',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gold.dark,
    letterSpacing: 1.5,
  },
  genuineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  genuineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text.primary,
    lineHeight: 28,
    marginBottom: 4,
  },
  sku: {
    fontSize: 11.5,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface.subtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text.primary,
  },
  strikePrice: {
    fontSize: 16,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  stockPillIn: {
    backgroundColor: '#DCFCE7',
  },
  stockPillOut: {
    backgroundColor: '#FEE2E2',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockDotIn: {
    backgroundColor: colors.status.success,
  },
  stockDotOut: {
    backgroundColor: colors.status.badgeDanger,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockTextIn: {
    color: '#15803D',
  },
  stockTextOut: {
    color: '#B91C1C',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantPill: {
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  variantPillActive: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.gold.soft,
  },
  variantSize: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  variantSizeActive: {
    color: colors.dark.darkest,
  },
  variantPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
    marginTop: 2,
  },
  variantPriceActive: {
    color: colors.gold.dark,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 13.5,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  assuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF9C3',
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  assuranceTextCol: {
    flex: 1,
  },
  assuranceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
  },
  assuranceSubtitle: {
    fontSize: 11.5,
    color: '#A16207',
    marginTop: 2,
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
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stepCount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  ctaButton: {
    flex: 1,
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.gold.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  ctaButtonSuccess: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  ctaButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  ctaText: {
    color: colors.dark.darkest,
    fontWeight: '800',
    fontSize: 15,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 84,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: '#16191E',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
