import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, ShoppingBag, Star, Filter, SlidersHorizontal, ChevronRight, X, Loader2 } from 'lucide-react';
import { api } from './lib/api';
import { Product, Category, User, Order } from './types';

// Importing Custom Subcomponents
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import ProductView from './components/ProductView';
import CartSidebar from './components/CartSidebar';
import CheckoutView from './components/CheckoutView';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';

interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export default function App() {
  // Navigation Routing States
  const [currentRoute, setCurrentRoute] = useState<'home' | 'catalog' | 'detail' | 'checkout' | 'account' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // User Cart and Wishlist states
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [guestCart, setGuestCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);

  // Dialog panels
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Catalog Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [stockOnly, setStockOnly] = useState(false);
  const [sortParam, setSortParam] = useState('newest');
  const [priceCap, setPriceCap] = useState<number>(400);

  // Stored active user addresses list
  const [addresses, setAddresses] = useState<any[]>([]);

  // General loading states
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  // Page Load
  useEffect(() => {
    loadBaseConfigs();
    loadSession();
    // Load local guest storage carts
    try {
      const savedGuest = localStorage.getItem('nils_guest_cart');
      if (savedGuest) setGuestCart(JSON.parse(savedGuest));
      
      const savedWish = localStorage.getItem('nils_guest_wish');
      if (savedWish) setWishlistProductIds(JSON.parse(savedWish));
    } catch (err) {
      console.error('Local Storage read error:', err);
    }
  }, []);

  // Fetch Cart and Wishlists on User states transitions
  useEffect(() => {
    if (user) {
      syncAndLoadOnLogin();
    } else {
      loadGuestData();
    }
  }, [user, guestCart]);

  const loadBaseConfigs = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
      loadFilteredProducts({});
    } catch (err) {
      console.error('Failed to load initial configurations:', err);
    }
  };

  const loadSession = async () => {
    try {
      const response = await api.me();
      if (response.user) {
        setUser(response.user);
      }
    } catch {
      // ignore anonymous sessions
    }
  };

  // Re-fetch products according to filter criteria
  const loadFilteredProducts = async (overrideParams: any) => {
    setLoadingProducts(true);
    try {
      const filters = {
        q: searchQuery,
        categoryId: selectedCategoryId,
        brand: selectedBrand,
        rating: selectedMinRating > 0 ? selectedMinRating : undefined,
        availability: stockOnly ? true : undefined,
        sort: sortParam,
        ...overrideParams
      };
      let list = await api.getProducts(filters);
      // apply custom client-side price cap (since server does exact joins)
      list = list.filter(p => p.price <= (overrideParams.priceCap || priceCap));
      setProducts(list);
    } catch (err) {
      console.error('Failed to fetch filtered list:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Dynamic database updater triggers on filter alterations
  useEffect(() => {
    // skip first boot
    if (categories.length > 0) {
      const del = setTimeout(() => {
        loadFilteredProducts({});
      }, 200);
      return () => clearTimeout(del);
    }
  }, [selectedCategoryId, selectedBrand, selectedMinRating, stockOnly, sortParam, priceCap, searchQuery]);

  // Sync Guest Cart to Server database upon login
  const syncAndLoadOnLogin = async () => {
    try {
      // Sync guest cart to active account
      if (guestCart.length > 0) {
        for (const item of guestCart) {
          await api.addToCart(item.productId, item.quantity);
        }
        setGuestCart([]);
        localStorage.removeItem('nils_guest_cart');
      }

      // Re-fetch database items
      const [serverCart, serverWish, savedAddresses] = await Promise.all([
        api.getCart(),
        api.getWishlist(),
        api.getAddresses()
      ]);
      setCartItems(serverCart);
      setWishlistProductIds(serverWish.map(w => w.productId));
      setAddresses(savedAddresses);
    } catch (err) {
      console.error('Logged in sync failed:', err);
    }
  };

  // Load standard client specifications when Guest
  const loadGuestData = async () => {
    try {
      const allProds = await api.getProducts({});
      const resolvedCart: CartItemWithProduct[] = guestCart.map((item, idx) => {
        const prod = allProds.find(p => p.id === item.productId);
        return prod ? {
          id: `guest-item-${idx}`,
          productId: item.productId,
          quantity: item.quantity,
          product: prod
        } : null;
      }).filter(item => item !== null) as CartItemWithProduct[];

      setCartItems(resolvedCart);
    } catch (err) {
      console.error('Failed to load guest catalogs:', err);
    }
  };

  // Trigger addresses list reloads from lower flows
  const handleRefreshAddresses = async () => {
    try {
      const list = await api.getAddresses();
      setAddresses(list);
    } catch (err) {
      console.error('Addressbook sync failed:', err);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    syncAndLoadOnLogin();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCartItems([]);
    setWishlistProductIds([]);
    setAddresses([]);
    setCurrentRoute('home');
  };

  // --- CART MANAGEMENT ---
  const handleAddToCart = async (productId: string, quantity: number) => {
    setAddingToCartId(productId);
    try {
      if (user) {
        await api.addToCart(productId, quantity);
        const serverCart = await api.getCart();
        setCartItems(serverCart);
      } else {
        // Add to Guest local storages
        let updated = [...guestCart];
        const matchIdx = updated.findIndex(i => i.productId === productId);
        if (matchIdx !== -1) {
          updated[matchIdx].quantity += quantity;
        } else {
          updated.push({ productId, quantity });
        }
        setGuestCart(updated);
        localStorage.setItem('nils_guest_cart', JSON.stringify(updated));
      }
      // auto open cart drawer
      setCartOpen(true);
    } catch (err: any) {
      alert(err.message || 'Verification of safety limits block additions.');
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleUpdateCartQuantity = async (cartItemId: string, newQty: number) => {
    try {
      if (user) {
        await api.updateCartQuantity(cartItemId, newQty);
        const serverCart = await api.getCart();
        setCartItems(serverCart);
      } else {
        // Update guest quantity
        const idx = parseInt(cartItemId.replace('guest-item-', ''));
        if (!isNaN(idx) && guestCart[idx]) {
          let updated = [...guestCart];
          updated[idx].quantity = newQty;
          setGuestCart(updated);
          localStorage.setItem('nils_guest_cart', JSON.stringify(updated));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Status change failure.');
    }
  };

  const handleRemoveCartItem = async (cartItemId: string) => {
    try {
      if (user) {
        await api.removeCartItem(cartItemId);
        const serverCart = await api.getCart();
        setCartItems(serverCart);
      } else {
        const idx = parseInt(cartItemId.replace('guest-item-', ''));
        if (!isNaN(idx)) {
          const updated = guestCart.filter((_, i) => i !== idx);
          setGuestCart(updated);
          localStorage.setItem('nils_guest_cart', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Failed to delete cart line:', err);
    }
  };

  const handleSaveForLater = async (productId: string, cartItemId: string) => {
    // Add to wishlist
    await handleToggleWishlist(productId);
    // Remove from cart
    await handleRemoveCartItem(cartItemId);
  };

  // --- WISHLIST MANAGEMENT ---
  const handleToggleWishlist = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      if (user) {
        await api.toggleWishlist(productId);
        const serverWish = await api.getWishlist();
        setWishlistProductIds(serverWish.map(w => w.productId));
      } else {
        // Guest toggle Wishlist
        let updated = [...wishlistProductIds];
        const exIdx = updated.indexOf(productId);
        if (exIdx !== -1) {
          updated.splice(exIdx, 1);
        } else {
          updated.push(productId);
        }
        setWishlistProductIds(updated);
        localStorage.setItem('nils_guest_wish', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to toggle Wishlist item:', err);
    }
  };

  // Launch Checkout Module
  const handleStartCheckout = () => {
    setCartOpen(false);
    if (!user) {
      // Must authenticate to place shipping orders securely.
      setAuthOpen(true);
    } else {
      setCurrentRoute('checkout');
    }
  };

  // Handle successful payments
  const handleOrderPlacedSuccess = (order: Order) => {
    // clear cart state on UI
    setCartItems([]);
    setGuestCart([]);
  };

  // Home filter trigger helpers
  const handleCategoryBubbleClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentRoute('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-neutral-900 font-sans flex flex-col selection:bg-emerald-800/10 selection:text-emerald-900" id="nils-main-canvas">
      
      {/* Dynamic Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthOpen(true)}
        cartCount={cartItems.reduce((acc, c) => acc + c.quantity, 0)}
        wishCount={wishlistProductIds.length}
        onViewCart={() => setCartOpen(true)}
        onViewWishlist={() => {
          if (!user) setAuthOpen(true);
          else {
            setSelectedCategoryId('');
            setCurrentRoute('account');
            // Wait for node to update
            setTimeout(() => {
              document.getElementById('tab-btn-wish')?.click();
            }, 100);
          }
        }}
        onViewAccount={() => {
          setSelectedCategoryId('');
          setCurrentRoute('account');
        }}
        onViewAdmin={() => {
          setSelectedCategoryId('');
          setCurrentRoute('admin');
        }}
        onSearch={(q) => {
          setSearchQuery(q);
          setCurrentRoute('catalog');
        }}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setCurrentRoute('detail');
        }}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
          setCurrentRoute('catalog');
        }}
        onGoHome={() => {
          setSelectedCategoryId('');
          setSearchQuery('');
          setCurrentRoute('home');
        }}
      />

      {/* RENDER DYNAMIC PAGES ROUTER */}
      <main className="flex-1">

        {/* 1. HOMEPAGE */}
        {currentRoute === 'home' && (
          <div id="homepage-canvas" className="space-y-16 animate-fade-in">
            
            {/* LARGE CLEAN HERO SECTION */}
            <section className="relative bg-[#fafaf9] border-b border-neutral-100 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10">
                <div className="max-w-2xl space-y-6">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1b3b2b]/5 border border-[#1b3b2b]/15 text-[#1b3b2b] text-[10px] font-bold tracking-widest uppercase rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>The Autumn Curation</span>
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 font-sans leading-none">
                    Quality Products.<br />Thoughtfully Chosen.
                  </h1>
                  <p className="text-base text-neutral-500 max-w-lg leading-relaxed">
                    Discover products people genuinely love. Every piece in our boutique is meticulously analyzed for structural durability, raw organic materials, and architectural restraint.
                  </p>
                  <div className="pt-4 flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        setSelectedCategoryId('');
                        setCurrentRoute('catalog');
                      }}
                      className="px-8 py-3.5 bg-[#1b3b2b] hover:bg-[#12281d] text-white text-xs font-semibold tracking-widest uppercase rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
                      id="hero-btn-shop"
                    >
                      Shop Collection
                    </button>
                    <button
                      onClick={() => handleCategoryBubbleClick('cat_electronics')}
                      className="px-8 py-3.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-semibold tracking-widest uppercase rounded-xl transition-all cursor-pointer"
                      id="hero-btn-featured"
                    >
                      Acoustic Curation
                    </button>
                  </div>
                </div>
              </div>

              {/* Architectural Ambient Abstract block under background (No low-quality images) */}
              <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-[#f5f5f4] hidden lg:block border-l border-neutral-100">
                <img
                  src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200"
                  alt="Minimal studio"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center grayscale hover:grayscale-0 duration-1000 transition-all opacity-80"
                />
              </div>
            </section>

            {/* FEATURED CATEGORIES GRID */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="text-center md:text-left">
                <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400 font-mono">
                  Boutique Directories
                </h2>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">
                  Featured Categories
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6" id="categories-grid-root">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryBubbleClick(cat.id)}
                    className="group relative h-48 bg-neutral-100 rounded-2xl overflow-hidden cursor-pointer border border-neutral-100 flex flex-col justify-end p-4 hover:shadow-lg transition-all"
                    id={`cat-card-${cat.id}`}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 duration-500 transition-transform brightness-[0.7]"
                      loading="lazy"
                    />
                    <div className="relative z-10 text-white space-y-1">
                      <h4 className="text-xs font-bold tracking-wide uppercase leading-tight">{cat.name}</h4>
                      <p className="text-[10px] text-neutral-200 uppercase font-mono tracking-wider flex items-center gap-1">
                        <span>Explore</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* HORIZONTAL NEW ARRIVALS */}
            <section className="bg-[#fafaf7] py-16 border-y border-neutral-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400 font-mono">Curated Arrivals</h2>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">New Arrivals</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSortParam('newest');
                      setCurrentRoute('catalog');
                    }}
                    className="text-xs font-semibold text-emerald-800 hover:underline underline-offset-4 cursor-pointer"
                  >
                    View All Arrivals &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.filter(p => p.isNewArrival).slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelect={(p) => {
                        setSelectedProduct(p);
                        setCurrentRoute('detail');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onToggleWishlist={(pId, e) => handleToggleWishlist(pId, e)}
                      isWishlisted={wishlistProductIds.includes(p.id)}
                      onQuickAdd={(pId, e) => handleAddToCart(pId, 1)}
                      isAddingToCart={addingToCartId === p.id}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* BEST SELLERS AND POPULAR PRODUCTS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center">
                <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400 font-mono">Highly Requested</h2>
                <h3 className="text-xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1 font-sans">
                  Best Selling Masterpieces
                </h3>
                <p className="text-xs text-neutral-500 mt-2 max-w-md mx-auto">
                  A small list of design landmarks that have emerged as customer default choice.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.filter(p => p.isBestseller).slice(0, 4).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={(p) => {
                      setSelectedProduct(p);
                      setCurrentRoute('detail');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onToggleWishlist={(pId, e) => handleToggleWishlist(pId, e)}
                    isWishlisted={wishlistProductIds.includes(p.id)}
                    onQuickAdd={(pId, e) => handleAddToCart(pId, 1)}
                    isAddingToCart={addingToCartId === p.id}
                  />
                ))}
              </div>
            </section>

            {/* REAL CUSTOMER REVIEWS BOARD */}
            <section className="bg-neutral-50 border-t border-neutral-100 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-1">
                  <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400 font-mono">Corporate Integrity</h2>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-sans">
                    Opinionated Curators Speak Out
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white border border-neutral-100 rounded-2xl shadow-xs space-y-4">
                    <div className="flex text-amber-400">
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed italic">
                      "The Over-Ear Headphones represent acoustic artwork. Carbon fiber joints snap into position cleanly without loose rattles. Delivery arrived in standard linen sack cardboard boxes. Unbelievable precision."
                    </p>
                    <div className="border-t border-neutral-50 pt-3 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-semibold text-neutral-800">Gregory S., Chicago</span>
                      <span className="font-mono">Verify Match</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-neutral-100 rounded-2xl shadow-xs space-y-4">
                    <div className="flex text-amber-400">
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed italic">
                      "Everyday Bridle leather wallet is extremely quiet in pocket lines. It compresses down nicely holding 6 chips without bloating. Fully hand burnished edge finishes. Buy with ease."
                    </p>
                    <div className="border-t border-neutral-50 pt-3 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-semibold text-neutral-800">Charlotte V., London</span>
                      <span className="font-mono">Verify Match</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-[#1b3b2b]/10 bg-emerald-50/10 rounded-2xl shadow-xs space-y-4">
                    <div className="flex text-amber-400">
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                      <Star className="w-4 h-4 fill-currentColor" />
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed italic">
                      "I ordered the Arch Pour-Over kit. The heat borosilicate feels substantial. Packaging is fully reusable, which echoes sustainable boutique principles. Highly polished shipping logs."
                    </p>
                    <div className="border-t border-neutral-50 pt-3 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-semibold text-emerald-999 text-emerald-800 font-bold">Alexander K., Milan</span>
                      <span className="font-mono text-emerald-850">Verify Curation</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* 2. CATALOG DIRECTORY OVERVIEW */}
        {currentRoute === 'catalog' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="catalog-directory-view">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              
              {/* FILTERING BAR (Left Column) */}
              <aside className="w-full lg:w-64 bg-white border border-neutral-100 rounded-2xl p-6 space-y-6 flex-shrink-0 sticky top-24">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900">
                    <Filter className="w-4 h-4 text-emerald-850" />
                    <span>Search Filter Suite</span>
                  </div>
                  
                  {/* Reset trigger */}
                  <button
                    onClick={() => {
                      setSelectedCategoryId('');
                      setSelectedBrand('');
                      setSelectedMinRating(0);
                      setStockOnly(false);
                      setPriceCap(400);
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-semibold uppercase text-neutral-400 hover:text-red-650"
                  >
                    Clear All
                  </button>
                </div>

                {/* Categories Radio listing */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Category Sector</h4>
                  <div className="space-y-2 text-xs text-neutral-650">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="cat-radio-all"
                        checked={selectedCategoryId === ''}
                        onChange={() => setSelectedCategoryId('')}
                        className="w-4 h-4 text-emerald-900 focus:ring-emerald-800 accent-[#1b3b2b]"
                      />
                      <label htmlFor="cat-radio-all" className="cursor-pointer font-medium text-neutral-700">All Sectors</label>
                    </div>
                    {categories.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`cat-radio-${c.id}`}
                          checked={selectedCategoryId === c.id}
                          onChange={() => setSelectedCategoryId(c.id)}
                          className="w-4 h-4 text-emerald-999 accent-[#1b3b2b]"
                        />
                        <label htmlFor={`cat-radio-${c.id}`} className="cursor-pointer hover:text-[#1b3b2b] truncate pr-2 font-medium text-neutral-700">{c.name}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sorting Select options */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Sort Catalogue</h4>
                  <select
                    value={sortParam}
                    onChange={(e) => setSortParam(e.target.value)}
                    className="w-full text-xs p-2 focus:outline-hidden ring-1 focus:ring-emerald-800 ring-neutral-200 mt-1 rounded-lg"
                    id="catalog-sort-dispatcher"
                  >
                    <option value="newest">New Arrivals First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating_desc">Reviews Rank</option>
                  </select>
                </div>

                {/* Range Sliders for price caps */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Max Price cap</h4>
                    <span className="font-mono font-bold">${priceCap}</span>
                  </div>
                  <input
                    type="range"
                    min={35}
                    max={400}
                    step={5}
                    value={priceCap}
                    onChange={(e) => setPriceCap(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg cursor-pointer accent-[#1b3b2b]"
                    id="filter-price-slider"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>$35</span>
                    <span>$400</span>
                  </div>
                </div>

                {/* Brand selection filter checkboxes */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Creators Brand</h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { value: '', label: 'All Brands' },
                      { value: 'NILS Studio', label: 'NILS Studio' },
                      { value: 'Atelier Nils', label: 'Atelier Nils' },
                      { value: 'Hearth Studio', label: 'Hearth Studio' },
                      { value: 'Keycraft', label: 'Keycraft' }
                    ].map((brandOpt) => (
                      <div key={brandOpt.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`brand-chk-${brandOpt.value || 'all'}`}
                          checked={selectedBrand === brandOpt.value}
                          onChange={() => setSelectedBrand(brandOpt.value)}
                          className="w-4 h-4 accent-[#1b3b2b]"
                        />
                        <label htmlFor={`brand-chk-${brandOpt.value || 'all'}`} className="cursor-pointer text-neutral-700 font-medium">{brandOpt.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability filter Switch */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-600">Stock Availability Only</span>
                  <input
                    type="checkbox"
                    checked={stockOnly}
                    onChange={(e) => setStockOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#1b3b2b]"
                  />
                </div>

              </aside>

              {/* PRODUCTS DISPLAY GRID (Right Column) */}
              <div className="flex-1 space-y-6">
                
                {/* Search descriptors */}
                <div className="flex flex-col sm:flex-row items-baseline justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950 font-sans uppercase tracking-wider">
                      {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'Shop Catalog'}
                    </h2>
                    <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">Showing {products.length} matching selections</p>
                  </div>
                </div>

                {/* Infinite matching search elements */}
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-20 bg-white border rounded-2xl p-8 max-w-lg mx-auto">
                    <span className="p-3 bg-neutral-50 rounded-full inline-block border border-neutral-100 text-neutral-400 mb-4">
                      <SlidersHorizontal className="w-6 h-6 stroke-1" />
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900">No Matching Products</h3>
                    <p className="text-xs text-neutral-400 mt-2 max-w-sm mx-auto">We couldn't resolve any catalog items matching your filter constraints. Adjust slider price caps, ratings range, or keywords.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6" id="catalog-products-grid">
                    {products.map((item) => (
                      <ProductCard
                        key={item.id}
                        product={item}
                        onSelect={(p) => {
                          setSelectedProduct(p);
                          setCurrentRoute('detail');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onToggleWishlist={(pId, e) => handleToggleWishlist(pId, e)}
                        isWishlisted={wishlistProductIds.includes(item.id)}
                        onQuickAdd={(pId, e) => handleAddToCart(pId, 1)}
                        isAddingToCart={addingToCartId === item.id}
                      />
                    ))}
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* 3. PRODUCT STANDALONE DETAIL VIEW */}
        {currentRoute === 'detail' && selectedProduct && (
          <div className="animate-fade-in" id="product-detail-view-shell">
            <ProductView
              product={selectedProduct}
              user={user}
              onGoBack={() => setCurrentRoute('catalog')}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAddToCart={handleAddToCart}
              isWishlisted={wishlistProductIds.includes(selectedProduct.id)}
              onToggleWishlist={() => handleToggleWishlist(selectedProduct.id)}
            />
          </div>
        )}

        {/* 4. BILLING CHECKOUT VIEW */}
        {currentRoute === 'checkout' && cartItems.length > 0 && (
          <div className="animate-fade-in" id="checkout-view-shell">
            <CheckoutView
              cartItems={cartItems}
              userAddresses={addresses}
              onOrderPlaced={handleOrderPlacedSuccess}
              onCancel={() => {
                setCurrentRoute('home');
              }}
              onRefreshAddresses={handleRefreshAddresses}
            />
          </div>
        )}

        {/* 5. USER ACCOUNTS DASHBOARD */}
        {currentRoute === 'account' && user && (
          <div className="animate-fade-in" id="user-dashboard-shell">
            <UserDashboard
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setCurrentRoute('detail');
              }}
              onAddToCart={handleAddToCart}
            />
          </div>
        )}

        {/* 6. ADMIN SECURITY CONTROL MODULE */}
        {currentRoute === 'admin' && user?.role === 'admin' && (
          <div className="animate-fade-in" id="admin-panel-shell">
            <AdminPanel
              categories={categories}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setCurrentRoute('detail');
              }}
            />
          </div>
        )}

      </main>

      {/* FOOTER CANVAS */}
      <Footer
        onGoHome={() => {
          setSelectedCategoryId('');
          setCurrentRoute('home');
        }}
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
          setCurrentRoute('catalog');
        }}
      />

      {/* SLIDEOUT CART OVERLAY DRAWER */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onSaveForLater={handleSaveForLater}
        onCheckout={handleStartCheckout}
      />

      {/* AUTHENTICATION modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />

    </div>
  );
}
