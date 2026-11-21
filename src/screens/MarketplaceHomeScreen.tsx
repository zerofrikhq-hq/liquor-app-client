import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { Vendor } from '../types';
import { api } from '../services/api';

interface Props {
  onSelectVendor: (vendor: Vendor) => void;
  searchQuery: string;
}

export const MarketplaceHomeScreen: React.FC<Props> = ({
  onSelectVendor,
  searchQuery,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadVendors = async () => {
    try {
      const res = await api.fetchVendors();
      if (res.success && res.vendors) {
        setVendors(res.vendors);
      }
    } catch (err) {
      console.warn('[Marketplace] load vendors error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadVendors();
  };

  // Search exclusively across stores & vendors (by business name, address, or description)
  const isSearching = searchQuery.trim().length > 0;
  const filteredVendors = vendors.filter((v) => {
    if (!isSearching) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      v.name.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)
    );
  });

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
        <Text style={styles.loadingText}>Locating nearest liquor stores...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold.primary} />}
    >
      {/* 1. Hero Promotional Banner (shown when not searching) */}
      {!isSearching && (
        <View style={styles.heroBanner}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <View style={styles.heroEyebrowRow}>
              <Text style={styles.heroEyebrow}>AUSTRALIA'S TRUSTED LIQUOR DELIVERY</Text>
            </View>
            <Text style={styles.heroTitle}>Enjoy Your Weekend</Text>
            <Text style={styles.heroSubtitle}>With Australia's Favourite Drinks</Text>
            <Text style={styles.heroDesc}>Premium single malts, craft gins, and fine wines delivered to your door.</Text>

            <View style={styles.promoBadge}>
              <Ionicons name="flash" size={13} color={colors.gold.dark} />
              <Text style={styles.promoBadgeText}>EXPRESS 30–45 MIN DELIVERY TO YOUR DOOR</Text>
            </View>
          </View>
        </View>
      )}

      {/* 2. Trust Strip (shown when not searching) */}
      {!isSearching && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color={colors.gold.primary} />
            <Text style={styles.trustText}>Licensed Retailer</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="flash" size={16} color={colors.status.deliveryText} />
            <Text style={styles.trustText}>30–45m Delivery</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="person" size={16} color={colors.gold.primary} />
            <Text style={styles.trustText}>18+ ID Checked</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="card" size={16} color={colors.gold.primary} />
            <Text style={styles.trustText}>Secure Stripe Pay</Text>
          </View>
        </ScrollView>
      )}

      {/* 3. Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {isSearching ? `Stores matching "${searchQuery}"` : 'Select Your Store'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {isSearching
              ? `Found ${filteredVendors.length} store${filteredVendors.length === 1 ? '' : 's'}`
              : 'Each order is delivered directly from a single licensed cellar'}
          </Text>
        </View>
        <View style={styles.storeCountBadge}>
          <Text style={styles.storeCountText}>{filteredVendors.length} Stores</Text>
        </View>
      </View>

      {/* 4. Empty State when searching */}
      {isSearching && filteredVendors.length === 0 ? (
        <View style={styles.emptySearchBox}>
          <Ionicons name="storefront-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No Stores Found</Text>
          <Text style={styles.emptySubtitle}>
            We couldn't find any licensed stores matching "{searchQuery}".
          </Text>
        </View>
      ) : (
        /* 5. Vendor Cards Stack */
        <View style={styles.vendorList}>
          {filteredVendors.map((vendor) => (
            <TouchableOpacity
              key={vendor.id}
              style={styles.vendorCard}
              onPress={() => onSelectVendor(vendor)}
              activeOpacity={0.88}
            >
              {/* Store Image Banner */}
              <View style={styles.storeImageWrap}>
                <Image source={{ uri: vendor.imageUrl }} style={styles.storeImage} resizeMode="cover" />
                <View style={styles.storeImageOverlay} />

                {/* Express SLA Floating Tag */}
                <View style={styles.floatingEtaTag}>
                  <Ionicons name="flash" size={11} color={colors.status.deliveryText} />
                  <Text style={styles.floatingEtaText}>{vendor.eta}</Text>
                </View>
              </View>

              {/* Store Body Info */}
              <View style={styles.storeBody}>
                <View style={styles.storeTitleRow}>
                  <Text style={styles.storeName}>{vendor.name}</Text>
                  <View style={styles.verifiedStoreBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.gold.primary} />
                    <Text style={styles.verifiedStoreText}>Licensed Cellar</Text>
                  </View>
                </View>

                <Text style={styles.storeDesc} numberOfLines={2}>
                  {vendor.description}
                </Text>

                <View style={styles.storeMetaRow}>
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={13} color={colors.text.muted} />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {vendor.address}
                    </Text>
                  </View>

                  <View style={styles.productCountPill}>
                    <Text style={styles.productCountText}>{vendor.productCount} Bottles</Text>
                  </View>
                </View>

                {/* Action Button */}
                <View style={styles.storeActionRow}>
                  <Text style={styles.licenceText}>Licence: {vendor.licenceNumber}</Text>
                  <View style={styles.shopBtn}>
                    <Text style={styles.shopBtnText}>Shop Store</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.dark.darkest} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.light,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.light,
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  heroBanner: {
    backgroundColor: colors.dark.bg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  heroContent: {
    zIndex: 2,
  },
  heroEyebrowRow: {
    marginBottom: 6,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold.primary,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold.soft,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  promoBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.gold.dark,
    letterSpacing: 0.8,
  },
  trustStrip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 10,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  trustText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  storeCountBadge: {
    backgroundColor: colors.dark.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  storeCountText: {
    color: colors.gold.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  vendorList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  vendorCard: {
    backgroundColor: colors.surface.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  storeImageWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeImageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  floatingEtaTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.status.deliveryBg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  floatingEtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.status.deliveryText,
  },
  storeBody: {
    padding: spacing.md,
  },
  storeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  verifiedStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  verifiedStoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  storeDesc: {
    fontSize: 12.5,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  storeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.borderSubtle,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  addressText: {
    fontSize: 11.5,
    color: colors.text.muted,
  },
  productCountPill: {
    backgroundColor: colors.surface.subtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  productCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  storeActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  licenceText: {
    fontSize: 11,
    color: colors.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  shopBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.dark.darkest,
  },
  emptySearchBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
