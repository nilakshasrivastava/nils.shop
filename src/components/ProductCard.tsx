import React from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: any;
  product: Product;
  onSelect: (p: Product) => void;
  onToggleWishlist: (pId: string, e: React.MouseEvent<any>) => any;
  isWishlisted: boolean;
  onQuickAdd: (pId: string, e: React.MouseEvent<any>) => any;
  isAddingToCart?: boolean;
}

export default function ProductCard({
  product,
  onSelect,
  onToggleWishlist,
  isWishlisted,
  onQuickAdd,
  isAddingToCart = false,
}: ProductCardProps) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col bg-white border border-neutral-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
      id={`product-card-${product.id}`}
    >
      
      {/* Product Image and Overlay Controls */}
      <div className="relative aspect-square w-full bg-neutral-50 overflow-hidden border-b border-neutral-50">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center group-hover:scale-105 duration-500 transition-transform"
          loading="lazy"
        />

        {/* Dynamic Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.isBestseller && (
            <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-[#1b3b2b] text-white rounded-md">
              Bestseller
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-neutral-900 text-white rounded-md">
              New
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="px-2 py-0.5 text-[9px] font-semibold tracking-widest uppercase bg-amber-550 bg-amber-600 text-white rounded-md">
              Low Stock
            </span>
          )}
          {!product.availability && (
            <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-neutral-300 text-neutral-600 rounded-md">
              Out of stock
            </span>
          )}
        </div>

        {/* Wishlist Hearts button */}
        <button
          onClick={(e) => onToggleWishlist(product.id, e)}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full border shadow-sm transition-all z-10 cursor-pointer ${
            isWishlisted
              ? 'bg-[#1b3b2b] border-[#1b3b2b] text-white'
              : 'bg-white/80 hover:bg-white border-neutral-100 text-neutral-600 hover:text-emerald-900 hover:scale-110'
          }`}
          aria-label="Toggle wishlist"
          id={`btn-wishlist-${product.id}`}
        >
          <Heart className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Action button overlay */}
        {product.availability && (
          <div className="absolute bottom-3 left-0 right-0 px-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 hidden sm:block">
            <button
              onClick={(e) => onQuickAdd(product.id, e)}
              disabled={isAddingToCart}
              className="w-full py-2.5 bg-white/90 hover:bg-[#1b3b2b] hover:text-white text-neutral-900 border border-neutral-200 hover:border-emerald-800 text-xs font-semibold tracking-wider uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              id={`btn-quickadd-${product.id}`}
            >
              {isAddingToCart ? (
                <span className="w-3 h-3 border-2 border-neutral-900/20 border-t-neutral-900 rounded-full animate-spin" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )}
              <span>Quick Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase font-mono mb-1">
          {product.brand}
        </p>
        <h3 className="text-xs font-semibold tracking-tight text-neutral-900 line-clamp-1 group-hover:text-[#1b3b2b] transition-colors">
          {product.name}
        </h3>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex text-amber-400">
            <Star className="w-3 h-3 fill-currentColor" />
          </div>
          <span className="text-[10px] font-bold text-neutral-700">{product.rating}</span>
          <span className="text-[10px] text-neutral-400">&bull; {product.brand == 'NILS Studio' ? 'Seeded' : 'Verified'}</span>
        </div>

        {/* Product Price & Mobile Actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-50">
          <span className="text-sm font-bold text-neutral-950">${product.price}</span>
          
          {/* Mobile direct addToCart button always-visible */}
          {product.availability ? (
            <button
              onClick={(e) => onQuickAdd(product.id, e)}
              disabled={isAddingToCart}
              className="sm:hidden p-2 bg-neutral-950 text-white rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Add to cart"
              id={`btn-m-add-${product.id}`}
            >
              {isAddingToCart ? (
                <span className="w-3 h-3 block border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingBag className="w-4.5 h-4.5" />
              )}
            </button>
          ) : (
            <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest sm:hidden">
              Sold out
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
