export interface User {
  id: number;
  public_id: string;
  role_id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  role?: string;
  created_at?: string;
}

export interface Vendor {
  id: number;
  public_id: string;
  name: string;
  description: string;
  address: string;
  distance: string;
  eta: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  licenceNumber: string;
  imageUrl: string;
}

export interface VolumeOption {
  size: string;
  price: number;
}

export interface Product {
  id: string;
  vendorId: number;
  sku: string;
  name: string;
  brand: string;
  description: string;
  size: string;
  abv: string;
  origin: string;
  price: number;
  specialPrice: number | null;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  qty: number;
  isInStock: boolean;
  categoryName?: string;
  volumeOptions: VolumeOption[];
}

export interface CartItem {
  id: number;
  productId: string;
  name: string;
  sku: string;
  imageUrl: string;
  selectedVolume: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  currentStock: number;
  isInStock: boolean;
}

export interface Cart {
  id: number | null;
  vendor: {
    id: number;
    name: string;
  } | null;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

export interface VendorConflict {
  currentVendor: { id: number; name: string };
  newVendor: { id: number; name: string };
  pendingProduct: Product;
  pendingQuantity: number;
  pendingVolume?: string;
}

export interface OrderItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedVolume?: string;
}

export interface Order {
  id: number;
  publicId: string;
  vendorName: string;
  status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDeliveryTime: string;
  createdAt: string;
  items: OrderItem[];
}

export interface UserAddress {
  id: number;
  userId: number;
  label: string;
  addressLine1: string;
  unitNumber?: string;
  city?: string;
  state?: string;
  postcode?: string;
  deliveryInstructions?: string;
  contactPhone?: string;
  isDefault?: boolean;
  createdAt?: string;
}
