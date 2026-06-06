import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ShieldAlert, ChevronRight, User, Truck, Receipt, Check, Loader2 } from 'lucide-react';
import { CartItem, Product, Address, Order } from '../types';
import { api } from '../lib/api';

interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

interface CheckoutViewProps {
  cartItems: CartItemWithProduct[];
  userAddresses: Address[];
  onOrderPlaced: (order: Order) => void;
  onCancel: () => void;
  onRefreshAddresses: () => void;
}

export default function CheckoutView({
  cartItems,
  userAddresses,
  onOrderPlaced,
  onCancel,
  onRefreshAddresses,
}: CheckoutViewProps) {
  // Navigation steps
  const [step, setStep] = useState<'details' | 'payment' | 'completed'>('details');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address Selector Or New Address Form States
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  // Shipping form fields
  const [shipName, setShipName] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipState, setShipState] = useState('');
  const [shipPostal, setShipPostal] = useState('');
  const [shipCountry, setShipCountry] = useState('United States');

  // Billing address match checkbox
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Billing fields if sameAsBilling is false
  const [billName, setBillName] = useState('');
  const [billStreet, setBillStreet] = useState('');
  const [billCity, setBillCity] = useState('');
  const [billState, setBillState] = useState('');
  const [billPostal, setBillPostal] = useState('');
  const [billCountry, setBillCountry] = useState('United States');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'bank_transfer'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isFreeShipping = subtotal >= 150;
  const shippingCost = isFreeShipping ? 0 : 15;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (userAddresses.length > 0) {
      setSelectedAddressId(userAddresses[0].id);
      setUseCustomAddress(false);
    } else {
      setUseCustomAddress(true);
    }
  }, [userAddresses]);

  // Form submit validators
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!useCustomAddress && !selectedAddressId) {
      setErrorMsg('Please select a shipping location or click Add New Address.');
      return;
    }

    if (useCustomAddress) {
      if (!shipName || !shipStreet || !shipCity || !shipState || !shipPostal) {
        setErrorMsg('Please complete all custom shipping fields.');
        return;
      }
    }

    setStep('payment');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // Resolve Shipping Address Object
      let finalShipping: Omit<Address, 'id' | 'userId' | 'createdAt'>;

      if (!useCustomAddress) {
        const matched = userAddresses.find(a => a.id === selectedAddressId);
        if (!matched) throw new Error('Selected address could not be resolved.');
        finalShipping = {
          name: matched.name,
          street: matched.street,
          city: matched.city,
          state: matched.state,
          postalCode: matched.postalCode,
          country: matched.country,
          type: 'shipping'
        };
      } else {
        finalShipping = {
          name: shipName,
          street: shipStreet,
          city: shipCity,
          state: shipState,
          postalCode: shipPostal,
          country: shipCountry,
          type: 'shipping'
        };

        // Saveto addresses list automatically in the background
        try {
          await api.createAddress(finalShipping);
          onRefreshAddresses();
        } catch {
          // ignore address book failure for simple checkout continuity.
        }
      }

      // Resolve Billing Address
      const finalBilling = sameAsBilling ? finalShipping : {
        name: billName,
        street: billStreet,
        city: billCity,
        state: billState,
        postalCode: billPostal,
        country: billCountry,
        type: 'billing' as const
      };

      // Place order via API
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.image,
        price: item.product.price,
        quantity: item.quantity
      }));

      const placed = await api.createOrder({
        items: orderItems,
        shippingAddress: finalShipping,
        billingAddress: finalBilling,
        paymentMethod,
        totalAmount: total
      });

      setPlacedOrder(placed);
      setStep('completed');
      onOrderPlaced(placed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification of inventory blocks placement.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'completed' && placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" id="checkout-receipt-panel">
        <div className="inline-flex p-4 bg-emerald-50 text-[#1b3b2b] rounded-full border border-emerald-100 mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 font-sans">
          Your Order is Confirmed
        </h1>
        <p className="mt-3 text-sm text-neutral-500 max-w-md mx-auto">
          Thank you for shopping at NILS.SHOP. Your order has been registered securely, and our curation suite has begun picking items for boxing.
        </p>

        {/* Receipt Box details */}
        <div className="mt-10 p-8 border border-neutral-150 rounded-2xl bg-[#fafaf9] max-w-md mx-auto text-left text-xs space-y-4">
          <div className="flex justify-between border-b border-neutral-100 pb-3">
            <span className="text-neutral-500 uppercase tracking-widest font-bold">Order Number</span>
            <span className="font-mono font-bold text-neutral-900">{placedOrder.id}</span>
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold text-neutral-800 uppercase tracking-wider text-[10px]">Curation Manifest</p>
            {placedOrder.items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-neutral-650">
                <span className="truncate max-w-[200px]">{it.productName} (x{it.quantity})</span>
                <span className="font-mono font-medium">${it.price * it.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-3 flex justify-between font-bold text-sm text-neutral-950">
            <span>Amount Dispatched</span>
            <span>${placedOrder.totalAmount}</span>
          </div>

          <div className="text-[10px] text-neutral-400 bg-white p-2.5 rounded-lg border border-neutral-100 text-center uppercase tracking-wider">
            Expected Delivery: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </div>
        </div>

        <button
          onClick={onCancel} // Cancel functions also resets route views back to home catalog.
          className="mt-8 px-6 py-3 bg-[#1b3b2b] hover:bg-[#12281d] text-white text-xs tracking-widest font-semibold uppercase rounded-xl shadow-lg transition-colors cursor-pointer"
          id="btn-receipt-finish"
        >
          Return to Curation Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="checkout-interactive-panel">
      
      {/* Tracker headers */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-8">
        <span className={step === 'details' ? 'text-emerald-800' : 'text-neutral-5 * text-neutral-800'}>1. Shipping Details</span>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-350" />
        <span className={step === 'payment' ? 'text-emerald-800' : 'text-neutral-400'}>2. Final Payment</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: Checkout entries */}
        <div className="lg:col-span-2 space-y-6">
          {errorMsg && (
            <div className="p-3 text-xs text-red-650 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-6 bg-white border border-neutral-100 p-8 rounded-2xl">
              
              {/* SAVED ADDRESS SELECTOR */}
              {userAddresses.length > 0 && (
                <div className="space-y-3 pb-6 border-b border-neutral-100">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-900 flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-neutral-600" />
                    <span>Select Shipping Destination</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {userAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id && !useCustomAddress;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setUseCustomAddress(false);
                          }}
                          className={`p-4 border rounded-xl cursor-pointer text-xs transition-all relative ${
                            isSelected
                              ? 'border-[#1b3b2b] bg-emerald-50/5/10 ring-2 ring-emerald-800/5 ring-emerald-999 bg-emerald-50/10'
                              : 'border-neutral-200 hover:border-neutral-400 bg-white'
                          }`}
                          id={`address-item-${addr.id}`}
                        >
                          <p className="font-bold text-neutral-900">{addr.name}</p>
                          <p className="text-neutral-500 mt-1">{addr.street}</p>
                          <p className="text-neutral-500">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-neutral-400">{addr.country}</p>
                          {isSelected && (
                            <span className="absolute bottom-2.5 right-2.5 text-emerald-800">
                              <Check className="w-4 h-4 stroke-2" />
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Quick Trigger custom address form */}
                    <div
                      onClick={() => setUseCustomAddress(true)}
                      className={`p-4 border border-dashed rounded-xl cursor-pointer text-xs flex items-center justify-center text-center ${
                        useCustomAddress
                          ? 'border-[#1b3b2b] text-emerald-800 font-semibold bg-emerald-50/20'
                          : 'border-neutral-300 text-neutral-500 hover:border-neutral-600 hover:text-neutral-900'
                      }`}
                      id="btn-trigger-new-address"
                    >
                      <span>+ Custom Delivery Destination</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOM SHIPMENT FORM */}
              {useCustomAddress && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-900 flex items-center gap-2">
                    <Truck className="w-4.5 h-4.5 text-neutral-600" />
                    <span>Enter Custom Shipping Address</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        required
                        value={shipName}
                        onChange={(e) => setShipName(e.target.value)}
                        placeholder="e.g. Thomas Nils"
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                        id="ship-name-input"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        required
                        value={shipStreet}
                        onChange={(e) => setShipStreet(e.target.value)}
                        placeholder="Apt 4B, 238 Pine Street"
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                        id="ship-street-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={shipCity}
                        onChange={(e) => setShipCity(e.target.value)}
                        placeholder="San Francisco"
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                        id="ship-city-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          required
                          value={shipState}
                          onChange={(e) => setShipState(e.target.value)}
                          placeholder="CA"
                          className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                          id="ship-state-input"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                          Postal ZIP
                        </label>
                        <input
                          type="text"
                          required
                          value={shipPostal}
                          onChange={(e) => setShipPostal(e.target.value)}
                          placeholder="94104"
                          className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                          id="ship-zip-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Same as Billing checkbox */}
              <div className="pt-4 border-t border-neutral-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-same-billing"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="w-4 h-4 border-neutral-300 rounded text-emerald-800 accent-emerald-900 focus:ring-emerald-800"
                />
                <label htmlFor="chk-same-billing" className="text-xs text-neutral-600 font-medium cursor-pointer">
                  Billing matches Shipping criteria.
                </label>
              </div>

              {/* CUSTOM BILLING ADDRESS FORM */}
              {!sameAsBilling && (
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-900 flex items-center gap-2">
                    <Receipt className="w-4.5 h-4.5 text-neutral-600" />
                    <span>Enter Billing Address Details</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        Payer Name
                      </label>
                      <input
                        type="text"
                        required
                        value={billName}
                        onChange={(e) => setBillName(e.target.value)}
                        placeholder="Same as Card details"
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white focus:outline-hidden"
                        id="bill-name-input"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        Billing Street
                      </label>
                      <input
                        type="text"
                        required
                        value={billStreet}
                        onChange={(e) => setBillStreet(e.target.value)}
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white focus:outline-hidden"
                        id="bill-street-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        Billing City
                      </label>
                      <input
                        type="text"
                        required
                        value={billCity}
                        onChange={(e) => setBillCity(e.target.value)}
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white"
                        id="bill-city-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                          Billing State
                        </label>
                        <input
                          type="text"
                          required
                          value={billState}
                          onChange={(e) => setBillState(e.target.value)}
                          className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl"
                          id="bill-state-input"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                          Payer ZIP URL
                        </label>
                        <input
                          type="text"
                          required
                          value={billPostal}
                          onChange={(e) => setBillPostal(e.target.value)}
                          className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl"
                          id="bill-zip-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 border border-neutral-200 text-xs text-neutral-700 tracking-wider font-semibold uppercase rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
                  id="btn-cancel-checkout"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1b3b2b] hover:bg-[#12281d] text-white text-xs tracking-widest font-semibold uppercase rounded-xl shadow-lg transition-colors cursor-pointer"
                  id="btn-submit-details"
                >
                  Go to Payment
                </button>
              </div>

            </form>
          ) : (
            <form onSubmit={handlePlaceOrder} className="space-y-6 bg-white border border-neutral-100 p-8 rounded-2xl">
              <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-neutral-600" />
                <span>Choose Payment Method</span>
              </h3>

              {/* Payment selection selector */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border text-center rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'card' ? 'border-[#1b3b2b] bg-emerald-50/10 text-[#1b3b2b] font-semibold' : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                  }`}
                  id="btn-pay-card"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[10px] tracking-wider uppercase">Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-4 border text-center rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'apple_pay' ? 'border-[#1b3b2b] bg-emerald-50/10 text-[#1b3b2b] font-semibold' : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                  }`}
                  id="btn-pay-apple"
                >
                  <span className="text-xs font-bold tracking-tighter"> Pay</span>
                  <span className="text-[10px] tracking-wider uppercase">Apple Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 border text-center rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'bank_transfer' ? 'border-[#1b3b2b] bg-emerald-50/10 text-[#1b3b2b] font-semibold' : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                  }`}
                  id="btn-pay-bank"
                >
                  <Receipt className="w-5 h-5" />
                  <span className="text-[10px] tracking-wider uppercase">Bank Transfer</span>
                </button>
              </div>

              {/* Payments specifics rendering fields */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Thomas Nils"
                      className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white"
                      id="card-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      maxLength={19}
                      className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white font-mono"
                      id="card-num-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white font-mono"
                        id="card-exp-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-1">
                        Security CVV
                      </label>
                      <input
                        type="password"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        maxLength={3}
                        className="w-full text-xs p-2.5 border border-neutral-200 bg-neutral-50 rounded-xl focus:bg-white font-mono"
                        id="card-cvv-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'apple_pay' && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-600 text-xs text-center leading-relaxed">
                  Apple Pay will retrieve shipping and cards specifications from your device. Press <strong>Complete Order</strong> to complete biometric lock verification.
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-600 text-xs space-y-1.5 font-mono">
                  <p className="font-bold text-neutral-900 uppercase text-[10px] tracking-wider mb-1">Wire Instructions</p>
                  <p>Bank: MINIMALIST ACCRUED UNION</p>
                  <p>Account: 8847-2917-0921-2</p>
                  <p>Routing ID: 121000248</p>
                  <p className="text-[10px] text-neutral-450 italic mt-2">Note: Shipment dispatches on wire matching checks (usually takes 1 business morning).</p>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="px-5 py-2.5 border border-neutral-200 text-xs text-neutral-700 tracking-wider font-semibold uppercase rounded-xl hover:bg-neutral-50 transition-colors"
                  id="btn-checkout-prev"
                >
                  Return to Details
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#1b3b2b] hover:bg-[#12281d] text-white text-xs tracking-widest font-semibold uppercase rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="btn-confirm-order"
                >
                  {loading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  )}
                  <span>{loading ? 'Confirming with Store...' : `Place Order of $${total}`}</span>
                </button>
              </div>

            </form>
          )}
        </div>

        {/* RIGHT COLUMN: Order Summary (Sticky) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#fafaf9] border border-neutral-100 p-6 rounded-2xl sticky top-24 space-y-4">
            <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-900 border-b border-neutral-200 pb-3">
              Items Under Boxing ({cartItems.length})
            </h3>

            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3.5 flex gap-3 first:pt-0 last:pb-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
                  />
                  <div className="overflow-hidden flex-1 text-xs">
                    <p className="font-semibold text-neutral-900 truncate">{item.product.name}</p>
                    <p className="text-neutral-400 mt-0.5">Quantity: {item.quantity}</p>
                    <p className="font-mono font-bold text-neutral-950 mt-1">${item.product.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Total Item Subtotal</span>
                <span className="font-mono">${subtotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping & Handlers</span>
                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost}`}</span>
              </div>
              <hr className="my-2 border-neutral-200" />
              <div className="flex justify-between font-bold text-sm text-neutral-950">
                <span>Bill Total</span>
                <span>${total}</span>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 text-center leading-relaxed">
              * Taxes and shipping guarantees fully audited at source.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
