// Tipos del dominio. Espejo del esquema en supabase/migrations.
// Cuando el esquema cambie: `supabase gen types typescript` y reconciliar aquí.

export type StoreStatus = 'draft' | 'active' | 'suspended';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';
export type MemberRole = 'owner' | 'staff';
export type MovementReason =
  | 'sale' | 'restock' | 'adjustment' | 'return' | 'cancellation' | 'initial';

/** Paleta y tipografía que cada tenant puede sobrescribir sin recompilar. */
export interface StoreTheme {
  ink?: string;
  inkSoft?: string;
  cream?: string;
  creamDeep?: string;
  gold?: string;
  goldLight?: string;
  goldDeep?: string;
  displayFont?: string;
  sansFont?: string;
  heroImage?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroTitleAccent?: string;
  heroSubtitle?: string;
  heroCta?: string;
  announcements?: string[];
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  currency: string;
  locale: string;
  status: StoreStatus;
  theme: StoreTheme;
  low_stock_threshold: number;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_onboarded_at: string | null;
  platform_fee_bps: number;
  support_email: string | null;
  support_phone: string | null;
  whatsapp_number: string | null;
  alert_emails: string[];
  social: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_visible: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  store_id: string;
  product_id: string;
  sku: string | null;
  name: string;
  option_name: string | null;
  option_value: string | null;
  price_cents: number | null;
  compare_at_cents: number | null;
  stock: number;
  low_stock_threshold: number | null;
  is_default: boolean;
  is_active: boolean;
  position: number;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  slug: string;
  name: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  status: ProductStatus;
  is_featured: boolean;
  price_cents: number;
  compare_at_cents: number | null;
  cost_cents: number | null;
  track_inventory: boolean;
  low_stock_threshold: number | null;
  requires_shipping: boolean;
  weight_grams: number | null;
  attributes: Record<string, unknown>;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
  category: Pick<Category, 'id' | 'slug' | 'name'> | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  name?: string;
}

export interface Order {
  id: string;
  store_id: string;
  order_number: string;
  customer_id: string | null;
  email: string;
  phone: string | null;
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  coupon_code: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  inventory_applied: boolean;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  customer_note: string | null;
  internal_note: string | null;
  placed_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface StockAlert {
  id: string;
  store_id: string;
  variant_id: string;
  threshold: number;
  stock_at_alert: number;
  status: 'open' | 'notified' | 'resolved';
  notified_at: string | null;
  created_at: string;
}

export interface ShippingRate {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  countries: string[];
  states: string[] | null;
  price_cents: number;
  free_over_cents: number | null;
  min_days: number | null;
  max_days: number | null;
  ground_only: boolean;
  is_active: boolean;
  position: number;
}

export interface DashboardMetrics {
  revenue_cents: number;
  revenue_prev_cents: number;
  orders: number;
  orders_prev: number;
  aov_cents: number;
  pending: number;
  low_stock: number;
  products: number;
  customers: number;
}

/** Línea del carrito tal como vive en localStorage. */
export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string | null;
  priceCents: number;
  quantity: number;
  imageUrl: string | null;
  maxStock: number;
}
