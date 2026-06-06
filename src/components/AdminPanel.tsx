import React, { useState, useEffect } from 'react';
import { BarChart, Package, ShoppingCart, Users, Trash2, Edit, Plus, X, List, Calendar, Info, Loader2, Check } from 'lucide-react';
import { Product, Order, User, Category } from '../types';
import { api } from '../lib/api';

interface AdminPanelProps {
  categories: Category[];
  onSelectProduct: (p: Product) => void;
}

export default function AdminPanel({ categories, onSelectProduct }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'products' | 'orders' | 'users'>('analytics');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [productList, setProductList] = useState<Product[]>([]);
  const [customerList, setCustomerList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal control states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields for Product Creator/Editor
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('NILS Studio');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodCategory, setProdCategory] = useState(categories[0]?.id || 'cat_electronics');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800');
  const [prodDesc, setProdDesc] = useState('');
  const [prodBestseller, setProdBestseller] = useState(false);
  const [prodNewArrival, setProdNewArrival] = useState(false);
  
  // Specifications builder state
  const [specName1, setSpecName1] = useState('Material');
  const [specVal1, setSpecVal1] = useState('');
  const [specName2, setSpecName2] = useState('Origin');
  const [specVal2, setSpecVal2] = useState('');

  useEffect(() => {
    loadAdminData();
  }, [activeSubTab]);

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeSubTab === 'analytics') {
        const stats = await api.getAdminAnalytics();
        setAnalytics(stats);
      } else if (activeSubTab === 'products') {
        const prods = await api.getProducts({});
        setProductList(prods);
      } else if (activeSubTab === 'orders') {
        const stats = await api.getAdminAnalytics(); // contains recent orders including non-fulfilled
        setAnalytics(stats); // reuse same resolver
      } else if (activeSubTab === 'users') {
        const custs = await api.getAdminCustomers();
        setCustomerList(custs);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unauthorized or network failure.');
    } finally {
      setLoading(false);
    }
  };

  // Dispatch details changes
  const handleOrderStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Status change failure.');
    }
  };

  // Product deletions
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you absolutely sure you wish to delete this product? This action cascades to wishlists and reviews.')) return;
    try {
      await api.deleteProduct(id);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Deletions error.');
    }
  };

  // Product submission (create or update)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodDesc) {
      alert('Please fill out Name, Price, and Description.');
      return;
    }

    const payload = {
      name: prodName,
      brand: prodBrand,
      price: Number(prodPrice),
      stock: Number(prodStock),
      categoryId: prodCategory,
      image: prodImage,
      description: prodDesc,
      isBestseller: prodBestseller,
      isNewArrival: prodNewArrival,
      availability: Number(prodStock) > 0,
      images: [prodImage],
      specifications: [
        { name: specName1, value: specVal1 || 'Custom' },
        { name: specName2, value: specVal2 || 'Standard' }
      ]
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowProductModal(false);
      resetProductForm();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit product.');
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBrand('NILS Studio');
    setProdPrice('');
    setProdStock('10');
    setProdCategory(categories[0]?.id || 'cat_electronics');
    setProdImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800');
    setProdDesc('');
    setProdBestseller(false);
    setProdNewArrival(false);
    setSpecName1('Material');
    setSpecVal1('');
    setSpecName2('Origin');
    setSpecVal2('');
  };

  const triggerEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdBrand(p.brand);
    setProdPrice(p.price.toString());
    setProdStock(p.stock.toString());
    setProdCategory(p.categoryId);
    setProdImage(p.image);
    setProdDesc(p.description);
    setProdBestseller(p.isBestseller);
    setProdNewArrival(p.isNewArrival);
    setSpecName1(p.specifications[0]?.name || 'Material');
    setSpecVal1(p.specifications[0]?.value || '');
    setSpecName2(p.specifications[1]?.name || 'Origin');
    setSpecVal2(p.specifications[1]?.value || '');
    setShowProductModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-interactive-panel">
      
      {/* Admin Title headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-905 font-sans uppercase">
            NILS.SHOP Administration Control Panel
          </h1>
          <p className="text-xs text-neutral-450 text-neutral-400 mt-1">Configure catalogs listings, dispatch orders, review transactions, and analyze customer margins.</p>
        </div>

        {activeSubTab === 'products' && (
          <button
            onClick={() => {
              resetProductForm();
              setShowProductModal(true);
            }}
            className="self-start md:self-auto px-4 py-2 bg-[#1b3b2b] hover:bg-[#12281d] text-white text-xs font-semibold tracking-wider uppercase rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            id="btn-admin-add-product"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        )}
      </div>

      {/* SUBNAV tab triggers */}
      <div className="flex border-b border-neutral-100 gap-1 pb-px overflow-x-auto mb-8">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'analytics'
              ? 'border-[#1b3b2b] text-emerald-800 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
          id="btn-adm-tab-stats"
        >
          <div className="flex items-center gap-1.5">
            <BarChart className="w-4 h-4" />
            <span>Sales & Analytics</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'border-[#1b3b2b] text-emerald-800 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
          id="btn-adm-tab-catalog"
        >
          <div className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            <span>Catalog Manager</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'border-[#1b3b2b] text-emerald-800 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
          id="btn-adm-tab-orders"
        >
          <div className="flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4" />
            <span>Dispatch Registry</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'border-[#1b3b2b] text-emerald-800 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
          id="btn-adm-tab-users"
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Customers Roster</span>
          </div>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 mb-6 text-xs text-red-650 bg-red-101 bg-red-50 border border-red-100 rounded-xl">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-32">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8 min-h-[350px]">
          
          {/* TAB 1: ANALYTICS METRICS */}
          {activeSubTab === 'analytics' && analytics && (
            <div className="space-y-10">
              
              {/* Metrics grid cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-neutral-150 p-5 rounded-2xl bg-[#fafaf9]/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2 font-mono">Gross Sales Revenue</span>
                    <h3 className="text-2xl font-extrabold text-[#1b3b2b] font-sans">${analytics.totalSales}</h3>
                  </div>
                  <p className="text-[9px] text-[#136136] bg-emerald-50 self-start px-1.5 py-0.5 rounded-sm mt-3 font-semibold">Verified Checkout Matches</p>
                </div>

                <div className="border border-neutral-150 p-5 rounded-2xl bg-[#fafaf9]/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2 font-mono">Registered Orders</span>
                    <h3 className="text-2xl font-extrabold text-neutral-950 font-sans">{analytics.totalOrders}</h3>
                  </div>
                  <p className="text-[9px] text-neutral-450 text-neutral-400 mt-3 uppercase font-mono tracking-wider">Averaged value: ${analytics.totalOrders > 0 ? (analytics.totalSales / analytics.totalOrders).toFixed(0) : 0}/order</p>
                </div>

                <div className="border border-neutral-150 p-5 rounded-2xl bg-[#fafaf9]/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2 font-mono">Enrolled Customers</span>
                    <h3 className="text-2xl font-extrabold text-neutral-950 font-sans">{analytics.totalCustomers}</h3>
                  </div>
                  <p className="text-[9px] text-neutral-450 text-neutral-400 mt-3 bg-neutral-100 px-1.5 py-0.5 self-start rounded-sm font-semibold">Excludes Administrators</p>
                </div>

                <div className="border border-neutral-150 p-5 rounded-2xl bg-[#fafaf9]/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2 font-mono">Products Cataloged</span>
                    <h3 className="text-2xl font-extrabold text-neutral-950 font-sans">{analytics.totalProducts}</h3>
                  </div>
                  <p className="text-[9px] text-neutral-450 text-neutral-400 mt-3 font-medium uppercase font-mono">{categories.length} Categories mapped</p>
                </div>
              </div>

              {/* Breakdown Graph layouts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold tracking-widest uppercase text-neutral-900">Category Revenue Contribution</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">Distribution of purchases among product sectors.</p>
                  </div>

                  <div className="border border-neutral-100 p-6 rounded-2xl space-y-4 bg-white shadow-xs">
                    {analytics.categoryBreakdown.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No sales tracked yet across categories.</p>
                    ) : (
                      analytics.categoryBreakdown.map((catAny: any, cIdx: number) => {
                        const pctMax = analytics.totalSales > 0 ? (catAny.revenue / analytics.totalSales) * 100 : 0;
                        return (
                          <div key={cIdx} className="space-y-1 text-xs">
                            <div className="flex justify-between font-medium text-neutral-700">
                              <span>{catAny.categoryName}</span>
                              <span className="font-mono">${catAny.revenue} ({pctMax.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#1b3b2b] rounded-full" style={{ width: `${pctMax}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold tracking-widest uppercase text-neutral-900">Recent Transactions Monitor</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">Displaying real-time updates of the latest checkouts.</p>
                  </div>

                  <div className="border border-neutral-100 rounded-2xl overflow-hidden bg-white max-h-80 overflow-y-auto">
                    <table className="min-w-full divide-y divide-neutral-100 text-xs">
                      <thead className="bg-[#fafaf9]/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-neutral-700 tracking-wider">Order ID</th>
                          <th className="px-4 py-3 text-left font-bold text-neutral-700 tracking-wider">Customer</th>
                          <th className="px-4 py-3 text-left font-bold text-neutral-700 tracking-wider">Items Volume</th>
                          <th className="px-4 py-3 text-left font-bold text-neutral-700 tracking-wider">Billing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-600">
                        {analytics.recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center italic text-neutral-400">No transactions recorded yet.</td>
                          </tr>
                        ) : (
                          analytics.recentOrders.map((rec: any, idx: number) => (
                            <tr key={idx} className="hover:bg-neutral-50/50">
                              <td className="px-4 py-3 font-mono font-bold text-neutral-905">{rec.id}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-neutral-800">{rec.customerName}</p>
                                <p className="text-[10px] text-neutral-400 truncate max-w-[120px]">{rec.customerEmail}</p>
                              </td>
                              <td className="px-4 py-3 font-mono">{rec.items.length} units</td>
                              <td className="px-4 py-3 font-mono font-bold text-neutral-900">${rec.totalAmount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CATALOG WORKSPACE */}
          {activeSubTab === 'products' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-neutral-950">Active Catalog Database</h3>
                <p className="text-xs text-neutral-500 mt-1">Register new wares or edit current tags, prices, specifications, and inventories.</p>
              </div>

              <div className="border border-neutral-120 rounded-2xl overflow-hidden bg-white max-h-[500px] overflow-y-auto shadow-xs">
                <table className="min-w-full divide-y divide-neutral-100 text-xs text-left">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-5 py-3.5 font-bold tracking-wider text-neutral-900 uppercase">Product Details</th>
                      <th className="px-5 py-3.5 font-bold tracking-wider text-neutral-900 uppercase">Brand</th>
                      <th className="px-5 py-3.5 font-bold tracking-wider text-neutral-900 uppercase">Stock</th>
                      <th className="px-5 py-3.5 font-bold tracking-wider text-[#1b3b2b] uppercase">Price</th>
                      <th className="px-5 py-3.5 font-bold tracking-wider text-neutral-900 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-600">
                    {productList.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50/20 group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt="" className="w-10 h-10 object-cover bg-neutral-50 border rounded-lg flex-shrink-0" />
                            <div className="overflow-hidden">
                              <p
                                onClick={() => onSelectProduct(p)}
                                className="font-bold text-neutral-900 leading-tight hover:text-[#1b3b2b] cursor-pointer truncate max-w-[250px]"
                              >
                                {p.name}
                              </p>
                              <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wide">Category: {p.categoryId.replace('cat_', '')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono">{p.brand}</td>
                        <td className="px-5 py-4 font-semibold font-mono">
                          <span className={p.stock <= 5 ? 'text-amber-600' : 'text-neutral-500'}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-extrabold font-sans text-neutral-950">${p.price}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => triggerEditProduct(p)}
                              className="p-1 px-2.5 bg-neutral-100 font-semibold text-neutral-700 rounded-lg hover:bg-[#1b3b2b] hover:text-white transition-colors cursor-pointer"
                              id={`btn-adm-edit-${p.id}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 hover:bg-red-50 text-neutral-450 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              aria-label="Delete product"
                              id={`btn-adm-delete-${p.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH CONTROL */}
          {activeSubTab === 'orders' && analytics && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-[#1b3b2b]">Active Dispatch Registry</h3>
                <p className="text-xs text-neutral-400 mt-1">Audit customer deliveries and alter ship statuses dynamically.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {analytics.recentOrders.map((ord: any) => (
                  <div key={ord.id} className="border border-neutral-150 rounded-2xl p-5 bg-[#fafaf9]/20" id={`admin-dispatch-row-${ord.id}`}>
                    <div className="flex flex-col sm:flex-row justify-between pb-3 border-b border-neutral-100 gap-4 mb-4 items-start sm:items-center">
                      <div>
                        <p className="text-[10px] font-mono text-neutral-400">TRANSACTION ID / RECIPIENT</p>
                        <p className="text-xs font-bold text-neutral-905">
                          <span className="font-mono uppercase">{ord.id}</span> &bull; {ord.customerName}
                        </p>
                        <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">{ord.customerEmail}</span>
                      </div>

                      {/* State switcher selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase font-mono">Dispatch State</span>
                        <select
                          value={ord.status}
                          onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as Order['status'])}
                          className="text-xs p-1.5 focus:outline-hidden ring-1 focus:ring-emerald-800 ring-neutral-300 rounded-lg bg-white font-medium"
                          id={`select-status-${ord.id}`}
                        >
                          <option value="pending">Pending Review</option>
                          <option value="processing">Processing Box</option>
                          <option value="shipped">On Courier Shipped</option>
                          <option value="delivered">Successfully Delivered</option>
                        </select>
                      </div>
                    </div>

                    {/* Order contents summary */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Dispatched Units ({ord.items.length})</p>
                      {ord.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs text-neutral-600">
                          <span>{it.productName} &bull; Qty: {it.quantity}</span>
                          <span className="font-mono">${it.price * it.quantity}</span>
                        </div>
                      ))}
                      
                      <div className="border-t border-neutral-100 pt-2 flex justify-between font-bold text-xs text-neutral-900">
                        <span>Payer Billing Address</span>
                        <span className="font-mono text-neutral-950">${ord.totalAmount}</span>
                      </div>
                      
                      {/* String representations of location */}
                      <p className="text-[10px] text-neutral-450 italic mt-1 leading-relaxed">
                        Ship to: {ord.shippingAddress?.name}, {ord.shippingAddress?.street}, {ord.shippingAddress?.city}, {ord.shippingAddress?.state} {ord.shippingAddress?.postalCode}. Method: {ord.paymentMethod.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: USERS LISTS */}
          {activeSubTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-neutral-950">Logged Accounts Directory</h3>
                <p className="text-xs text-neutral-500 mt-1">Examining registered customer log entries (excluding corporate managers).</p>
              </div>

              <div className="border border-neutral-150 rounded-2xl overflow-hidden bg-white max-h-[400px] overflow-y-auto shadow-xs">
                <table className="min-w-full divide-y divide-neutral-100 text-xs text-left">
                  <thead className="bg-[#fafaf9]/60">
                    <tr>
                      <th className="px-5 py-3 font-bold tracking-wider text-neutral-900 uppercase">Customer Name</th>
                      <th className="px-5 py-3 font-bold tracking-wider text-neutral-900 uppercase">E-Mail Descriptor</th>
                      <th className="px-5 py-3 font-bold tracking-wider text-neutral-950 uppercase">Date Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-600">
                    {customerList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center italic text-neutral-400">No customer profiles logged yet within local db.</td>
                      </tr>
                    ) : (
                      customerList.map((cust) => (
                        <tr key={cust.id} className="hover:bg-neutral-50/50">
                          <td className="px-5 py-3 font-bold text-neutral-850 flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-neutral-100 text-neutral-700 border rounded-full flex items-center justify-center text-[10px] font-mono font-bold leading-none">{cust.name.charAt(0)}</span>
                            <span>{cust.name}</span>
                          </td>
                          <td className="px-5 py-3 font-mono text-neutral-700">{cust.email}</td>
                          <td className="px-5 py-3 text-neutral-450 text-neutral-400">{new Date(cust.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL DIALOG: Product Creation and edit details */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setShowProductModal(false)} />
          
          <div className="relative w-full max-w-lg p-8 bg-white border rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-950 rounded-full transition-colors"
              aria-label="Close add product modal"
              id="btn-close-prod-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-6">
              {editingProduct ? `Edit Curation: ${editingProduct.name}` : 'Catalog New Product Selection'}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-sans text-neutral-600">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold tracking-wider text-neutral-400 mb-1 uppercase text-[10px]">Product Name</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Leather Bifold"
                    className="w-full p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold tracking-wider text-neutral-400 mb-1 uppercase text-[10px]">Brand Label</label>
                  <input
                    type="text"
                    required
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    placeholder="NILS Studio"
                    className="w-full p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold tracking-wider text-neutral-400 mb-1 uppercase text-[10px]">Price (INR or USD)</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="120"
                    className="w-full p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold tracking-wider text-neutral-400 mb-1 uppercase text-[10px]">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="10"
                    className="w-full p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold tracking-wider text-neutral-400 mb-1 uppercase text-[10px]">Catalog Section</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold tracking-wider text-neutral-400 mb-1 uppercase text-[10px]">Unsplash Photography URL</label>
                <input
                  type="url"
                  required
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl font-mono text-[10px]"
                />
              </div>

              <div>
                <label className="block font-bold tracking-wider text-neutral-400 mb-1 uppercase text-[10px]">Detailed Curation Description</label>
                <textarea
                  rows={3}
                  required
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Elaborate details explaining source materials, craftsmanship qualities and features..."
                  className="w-full p-3 border border-neutral-200 bg-neutral-50 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-bestseller"
                    checked={prodBestseller}
                    onChange={(e) => setProdBestseller(e.target.checked)}
                    className="w-4 h-4 border-neutral-300 accent-emerald-900 rounded"
                  />
                  <label htmlFor="chk-bestseller" className="font-semibold text-neutral-600 cursor-pointer">Tag as Bestseller Section</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-newarrival"
                    checked={prodNewArrival}
                    onChange={(e) => setProdNewArrival(e.target.checked)}
                    className="w-4 h-4 border-neutral-300 accent-emerald-900 rounded"
                  />
                  <label htmlFor="chk-newarrival" className="font-semibold text-neutral-600 cursor-pointer">Tag as New Arrival Section</label>
                </div>
              </div>

              {/* SPECIFICATION ITEMS */}
              <div className="border-t border-neutral-100 pt-4 space-y-3">
                <p className="font-bold text-neutral-900 uppercase text-[10px] tracking-wider mb-1">Key Specifications</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Specification 1 name (e.g. Material)"
                      value={specName1}
                      onChange={(e) => setSpecName1(e.target.value)}
                      className="w-full p-2 border border-neutral-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Specification 1 value (e.g. 100% Merino wool)"
                      value={specVal1}
                      onChange={(e) => setSpecVal1(e.target.value)}
                      className="w-full p-2 border border-neutral-200 rounded-lg mt-1.5"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Specification 2 name (e.g. Origin)"
                      value={specName2}
                      onChange={(e) => setSpecName2(e.target.value)}
                      className="w-full p-2 border border-neutral-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Specification 2 value (e.g. Designed in Milan)"
                      value={specVal2}
                      onChange={(e) => setSpecVal2(e.target.value)}
                      className="w-full p-2 border border-neutral-200 rounded-lg mt-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3.5 pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1b3b2b] hover:bg-[#12281d] text-white font-semibold rounded-xl"
                >
                  {editingProduct ? 'Save Curation Details' : 'Publish Product to Store'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
