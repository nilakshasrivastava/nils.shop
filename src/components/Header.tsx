import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User as MapUser, ChevronDown, Check, LogOut, Settings, BarChart2 } from 'lucide-react';
import { User, Category, Product } from '../types';
import { api } from '../lib/api';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  cartCount: number;
  wishCount: number;
  onViewCart: () => void;
  onViewWishlist: () => void;
  onViewAccount: () => void;
  onViewAdmin: () => void;
  onSearch: (q: string) => void;
  onSelectProduct: (p: Product) => void;
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (catId: string) => void;
  onGoHome: () => void;
}

export default function Header({
  user,
  onLogout,
  onOpenAuth,
  cartCount,
  wishCount,
  onViewCart,
  onViewWishlist,
  onViewAccount,
  onViewAdmin,
  onSearch,
  onSelectProduct,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onGoHome,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dropdownCategoriesOpen, setDropdownCategoriesOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load live quick search suggestions
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const prodSuggestions = await api.getProducts({ q: searchQuery });
        setSuggestions(prodSuggestions.slice(0, 5)); // cap suggestions at 5
      } catch (err) {
        console.error('Failed to load search suggestions:', err);
      }
    }, 150);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setSearchFocused(false);
  };

  const handleSuggestionClick = (product: Product) => {
    onSelectProduct(product);
    setSearchQuery('');
    setSuggestions([]);
    setSearchFocused(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-xs" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={onGoHome}
              className="text-xl font-bold tracking-[0.2em] text-neutral-950 hover:text-emerald-900 transition-colors uppercase font-sans cursor-pointer focus:outline-none"
              id="brand-logo"
            >
              NILS<span className="text-[#1b3b2b]">.</span>SHOP
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => onSelectCategory('')}
                className={`px-3 py-2 text-xs font-medium tracking-wider uppercase rounded-lg transition-colors cursor-pointer ${
                  selectedCategoryId === '' ? 'text-emerald-900 bg-neutral-100' : 'text-neutral-500 hover:text-neutral-900'
                }`}
                id="nav-all-products"
              >
                All
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setDropdownCategoriesOpen(!dropdownCategoriesOpen)}
                  onBlur={() => setTimeout(() => setDropdownCategoriesOpen(false), 200)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium tracking-wider uppercase text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                  id="nav-categories-dropdown"
                >
                  <span>Categories</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {dropdownCategoriesOpen && (
                  <div className="absolute left-0 mt-1 w-52 bg-white border border-neutral-100 rounded-xl shadow-xl py-2 z-50">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onSelectCategory(cat.id);
                          setDropdownCategoriesOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-medium tracking-wide transition-colors hover:bg-neutral-50 flex items-center justify-between ${
                          selectedCategoryId === cat.id ? 'text-emerald-900 font-semibold' : 'text-neutral-600'
                        }`}
                        id={`cat-item-${cat.slug}`}
                      >
                        <span>{cat.name}</span>
                        {selectedCategoryId === cat.id && <Check className="w-3.5 h-3.5 text-emerald-800" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Quick Dynamic Search Form */}
          <div ref={searchRef} className="relative flex-1 max-w-md mx-4 md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products, brands, or descriptions..."
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-950 placeholder-neutral-400 text-xs px-4 py-2.5 pl-10 border border-neutral-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-emerald-800/15 focus:border-[#1b3b2b] focus:bg-white transition-all"
                id="header-search-input"
              />
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                <Search className="w-4 h-4" />
              </span>
            </form>

            {/* Live Matches Search suggestions */}
            {searchFocused && suggestions.length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-white border border-neutral-100 rounded-2xl shadow-xl py-2 max-h-96 overflow-y-auto z-50">
                <div className="px-4 py-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                  Product Suggestions
                </div>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSuggestionClick(p)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 transition-colors text-left"
                    id={`search-suggest-${p.id}`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 object-cover rounded-md bg-neutral-100 border border-neutral-100 flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-neutral-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono tracking-wide">{p.brand} &bull; ${p.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tool Navigation Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Wishlist Button */}
            <button
              onClick={onViewWishlist}
              className="relative p-2.5 text-neutral-600 hover:text-emerald-900 hover:bg-neutral-50 rounded-full transition-all cursor-pointer"
              aria-label="Wishlist"
              id="btn-header-wishlist"
            >
              <Heart className="w-4.5 h-4.5" />
              {wishCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onViewCart}
              className="relative p-2.5 text-neutral-600 hover:text-emerald-900 hover:bg-neutral-50 rounded-full transition-all cursor-pointer"
              aria-label="Shopping Cart"
              id="btn-header-cart"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1b3b2b] text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <span className="h-6 w-px bg-neutral-200" />

            {/* User Profile Trigger */}
            <div ref={userMenuRef} className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 py-1.5 px-3 hover:bg-neutral-50 rounded-full transition-colors text-xs font-medium text-neutral-700 cursor-pointer"
                    id="btn-profile-trigger"
                  >
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-100 flex items-center justify-center text-[10px] uppercase font-bold">
                      {user.name.charAt(0)}
                    </span>
                    <span className="hidden sm:inline-block truncate max-w-[80px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-100 rounded-2xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-neutral-50">
                        <p className="text-xs font-semibold text-neutral-950">{user.name}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="mt-1 inline-block px-1.5 py-0.5 rounded-sm bg-neutral-900 text-[8px] font-bold tracking-wider uppercase text-white">
                            Administrator
                          </span>
                        )}
                      </div>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            onViewAdmin();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                          id="btn-menu-admin"
                        >
                          <BarChart2 className="w-4 h-4 text-emerald-800" />
                          <span>Admin Control Panel</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onViewAccount();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                        id="btn-menu-dashboard"
                      >
                        <Settings className="w-4 h-4 text-neutral-400" />
                        <span>Account Settings</span>
                      </button>

                      <hr className="my-1 border-neutral-50" />

                      <button
                        onClick={() => {
                          onLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        id="btn-menu-logout"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-neutral-950 hover:text-white border border-neutral-200 hover:border-neutral-950 rounded-full transition-all text-xs font-medium text-neutral-800 cursor-pointer cursor-pointer"
                  id="btn-header-login"
                >
                  <MapUser className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
