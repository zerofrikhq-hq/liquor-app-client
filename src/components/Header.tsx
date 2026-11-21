import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { useCart } from '../context/CartContext';

interface Props {
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onCartPress: () => void;
  onProfilePress?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export const Header: React.FC<Props> = ({
  searchQuery = '',
  onSearchChange,
  onCartPress,
  onProfilePress,
  showSearch = true,
  searchPlaceholder = 'Search stores or vendors...',
}) => {
  const { cart } = useCart();

  return (
    <View style={styles.container}>
      {/* Main Brand Row */}
      <View style={styles.brandRow}>
        <View style={styles.brandCol}>
          <View style={styles.logoRow}>
            <Text style={styles.brandTitle}>Chillbro</Text>
            <View style={styles.crownDot} />
          </View>
          <Text style={styles.brandTagline}>GOOD DRINKS. GREAT TIMES.</Text>
        </View>

        {/* Header Actions */}
        <View style={styles.actionsRow}>
          {onProfilePress && (
            <TouchableOpacity style={styles.actionIconBtn} onPress={onProfilePress}>
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Cart Pill */}
          <TouchableOpacity style={styles.cartPill} onPress={onCartPress} activeOpacity={0.8}>
            <View style={styles.cartIconWrap}>
              <Ionicons name="cart" size={17} color={colors.gold.primary} />
              {cart.itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.cartAmountText}>
              ${cart.total > 0 ? cart.total.toFixed(2) : '0.00'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Search Bar */}
      {showSearch && onSearchChange && (
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={onSearchChange}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => onSearchChange('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },

  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandCol: {
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  crownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold.primary,
  },
  brandTagline: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.gold.primary,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  cartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.gold.primary,
  },
  cartIconWrap: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.status.badgeDanger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cartAmountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2229',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2A2F3A',
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
});
