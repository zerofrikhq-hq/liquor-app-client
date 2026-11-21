import { getDefaultApiBaseUrl } from '../config/apiConfig';
import { User, Vendor, Product, Cart, Order, UserAddress } from '../types';

let currentBaseUrl = getDefaultApiBaseUrl();

export function setApiBaseUrl(url: string) {
  currentBaseUrl = url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const url = `${currentBaseUrl}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok && response.status !== 409) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  registerRequest: (data: { email: string; password: string; full_name: string; phone_number?: string }) =>
    request<{ success: boolean; message: string; email: string; devOtp?: string }>('POST', '/api/auth/register-request', data),

  verifyRegistrationOtp: (data: { email: string; otp_code: string }) =>
    request<{ success: boolean; message: string; user: User }>('POST', '/api/auth/verify-registration-otp', data),

  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; message: string; user: User }>('POST', '/api/auth/login', data),

  forgotPasswordRequest: (data: { email: string }) =>
    request<{ success: boolean; message: string; email: string; devOtp?: string }>('POST', '/api/auth/forgot-password-request', data),

  verifyResetOtp: (data: { email: string; otp_code: string }) =>
    request<{ success: boolean; message: string }>('POST', '/api/auth/verify-reset-otp', data),

  resetPasswordVerify: (data: { email: string; otp_code: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('POST', '/api/auth/reset-password-verify', data),

  // Vendors & Products
  fetchVendors: () =>
    request<{ success: boolean; vendors: Vendor[] }>('GET', '/api/vendors'),

  searchGlobal: (query: string) =>
    request<{
      success: boolean;
      query: string;
      products: (Product & { vendorName: string })[];
      vendors: Vendor[];
    }>('GET', `/api/vendors/search/global?q=${encodeURIComponent(query)}`),

  fetchVendorById: (id: number) =>
    request<{ success: boolean; vendor: Vendor }>('GET', `/api/vendors/${id}`),

  fetchVendorProducts: (vendorId: number, params?: { category?: string; inStockOnly?: boolean; search?: string; sortBy?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.inStockOnly) q.append('inStockOnly', 'true');
    if (params?.search) q.append('search', params.search);
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request<{ success: boolean; count: number; products: Product[] }>('GET', `/api/vendors/${vendorId}/products${queryString}`);
  },

  fetchProductDetails: (productId: string) =>
    request<{ success: boolean; product: Product }>('GET', `/api/vendors/products/${productId}`),

  fetchCategories: () =>
    request<{ success: boolean; categories: Array<{ id: string; name: string; url_key: string }> }>('GET', '/api/vendors/categories'),

  // Cart
  fetchCart: (userId: number) =>
    request<{ success: boolean; cart: Cart }>('GET', `/api/cart?userId=${userId}`),

  addToCart: (data: {
    userId: number;
    vendorId: number;
    productId: string;
    quantity: number;
    selectedVolume?: string;
    overwrite?: boolean;
  }) =>
    request<{
      success: boolean;
      conflict?: boolean;
      message?: string;
      currentVendor?: { id: number; name: string };
      newVendor?: { id: number; name: string };
      cart?: Cart;
    }>('POST', '/api/cart/items', data),

  updateCartItemQty: (itemId: number, userId: number, quantity: number) =>
    request<{ success: boolean; cart: Cart }>('PUT', `/api/cart/items/${itemId}`, { userId, quantity }),

  removeCartItem: (itemId: number, userId: number) =>
    request<{ success: boolean; cart: Cart }>('DELETE', `/api/cart/items/${itemId}?userId=${userId}`),

  clearCart: (userId: number) =>
    request<{ success: boolean; cart: Cart }>('DELETE', `/api/cart?userId=${userId}`),

  // Orders
  placeOrder: (data: {
    userId: number;
    deliveryAddress: string;
    contactPhone: string;
    deliveryInstructions?: string;
    paymentMethod?: string;
    stripePaymentIntentId?: string;
  }) =>
    request<{ success: boolean; message: string; order: Order }>('POST', '/api/orders/place', data),

  fetchUserOrders: (userId: number) =>
    request<{ success: boolean; count: number; orders: Order[] }>('GET', `/api/orders/user/${userId}`),

  fetchOrderDetails: (orderId: number) =>
    request<{ success: boolean; order: Order }>('GET', `/api/orders/${orderId}`),

  // Profile
  fetchProfile: (userId: number) =>
    request<{ success: boolean; profile: User }>('GET', `/api/user/profile/${userId}`),

  updateProfile: (userId: number, data: { full_name: string; phone_number: string }) =>
    request<{ success: boolean; message: string; profile: User }>('PUT', `/api/user/profile/${userId}`, data),

  // Saved Addresses
  fetchUserAddresses: (userId: number) =>
    request<{ success: boolean; addresses: UserAddress[] }>('GET', `/api/user/${userId}/addresses`),

  saveUserAddress: (
    userId: number,
    data: {
      addressLine1: string;
      label?: string;
      unitNumber?: string;
      city?: string;
      state?: string;
      postcode?: string;
      deliveryInstructions?: string;
      contactPhone?: string;
      isDefault?: boolean;
    }
  ) =>
    request<{ success: boolean; message: string; address: UserAddress }>('POST', `/api/user/${userId}/addresses`, data),

  deleteUserAddress: (userId: number, addressId: number) =>
    request<{ success: boolean; message: string }>('DELETE', `/api/user/${userId}/addresses/${addressId}`),
};
