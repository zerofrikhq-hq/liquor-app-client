import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Cart, Product, VendorConflict } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  vendorConflict: VendorConflict | null;
  addToCart: (product: Product, vendorName: string, quantity?: number, selectedVolume?: string) => Promise<void>;
  resolveVendorConflict: (overwrite: boolean) => Promise<void>;
  dismissConflict: () => void;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const defaultCart: Cart = {
  id: null,
  vendor: null,
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  itemCount: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(defaultCart);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vendorConflict, setVendorConflict] = useState<VendorConflict | null>(null);

  // Sync cart from database
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(defaultCart);
      return;
    }
    try {
      const res = await api.fetchCart(user.id);
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } catch (err) {
      console.warn('[CartContext] fetchCart error:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add to Cart with Single-Vendor Conflict Detection
  const addToCart = async (
    product: Product,
    vendorName: string,
    quantity: number = 1,
    selectedVolume?: string
  ) => {
    if (!user) {
      throw new Error('Please sign in to add items to your cart.');
    }

    const volume = selectedVolume || product.size || '700mL';

    // 1. Client-side conflict pre-check
    if (cart.vendor && cart.items.length > 0 && cart.vendor.id !== product.vendorId) {
      setVendorConflict({
        currentVendor: cart.vendor,
        newVendor: { id: product.vendorId, name: vendorName },
        pendingProduct: product,
        pendingQuantity: quantity,
        pendingVolume: volume,
      });
      return;
    }

    // 2. Add via backend API
    setIsLoading(true);
    try {
      const res = await api.addToCart({
        userId: user.id,
        vendorId: product.vendorId,
        productId: product.id,
        quantity,
        selectedVolume: volume,
        overwrite: false,
      });

      if (res.conflict) {
        // Backend caught conflict
        setVendorConflict({
          currentVendor: res.currentVendor || { id: cart.vendor?.id || 0, name: 'Current Store' },
          newVendor: res.newVendor || { id: product.vendorId, name: vendorName },
          pendingProduct: product,
          pendingQuantity: quantity,
          pendingVolume: volume,
        });
      } else if (res.success && res.cart) {
        setCart(res.cart);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve conflict: either overwrite existing cart or cancel
  const resolveVendorConflict = async (overwrite: boolean) => {
    if (!vendorConflict || !user) {
      setVendorConflict(null);
      return;
    }

    if (!overwrite) {
      // User cancelled: keep current cart
      setVendorConflict(null);
      return;
    }

    // User chose Overwrite: flush current cart and add new item
    const { pendingProduct, pendingQuantity, pendingVolume } = vendorConflict;
    setIsLoading(true);
    setVendorConflict(null);

    try {
      const res = await api.addToCart({
        userId: user.id,
        vendorId: pendingProduct.vendorId,
        productId: pendingProduct.id,
        quantity: pendingQuantity,
        selectedVolume: pendingVolume,
        overwrite: true,
      });

      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const dismissConflict = () => {
    setVendorConflict(null);
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.updateCartItemQty(itemId, user.id, quantity);
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } catch (err: any) {
      Alert.alert('Stock Limit', err.message || 'Cannot increase quantity beyond available stock.');
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.removeCartItem(itemId, user.id);
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.clearCart(user.id);
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        vendorConflict,
        addToCart,
        resolveVendorConflict,
        dismissConflict,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
