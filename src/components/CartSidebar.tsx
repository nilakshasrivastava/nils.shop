import { X, Trash2, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { Product } from '../types';

interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemWithProduct[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onSaveForLater: (productId: string, cartItemId: string) => void;
  onCheckout: () => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  onCheckout,
}: CartSidebarProps) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isFreeShipping = subtotal >= 150;
  const shippingCost = subtotal === 0 ? 0 : (isFreeShipping ? 0 : 15);
  const total = subtotal + shippingCost;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-sidebar-drawer">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-100 flex flex-col shadow-2xl relative">
          
          {/* Header Panel */}
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-800" />
              <h2 className="text-base font-semibold text-neutral-950 uppercase tracking-wider font-sans">
                Your Shopping Bag
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-150 text-neutral-500 font-mono">
                {cartItems.length}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-950 rounded-full transition-colors"
              aria-label="Close cart side bar"
              id="btn-close-cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents Section */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 px-6 id-cart-items-container">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-center text-neutral-400 p-6">
                <ShoppingBag className="w-12 h-12 text-neutral-200 stroke-1 mb-4" />
                <p className="text-sm font-semibold text-neutral-500">Your bag is empty</p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">Explore our boutique and choose products to load catalog.</p>
                <button
                  onClick={onClose}
                  className="mt-5 px-6 py-2.5 border border-neutral-200 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer"
                  id="btn-cart-empty-shop"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-5 flex gap-4 pr-1 relative group" id={`cart-item-row-${item.id}`}>
                  <div className="w-20 h-20 bg-neutral-50 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-100">
                    <img src={item.product.image} alt={item.product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <p className="text-[9px] font-semibold text-neutral-400 font-mono uppercase tracking-wider">
                        {item.product.brand}
                      </p>
                      <h4 className="text-xs font-semibold text-neutral-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs font-bold text-neutral-950 mt-1">
                        ${item.product.price}
                      </p>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-neutral-200 rounded-lg text-xs bg-neutral-50 scale-95 origin-left">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-1 px-2.5 text-neutral-500 hover:text-neutral-900"
                          id={`btn-cart-minus-${item.id}`}
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-neutral-900 font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))}
                          className="p-1 px-2.5 text-neutral-500 hover:text-neutral-900"
                          id={`btn-cart-plus-${item.id}`}
                        >
                          +
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onSaveForLater(item.productId, item.id)}
                          className="text-[10px] text-neutral-450 text-neutral-400 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                          title="Save to Wishlist"
                          id={`btn-cart-save-${item.id}`}
                        >
                          <Heart className="w-3 h-3" />
                          <span>Save</span>
                        </button>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-neutral-400 hover:text-red-600 p-1"
                          aria-label="Remove item"
                          id={`btn-cart-trash-${item.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Totals Summary column */}
          {cartItems.length > 0 && (
            <div className="border-t border-neutral-100 px-6 py-6 bg-neutral-50 space-y-4">
              
              {/* Shipping Progress bar */}
              <div className="text-xs text-neutral-500" id="shipping-banner">
                {isFreeShipping ? (
                  <p className="text-emerald-800 font-medium flex items-center gap-1.5">
                    <span>Congratulations! You qualify for <strong>Free Shipping</strong>.</span>
                  </p>
                ) : (
                  <p>
                    Add <strong className="text-neutral-900">${150 - subtotal}</strong> more to qualify for <strong>Free Shipping</strong>.
                  </p>
                )}
                <div className="h-1.5 bg-neutral-200 mt-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1b3b2b] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / 150) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Tally summaries */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">${subtotal}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Standard Delivery</span>
                  <span className="font-mono font-medium">
                    {shippingCost === 0 ? 'Complimentary' : `$${shippingCost}`}
                  </span>
                </div>
                <hr className="my-2 border-neutral-200" />
                <div className="flex justify-between text-neutral-900 text-sm font-bold">
                  <span>Estimated Total</span>
                  <span className="font-sans">${total}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={onCheckout}
                className="w-full py-4 bg-[#1b3b2b] hover:bg-[#12281d] text-white font-semibold text-xs tracking-widest uppercase rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
                id="btn-cart-checkout"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-[10px] text-neutral-450 text-neutral-400 mt-2">
                Duties and taxes included. Orders dispatched within 24 hours.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
