import React, { useState, useEffect } from 'react';
import { Package, Heart, Star, Settings, User as UserIcon, Calendar, CheckSquare, Loader2, ArrowRight } from 'lucide-react';
import { User, Order, WishlistItem, Product, Review } from '../types';
import { api } from '../lib/api';

interface UserDashboardProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  onSelectProduct: (p: Product) => void;
  onAddToCart: (pId: string, qty: number) => void;
}

export default function UserDashboard({ user, onUpdateUser, onSelectProduct, onAddToCart }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'reviews' | 'profile'>('orders');
  
  // States of user records
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<(WishlistItem & { product: Product })[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile forms
  const [nameInput, setNameInput] = useState(user.name);
  const [emailInput, setEmailInput] = useState(user.email);
  const [passInput, setPassInput] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [submitingProfile, setSubmitingProfile] = useState(false);

  useEffect(() => {
    loadDashboardState();
  }, [activeTab]);

  const loadDashboardState = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const ords = await api.getOrders();
        setOrders(ords);
      } else if (activeTab === 'wishlist') {
        const wish = await api.getWishlist();
        setWishlist(wish);
      }
    } catch (err) {
      console.error('Failed to load dashboard specs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSubmitingProfile(true);

    try {
      const data = await api.updateMe(nameInput, emailInput, passInput || undefined);
      onUpdateUser(data.user);
      setProfileSuccess('Your profile details have been saved successfully.');
      setPassInput('');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to apply profile changes.');
    } finally {
      setSubmitingProfile(false);
    }
  };

  const handleRemoveWish = async (pId: string) => {
    try {
      await api.toggleWishlist(pId);
      // reload
      const wish = await api.getWishlist();
      setWishlist(wish);
    } catch (err) {
      console.error('Failed to edit wishlist:', err);
    }
  };

  const handleMoveToCart = async (pId: string) => {
    try {
      await onAddToCart(pId, 1);
      // remove from wishlist
      await handleRemoveWish(pId);
    } catch (err) {
      console.error('Cart moving failed:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="user-dashboard-panel">
      
      {/* Intro Greetings Banner */}
      <div className="bg-neutral-50 border border-neutral-150 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 bg-[#1b3b2b] text-white rounded-full flex items-center justify-center text-xl font-bold font-sans">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 font-sans">Welcome Back, {user.name}</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Joined on {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 bg-white px-4 py-2 rounded-xl border border-neutral-100">
          <Calendar className="w-3.5 h-3.5 text-emerald-800" />
          <span>Evaluation Session Valid</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDE SELECTOR Tab lists */}
        <div className="lg:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#1b3b2b] text-white font-bold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50'
            }`}
            id="tab-btn-orders"
          >
            <Package className="w-4 h-4" />
            <span>Order History</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-[#1b3b2b] text-white font-bold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50'
            }`}
            id="tab-btn-wish"
          >
            <Heart className="w-4 h-4" />
            <span>My Wishlist</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#1b3b2b] text-white font-bold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50'
            }`}
            id="tab-btn-profile"
          >
            <Settings className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* MAIN BODY View rendering */}
        <div className="lg:col-span-3">
          
          {loading && activeTab !== 'profile' ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : (
            <div className="bg-white border border-neutral-100 p-6 sm:p-8 rounded-2xl min-h-[400px]">

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-905">Your Order Manifests</h3>
                    <p className="text-xs text-neutral-400 mt-1">Track shipping statuses, payment modes, and curation records.</p>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <Package className="w-10 h-10 text-neutral-300 mx-auto stroke-1 mb-3" />
                      <p className="text-xs font-semibold text-neutral-500">No placed orders found</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Explore catalogs and check out items to create history.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 font-sans max-h-160 overflow-y-auto pr-1">
                      {orders.map((ord) => (
                        <div key={ord.id} className="border border-neutral-150 rounded-2xl p-5 bg-[#fafaf9]/20" id={`order-item-${ord.id}`}>
                          <div className="flex flex-col sm:flex-row justify-between pb-3.5 border-b border-neutral-100 gap-2 mb-4">
                            <div>
                              <p className="text-[10px] font-mono text-neutral-400 tracking-wider">ORDER NUMBER</p>
                              <p className="text-xs font-bold font-mono text-neutral-905">{ord.id}</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-xs">
                              <div>
                                <p className="text-[10px] text-neutral-400 font-mono">ORDERED ON</p>
                                <p className="text-neutral-800 font-medium">{new Date(ord.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-neutral-400 font-mono">TOTAL BILL</p>
                                <p className="text-neutral-950 font-bold">${ord.totalAmount}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-neutral-400 font-mono">SHIPMENT STATE</p>
                                <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase ${
                                  ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-850' :
                                  ord.status === 'shipped' ? 'bg-blue-50 text-blue-800' :
                                  ord.status === 'processing' ? 'bg-amber-50 text-amber-800' :
                                  'bg-neutral-100 text-neutral-600'
                                }`}>
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Order Products matching list */}
                          <div className="space-y-3">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex gap-3 items-center text-xs">
                                <img src={it.productImage} alt="" className="w-10 h-10 object-cover bg-neutral-50 border border-neutral-100 rounded-lg flex-shrink-0" />
                                <div className="flex-1 overflow-hidden">
                                  <p className="font-semibold text-neutral-900 truncate">{it.productName}</p>
                                  <p className="text-neutral-400 text-[11px] mt-0.5">${it.price} &bull; Qty: {it.quantity}</p>
                                </div>
                                <span className="font-mono font-bold text-neutral-950">${it.price * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WISHLIST TAB */}
              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Your Saved Curations</h3>
                    <p className="text-xs text-neutral-400 mt-1">Review saved items or throw them directly into active boxes.</p>
                  </div>

                  {wishlist.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-50 rounded-2xl border border-neutral-105">
                      <Heart className="w-10 h-10 text-neutral-300 mx-auto stroke-1 mb-3" fill="none" />
                      <p className="text-xs font-semibold text-neutral-500">Your Wishlist is empty</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Press heart symbols on product cards to save items.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-160 overflow-y-auto pr-1">
                      {wishlist.map((item) => (
                        <div key={item.id} className="p-4 border border-neutral-150 rounded-2xl flex gap-3.5 bg-white relative group" id={`wishlist-entry-${item.id}`}>
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-50 flex-shrink-0 border border-neutral-100">
                            <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-1 overflow-hidden flex flex-col justify-between">
                            <div>
                              <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest leading-none mb-1">{item.product.brand}</p>
                              <h4
                                onClick={() => onSelectProduct(item.product)}
                                className="text-xs font-semibold text-neutral-900 leading-tight truncate hover:text-[#1b3b2b] transition-colors cursor-pointer"
                              >
                                {item.product.name}
                              </h4>
                              <p className="text-xs font-bold text-neutral-950 mt-1">${item.product.price}</p>
                            </div>

                            <div className="flex gap-2 items-center mt-3 pt-2.5 border-t border-neutral-100 text-[11px] font-medium text-neutral-500">
                              {item.product.availability ? (
                                <button
                                  onClick={() => handleMoveToCart(item.product.id)}
                                  className="text-[#1b3b2b] hover:underline flex items-center gap-1 cursor-pointer"
                                  id={`btn-move-cart-${item.id}`}
                                >
                                  <span>Move to Bag</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-red-650 text-red-600">Out of Stock</span>
                              )}
                              
                              <span className="text-neutral-200">|</span>
                              
                              <button
                                onClick={() => handleRemoveWish(item.product.id)}
                                className="text-neutral-450 text-neutral-400 hover:text-red-600 cursor-pointer"
                                id={`btn-wish-remove-${item.id}`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-[#1b3b2b]">Security Profile Settings</h3>
                    <p className="text-xs text-neutral-400 mt-1">Manage real email descriptors and system login hashes.</p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                    {profileSuccess && (
                      <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg">
                        {profileSuccess}
                      </div>
                    )}
                    {profileError && (
                      <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
                        {profileError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white"
                        id="profile-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1">Authenticated Email</label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white"
                        id="profile-email-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1">
                        Change Password <span className="font-normal text-neutral-400">(leave blank to keep current)</span>
                      </label>
                      <input
                        type="password"
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white font-mono"
                        id="profile-pass-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitingProfile}
                      className="px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#12281d] text-white font-semibold text-xs tracking-widest uppercase rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"
                      id="btn-save-profile"
                    >
                      {submitingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : null}
                      <span>Save Profile Changes</span>
                    </button>
                  </form>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
