export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  details: string;
  inStock: boolean;
  stock: number;
  tags: string[];
  isNew?: boolean;
  isSale?: boolean;
  isBestSeller?: boolean;
  onOffer?: boolean;
  offerBadge?: string;
  offerDescription?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  badge_text: string;
  discount_text?: string;
  product_id?: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  sort_order: number;
  created_at: string;
}

export const CIRCLE_CATEGORIES = [
  { label: 'Breads',    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=240&q=80&fit=crop', href: '/shop?category=Bread' },
  { label: 'Pastries',  image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=240&q=80&fit=crop', href: '/shop?category=Pastry' },
  { label: 'Cakes',     image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=240&q=80&fit=crop', href: '/shop?category=Cake' },
  { label: 'Cookies',   image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=240&q=80&fit=crop', href: '/shop?category=Cookies' },
  { label: 'Donuts',    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=240&q=80&fit=crop', href: '/shop?category=Donuts' },
  { label: 'Specials',  image: 'https://images.unsplash.com/photo-1464500701-54b8b28ede7f?w=240&q=80&fit=crop', href: '/shop' },
];

export const CATEGORY_LIST = ['All', 'Bread', 'Pastry', 'Cake', 'Cookies', 'Donuts'];

export const products: Product[] = [
  {
    id: 'white-bread',
    name: 'White Bread Loaf',
    price: 200,
    originalPrice: 250,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80&fit=crop',
    category: 'Bread',
    description: 'Soft, fluffy white bread loaf baked fresh every morning. Perfect for sandwiches, toast, or just enjoying warm with butter.',
    details: 'Ingredients: Wheat flour, water, yeast, salt, sugar. Weight: 800g. Shelf life: 3 days at room temperature.',
    inStock: true, stock: 45,
    tags: ['Fresh', 'Daily Bake', 'Popular'],
    isSale: true, isBestSeller: true,
  },
  {
    id: 'sourdough-loaf',
    name: 'Artisan Sourdough Loaf',
    price: 450,
    image: 'https://images.unsplash.com/photo-1586444248879-6b4d8e2ef9a3?w=600&q=80&fit=crop',
    category: 'Bread',
    description: 'Traditional sourdough with a crispy crust and chewy interior. Made with our long-fermented starter for authentic depth of flavour.',
    details: 'Ingredients: Wheat flour, water, sourdough starter, sea salt. Weight: 900g. Shelf life: 4 days.',
    inStock: true, stock: 20,
    tags: ['Artisan', 'Sourdough'],
    isNew: true,
  },
  {
    id: 'butter-croissant',
    name: 'Butter Croissant',
    price: 150,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80&fit=crop',
    category: 'Pastry',
    description: 'Flaky, buttery French-style croissant. Layers of golden perfection — crispy outside, pillowy inside.',
    details: 'Weight: 100g each. Made with 100% butter. Shelf life: 1 day. Best served warm.',
    inStock: true, stock: 60,
    tags: ['French', 'Buttery', 'Breakfast'],
    isBestSeller: true,
  },
  {
    id: 'cinnamon-roll',
    name: 'Cinnamon Swirl Roll',
    price: 180,
    originalPrice: 220,
    image: 'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=600&q=80&fit=crop',
    category: 'Pastry',
    description: 'Warm, fluffy cinnamon roll with vanilla cream cheese icing. Made fresh every morning — best enjoyed warm.',
    details: 'Weight: 150g. Shelf life: 1 day. Contains: flour, butter, cinnamon, cream cheese.',
    inStock: true, stock: 30,
    tags: ['Sweet', 'Cinnamon'],
    isSale: true,
  },
  {
    id: 'classic-donut',
    name: 'Classic Glazed Donut',
    price: 70,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80&fit=crop',
    category: 'Donuts',
    description: 'Light, airy donut with a sweet vanilla glaze. Available in plain, chocolate, and sprinkles.',
    details: 'Weight: 80g each. Flavours: Plain, Chocolate, Strawberry, Sprinkles. Shelf life: 1 day.',
    inStock: true, stock: 80,
    tags: ['Sweet', 'Kids'],
    isBestSeller: true,
  },
  {
    id: 'chocolate-cake',
    name: 'Dark Chocolate Fudge Cake',
    price: 1500,
    originalPrice: 1800,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&fit=crop',
    category: 'Cake',
    description: 'Rich, decadent 3-layer chocolate fudge cake with Belgian chocolate ganache. Perfect for any celebration.',
    details: 'Serves 8–12. Available in 1kg, 1.5kg, 2kg. Custom decoration available. Order 24hrs in advance.',
    inStock: true, stock: 15,
    tags: ['Celebration', 'Chocolate'],
    isSale: true, isBestSeller: true,
  },
  {
    id: 'red-velvet-cake',
    name: 'Red Velvet Dream Cake',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80&fit=crop',
    category: 'Cake',
    description: 'Stunning red velvet with velvety cream cheese frosting. A showstopper for weddings, birthdays, and special events.',
    details: 'Serves 8–12. 1kg standard. Custom sizes available. Order 48hrs in advance.',
    inStock: true, stock: 10,
    tags: ['Celebration', 'Wedding'],
    isNew: true, isBestSeller: true,
  },
  {
    id: 'new-york-cheesecake',
    name: 'New York Cheesecake',
    price: 900,
    originalPrice: 1100,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80&fit=crop',
    category: 'Cake',
    description: 'Classic baked New York cheesecake on a buttery digestive base. Creamy, rich, and perfectly smooth.',
    details: 'Serves 6–8. 800g. Toppings: plain, strawberry, blueberry. Keep refrigerated. Consume within 3 days.',
    inStock: true, stock: 12,
    tags: ['Cheesecake', 'American'],
    isSale: true,
  },
  {
    id: 'vanilla-cupcakes',
    name: 'Vanilla Cupcakes (6-Pack)',
    price: 480,
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600&q=80&fit=crop',
    category: 'Pastry',
    description: 'Six fluffy vanilla cupcakes topped with swirled buttercream. Choose your frosting colour for parties.',
    details: 'Pack of 6. 60g each. Flavours: Vanilla, Chocolate, Strawberry, Lemon. Custom colours available.',
    inStock: true, stock: 25,
    tags: ['Party', 'Kids'],
  },
  {
    id: 'blueberry-muffin',
    name: 'Blueberry Muffin',
    price: 130,
    originalPrice: 160,
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80&fit=crop',
    category: 'Pastry',
    description: 'Moist muffin packed with fresh blueberries and topped with a crunchy streusel crumble.',
    details: 'Weight: 120g. Made with fresh blueberries. Shelf life: 2 days.',
    inStock: true, stock: 40,
    tags: ['Breakfast', 'Healthy'],
    isSale: true,
  },
  {
    id: 'butter-cookies',
    name: 'Butter Cookies Box (500g)',
    price: 450,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&fit=crop',
    category: 'Cookies',
    description: 'Melt-in-your-mouth shortbread butter cookies in a beautiful gift box. Ideal for gifting.',
    details: '500g of assorted butter cookies. Varieties: plain, chocolate chip, vanilla. Shelf life: 2 weeks.',
    inStock: false, stock: 0,
    tags: ['Gift', 'Shortbread'],
  },
  {
    id: 'fruit-tart',
    name: 'Mixed Fruit Tart',
    price: 650,
    originalPrice: 800,
    image: 'https://images.unsplash.com/photo-1464500701-54b8b28ede7f?w=600&q=80&fit=crop',
    category: 'Pastry',
    description: 'Crisp pastry shell filled with vanilla custard cream topped with fresh seasonal fruits. A visual delight.',
    details: 'Serves 4–6. Also available as individual mini-tarts (KES 200 each). Consume within 24 hours.',
    inStock: true, stock: 8,
    tags: ['Fruit', 'Fancy'],
    isSale: true, isBestSeller: true,
  },
];

export const getProduct = (id: string) => products.find(p => p.id === id);
export const getBestSellers = () => products.filter(p => p.isBestSeller);
export const getOnOffer = () => products.filter(p => p.isSale || p.onOffer);
export const getRelated = (product: Product, count = 4) =>
  products.filter(p => p.id !== product.id && p.category === product.category).slice(0, count);
