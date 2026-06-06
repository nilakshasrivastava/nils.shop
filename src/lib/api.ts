import { User, Category, Product, Review, Order, Address, CartItem, WishlistItem } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('nils_shop_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- AUTHENDICATION ---
  async me(): Promise<{ user: User | null }> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
      if (!res.ok) return { user: null };
      return await res.json();
    } catch {
      return { user: null };
    }
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('nils_shop_token', data.token);
    return data;
  },

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('nils_shop_token', data.token);
    return data;
  },

  async updateMe(name: string, email: string, newPassword?: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/update`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return await res.json();
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Reset failed');
    }
    return await res.json();
  },

  logout(): void {
    localStorage.removeItem('nils_shop_token');
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    return await res.json();
  },

  // --- PRODUCTS ---
  async getProducts(params?: {
    q?: string;
    categoryId?: string;
    brand?: string;
    rating?: number;
    availability?: boolean;
    sort?: string;
    bestseller?: boolean;
    newArrival?: boolean;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.set(k, String(v));
        }
      });
    }
    const url = `${API_BASE}/products${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  },

  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return await res.json();
  },

  // Admin: Create Product
  async createProduct(productData: Omit<Product, 'id' | 'rating' | 'createdAt'>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    return await res.json();
  },

  // Admin: Edit Product
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to edit product');
    }
    return await res.json();
  },

  // Admin: Delete Product
  async deleteProduct(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete product');
    }
    return await res.json();
  },

  // --- REVIEWS ---
  async getProductReviews(productId: string): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/products/${productId}/reviews`);
    return await res.json();
  },

  async createReview(productId: string, rating: number, comment: string): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId, rating, comment }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit review');
    }
    return await res.json();
  },

  async deleteReview(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete review');
    }
    return await res.json();
  },

  // --- WISHLIST ---
  async getWishlist(): Promise<(WishlistItem & { product: Product })[]> {
    const res = await fetch(`${API_BASE}/wishlist`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  async toggleWishlist(productId: string): Promise<{ active: boolean }> {
    const res = await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error('Wishlist edit failed');
    return await res.json();
  },

  // --- CART ---
  async getCart(): Promise<(CartItem & { product: Product })[]> {
    const res = await fetch(`${API_BASE}/cart`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  async addToCart(productId: string, quantity: number): Promise<CartItem> {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Add to cart failed');
    }
    return await res.json();
  },

  async updateCartQuantity(id: string, quantity: number): Promise<CartItem> {
    const res = await fetch(`${API_BASE}/cart/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error('Quantity update failed');
    return await res.json();
  },

  async removeCartItem(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/cart/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Remove from cart failed');
    return await res.json();
  },

  // --- ADDRESSES ---
  async getAddresses(): Promise<Address[]> {
    const res = await fetch(`${API_BASE}/addresses`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  async createAddress(addressData: Omit<Address, 'id' | 'userId' | 'createdAt'>): Promise<Address> {
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(addressData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Address addition failed');
    }
    return await res.json();
  },

  async deleteAddress(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/addresses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Address deletion failed');
    return await res.json();
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Order selection failed');
    return await res.json();
  },

  async createOrder(orderData: {
    items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[];
    shippingAddress: Omit<Address, 'id' | 'userId' | 'createdAt'>;
    billingAddress?: Omit<Address, 'id' | 'userId' | 'createdAt'>;
    paymentMethod: 'card' | 'apple_pay' | 'bank_transfer';
    totalAmount: number;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Checkout order submission failed');
    }
    return await res.json();
  },

  // Admin update status
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Status update failed');
    return await res.json();
  },

  // --- ADMIN METRICS ---
  async getAdminAnalytics(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    categoryBreakdown: { categoryName: string; revenue: number }[];
    recentOrders: (Order & { customerName: string; customerEmail: string })[];
  }> {
    const res = await fetch(`${API_BASE}/admin/analytics`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Unauthorized or analytics fetch failed');
    return await res.json();
  },

  async getAdminCustomers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/customers`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to retrieve customers lists');
    return await res.json();
  },
};
