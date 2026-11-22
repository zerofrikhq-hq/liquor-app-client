import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { Product } from '../types';

interface Props {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  isAdding?: boolean;
  isAdded?: boolean;
}

export const ProductCard: React.FC<Props> = ({
  product,
  onPress,
  onAddToCart,
  isAdding = false,
  isAdded = false,
}) => {
  const isOutOfStock = !product.isInStock || product.qty <= 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Bottle Image Canvas */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />

        {/* Stock Status Pill */}
        <View style={[styles.stockPill, isOutOfStock ? styles.stockPillOut : styles.stockPillIn]}>
          <View style={[styles.stockDot, isOutOfStock ? styles.stockDotOut : styles.stockDotIn]} />
          <Text style={[styles.stockText, isOutOfStock ? styles.stockTextOut : styles.stockTextIn]}>
            {isOutOfStock ? 'Sold Out' : `In Stock: ${Math.floor(product.qty)}`}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        {/* Specs Pill */}
        <View style={styles.specsRow}>
          <Text style={styles.specsText}>{product.abv || '40% ABV'} • {product.size || '700mL'}</Text>
          {product.origin ? (
            <Text style={styles.originText}>{product.origin}</Text>
          ) : null}
        </View>

        {/* Product Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price & Delivery SLA */}
        <View style={styles.priceRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.specialPrice && (
              <Text style={styles.comparePrice}>${product.specialPrice.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.deliveryTag}>
            <Ionicons name="flash" size={10} color={colors.status.deliveryText} />
            <Text style={styles.deliveryTagText}>30–45m</Text>
          </View>
        </View>

        {/* Add to Cart CTA */}
        <TouchableOpacity
          style={[
            styles.addButton,
            isOutOfStock ? styles.addButtonDisabled : null,
            isAdded ? styles.addButtonSuccess : null,
          ]}
          onPress={(e: any) => {
            e?.stopPropagation?.();
            onAddToCart();
          }}
          disabled={isOutOfStock || isAdding}
          activeOpacity={0.8}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isAdded ? (
            <>
              <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Added!</Text>
            </>
          ) : (
            <>
              <Ionicons
                name={isOutOfStock ? 'ban' : 'cart-outline'}
                size={15}
                color={isOutOfStock ? colors.text.muted : '#FFFFFF'}
              />
              <Text style={[styles.addButtonText, isOutOfStock ? styles.addButtonTextDisabled : null]}>
                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    overflow: 'hidden',
    width: '48.5%',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    height: 150,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: spacing.sm,
  },
  image: {
    width: '85%',
    height: '85%',
  },
  stockPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  stockPillIn: {
    backgroundColor: colors.status.inStockBg,
  },
  stockPillOut: {
    backgroundColor: colors.status.outOfStockBg,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  stockDotIn: {
    backgroundColor: colors.status.inStockText,
  },
  stockDotOut: {
    backgroundColor: colors.status.outOfStockText,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stockTextIn: {
    color: colors.status.inStockText,
  },
  stockTextOut: {
    color: colors.status.outOfStockText,
  },
  details: {
    padding: 12,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  specsText: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
  },
  originText: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: '500',
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  comparePrice: {
    fontSize: 11,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  deliveryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.status.deliveryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deliveryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.status.deliveryText,
  },
  addButton: {
    backgroundColor: colors.dark.bg,
    borderRadius: radii.md,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
  },
  addButtonSuccess: {
    backgroundColor: '#16A34A',
  },
  addButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  addButtonTextDisabled: {
    color: colors.text.muted,
  },
});
