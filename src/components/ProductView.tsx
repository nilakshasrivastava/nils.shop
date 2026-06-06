import React, { useState, useEffect } from 'react';
import { Star, Shield, ArrowLeft, Heart, ShoppingBag, Plus, Minus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { Product, Review, User } from '../types';
import { api } from '../lib/api';

interface ProductViewProps {
  product: Product;
  user: User | null;
  onGoBack: () => void;
  onSelectProduct: (p: Product) => void;
  onAddToCart: (pId: string, qty: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}

export default function ProductView({
  product,
  user,
  onGoBack,
  onSelectProduct,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}: ProductViewProps) {
  const [activeImage, setActiveImage] = useState(product.image);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [errorReview, setErrorReview] = useState<string | null>(null);

  // New review form states
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    setActiveImage(product.image);
    setQuantity(1);
    loadReviewsAndRelated();
  }, [product]);

  const loadReviewsAndRelated = async () => {
    setLoadingReviews(true);
    try {
      const [revs, rels] = await Promise.all([
        api.getProductReviews(product.id),
        api.getProducts({ categoryId: product.categoryId }),
      ]);
      setReviews(revs);
      setRelated(rels.filter((p) => p.id !== product.id).slice(0, 4));
    } catch (err) {
      console.error('Failed to load reviews or related products:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!commentInput.trim()) {
      setErrorReview('Please write a review comment.');
      return;
    }

    setSubmittingReview(true);
    setErrorReview(null);
    try {
      if (editingReviewId) {
        // Just recreate or update
        await api.createReview(product.id, ratingInput, commentInput);
      } else {
        await api.createReview(product.id, ratingInput, commentInput);
      }
      setCommentInput('');
      setRatingInput(5);
      setEditingReviewId(null);
      await loadReviewsAndRelated();
    } catch (err: any) {
      setErrorReview(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (rev: Review) => {
    setEditingReviewId(rev.id);
    setCommentInput(rev.comment);
    setRatingInput(rev.rating);
    // scroll to form
    document.getElementById('review-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you would like to delete your review?')) return;
    try {
      await api.deleteReview(id);
      await loadReviewsAndRelated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  // Compute rating aggregates
  const totalReviews = reviews.length;
  const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = totalReviews > 0 ? (ratingSum / totalReviews).toFixed(1) : parseFloat(product.rating.toString()).toFixed(1);

  // rating distribution
  const ratingsCount = [0, 0, 0, 0, 0]; // 5 to 1
  reviews.forEach((r) => {
    const idx = 5 - r.rating;
    if (idx >= 0 && idx < 5) {
      ratingsCount[idx]++;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id={`product-view-${product.id}`}>
      
      {/* Return Button */}
      <button
        onClick={onGoBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 hover:bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-800 tracking-wider uppercase rounded-xl transition-colors mb-8 cursor-pointer"
        id="btn-back-catalog"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
        
        {/* LEFT COLUMN: Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-100 shadow-xs group">
            <img
              src={activeImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center group-hover:scale-105 duration-500 transition-transform"
              id="main-product-image"
            />
          </div>

          {/* Sub images selector */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1" id="sub-images-row">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-square w-20 rounded-xl bg-neutral-50 border overflow-hidden flex-shrink-0 cursor-pointer ${
                    activeImage === img ? 'border-[#1b3b2b] ring-2 ring-emerald-800/10' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                  id={`btn-gallery-thumb-${idx}`}
                >
                  <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Options details */}
        <div className="flex flex-col space-y-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-neutral-400 font-mono uppercase mb-1">
              {product.brand}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 font-sans">
              {product.name}
            </h1>

            {/* Ratings Header summary */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-400">
                <Star className="w-4 h-4 fill-currentColor" />
              </div>
              <span className="text-sm font-bold text-neutral-800">{avgRating} Stars</span>
              <span className="text-sm text-neutral-400">&bull;</span>
              <span className="text-sm text-neutral-500 underline underline-offset-4">{totalReviews} customer reviews</span>
            </div>
          </div>

          {/* Product Price Tag */}
          <div className="py-2.5 border-y border-neutral-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Boutique Price</p>
              <p className="text-2xl font-extrabold text-neutral-950 font-sans">${product.price}</p>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Inventory Status</p>
              {product.availability ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>In Stock ({product.stock} left)</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-600">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Product Description text */}
          <p className="text-sm text-neutral-600 leading-relaxed">
            {product.description}
          </p>

          {/* Quantities selector and Cart Adders */}
          {product.availability ? (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-200 bg-neutral-50 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-3 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                    aria-label="Decrease quantity"
                    id="btn-qty-minus"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-neutral-900" id="text-qty-val">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-3 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                    aria-label="Increase quantity"
                    id="btn-qty-plus"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onAddToCart(product.id, quantity)}
                  className="flex-1 py-3 bg-[#1b3b2b] hover:bg-[#12281d] text-white font-semibold text-sm tracking-widest uppercase rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-add-to-cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Shopping Bag</span>
                </button>

                <button
                  onClick={onToggleWishlist}
                  className={`p-3 border rounded-xl shadow-xs transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'bg-[#1b3b2b] text-white border-[#1b3b2b]'
                      : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200 hover:text-emerald-900'
                  }`}
                  aria-label="Toggle wishlist"
                  id="btn-wishlist-toggle"
                >
                  <Heart className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled
              className="py-3 bg-neutral-200 text-neutral-400 font-semibold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
              id="btn-sold-out"
            >
              Out of stock
            </button>
          )}

          {/* Secure Guarantee column */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-500 mt-2">
            <Shield className="w-5 h-5 text-emerald-800 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>Shop with Confidence.</strong> Nils.Shop secures every transaction on an isolated cloud server. Lifetime guarantees are provided on raw materials sourcing.
            </p>
          </div>

          {/* Product Specifications sheet */}
          <div className="pt-6 border-t border-neutral-200">
            <h3 className="text-xs font-bold tracking-widest text-neutral-900 uppercase mb-3">
              Technical Specifications
            </h3>
            <div className="border border-neutral-100 rounded-xl overflow-hidden bg-white">
              <table className="min-w-full divide-y divide-neutral-100 text-xs">
                <tbody className="divide-y divide-neutral-100">
                  {product.specifications.map((spec, sIdx) => (
                    <tr key={sIdx} className="odd:bg-neutral-50/50">
                      <td className="px-4 py-2.5 font-semibold text-neutral-600 w-1/3">{spec.name}</td>
                      <td className="px-4 py-2.5 text-neutral-900 font-mono text-[11px]">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Aggregate review distribution breakdown */}
      <div className="mt-16 pt-10 border-t border-neutral-100 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Customer Reviews</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-extrabold text-neutral-900 font-sans">{avgRating}</span>
            <div>
              <div className="flex text-amber-400">
                <Star className="w-5 h-5 fill-currentColor" />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Based on {totalReviews} reviews</p>
            </div>
          </div>

          {/* Rating distribution bar graph */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars, idx) => {
              const count = ratingsCount[idx];
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-neutral-500 font-medium whitespace-nowrap">{stars} Stars</span>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-neutral-400 font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write a review module */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900">Verified Comments</h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 id-reviews-list">
            {loadingReviews ? (
              <p className="text-xs text-neutral-400">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No customer reviews yet. Be the first to express opinion!</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 border border-neutral-100 rounded-2xl bg-[#fafaf9]/30 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">{rev.userName}</p>
                      <div className="flex text-amber-400 my-1">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-currentColor" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                    {rev.comment}
                  </p>

                  {/* Edit/Delete triggers for own reviews */}
                  {user && (user.id === rev.userId || user.role === 'admin') && (
                    <div className="absolute top-4 right-4 hidden group-hover:flex items-center gap-2">
                      <button
                        onClick={() => handleEditReview(rev)}
                        className="p-1 text-neutral-400 hover:text-[#1b3b2b] rounded-full transition-colors cursor-pointer"
                        title="Edit review"
                        id={`btn-edit-rev-${rev.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
                        title="Delete review"
                        id={`btn-delete-rev-${rev.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Form write a review */}
          <div id="review-form-section" className="p-6 border border-neutral-150 rounded-2xl bg-[#f5f5f4]/30 mt-6">
            <h4 className="text-xs font-bold tracking-widest text-neutral-900 uppercase mb-4">
              {editingReviewId ? 'Modify Your Verified Opinion' : 'Author a Product Review'}
            </h4>
            
            {user ? (
              <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                {errorReview && (
                  <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-155 rounded-lg">
                    {errorReview}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Your Star Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        aria-label={`Rate ${star} Stars`}
                        id={`btn-form-star-${star}`}
                      >
                        <Star className={`w-6 h-6 ${ratingInput >= star ? 'fill-currentColor' : 'text-neutral-350'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Your Comment</label>
                  <textarea
                    rows={3}
                    required
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Provide details about texture, durability, sound qualities, and shipping speeds..."
                    className="w-full text-xs p-3 border border-neutral-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-800 focus:border-[#1b3b2b] focus:outline-hidden"
                    id="input-review-comment"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-[#1b3b2b] hover:bg-[#12281d] text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    id="btn-submit-review"
                  >
                    {submittingReview ? <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" /> : null}
                    <span>{editingReviewId ? 'Save Changes' : 'Submit My Review'}</span>
                  </button>

                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setCommentInput('');
                        setRatingInput(5);
                      }}
                      className="px-4 py-2 border border-neutral-200 text-neutral-600 text-xs rounded-lg transition-colors bg-white hover:bg-neutral-55 cursor-pointer"
                      id="btn-cancel-edit-rev"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Please register or sign in to authorize a verified customer review.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* BOTTOM COLUMN: Related recommendations */}
      {related.length > 0 && (
        <div className="mt-20 pt-10 border-t border-neutral-100">
          <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase mb-6">
            Complementary Curations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectProduct(item)}
                className="group cursor-pointer space-y-2 bg-white border border-neutral-100 p-3 rounded-2xl hover:shadow-md transition-shadow"
                id={`related-card-${item.id}`}
              >
                <div className="aspect-square bg-neutral-50 overflow-hidden rounded-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-mono tracking-wider uppercase text-neutral-400">{item.brand}</p>
                  <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-800 transition-colors line-clamp-1">{item.name}</h4>
                  <p className="text-xs font-bold text-neutral-950 mt-1">${item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
