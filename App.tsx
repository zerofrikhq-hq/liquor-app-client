import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  Text,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/config/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { Vendor, Product, Order } from './src/types';

// Components
import { Header } from './src/components/Header';
import { VendorConflictModal } from './src/components/VendorConflictModal';

// Screens
import { AuthScreen } from './src/screens/AuthScreen';
import { MarketplaceHomeScreen } from './src/screens/MarketplaceHomeScreen';
import { VendorStorefrontScreen } from './src/screens/VendorStorefrontScreen';
import { ProductDetailsScreen } from './src/screens/ProductDetailsScreen';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { ThankYouScreen } from './src/screens/ThankYouScreen';
import { MyOrdersScreen } from './src/screens/MyOrdersScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Inject CSS reset on web to eliminate browser's native focus ring/outline on text inputs and ensure icon fonts load
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'chillbro-web-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @font-face {
        font-family: 'ionicons';
        src: url('/fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Ionicons';
        src: url('/fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      input, textarea, select, [contenteditable] {
        outline: none !important;
        outline-color: transparent !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input:focus, textarea:focus, select:focus, [contenteditable]:focus {
        outline: none !important;
        outline-color: transparent !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

type Screen = 'home' | 'store' | 'pdp' | 'cart' | 'checkout' | 'thankyou' | 'orders' | 'profile' | 'auth';

interface HistoryEntry {
  screen: Screen;
  vendor?: Vendor | null;
  product?: Product | null;
}

function MainApp() {
  const { isAuthenticated, logout } = useAuth();
  const { cart, vendorConflict, resolveVendorConflict, dismissConflict } = useCart();

  // Navigation History Stack
  const [history, setHistory] = useState<HistoryEntry[]>([{ screen: 'home' }]);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Screen & contextual params derived from top of history stack
  const currentEntry = history[history.length - 1] || { screen: 'home' };
  const currentScreen = currentEntry.screen;
  const selectedVendor = currentEntry.vendor || null;
  const selectedProduct = currentEntry.product || null;

  // Navigates forward, pushing the new screen onto history
  const navigateTo = (
    screen: Screen,
    params?: { vendor?: Vendor | null; product?: Product | null; replace?: boolean }
  ) => {
    setHistory((prev) => {
      const current = prev[prev.length - 1];
      const vendorToUse = params?.vendor !== undefined ? params.vendor : (current?.vendor || null);
      const productToUse =
        params?.product !== undefined
          ? params.product
          : screen === 'pdp'
          ? current?.product || null
          : null;

      // Don't push identical consecutive entries
      if (
        current &&
        current.screen === screen &&
        current.vendor?.id === vendorToUse?.id &&
        current.product?.id === productToUse?.id
      ) {
        return prev;
      }

      const newEntry: HistoryEntry = {
        screen,
        vendor: vendorToUse,
        product: productToUse,
      };

      if (params?.replace) {
        return [...prev.slice(0, prev.length - 1), newEntry];
      }

      const next = [...prev, newEntry];
      return next.length > 30 ? next.slice(next.length - 30) : next;
    });
  };

  // Navigates backward to the exact previous screen in history
  const goBack = () => {
    setHistory((prev) => {
      if (prev.length <= 1) {
        return [{ screen: 'home' }];
      }
      return prev.slice(0, prev.length - 1);
    });
  };

  // Resets navigation stack back to home root
  const resetToHome = () => {
    setHistory([{ screen: 'home' }]);
  };

  // Hardware Back Button integration (Android)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const onHardwareBackPress = () => {
      if (history.length > 1) {
        goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => subscription.remove();
  }, [history.length]);

  // Navigation handlers
  const handleSelectVendor = (vendor: Vendor) => {
    navigateTo('store', { vendor, product: null });
  };

  const handleSelectProduct = (product: Product) => {
    navigateTo('pdp', { vendor: selectedVendor, product });
  };

  const handleOrderPlaced = (order: Order) => {
    setLastPlacedOrder(order);
    navigateTo('thankyou');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Global Header (shown on Home, Store) */}
        {(currentScreen === 'home' || currentScreen === 'store') && (
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={
              currentScreen === 'store'
                ? `Search ${selectedVendor?.name || 'store'}...`
                : 'Search stores or vendors...'
            }
            onCartPress={() => navigateTo('cart')}
            onProfilePress={() => {
              if (isAuthenticated) {
                navigateTo('profile');
              } else {
                navigateTo('auth');
              }
            }}
          />
        )}

        {/* Screen Routing */}
        <View style={styles.content}>
          {currentScreen === 'auth' && (
            <AuthScreen
              onSuccess={goBack}
              onBack={goBack}
            />
          )}

          {currentScreen === 'home' && (
            <MarketplaceHomeScreen
              onSelectVendor={handleSelectVendor}
              searchQuery={searchQuery}
            />
          )}

          {currentScreen === 'store' && (
            selectedVendor ? (
              <VendorStorefrontScreen
                vendor={selectedVendor}
                onBack={goBack}
                onSelectProduct={handleSelectProduct}
                onRequireAuth={() => navigateTo('auth')}
                searchQuery={searchQuery}
              />
            ) : (
              <MarketplaceHomeScreen
                onSelectVendor={handleSelectVendor}
                searchQuery={searchQuery}
              />
            )
          )}

          {currentScreen === 'pdp' && (
            selectedProduct ? (
              <ProductDetailsScreen
                product={selectedProduct}
                vendorName={selectedVendor?.name || 'Licensed Store'}
                onBack={goBack}
                onOpenCart={() => navigateTo('cart')}
                onRequireAuth={() => navigateTo('auth')}
              />
            ) : (
              <MarketplaceHomeScreen
                onSelectVendor={handleSelectVendor}
                searchQuery={searchQuery}
              />
            )
          )}

          {currentScreen === 'cart' && (
            <CartScreen
              onBack={goBack}
              onProceedCheckout={() => {
                if (!isAuthenticated) {
                  navigateTo('auth');
                } else {
                  navigateTo('checkout');
                }
              }}
              onExploreVendors={resetToHome}
            />
          )}

          {currentScreen === 'checkout' && (
            <CheckoutScreen
              onBack={goBack}
              onOrderPlaced={handleOrderPlaced}
            />
          )}

          {currentScreen === 'thankyou' && lastPlacedOrder && (
            <ThankYouScreen
              order={lastPlacedOrder}
              onTrackOrders={() => navigateTo('orders')}
              onContinueShopping={resetToHome}
            />
          )}

          {currentScreen === 'orders' && (
            <MyOrdersScreen
              onBack={goBack}
              onExploreVendors={resetToHome}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              onBack={goBack}
              onLogout={() => {
                logout();
                resetToHome();
              }}
            />
          )}
        </View>

        {/* Bottom Tab Bar (shown on Home, Store, Cart, PDP, Orders, Profile) */}
        {['home', 'store', 'cart', 'pdp', 'orders', 'profile'].includes(currentScreen) && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                if (currentScreen === 'home') return;
                navigateTo('home', { vendor: null, product: null });
              }}
            >
              <Ionicons
                name={
                  currentScreen === 'home' || currentScreen === 'store' || currentScreen === 'pdp'
                    ? 'storefront'
                    : 'storefront-outline'
                }
                size={22}
                color={
                  currentScreen === 'home' || currentScreen === 'store' || currentScreen === 'pdp'
                    ? colors.gold.primary
                    : '#94A3B8'
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  currentScreen === 'home' || currentScreen === 'store' || currentScreen === 'pdp'
                    ? styles.tabLabelActive
                    : null,
                ]}
              >
                Stores
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                if (currentScreen === 'cart') return;
                navigateTo('cart');
              }}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={currentScreen === 'cart' ? 'cart' : 'cart-outline'}
                  size={22}
                  color={currentScreen === 'cart' ? colors.gold.primary : '#94A3B8'}
                />
                {cart.itemCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{cart.itemCount}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  currentScreen === 'cart' ? styles.tabLabelActive : null,
                ]}
              >
                Cart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                if (currentScreen === 'orders') return;
                if (!isAuthenticated) {
                  navigateTo('auth');
                } else {
                  navigateTo('orders');
                }
              }}
            >
              <Ionicons
                name={currentScreen === 'orders' ? 'receipt' : 'receipt-outline'}
                size={22}
                color={currentScreen === 'orders' ? colors.gold.primary : '#94A3B8'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  currentScreen === 'orders' ? styles.tabLabelActive : null,
                ]}
              >
                My Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                if (currentScreen === 'profile') return;
                if (!isAuthenticated) {
                  navigateTo('auth');
                } else {
                  navigateTo('profile');
                }
              }}
            >
              <Ionicons
                name={currentScreen === 'profile' ? 'person' : 'person-outline'}
                size={22}
                color={currentScreen === 'profile' ? colors.gold.primary : '#94A3B8'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  currentScreen === 'profile' ? styles.tabLabelActive : null,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Global Single-Vendor Conflict Modal */}
        <VendorConflictModal
          conflict={vendorConflict}
          onCancel={dismissConflict}
          onOverwrite={() => resolveVendorConflict(true)}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ionicons: require('./assets/fonts/Ionicons.ttf'),
    Ionicons: require('./assets/fonts/Ionicons.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark.darkest, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.darkest,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
    ...(Platform.OS === 'web'
      ? {
          height: '100%',
          maxHeight: '100%',
          overflow: 'hidden' as const,
        }
      : {}),
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface.light,
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.dark.bg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 24 : Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.gold.primary,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.status.badgeDanger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
});
