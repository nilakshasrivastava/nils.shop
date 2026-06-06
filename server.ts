import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { Product } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with sufficient limits
  app.use(express.json({ limit: '10mb' }));

  // Dynamic user auth helper middleware
  const getAuthUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    
    const userId = token.startsWith('token-') ? token.substring(6) : token;
    return db.getUserById(userId) || null;
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    next();
  };

  // --- API ROUTING SECTION ---

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Parameters email, password, and name are required' });
      }

      const existingUser = db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered. Please sign in instead.' });
      }

      const user = db.createUser(email, password, name, 'customer');
      res.status(201).json({
        user,
        token: `token-${user.id}`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.getUserByEmail(email);
      if (!user || !db.validateCredentials(email, password)) {
        return res.status(401).json({ error: 'Invalid email or password combination' });
      }

      res.json({
        user,
        token: `token-${user.id}`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Get Current Profile
  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.json({ user: null });
    }
    res.json({ user });
  });

  // Auth: Update Profile
  app.put('/api/auth/update', requireAuth, (req, res) => {
    try {
      const currentUser = getAuthUser(req)!;
      const { name, email, newPassword } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const existing = db.getUserByEmail(email);
      if (existing && existing.id !== currentUser.id) {
        return res.status(409).json({ error: 'Email is already taken by another account' });
      }

      const updatedUser = db.updateUserProfile(currentUser.id, name, email);
      if (newPassword) {
        db.updateUserPassword(email, newPassword);
      }

      res.json({ user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Reset Password Simulation
  app.post('/api/auth/password-reset', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address' });
    }
    // Simulate updating password to a default reset phrase
    db.updateUserPassword(email, 'reset123');
    res.json({ message: 'Password has been temporarily reset to: reset123. Please login and update it immediately.' });
  });

  // Categories list
  app.get('/api/categories', (req, res) => {
    res.json(db.getCategories());
  });

  // Products querying (supports, search, category, brand, rating, availability, isBestseller, sorting)
  app.get('/api/products', (req, res) => {
    try {
      let filtered = db.getProducts();
      const { q, categoryId, brand, rating, availability, sort, bestseller, newArrival } = req.query;

      // Filter by Search Query
      if (q) {
        const queryTerm = String(q).toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(queryTerm) ||
          p.brand.toLowerCase().includes(queryTerm) ||
          p.description.toLowerCase().includes(queryTerm)
        );
      }

      // Filter by Category
      if (categoryId) {
        filtered = filtered.filter(p => p.categoryId === categoryId);
      }

      // Filter by Brand
      if (brand) {
        filtered = filtered.filter(p => p.brand.toLowerCase() === String(brand).toLowerCase());
      }

      // Filter by Rating
      if (rating) {
        const minRating = parseFloat(String(rating));
        filtered = filtered.filter(p => p.rating >= minRating);
      }

      // Filter by Availability
      if (availability) {
        const avail = String(availability) === 'true';
        filtered = filtered.filter(p => p.availability === avail);
      }

      // Filter by Best seller
      if (bestseller) {
        const bs = String(bestseller) === 'true';
        filtered = filtered.filter(p => p.isBestseller === bs);
      }

      // Filter by New Arrival
      if (newArrival) {
        const na = String(newArrival) === 'true';
        filtered = filtered.filter(p => p.isNewArrival === na);
      }

      // Sorting
      if (sort) {
        if (sort === 'price_asc') {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sort === 'price_desc') {
          filtered.sort((a, b) => b.price - a.price);
        } else if (sort === 'rating_desc') {
          filtered.sort((a, b) => b.rating - a.rating);
        } else if (sort === 'newest') {
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single product
  app.get('/api/products/:id', (req, res) => {
    const prod = db.getProductById(req.params.id);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(prod);
  });

  // Admin: Create Product
  app.post('/api/products', requireAdmin, (req, res) => {
    try {
      const { name, description, price, categoryId, brand, image, images, specifications, availability, stock, isBestseller, isNewArrival } = req.body;
      if (!name || !description || !price || !categoryId || !brand || !image) {
        return res.status(400).json({ error: 'Parameters name, description, price, categoryId, brand, and main image are required' });
      }

      // Create product
      const newProd = db.createProduct({
        name,
        description,
        price: Number(price),
        categoryId,
        brand,
        image,
        images: Array.isArray(images) && images.length > 0 ? images : [image],
        specifications: Array.isArray(specifications) ? specifications : [],
        availability: availability !== undefined ? Boolean(availability) : true,
        stock: stock !== undefined ? Number(stock) : 10,
        isBestseller: Boolean(isBestseller),
        isNewArrival: Boolean(isNewArrival)
      });

      res.status(201).json(newProd);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Edit Product
  app.put('/api/products/:id', requireAdmin, (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;

      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.stock !== undefined) updates.stock = Number(updates.stock);

      const updated = db.updateProduct(id, updates);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Delete Product
  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    try {
      const deleted = db.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- REVIEWS ---
  // Get reviews of a product
  app.get('/api/products/:productId/reviews', (req, res) => {
    res.json(db.getReviewsByProductId(req.params.productId));
  });

  // Submit and edit reviews
  app.post('/api/reviews', requireAuth, (req, res) => {
    try {
      const user = getAuthUser(req)!;
      const { productId, rating, comment } = req.body;

      if (!productId || rating === undefined || !comment) {
        return res.status(400).json({ error: 'productId, rating, and comment are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      }

      const review = db.createReview(user.id, user.name, productId, rating, comment);
      res.status(201).json(review);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete review
  app.delete('/api/reviews/:id', requireAuth, (req, res) => {
    try {
      const user = getAuthUser(req)!;
      const success = db.deleteReview(req.params.id, user.id);
      if (!success) {
        return res.status(404).json({ error: 'Review not found' });
      }
      res.json({ message: 'Review deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- WISHLIST ---
  app.get('/api/wishlist', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    const wishlist = db.getWishlist(user.id);
    
    // Join product info
    const resolvedItems = wishlist.map(item => {
      const prod = db.getProductById(item.productId);
      return {
        ...item,
        product: prod
      };
    }).filter(item => item.product !== undefined);

    res.json(resolvedItems);
  });

  app.post('/api/wishlist/toggle', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const result = db.toggleWishlist(user.id, productId);
    res.json(result);
  });

  // --- SHOPPING CART SYNC ---
  app.get('/api/cart', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    const cartItems = db.getCartItems(user.id);
    
    const resolvedItems = cartItems.map(item => {
      const prod = db.getProductById(item.productId);
      return {
        ...item,
        product: prod
      };
    }).filter(item => item.product !== undefined);

    res.json(resolvedItems);
  });

  app.post('/api/cart', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ error: 'productId and quantity are required' });
    }

    const item = db.addToCart(user.id, productId, Number(quantity));
    res.status(201).json(item);
  });

  app.put('/api/cart/:id', requireAuth, (req, res) => {
    try {
      const user = getAuthUser(req)!;
      const { quantity } = req.body;
      const id = req.params.id;

      const item = db.updateCartQuantity(id, user.id, Number(quantity));
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/cart/:id', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    const resolved = db.removeCartItem(req.params.id, user.id);
    if (!resolved) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.json({ message: 'Item removed from cart' });
  });

  // --- ADDRESSBOOK ---
  app.get('/api/addresses', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    res.json(db.getAddresses(user.id));
  });

  app.post('/api/addresses', requireAuth, (req, res) => {
    try {
      const user = getAuthUser(req)!;
      const { name, street, city, state, postalCode, country, type } = req.body;
      if (!name || !street || !city || !state || !postalCode || !country) {
        return res.status(400).json({ error: 'All address fields are required' });
      }

      const address = db.createAddress(user.id, {
        name,
        street,
        city,
        state,
        postalCode,
        country,
        type: type || 'shipping'
      });
      res.status(201).json(address);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/addresses/:id', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    const success = db.deleteAddress(req.params.id, user.id);
    if (!success) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ message: 'Address deleted successfully' });
  });

  // --- ORDERS ---
  app.get('/api/orders', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    res.json(db.getOrders(user.id));
  });

  app.get('/api/orders/:id', requireAuth, (req, res) => {
    const user = getAuthUser(req)!;
    const order = db.getOrderById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (user.role !== 'admin' && order.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this order' });
    }

    res.json(order);
  });

  app.post('/api/orders', requireAuth, (req, res) => {
    try {
      const user = getAuthUser(req)!;
      const { items, shippingAddress, billingAddress, paymentMethod, totalAmount } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress || !paymentMethod) {
        return res.status(400).json({ error: 'Items list, shipping address, and payment method are required' });
      }

      // Verify stock before placing order
      for (const item of items) {
        const prod = db.getProductById(item.productId);
        if (!prod) {
          return res.status(400).json({ error: `Product not found: ${item.productName}` });
        }
        if (prod.stock < item.quantity) {
          return res.status(400).json({ error: `Sorry, only ${prod.stock} units of ${prod.name} are available.` });
        }
      }

      const order = db.createOrder(user.id, {
        items,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        totalAmount: Number(totalAmount)
      });

      // Clear cart on successful checkout
      db.clearCart(user.id);

      res.status(201).json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update Status
  app.put('/api/orders/:id/status', requireAdmin, (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      const order = db.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Global Metrics & Analytics
  app.get('/api/admin/analytics', requireAdmin, (req, res) => {
    res.json(db.getAdminAnalytics());
  });

  // Admin: Customers List
  app.get('/api/admin/customers', requireAdmin, (req, res) => {
    const customers = db.getUsers().filter(u => u.role === 'customer');
    res.json(customers);
  });


  // --- STATIC AND INTEGRATION MIDDLEWARE ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NILS.SHOP API SERVER] running securely on host 0.0.0.0 port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start full-stack server backend:', err);
});
