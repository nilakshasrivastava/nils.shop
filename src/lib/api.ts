import { User, Category, Product, Review, Order, Address, CartItem, WishlistItem } from '../types';
import { localStore } from './fallbackStorage';

const API_BASE = '/api';

let isFallbackActive = false;

// Auto-check for Vercel/Github static deployment environments to eliminate slow initial probe requests
if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  if (host.includes('vercel.app') || host.includes('github.io') || host.includes('gitpod.io')) {
    isFallbackActive = true;
    console.log('[NILS.SHOP] Persistent deployment host detected. Auto-activating browser-safe Local Client Database fallback.');
  }
}

// Inner helper that handles standard network requests and detects when the server returns HTML instead of JSON (which occurs on static Vercel hosts during API calls)
async function fetchWithFallback(url: string, init?: RequestInit): Promise<Response> {
  if (isFallbackActive) {
    throw new Error('Client-side storage fallback active');
  }
  try {
    const res = await fetch(url, init);
    // Vercel routes unmatched /api paths to static index.html on client-only SPA builds, which is text/html
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.warn('[NILS.SHOP] API server returned HTML code. Activating local client-side storage database fallback.');
      isFallbackActive = true;
      throw new Error('API server returned HTML fallback page');
    }
    return res;
  } catch (err) {
    isFallbackActive = true;
    throw err;
  }
}

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

// Utility to fetch active user context locally
function getLocalUserId(): string | null {
  const token = localStorage.getItem('nils_shop_token');
  if (!token) return null;
  return token.startsWith('token-') ? token.substring(6) : token;
}

export const api = {
  // --- AUTHENTICATION ---
  async me(): Promise<{ user: User | null }> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) return { user: null };
      const user = localStore.getUserById(userId);
      return { user: user || null };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/auth/me`, { headers: getHeaders() });
      if (!res.ok) return { user: null };
      return await res.json();
    } catch {
      const userId = getLocalUserId();
      if (!userId) return { user: null };
      const user = localStore.getUserById(userId);
      return { user: user || null };
    }
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (isFallbackActive) {
      const user = localStore.getUserByEmail(email);
      if (!user || !localStore.validateCredentials(email, password)) {
        throw new Error('Invalid email or password combination');
      }
      const token = `token-${user.id}`;
      localStorage.setItem('nils_shop_token', token);
      return { user, token };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/auth/login`, {
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
    } catch (err: any) {
      if (isFallbackActive) {
        const user = localStore.getUserByEmail(email);
        if (!user || !localStore.validateCredentials(email, password)) {
          throw new Error('Invalid email or password combination');
        }
        const token = `token-${user.id}`;
        localStorage.setItem('nils_shop_token', token);
        return { user, token };
      }
      throw err;
    }
  },

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    if (isFallbackActive) {
      const existing = localStore.getUserByEmail(email);
      if (existing) {
        throw new Error('Email already registered. Please sign in instead.');
      }
      const user = localStore.createUser(email, password, name, 'customer');
      const token = `token-${user.id}`;
      localStorage.setItem('nils_shop_token', token);
      return { user, token };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/auth/register`, {
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
    } catch (err: any) {
      if (isFallbackActive) {
        const existing = localStore.getUserByEmail(email);
        if (existing) {
          throw new Error('Email already registered. Please sign in instead.');
        }
        const user = localStore.createUser(email, password, name, 'customer');
        const token = `token-${user.id}`;
        localStorage.setItem('nils_shop_token', token);
        return { user, token };
      }
      throw err;
    }
  },

  async updateMe(name: string, email: string, newPassword?: string): Promise<{ user: User }> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      const existing = localStore.getUserByEmail(email);
      if (existing && existing.id !== userId) {
        throw new Error('Email is already taken by another account');
      }
      const updatedUser = localStore.updateUserProfile(userId, name, email);
      if (newPassword) {
        localStore.updateUserPassword(email, newPassword);
      }
      return { user: updatedUser };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/auth/update`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        const existing = localStore.getUserByEmail(email);
        if (existing && existing.id !== userId) {
          throw new Error('Email is already taken by another account');
        }
        const updatedUser = localStore.updateUserProfile(userId, name, email);
        if (newPassword) {
          localStore.updateUserPassword(email, newPassword);
        }
        return { user: updatedUser };
      }
      throw err;
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    if (isFallbackActive) {
      const user = localStore.getUserByEmail(email);
      if (!user) {
        throw new Error('No account registered with this email address');
      }
      localStore.updateUserPassword(email, 'reset123');
      return { message: 'Password has been temporarily reset to: reset123. Please login and update it immediately.' };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Reset failed');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const user = localStore.getUserByEmail(email);
        if (!user) {
          throw new Error('No account registered with this email address');
        }
        localStore.updateUserPassword(email, 'reset123');
        return { message: 'Password has been temporarily reset to: reset123. Please login and update it immediately.' };
      }
      throw err;
    }
  },

  logout(): void {
    localStorage.removeItem('nils_shop_token');
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    if (isFallbackActive) {
      return localStore.getCategories();
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/categories`);
      return await res.json();
    } catch {
      return localStore.getCategories();
    }
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
    if (isFallbackActive) {
      let filtered = localStore.getProducts();
      if (params) {
        const { q, categoryId, brand, rating, availability, sort, bestseller, newArrival } = params;
        if (q) {
          const queryTerm = q.toLowerCase();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(queryTerm) ||
            p.brand.toLowerCase().includes(queryTerm) ||
            p.description.toLowerCase().includes(queryTerm)
          );
        }
        if (categoryId) {
          filtered = filtered.filter(p => p.categoryId === categoryId);
        }
        if (brand) {
          filtered = filtered.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
        }
        if (rating) {
          filtered = filtered.filter(p => p.rating >= rating);
        }
        if (availability !== undefined) {
          filtered = filtered.filter(p => p.availability === availability);
        }
        if (bestseller) {
          filtered = filtered.filter(p => p.isBestseller === bestseller);
        }
        if (newArrival) {
          filtered = filtered.filter(p => p.isNewArrival === newArrival);
        }
        if (sort) {
          if (sort === 'price_asc') {
            filtered = [...filtered].sort((a, b) => a.price - b.price);
          } else if (sort === 'price_desc') {
            filtered = [...filtered].sort((a, b) => b.price - a.price);
          } else if (sort === 'rating_desc') {
            filtered = [...filtered].sort((a, b) => b.rating - a.rating);
          } else if (sort === 'newest') {
            filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        }
      }
      return filtered;
    }
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            query.set(k, String(v));
          }
        });
      }
      const url = `${API_BASE}/products${query.toString() ? '?' + query.toString() : ''}`;
      const res = await fetchWithFallback(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch {
      // Local fallback in catch
      // Execute the same client filtering we defined above
      let filtered = localStore.getProducts();
      if (params) {
        const { q, categoryId, brand, rating, availability, sort, bestseller, newArrival } = params;
        if (q) {
          const queryTerm = q.toLowerCase();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(queryTerm) ||
            p.brand.toLowerCase().includes(queryTerm) ||
            p.description.toLowerCase().includes(queryTerm)
          );
        }
        if (categoryId) {
          filtered = filtered.filter(p => p.categoryId === categoryId);
        }
        if (brand) {
          filtered = filtered.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
        }
        if (rating) {
          filtered = filtered.filter(p => p.rating >= rating);
        }
        if (availability !== undefined) {
          filtered = filtered.filter(p => p.availability === availability);
        }
        if (bestseller) {
          filtered = filtered.filter(p => p.isBestseller === bestseller);
        }
        if (newArrival) {
          filtered = filtered.filter(p => p.isNewArrival === newArrival);
        }
        if (sort) {
          if (sort === 'price_asc') {
            filtered = [...filtered].sort((a, b) => a.price - b.price);
          } else if (sort === 'price_desc') {
            filtered = [...filtered].sort((a, b) => b.price - a.price);
          } else if (sort === 'rating_desc') {
            filtered = [...filtered].sort((a, b) => b.rating - a.rating);
          } else if (sort === 'newest') {
            filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        }
      }
      return filtered;
    }
  },

  async getProductById(id: string): Promise<Product> {
    if (isFallbackActive) {
      const prod = localStore.getProductById(id);
      if (!prod) throw new Error('Product not found');
      return prod;
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      return await res.json();
    } catch {
      const prod = localStore.getProductById(id);
      if (!prod) throw new Error('Product not found');
      return prod;
    }
  },

  // Admin: Create Product
  async createProduct(productData: Omit<Product, 'id' | 'rating' | 'createdAt'>): Promise<Product> {
    if (isFallbackActive) {
      return localStore.createProduct(productData);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create product');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        return localStore.createProduct(productData);
      }
      throw err;
    }
  },

  // Admin: Edit Product
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (isFallbackActive) {
      return localStore.updateProduct(id, updates);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to edit product');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        return localStore.updateProduct(id, updates);
      }
      throw err;
    }
  },

  // Admin: Delete Product
  async deleteProduct(id: string): Promise<{ message: string }> {
    if (isFallbackActive) {
      const success = localStore.deleteProduct(id);
      if (!success) throw new Error('Failed to delete product');
      return { message: 'Product deleted successfully' };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete product');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const success = localStore.deleteProduct(id);
        if (!success) throw new Error('Failed to delete product');
        return { message: 'Product deleted successfully' };
      }
      throw err;
    }
  },

  // --- REVIEWS ---
  async getProductReviews(productId: string): Promise<Review[]> {
    if (isFallbackActive) {
      return localStore.getReviewsByProductId(productId);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/products/${productId}/reviews`);
      return await res.json();
    } catch {
      return localStore.getReviewsByProductId(productId);
    }
  },

  async createReview(productId: string, rating: number, comment: string): Promise<Review> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      const user = localStore.getUserById(userId);
      return localStore.createReview(userId, user?.name || 'Customer', productId, rating, comment);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, rating, comment }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        const user = localStore.getUserById(userId);
        return localStore.createReview(userId, user?.name || 'Customer', productId, rating, comment);
      }
      throw err;
    }
  },

  async deleteReview(id: string): Promise<{ message: string }> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      const success = localStore.deleteReview(id, userId);
      if (!success) throw new Error('Review deletion failed');
      return { message: 'Review deleted successfully' };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/reviews/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete review');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        const success = localStore.deleteReview(id, userId);
        if (!success) throw new Error('Review deletion failed');
        return { message: 'Review deleted successfully' };
      }
      throw err;
    }
  },

  // --- WISHLIST ---
  async getWishlist(): Promise<(WishlistItem & { product: Product })[]> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) return [];
      const wishlist = localStore.getWishlist(userId);
      return wishlist.map(item => {
        const prod = localStore.getProductById(item.productId);
        return { ...item, product: prod! };
      }).filter(item => item.product !== undefined);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/wishlist`, { headers: getHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      const userId = getLocalUserId();
      if (!userId) return [];
      const wishlist = localStore.getWishlist(userId);
      return wishlist.map(item => {
        const prod = localStore.getProductById(item.productId);
        return { ...item, product: prod! };
      }).filter(item => item.product !== undefined);
    }
  },

  async toggleWishlist(productId: string): Promise<{ active: boolean }> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      return localStore.toggleWishlist(userId, productId);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/wishlist/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error('Wishlist edit failed');
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        return localStore.toggleWishlist(userId, productId);
      }
      throw err;
    }
  },

  // --- CART ---
  async getCart(): Promise<(CartItem & { product: Product })[]> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) return [];
      const cartItems = localStore.getCartItems(userId);
      return cartItems.map(item => {
        const prod = localStore.getProductById(item.productId);
        return { ...item, product: prod! };
      }).filter(item => item.product !== undefined);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/cart`, { headers: getHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      const userId = getLocalUserId();
      if (!userId) return [];
      const cartItems = localStore.getCartItems(userId);
      return cartItems.map(item => {
        const prod = localStore.getProductById(item.productId);
        return { ...item, product: prod! };
      }).filter(item => item.product !== undefined);
    }
  },

  async addToCart(productId: string, quantity: number): Promise<CartItem> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      return localStore.addToCart(userId, productId, quantity);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/cart`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Add to cart failed');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        return localStore.addToCart(userId, productId, quantity);
      }
      throw err;
    }
  },

  async updateCartQuantity(id: string, quantity: number): Promise<CartItem> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      return localStore.updateCartQuantity(id, userId, quantity);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/cart/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error('Quantity update failed');
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        return localStore.updateCartQuantity(id, userId, quantity);
      }
      throw err;
    }
  },

  async removeCartItem(id: string): Promise<{ message: string }> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      const success = localStore.removeCartItem(id, userId);
      if (!success) throw new Error('Remove from cart failed');
      return { message: 'Item removed from cart' };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/cart/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Remove from cart failed');
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        const success = localStore.removeCartItem(id, userId);
        if (!success) throw new Error('Remove from cart failed');
        return { message: 'Item removed from cart' };
      }
      throw err;
    }
  },

  // --- ADDRESSES ---
  async getAddresses(): Promise<Address[]> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) return [];
      return localStore.getAddresses(userId);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/addresses`, { headers: getHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      const userId = getLocalUserId();
      if (!userId) return [];
      return localStore.getAddresses(userId);
    }
  },

  async createAddress(addressData: Omit<Address, 'id' | 'userId' | 'createdAt'>): Promise<Address> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      return localStore.createAddress(userId, addressData);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/addresses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(addressData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Address addition failed');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        return localStore.createAddress(userId, addressData);
      }
      throw err;
    }
  },

  async deleteAddress(id: string): Promise<{ message: string }> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      const success = localStore.deleteAddress(id, userId);
      if (!success) throw new Error('Address deletion failed');
      return { message: 'Address deleted successfully' };
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/addresses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Address deletion failed');
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        const success = localStore.deleteAddress(id, userId);
        if (!success) throw new Error('Address deletion failed');
        return { message: 'Address deleted successfully' };
      }
      throw err;
    }
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) return [];
      return localStore.getOrders(userId);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/orders`, { headers: getHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      const userId = getLocalUserId();
      if (!userId) return [];
      return localStore.getOrders(userId);
    }
  },

  async getOrderById(id: string): Promise<Order> {
    if (isFallbackActive) {
      const order = localStore.getOrderById(id);
      if (!order) throw new Error('Order not found');
      return order;
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/orders/${id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Order selection failed');
      return await res.json();
    } catch {
      const order = localStore.getOrderById(id);
      if (!order) throw new Error('Order not found');
      return order;
    }
  },

  async createOrder(orderData: {
    items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[];
    shippingAddress: Omit<Address, 'id' | 'userId' | 'createdAt'>;
    billingAddress?: Omit<Address, 'id' | 'userId' | 'createdAt'>;
    paymentMethod: 'card' | 'apple_pay' | 'bank_transfer';
    totalAmount: number;
  }): Promise<Order> {
    if (isFallbackActive) {
      const userId = getLocalUserId();
      if (!userId) throw new Error('Authentication required');
      
      const resolvedShipping: Address = {
        ...orderData.shippingAddress,
        id: 'addr_' + Math.random().toString(36).substring(2, 9),
        userId,
        createdAt: new Date().toISOString()
      };
      const resolvedBilling: Address = orderData.billingAddress ? {
        ...orderData.billingAddress,
        id: 'addr_' + Math.random().toString(36).substring(2, 9),
        userId,
        createdAt: new Date().toISOString()
      } : resolvedShipping;

      const order = localStore.createOrder(userId, {
        items: orderData.items,
        shippingAddress: resolvedShipping,
        billingAddress: resolvedBilling,
        paymentMethod: orderData.paymentMethod,
        totalAmount: orderData.totalAmount
      });
      
      localStore.clearCart(userId);
      return order;
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Checkout order submission failed');
      }
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        const userId = getLocalUserId();
        if (!userId) throw new Error('Authentication required');
        
        const resolvedShipping: Address = {
          ...orderData.shippingAddress,
          id: 'addr_' + Math.random().toString(36).substring(2, 9),
          userId,
          createdAt: new Date().toISOString()
        };
        const resolvedBilling: Address = orderData.billingAddress ? {
          ...orderData.billingAddress,
          id: 'addr_' + Math.random().toString(36).substring(2, 9),
          userId,
          createdAt: new Date().toISOString()
        } : resolvedShipping;

        const order = localStore.createOrder(userId, {
          items: orderData.items,
          shippingAddress: resolvedShipping,
          billingAddress: resolvedBilling,
          paymentMethod: orderData.paymentMethod,
          totalAmount: orderData.totalAmount
        });
        
        localStore.clearCart(userId);
        return order;
      }
      throw err;
    }
  },

  // Admin update status
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    if (isFallbackActive) {
      return localStore.updateOrderStatus(id, status);
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/orders/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Status update failed');
      return await res.json();
    } catch (err: any) {
      if (isFallbackActive) {
        return localStore.updateOrderStatus(id, status);
      }
      throw err;
    }
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
    if (isFallbackActive) {
      return localStore.getAdminAnalytics();
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/admin/analytics`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Unauthorized or analytics fetch failed');
      return await res.json();
    } catch {
      return localStore.getAdminAnalytics();
    }
  },

  async getAdminCustomers(): Promise<User[]> {
    if (isFallbackActive) {
      return localStore.getUsers().filter(u => u.role === 'customer');
    }
    try {
      const res = await fetchWithFallback(`${API_BASE}/admin/customers`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve customers lists');
      return await res.json();
    } catch {
      return localStore.getUsers().filter(u => u.role === 'customer');
    }
  },
};
