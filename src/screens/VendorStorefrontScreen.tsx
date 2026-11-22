import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { Vendor, Product } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { FilterBar } from '../components/FilterBar';

interface Props {
  vendor: Vendor;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onRequireAuth?: () => void;
  searchQuery: string;
}

export const VendorStorefrontScreen: React.FC<Props> = ({
  vendor,
  onBack,
  onSelectProduct,
  onRequireAuth,
  searchQuery,
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamically load categories ONLY for products that exist in this vendor's catalog
  useEffect(() => {
    api.fetchVendorProducts(vendor.id)
      .then((res) => {
        if (res.success && res.products) {
          const uniqueCats = Array.from(
            new Set(res.products.map((p) => p.categoryName || '').filter(Boolean))
          );
          setCategories(uniqueCats);
        }
      })
      .catch((e) => console.warn('[Storefront] categories error:', e));
  }, [vendor.id]);

  // Load Vendor Products with current filters
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.fetchVendorProducts(vendor.id, {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        inStockOnly,
        search: searchQuery.trim() || undefined,
        sortBy: sortBy !== 'featured' ? sortBy : undefined,
      });

      if (res.success && res.products) {
        // Safeguard: Deduplicate by product id to prevent duplicate cards
        const seen = new Set<string>();
        const uniqueProducts = res.products.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setProducts(uniqueProducts);
      }
    } catch (err) {
      console.warn('[Storefront] load products error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [vendor.id, selectedCategory, inStockOnly, searchQuery, sortBy]);

  useEffect(() => {
    setIsLoading(true);
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const cycleSort = () => {
    const sortCycle = ['featured', 'price_asc', 'price_desc'];
    const nextIdx = (sortCycle.indexOf(sortBy) + 1) % sortCycle.length;
    setSortBy(sortCycle[nextIdx]);
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (addingId) return; // Prevent double taps

    setAddingId(product.id);
    try {
      await addToCart(product, vendor.name, 1);
      setAddedId(product.id);
      setToastMessage(`✓ 1x "${product.name}" added to cart`);
      setTimeout(() => {
        setAddedId((curr) => (curr === product.id ? null : curr));
      }, 1800);
      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    } catch (err: any) {
      Alert.alert('Cart Error', err.message || 'Could not add to cart.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Store Header Bar */}
      <View style={styles.vendorBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
          <View style={styles.vendorMeta}>
            <View style={styles.licencePill}>
              <Ionicons name="shield-checkmark" size={10} color={colors.gold.primary} />
              <Text style={styles.licencePillText}>Licensed Cellar</Text>
            </View>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.etaText}>⚡ {vendor.eta}</Text>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.licenceText}>{vendor.licenceNumber}</Text>
          </View>
        </View>
      </View>

      {/* 2. Filter Bar */}
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        inStockOnly={inStockOnly}
        onToggleInStock={() => setInStockOnly(!inStockOnly)}
        sortBy={sortBy}
        onCycleSort={cycleSort}
      />

      {/* 3. Product Catalog Grid */}
      {isLoading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gold.primary} />
          <Text style={styles.loadingText}>Fetching bottles from {vendor.name}...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="wine-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySubtitle}>Try resetting your filters or search terms.</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setSelectedCategory('all');
              setInStockOnly(false);
              setSortBy('featured');
            }}
          >
            <Text style={styles.resetBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold.primary} />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => onSelectProduct(item)}
              onAddToCart={() => handleAddToCart(item)}
              isAdding={addingId === item.id}
              isAdded={addedId === item.id}
            />
          )}
        />
      )}

      {/* 4. Floating Added to Cart Confirmation Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text style={styles.toastText} numberOfLines={1}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.light,
  },
  vendorBar: {
    backgroundColor: colors.dark.bg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  licencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  licencePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold.primary,
  },
  bullet: {
    color: '#64748B',
    fontSize: 10,
  },
  etaText: {
    fontSize: 11,
    color: colors.status.deliveryText,
    fontWeight: '700',
  },
  licenceText: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  centerBox: {
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
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  resetBtn: {
    backgroundColor: colors.gold.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.md,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark.darkest,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
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
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
