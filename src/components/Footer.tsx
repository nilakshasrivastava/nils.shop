import { Mail, MapPin, ShieldCheck, RefreshCw, Truck } from 'lucide-react';

interface FooterProps {
  onGoHome: () => void;
  onSelectCategory: (id: string) => void;
}

export default function Footer({ onGoHome, onSelectCategory }: FooterProps) {
  return (
    <footer className="bg-white border-t border-neutral-100 text-neutral-600 font-sans mt-auto" id="main-footer">
      
      {/* Guarantees Pitch Banner */}
      <div className="border-b border-neutral-50 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="p-3 bg-white rounded-full border border-neutral-100 text-emerald-800">
                <Truck className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">Thoughtful Shipping</h4>
                <p className="mt-1 text-xs text-neutral-500">Free carbon-neutral delivery on all orders over $150.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="p-3 bg-white rounded-full border border-neutral-100 text-emerald-800">
                <RefreshCw className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">30-Day Returns</h4>
                <p className="mt-1 text-xs text-neutral-500">Unused product return policy with free prepaid shipping labels.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="p-3 bg-white rounded-full border border-neutral-100 text-emerald-800">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">Lifetime Guarantee</h4>
                <p className="mt-1 text-xs text-neutral-500">Crafted from grade-A materials engineered to endure daily life.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Link Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Bio Column */}
          <div className="space-y-4">
            <button
              onClick={onGoHome}
              className="text-lg font-bold tracking-[0.2em] text-neutral-950 uppercase font-sans cursor-pointer focus:outline-hidden"
            >
              NILS<span className="text-[#1b3b2b]">.</span>SHOP
            </button>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
              Curating exceptional products with durable craftsmanship, functional architecture, and timeless aesthetic restraint.
            </p>
            <div className="pt-2 text-xs text-neutral-400 space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>742 Minimalist Way, San Francisco, CA</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span>curator@nils.shop</span>
              </p>
            </div>
          </div>

          {/* Catalog Columns */}
          <div>
            <h5 className="text-xs font-semibold tracking-widest uppercase text-neutral-900 mb-4">Boutique Directory</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onSelectCategory('cat_electronics')} className="hover:text-emerald-800 transition-colors">
                  Acoustics & Technology
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('cat_fashion')} className="hover:text-emerald-800 transition-colors">
                  Tailored Merino & Goods
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('cat_home')} className="hover:text-emerald-800 transition-colors">
                  Ceramic & Homeware
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('cat_accessories')} className="hover:text-emerald-800 transition-colors">
                  Cast Accessories
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div>
            <h5 className="text-xs font-semibold tracking-widest uppercase text-neutral-900 mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-xs text-neutral-500">
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Track Your Package
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Request Prepaid Returns
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Workspace Gift Cards
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Sustainability Monograph
                </span>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h5 className="text-xs font-semibold tracking-widest uppercase text-neutral-900 mb-4">Corporate Office</h5>
            <ul className="space-y-2.5 text-xs text-neutral-500">
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Supply Chain Monograph
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 transition-colors block cursor-pointer">
                  Press & Media Enquiries
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <hr className="my-10 border-neutral-100" />

        {/* Brand Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>&copy; {new Date().getFullYear()} NILS.SHOP. Coated with premium durable protection. All Rights Reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-neutral-600 transition-colors cursor-pointer">Secure checkout via Apple Pay & Striped systems</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
