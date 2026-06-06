import fs from 'fs';
import path from 'path';
import { User, Category, Product, Review, Order, Address, CartItem, WishlistItem } from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  users: User[];
  userCredentials: { [email: string]: string }; // email -> password mapping
  categories: Category[];
  products: Product[];
  reviews: Review[];
  orders: Order[];
  addresses: Address[];
  cartItems: CartItem[];
  wishlists: WishlistItem[];
}

// Low-resolution elegant placeholders that look like real premium studio shots
const CATEGORIES: Category[] = [
  {
    id: 'cat_electronics',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cat_fashion',
    name: 'Fashion & Apparel',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cat_home',
    name: 'Home & Living',
    slug: 'home',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cat_books',
    name: 'Curated Books',
    slug: 'books',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cat_fitness',
    name: 'Wellness & Fitness',
    slug: 'fitness',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'cat_accessories',
    name: 'Everyday Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1623859684198-58879cc559ec?auto=format&fit=crop&q=80&w=600',
  }
];

const PRODUCTS: Product[] = [
  // ELECTRONICS
  {
    id: 'prod_h1_studio',
    name: 'H1 Over-Ear Studio Headphones',
    description: 'Designed for purity of sound. Experience clean balance, high-fidelity acoustics, and structural carbon-fiber arms lined with ultra-breathable merino knit pads. Active noise cancellation tuned specifically for focus states.',
    price: 349,
    categoryId: 'cat_electronics',
    brand: 'NILS Audio',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Driver Size', value: '40mm custom beryllium dynamic drivers' },
      { name: 'Battery Life', value: 'Up to 38 hours with ANC active' },
      { name: 'Connectivity', value: 'Bluetooth 5.2 / High-Res Wired Jack' },
      { name: 'Materials', value: 'Anodized aluminum, carbon-fiber, merino knit wool' }
    ],
    availability: true,
    stock: 24,
    isBestseller: true,
    isNewArrival: false,
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'prod_k2_keyboard',
    name: 'K2 Minimal Linear Mechanical Keyboard',
    description: 'A structural, low-profile keyboard engineered for tactile speed and quiet operation. Complete with bespoke dye-sublimated PBT keycaps with ultra-crisp legends, housed in a solid CNC-milled aluminum chassis.',
    price: 189,
    categoryId: 'cat_electronics',
    brand: 'Keycraft',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Layout', value: '75% Minimal compact' },
      { name: 'Switches', value: 'NILS Custom Silent Linear (45g operating force)' },
      { name: 'Keycaps', value: 'Cherry profile, 1.5mm thick dye-sub PBT' },
      { name: 'Backlight', value: 'Warm white ambient (adjustable, 4 levels)' }
    ],
    availability: true,
    stock: 12,
    isBestseller: true,
    isNewArrival: true,
    createdAt: '2026-04-10T10:30:00Z'
  },
  {
    id: 'prod_stand_s1',
    name: 'S1 Brushed Aluminum Laptop Stand',
    description: 'Elevate your workspace. Milled from a single sheet of heavy aircraft-grade aluminum, the S1 provides ergonomic viewing height and maximum natural cooling airflow. Finished with protective charcoal silicone pads.',
    price: 79,
    categoryId: 'cat_electronics',
    brand: 'NILS Lab',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Material', value: '6061-T6 Aircraft grade aluminum' },
      { name: 'Weight Capacity', value: 'Up to 15 lbs' },
      { name: 'Finish', value: 'Fine-bead blasted, anodized silver' }
    ],
    availability: true,
    stock: 45,
    isBestseller: false,
    isNewArrival: false,
    createdAt: '2026-02-01T12:00:00Z'
  },
  {
    id: 'prod_mouse_m3',
    name: 'M3 Precision Wireless Studio Mouse',
    description: 'An ergonomic masterpiece sculpted for absolute accuracy. Features an ultra-precise 26,000 DPI optical sensor, silent tactile switches, and a high-quality machined aluminum scroll wheel. Blends seamlessly into minimalist studio setups.',
    price: 129,
    categoryId: 'cat_electronics',
    brand: 'NILS Lab',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Sensor DPI', value: 'Up to 26,000 Pixels/Inch' },
      { name: 'Battery Specs', value: 'USB-C Rechargeable, up to 120 hrs' },
      { name: 'Weight', value: '63 grams ultra-lightweight' },
      { name: 'Interface', value: '2.4G Premium Wireless / Bluetooth 5.1' }
    ],
    availability: true,
    stock: 30,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-18T10:45:00Z'
  },
  {
    id: 'prod_desk_light_p1',
    name: 'P1 Ambient Dual-光源 Desk Monitor Lightbar',
    description: 'Designed to reduce eye strain and elevate your focus. Anchors securely to your monitor or mounts on a beautiful heavy cast-brass base. Fully adjustable color temperature (2700K - 6500K) with linear step-less dimming controls.',
    price: 149,
    categoryId: 'cat_electronics',
    brand: 'NILS Lab',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Color Temp Range', value: '2700K (Warm Sunset) to 6500K (Daylight)' },
      { name: 'Power Connection', value: 'USB Type-C (5V, 2A)' },
      { name: 'Illuminance', value: 'Up to 1100 Lux at 35cm' }
    ],
    availability: true,
    stock: 18,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-20T11:30:00Z'
  },

  // FASHION
  {
    id: 'prod_merino_knit',
    name: 'Fine Merino Wool Crewneck Sweater',
    description: 'A versatile layer tailored in Biella merino wool. Fully fashioned engineered knit with subtle ribbed details along the cuff and hem. Designed with a clean, semi-structured drape for simple elegance.',
    price: 145,
    categoryId: 'cat_fashion',
    brand: 'NILS Studio',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Material', value: '100% Extra-fine Italian Merino Wool (19.5 micron)' },
      { name: 'Fit', value: 'Standard relaxed drape' },
      { name: 'Care', value: 'Hand wash cold, dry flat or professional clean' }
    ],
    availability: true,
    stock: 32,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-02T14:15:00Z'
  },
  {
    id: 'prod_leather_wal',
    name: 'English Tan Leather Bifold Cardholder',
    description: 'Cut from premium full-grain Wickett & Craig bridle leather. Hand-stitched with waxed linen thread and finished with hand-burnished edges. Accommodates up to 8 cards and folded currency with virtually no bulk.',
    price: 85,
    categoryId: 'cat_fashion',
    brand: 'Atelier Nils',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1627124316089-68b3be5d115e?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1627124316089-68b3be5d115e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1624443180590-db01121df75e?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Leather Type', value: 'Wickett & Craig English Bridle Leather' },
      { name: 'Threading', value: '0.6mm Waxed Fil Au Chinois Linen Thread' },
      { name: 'Dimensions', value: '4.0 in x 2.8 in x 0.25 in' }
    ],
    availability: true,
    stock: 18,
    isBestseller: true,
    isNewArrival: false,
    createdAt: '2026-03-20T09:00:00Z'
  },
  {
    id: 'prod_nylon_pack',
    name: 'Water-Resistant Technical Daily Backpack',
    description: 'A architectural silhouette optimal for rain or shine. Constructed in 1260D ballistic nylon with smooth polyurethane coat accents. Features dedicated suspension laptop compartments, hidden side bottle pockets, and premium YKK AquaGuard watertight zippers.',
    price: 180,
    categoryId: 'cat_fashion',
    brand: 'NILS Studio',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Capacity', value: '20 Liters' },
      { name: 'Material', value: '1260D Ripstop Ballistic Nylon' },
      { name: 'Weight', value: '1.9 lbs' },
      { name: 'Laptop Slot', value: 'Holds up to standard 16" laptop' }
    ],
    availability: true,
    stock: 15,
    isBestseller: true,
    isNewArrival: false,
    createdAt: '2026-02-18T10:45:00Z'
  },
  {
    id: 'prod_cotton_hoodie_a1',
    name: 'A1 Organic Heavyweight Cotton Hoodie',
    description: 'An elevated classic spun from heavy 450gsm organic French terry cotton. Features a double-lined structured hood without drawstrings, dropped shoulders, and subtle blind-stitched seams. Crafted to maintain its structural form for years.',
    price: 110,
    categoryId: 'cat_fashion',
    brand: 'NILS Studio',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Material Spec', value: '100% GOTS Certified Organic Cotton (450gsm)' },
      { name: 'Weave Type', value: 'Loopback French Terry' },
      { name: 'Dye Standard', value: 'Hypoallergenic Eco-Reactive Pigments' }
    ],
    availability: true,
    stock: 25,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-22T08:00:00Z'
  },
  {
    id: 'prod_leather_sneakers',
    name: 'Atelier Premium Leather Sneakers',
    description: 'A clean, low-top silhouette handcrafted in Marche, Italy. Cut from buttery-smooth full-grain calfskin leather, lined with breathable calfskin, and stitched onto durable Italian Margom rubber soles. The definitive everyday luxury sneaker.',
    price: 260,
    categoryId: 'cat_fashion',
    brand: 'Atelier Nils',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Origin Country', value: '100% Handcrafted in Marche, Italy' },
      { name: 'Upper Material', value: 'Full-Grain Grade-A Italian Calfskin Leather' },
      { name: 'Outsole', value: 'Custom Margom Vulcanized Natural Rubber' }
    ],
    availability: true,
    stock: 14,
    isBestseller: true,
    isNewArrival: true,
    createdAt: '2026-05-24T14:30:00Z'
  },

  // HOME & LIVING
  {
    id: 'prod_pour_over',
    name: 'Ceramic Arch Coffee Pour-Over Kit',
    description: 'Elevate your morning. High-fire artisanal porcelain dripper accompanied by a hand-blown heat-resistant borosilicate glass carafe. Double-walled construction ensures optimal brewing temperature control.',
    price: 65,
    categoryId: 'cat_home',
    brand: 'Hearth Studio',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1520974948035-acdf10a402d3?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Capacity', value: '600ml (2-4 cups)' },
      { name: 'Filter Type', value: 'Compatible with Hario V60-02 filters' },
      { name: 'Material', value: 'High-fire ceramic, borosilicate glass, olive wood cuff' }
    ],
    availability: true,
    stock: 28,
    isBestseller: true,
    isNewArrival: false,
    createdAt: '2026-02-28T16:00:00Z'
  },
  {
    id: 'prod_scent_candle',
    name: 'Sandalwood & Hinoki Soy Wax Candle',
    description: 'Inspired by Japanese wood bathhouses. Made of natural clean-burning American grown soy wax blended with pure cedar, sandalwood, and sweet citrus essential oils, housed in a beautiful matte-black stoneware cup designed for reuse.',
    price: 38,
    categoryId: 'cat_home',
    brand: 'Hearth Studio',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1603006905393-0d12e9603043?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1603006905393-0d12e9603043?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Burn Time', value: 'Approx. 55 hours' },
      { name: 'Wax Spec', value: '100% Non-GMO Soy wax with FSC cotton wick' },
      { name: 'Net Weight', value: '8.5 oz / 240g' }
    ],
    availability: true,
    stock: 50,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-15T11:00:00Z'
  },
  {
    id: 'prod_travertine_coasters',
    name: 'Minimalist Travertine Stone Coasters (Set of 4)',
    description: 'Cut from heavy, unfilled raw Italian travertine stone. Each coaster showcases the unique, organic geological cavities formed over millennia. Backed with premium cork layers to protect delicate tabletop surfaces.',
    price: 49,
    categoryId: 'cat_home',
    brand: 'Hearth Studio',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Material', value: 'Unfilled Raw Italian Travertine' },
      { name: 'Backing', value: 'High-density natural cork' },
      { name: 'Set Count', value: '4 unique rustic square pieces' },
      { name: 'Dimensions', value: '4.0 x 4.0 in square shape' }
    ],
    availability: true,
    stock: 40,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-10T12:00:00Z'
  },
  {
    id: 'prod_ceramic_tea_set',
    name: 'Faceted Ceramic Tea Set with Walnut Accent',
    description: 'A modern homage to traditional gongfu tea ceremonies. Features a matte-black faceted teapot with a solid walnut handle and four matching double-walled cups, hand-glazed with a satin-metallic interior.',
    price: 120,
    categoryId: 'cat_home',
    brand: 'Hearth Studio',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Included Items', value: '1 Faceted Teapot, 4 Double-Wall Cups' },
      { name: 'Teapot Volume', value: '450ml with integrated steel mesh filter' },
      { name: 'Material', value: 'Satin-glazed high-fire clay earthenware, solid walnut' }
    ],
    availability: true,
    stock: 15,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-15T09:00:00Z'
  },
  {
    id: 'prod_linen_duvet_set',
    name: 'Pure Belgian Linen Duvet Cover Set',
    description: 'Woven from flax grown with sustainable practices in Belgium. Breathable, hypoallergenic, and softened with dynamic enzyme washes for incredible comfort that improves with age. Includes one duvet cover and two standard envelope closure pillowcases.',
    price: 220,
    categoryId: 'cat_home',
    brand: 'Hearth Studio',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Material', value: '100% Belgian Flax Linen' },
      { name: 'Set Details', value: '1 Duvet Cover + 2 Pillow Shams (Standard Queen)' },
      { name: 'Weight Class', value: '175 gsm lightweight and highly breathable' }
    ],
    availability: true,
    stock: 12,
    isBestseller: true,
    isNewArrival: false,
    createdAt: '2026-04-12T14:15:00Z'
  },

  // CURATED BOOKS
  {
    id: 'prod_book_simplicity',
    name: 'Form & Space: Monograph on Nordic Architecture',
    description: 'A visual archive detailing simplicity in contemporary residential architecture throughout Sweden, Norway, and Denmark. Premium linen hardcover wrapping 240 pages of exquisite film photography and detail sketches.',
    price: 55,
    categoryId: 'cat_books',
    brand: 'Minimalist Press',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Format', value: 'Hardcover, linen upholstery' },
      { name: 'Pages', value: '240 pages offset-printed' },
      { name: 'Dimensions', value: '9.5 x 11.8 in' }
    ],
    availability: true,
    stock: 14,
    isBestseller: true,
    isNewArrival: false,
    createdAt: '2025-11-12T09:00:00Z'
  },
  {
    id: 'prod_book_japanese_simplicity',
    name: 'The Art of Simplicity: Interior Spaces of Japan',
    description: 'An exquisite visual journey through traditional and contemporary Japanese interiors. Highlights the philosophies of Ma (negative space), Wabi-Sabi, and detailed joinery craftsmanship. 280 heavy-grade matte pages with clothbound spine.',
    price: 60,
    categoryId: 'cat_books',
    brand: 'Minimalist Press',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Format', value: 'Premium stitch clothbound spine hardcover' },
      { name: 'Page Count', value: '280 pages on acid-free sustainable paper' },
      { name: 'Dimensions', value: '8.8 x 11.0 in portrait' }
    ],
    availability: true,
    stock: 20,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 'prod_book_mcm_masterpieces',
    name: 'Bespoke Design: Mid-Century Modern Masterpieces',
    description: 'A comprehensive tribute to the designers who reshaped the twentieth century. From Eames to Wegner, discover the history, technical drawings, and cultural impact of the most iconic furniture designs ever produced.',
    price: 75,
    categoryId: 'cat_books',
    brand: 'Minimalist Press',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Format', value: 'Heavyweight matte paper, slipcased collector edition' },
      { name: 'Pages', value: '320 pages detailing full architectural diagrams' },
      { name: 'Dimensions', value: '10.2 x 13.0 in oversized collector size' }
    ],
    availability: true,
    stock: 10,
    isBestseller: true,
    isNewArrival: true,
    createdAt: '2026-05-18T15:00:00Z'
  },

  // WELLNESS & FITNESS
  {
    id: 'prod_yoga_block',
    name: 'Sustainable Organic Cork Yoga Block Set',
    description: 'Provide firm structured alignment support during restorative and heat flows. Constructed from 100% natural organic Mediterranean oak cork, featuring smooth rounded radius edges for optimized grip comforts.',
    price: 45,
    categoryId: 'cat_fitness',
    brand: 'Form & Flow',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Quantity', value: 'Pair (2 blocks included)' },
      { name: 'Weight', value: '1.2 lbs per block' },
      { name: 'Material', value: '100% natural, harvest-renewed oak cork' }
    ],
    availability: true,
    stock: 22,
    isBestseller: false,
    isNewArrival: false,
    createdAt: '2026-03-05T07:30:00Z'
  },
  {
    id: 'prod_steel_bottle',
    name: 'Insulated Brushed Steel Flask (700ml)',
    description: 'Double-walled vacuum thermal protection in cold raw steel finish. Engineered to keep cold liquids carbonated and crisp for 24 hours, or coffee piping hot for up to 12. Complete with leakproof solid stainless steel cap thread.',
    price: 40,
    categoryId: 'cat_fitness',
    brand: 'NILS Lab',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Capacity', value: '700ml / 24 oz' },
      { name: 'Thermal Specs', value: 'Cold 24 hrs, Hot 12 hrs' },
      { name: 'Material', value: 'Pro-grade 18/8 food stainless steel, BPA free' }
    ],
    availability: true,
    stock: 35,
    isBestseller: true,
    isNewArrival: true,
    createdAt: '2026-04-20T17:00:00Z'
  },
  {
    id: 'prod_jump_rope_t1',
    name: 'T1 Ergonomic Grip Jump Rope Set',
    description: 'Engineered for pure speed and coordination. Features heavy, knurled anodized aluminum handles with precision ball bearings for effortless rotation. Includes both a lightweight speed cable and a heavier leather conditioning rope.',
    price: 55,
    categoryId: 'cat_fitness',
    brand: 'Form & Flow',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Handle Weight', value: '120g solid aircraft-grade knurled aluminum' },
      { name: 'Bearings Used', value: 'High-speed industrial carbon steel bearings' },
      { name: 'Adjustable Range', value: 'Rope customizable for bounds up to 10ft tall' }
    ],
    availability: true,
    stock: 18,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-12T14:30:00Z'
  },
  {
    id: 'prod_oil_diffuser',
    name: 'Aromatherapy Ceramic Oil Diffuser',
    description: 'Constructed from real hand-finished white porcelain to blend elegantly with home environments. Employs cool, high-frequency ultrasonic waves to diffuse essential oil micro-particles without standard heating, and includes an ambient glow light.',
    price: 85,
    categoryId: 'cat_fitness',
    brand: 'Form & Flow',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Outer Covering', value: 'High-density matte textured structural porcelain' },
      { name: 'Water Basin Capacity', value: '120ml (Spans up to 7-8 hours continuous)' },
      { name: 'Tech', value: 'Ultrasonic 2.4MHz micro-mist vibration plate' }
    ],
    availability: true,
    stock: 25,
    isBestseller: true,
    isNewArrival: true,
    createdAt: '2026-05-18T09:00:00Z'
  },

  // EVERYDAY ACCESSORIES
  {
    id: 'prod_acetate_glasses',
    name: 'Handcrafted Bio-Acetate Sunglasses',
    description: 'An elegant, D-frame silhouette sculpted in premium lightweight organic bio-acetate. Outfitted with high-contrast amber polarized CR-39 lenses offering full UV400 shield from daily solar rays.',
    price: 165,
    categoryId: 'cat_accessories',
    brand: 'Atelier Nils',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Frame Material', value: 'Mazzucchelli Italian Bio-Acetate' },
      { name: 'Lens Tech', value: 'Polarized CR-39 amber tint, Anti-reflective base' },
      { name: 'Fit Ratio', value: '48-22-145 (Medium fit)' }
    ],
    availability: true,
    stock: 10,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-10T15:30:00Z'
  },
  {
    id: 'prod_brass_holder',
    name: 'Cast Solid Brass Tension Custom Keyholder',
    description: 'Crafted systematically using premium cast solid brass that slowly develops a remarkable golden brown patina over standard everyday carry. Incorporates a high-tension spring gate mechanism to clip securely on belt loops.',
    price: 48,
    categoryId: 'cat_accessories',
    brand: 'Atelier Nils',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1623859684198-58879cc559ec?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1623859684198-58879cc559ec?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Material', value: '100% Sand-cast structural C360 Brass' },
      { name: 'Capacity', value: 'Collects up to 6 standard keys' },
      { name: 'Dimensions', value: '2.9 x 1.1 x 0.15 in' }
    ],
    availability: true,
    stock: 50,
    isBestseller: false,
    isNewArrival: false,
    createdAt: '2026-01-28T09:20:00Z'
  },
  {
    id: 'prod_brass_pen_s1',
    name: 'S1 Solid Raw Brass Desktop Pen',
    description: 'Systematically lathed from a raw solid brass hex bar, this heavy desktop pen offers perfect writing balance. Features a smooth twisting deployment mechanism and accepts standard premium Schmidt refills. Develops brilliant custom patina over time.',
    price: 95,
    categoryId: 'cat_accessories',
    brand: 'Atelier Nils',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Material Type', value: '100% C360 Lead-Free Solid Raw Brass' },
      { name: 'Deployment Mechanism', value: 'Precision inner double-helical twist track' },
      { name: 'Refills Supported', value: 'Schmidt EasyFlow 9000 / Parker G2 standards' }
    ],
    availability: true,
    stock: 35,
    isBestseller: false,
    isNewArrival: true,
    createdAt: '2026-05-14T10:30:00Z'
  },
  {
    id: 'prod_leather_journal',
    name: 'Atelier Hand-Bound Leather Journal',
    description: 'Crafted in Florence with premium vegetable-tanned Italian leather. Houses 160 pages of heavy fountain-pen-friendly deckled edge paper. Features leather cord wrap closure for timeless preservation.',
    price: 65,
    categoryId: 'cat_accessories',
    brand: 'Atelier Nils',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: [
      { name: 'Leather Specification', value: 'Genuine Tuscany Vegetable-Tanned Cowhide' },
      { name: 'Page Weight & Count', value: '160 pages of 120gsm heavy cotton deckled paper' },
      { name: 'Stitch Technique', value: 'Traditional hand-sewn long stitch binding' }
    ],
    availability: true,
    stock: 20,
    isBestseller: true,
    isNewArrival: true,
    createdAt: '2026-05-16T12:00:00Z'
  }
];

const SEEDED_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    userId: 'user_customer_1',
    productId: 'prod_h1_studio',
    rating: 5,
    comment: 'An absolute masterpiece of design and audio engineering. The wool ear cushions are incredibly comfortable for 8+ hour programming sessions and block out everything. Outstanding sound signature.',
    userName: 'Julius Vance',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z'
  },
  {
    id: 'rev_2',
    userId: 'user_customer_2',
    productId: 'prod_h1_studio',
    rating: 4,
    comment: 'The acoustic tuning is superb, and the build quality feels worthy of every dollar. Knocking off one star because they feel a slight bit heavy after an entire morning of wear, but the materials are outstanding.',
    userName: 'Elena Ristova',
    createdAt: '2026-04-12T15:30:00Z',
    updatedAt: '2026-04-12T15:30:00Z'
  },
  {
    id: 'rev_3',
    userId: 'user_customer_3',
    productId: 'prod_k2_keyboard',
    rating: 5,
    comment: 'I am in love with this keyboard. The keycaps have such a solid textured feel, and the silent linear switches feel soft and sound deep without any clicky noise. Seamlessly connects to my laptop.',
    userName: 'Siddharth Sen',
    createdAt: '2026-05-18T09:00:00Z',
    updatedAt: '2026-05-18T09:00:00Z'
  },
  {
    id: 'rev_4',
    userId: 'user_customer_1',
    productId: 'prod_leather_wal',
    rating: 5,
    comment: 'Beautiful stitching and leather smells genuine. I have been carrying this bifold for two months now, and the patina starting to develop on the English Tan is stunning.',
    userName: 'Julius Vance',
    createdAt: '2026-04-05T11:20:00Z',
    updatedAt: '2026-04-05T11:20:00Z'
  },
  {
    id: 'rev_5',
    userId: 'user_customer_2',
    productId: 'prod_pour_over',
    rating: 5,
    comment: 'Elegant enough to display on my open kitchen shelf. The thick double-walled carafe prevents the coffee from cooling down too fast, enabling highly consistent morning routines.',
    userName: 'Elena Ristova',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z'
  }
];

class Database {
  private schema: Schema;

  constructor() {
    this.schema = {
      users: [],
      userCredentials: {},
      categories: [],
      products: [],
      reviews: [],
      orders: [],
      addresses: [],
      cartItems: [],
      wishlists: []
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        this.schema = JSON.parse(data);
      } else {
        // Seed database
        this.schema.categories = CATEGORIES;
        this.schema.products = PRODUCTS;
        this.schema.reviews = SEEDED_REVIEWS;
        
        // Add default users
        // Admin user
        const adminId = 'user_admin_0';
        this.schema.users.push({
          id: adminId,
          email: 'admin@nils.shop',
          name: 'NILS Administrator',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        this.schema.userCredentials['admin@nils.shop'] = 'admin123'; // plaintext simple validation for easy evaluation.

        // Customer user 1
        this.schema.users.push({
          id: 'user_customer_1',
          email: 'customer@nils.shop',
          name: 'Julius Vance',
          role: 'customer',
          createdAt: new Date().toISOString()
        });
        this.schema.userCredentials['customer@nils.shop'] = 'customer123';

        // Customer user 2
        this.schema.users.push({
          id: 'user_customer_2',
          email: 'elena@nils.shop',
          name: 'Elena Ristova',
          role: 'customer',
          createdAt: new Date().toISOString()
        });
        this.schema.userCredentials['elena@nils.shop'] = 'customer123';

        this.save();
      }
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to database on disk:', err);
    }
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.schema.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.schema.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.schema.users.find(u => u.id === id);
  }

  public createUser(email: string, passwordHash: string, name: string, role: 'admin' | 'customer' = 'customer'): User {
    const id = `user_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      email: email.toLowerCase(),
      name,
      role,
      createdAt: new Date().toISOString()
    };
    
    this.schema.users.push(user);
    this.schema.userCredentials[email.toLowerCase()] = passwordHash;
    this.save();
    return user;
  }

  public updateUserProfile(userId: string, name: string, email: string): User {
    const idx = this.schema.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    
    const oldEmail = this.schema.users[idx].email;
    const newEmail = email.toLowerCase();
    
    this.schema.users[idx].name = name;
    this.schema.users[idx].email = newEmail;
    
    if (oldEmail !== newEmail) {
      const password = this.schema.userCredentials[oldEmail];
      delete this.schema.userCredentials[oldEmail];
      this.schema.userCredentials[newEmail] = password;
    }
    
    this.save();
    return this.schema.users[idx];
  }

  public updateUserPassword(email: string, passwordHash: string): void {
    this.schema.userCredentials[email.toLowerCase()] = passwordHash;
    this.save();
  }

  public validateCredentials(email: string, passwordHash: string): boolean {
    return this.schema.userCredentials[email.toLowerCase()] === passwordHash;
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return this.schema.categories;
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.schema.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.schema.products.find(p => p.id === id);
  }

  public createProduct(productData: Omit<Product, 'id' | 'rating' | 'createdAt'>): Product {
    const id = `prod_${Math.random().toString(36).substr(2, 9)}`;
    const product: Product = {
      ...productData,
      id,
      rating: 5.0, // default rating
      createdAt: new Date().toISOString()
    };
    this.schema.products.push(product);
    this.save();
    return product;
  }

  public updateProduct(id: string, productData: Partial<Product>): Product {
    const idx = this.schema.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    
    this.schema.products[idx] = {
      ...this.schema.products[idx],
      ...productData
    };
    this.save();
    return this.schema.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.schema.products.length;
    this.schema.products = this.schema.products.filter(p => p.id !== id);
    const affected = this.schema.products.length < initialLen;
    if (affected) {
      // Cascade deletions for reviews and wishlists
      this.schema.reviews = this.schema.reviews.filter(r => r.productId !== id);
      this.schema.wishlists = this.schema.wishlists.filter(w => w.productId !== id);
      this.schema.cartItems = this.schema.cartItems.filter(c => c.productId !== id);
      this.save();
    }
    return affected;
  }

  // Recalculates product rating based on current reviews
  public recalculateProductRating(productId: string): void {
    const prodReviews = this.schema.reviews.filter(r => r.productId === productId);
    if (prodReviews.length === 0) {
      const prod = this.getProductById(productId);
      if (prod) {
        prod.rating = 5.0;
        this.save();
      }
      return;
    }
    
    const sum = prodReviews.reduce((acc, rev) => acc + rev.rating, 0);
    const avg = Number((sum / prodReviews.length).toFixed(1));
    
    const prod = this.getProductById(productId);
    if (prod) {
      prod.rating = avg;
      this.save();
    }
  }

  // --- REVIEWS ---
  public getReviewsByProductId(productId: string): Review[] {
    return this.schema.reviews.filter(r => r.productId === productId);
  }

  public getReviewById(id: string): Review | undefined {
    return this.schema.reviews.find(r => r.id === id);
  }

  public getAllReviews(): Review[] {
    return this.schema.reviews;
  }

  public createReview(userId: string, userName: string, productId: string, rating: number, comment: string): Review {
    // Check if user already reviewed
    const existingIdx = this.schema.reviews.findIndex(r => r.userId === userId && r.productId === productId);
    const dateStr = new Date().toISOString();
    
    if (existingIdx !== -1) {
      // Update existing review
      this.schema.reviews[existingIdx] = {
        ...this.schema.reviews[existingIdx],
        rating,
        comment,
        updatedAt: dateStr
      };
      this.recalculateProductRating(productId);
      this.save();
      return this.schema.reviews[existingIdx];
    }

    const id = `rev_${Math.random().toString(36).substr(2, 9)}`;
    const review: Review = {
      id,
      userId,
      productId,
      rating,
      comment,
      userName,
      createdAt: dateStr,
      updatedAt: dateStr
    };
    this.schema.reviews.unshift(review);
    this.save();
    this.recalculateProductRating(productId);
    return review;
  }

  public updateReview(id: string, userId: string, rating: number, comment: string): Review {
    const idx = this.schema.reviews.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Review not found');
    if (this.schema.reviews[idx].userId !== userId) throw new Error('Not authorized to edit this review');

    this.schema.reviews[idx] = {
      ...this.schema.reviews[idx],
      rating,
      comment,
      updatedAt: new Date().toISOString()
    };
    this.save();
    this.recalculateProductRating(this.schema.reviews[idx].productId);
    return this.schema.reviews[idx];
  }

  public deleteReview(id: string, userId: string): boolean {
    const idx = this.schema.reviews.findIndex(r => r.id === id);
    if (idx === -1) return false;
    
    // Admins can delete any review, customers only their own
    const user = this.getUserById(userId);
    if (!user) return false;
    
    if (user.role !== 'admin' && this.schema.reviews[idx].userId !== userId) {
      throw new Error('Not authorized to delete this review');
    }

    const productId = this.schema.reviews[idx].productId;
    this.schema.reviews.splice(idx, 1);
    this.save();
    this.recalculateProductRating(productId);
    return true;
  }

  // --- CARTS ---
  public getCartItems(userId: string): CartItem[] {
    return this.schema.cartItems.filter(c => c.userId === userId);
  }

  public addToCart(userId: string, productId: string, quantity: number): CartItem {
    const exItem = this.schema.cartItems.find(c => c.userId === userId && c.productId === productId);
    if (exItem) {
      exItem.quantity += quantity;
      this.save();
      return exItem;
    }

    const id = `cart_${Math.random().toString(36).substr(2, 9)}`;
    const item: CartItem = { id, userId, productId, quantity };
    this.schema.cartItems.push(item);
    this.save();
    return item;
  }

  public updateCartQuantity(id: string, userId: string, quantity: number): CartItem {
    const item = this.schema.cartItems.find(c => c.id === id && c.userId === userId);
    if (!item) throw new Error('Cart item not found');
    
    item.quantity = quantity;
    this.save();
    return item;
  }

  public removeCartItem(id: string, userId: string): boolean {
    const initialLen = this.schema.cartItems.length;
    this.schema.cartItems = this.schema.cartItems.filter(c => !(c.id === id && c.userId === userId));
    const successfullyRemoved = this.schema.cartItems.length < initialLen;
    if (successfullyRemoved) {
      this.save();
    }
    return successfullyRemoved;
  }

  public clearCart(userId: string): void {
    this.schema.cartItems = this.schema.cartItems.filter(c => c.userId !== userId);
    this.save();
  }

  // --- WISHLISTS ---
  public getWishlist(userId: string): WishlistItem[] {
    return this.schema.wishlists.filter(w => w.userId === userId);
  }

  public toggleWishlist(userId: string, productId: string): { active: boolean } {
    const idx = this.schema.wishlists.findIndex(w => w.userId === userId && w.productId === productId);
    if (idx !== -1) {
      this.schema.wishlists.splice(idx, 1);
      this.save();
      return { active: false };
    }

    const id = `wish_${Math.random().toString(36).substr(2, 9)}`;
    this.schema.wishlists.push({
      id,
      userId,
      productId,
      createdAt: new Date().toISOString()
    });
    this.save();
    return { active: true };
  }

  // --- ADDRESSES ---
  public getAddresses(userId: string): Address[] {
    return this.schema.addresses.filter(a => a.userId === userId);
  }

  public createAddress(userId: string, addressData: Omit<Address, 'id' | 'userId' | 'createdAt'>): Address {
    const id = `addr_${Math.random().toString(36).substr(2, 9)}`;
    const address: Address = {
      ...addressData,
      id,
      userId,
      createdAt: new Date().toISOString()
    };
    this.schema.addresses.push(address);
    this.save();
    return address;
  }

  public deleteAddress(id: string, userId: string): boolean {
    const initialLen = this.schema.addresses.length;
    this.schema.addresses = this.schema.addresses.filter(a => !(a.id === id && a.userId === userId));
    const successfullyRemoved = this.schema.addresses.length < initialLen;
    if (successfullyRemoved) {
      this.save();
    }
    return successfullyRemoved;
  }

  // --- ORDERS ---
  public getOrders(userId: string): Order[] {
    const userObj = this.getUserById(userId);
    if (!userObj) return [];
    
    // Admin gets all orders, customers only their own
    if (userObj.role === 'admin') {
      return this.schema.orders;
    }
    return this.schema.orders.filter(o => o.userId === userId);
  }

  public getOrderById(id: string): Order | undefined {
    return this.schema.orders.find(o => o.id === id);
  }

  public createOrder(userId: string, orderData: Omit<Order, 'id' | 'userId' | 'createdAt' | 'status'>): Order {
    const id = `ord_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const order: Order = {
      ...orderData,
      id,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Deduct stock for each purchased item
    order.items.forEach(item => {
      const prod = this.getProductById(item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        if (prod.stock === 0) {
          prod.availability = false;
        }
      }
    });

    this.schema.orders.unshift(order);
    this.save();
    return order;
  }

  public updateOrderStatus(id: string, status: Order['status']): Order {
    const idx = this.schema.orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    
    this.schema.orders[idx].status = status;
    this.save();
    return this.schema.orders[idx];
  }

  // Admin insights - metrics calculations
  public getAdminAnalytics() {
    const orders = this.schema.orders;
    const users = this.schema.users;
    const products = this.schema.products;

    const totalSales = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const totalProducts = products.length;

    // Sales by category
    const salesByCategory: { [catId: string]: number } = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          salesByCategory[prod.categoryId] = (salesByCategory[prod.categoryId] || 0) + (item.price * item.quantity);
        }
      });
    });

    const categoryBreakdown = Object.keys(salesByCategory).map(catId => {
      const cat = this.schema.categories.find(c => c.id === catId);
      return {
        categoryName: cat ? cat.name : catId,
        revenue: salesByCategory[catId]
      };
    });

    // Recent orders dashboard list with resolved user names
    const resolvedOrders = orders.slice(0, 10).map(o => {
      const userObj = users.find(u => u.id === o.userId);
      return {
        ...o,
        customerName: userObj ? userObj.name : 'Unknown User',
        customerEmail: userObj ? userObj.email : ''
      };
    });

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      totalProducts,
      categoryBreakdown,
      recentOrders: resolvedOrders
    };
  }
}

export const db = new Database();
