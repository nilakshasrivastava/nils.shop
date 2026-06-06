/**
 * Shared Type Definitions for NILS.SHOP
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  brand: string;
  rating: number; // calculated from reviews or seeded
  image: string;
  images: string[]; // for detail view carousels
  specifications: { name: string; value: string }[];
  availability: boolean;
  stock: number;
  isBestseller: boolean;
  isNewArrival: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: 'shipping' | 'billing';
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: 'card' | 'apple_pay' | 'bank_transfer';
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

// User session client metadata
export interface AuthState {
  user: User | null;
  token: string | null;
}
