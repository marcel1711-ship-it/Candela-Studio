import { ShoppingBag, Store, Zap, UtensilsCrossed, TrendingUp, ChevronRight, LayoutDashboard } from 'lucide-react';

const services = [
  {
    id: 'marketplaces',
    icon: ShoppingBag,
    platforms: ['Amazon', 'TikTok Shop', 'Mercado Libre', 'Walmart'],
    title: 'Implementación en Marketplaces',
    subtitle: 'Empieza a vender donde está tu cliente',
    description: 'Te acompañamos desde cero hasta el primer pedido. Configuramos tu cuenta, estructuramos tus productos, cargamos el catálogo y lanzamos.',
    items: ['Configuración completa de cuenta', 'Estructura y optimización de productos', 'Carga de catálogo y variantes', 'Lanzamiento y primeras ventas'],
  },
  {
    id: 'tienda',
    icon: Store,
    platforms: ['Shopify', 'WooCommerce', 'Otras plataformas'],
    title: 'Creación de Tienda Online',
    subtitle: 'Tu tienda, lista para vender en días',
    description: 'Configuramos tu tienda online con pasarela de pagos, diseño optimizado para conversión y todo listo para empezar a vender.',
    items: ['Configuración de plataforma', 'Pasarela de pagos integrada', 'Diseño orientado a conversión', 'Dominio y SSL configurados'],
  },
  {
    id: 'automatizaciones',
    icon: Zap,
    platforms: ['GoHighLevel', 'Make', 'Zapier', 'n8n'],
    title: 'Automatizaciones de Negocio',
    subtitle: 'Trabaja menos, vende más',
    description: 'Automatizamos la captación de leads, el seguimiento de clientes, las notificaciones de pedidos y más con herramientas como GoHighLevel.',
    items: ['Captación y organización de leads', 'Seguimiento automático por email/WhatsApp', 'Notificaciones de pedidos', 'CRM completo y pipeline de ventas'],
  },
  {
    id: 'locales',
    icon: UtensilsCrossed,
    platforms: ['Carnicerías', 'Restaurantes', 'Comercios', 'Servicios'],
    title: 'Automatización para Negocios Locales',
    subtitle: 'Ideal para carnicerías, restaurantes y más',
    description: 'Transforma tu negocio local con formularios de pedido, notificaciones automáticas y organización sin caos desde el primer día.',
    items: ['Formularios de pedido automatizados', 'Notificaciones al cliente y al negocio', 'Organización y seguimiento de pedidos', 'Base de datos de clientes integrada'],
  },
  {
    id: 'gestion-marketplaces',
    icon: LayoutDashboard,
    platforms: ['Amazon', 'TikTok Shop', 'Mercado Libre', 'Walmart'],
    title: 'Gestión de Tiendas en Marketplaces',
    subtitle: 'Nosotros operamos, tú vendes',
    description: 'Nos encargamos del día a día de tu tienda en los marketplaces: actualización de listings, gestión de inventario, atención a reseñas y reportes de rendimiento.',
    items: ['Actualización y optimización de listings', 'Control de inventario y precios', 'Gestión de reseñas y atención al cliente', 'Reportes mensuales de rendimiento'],
  },
  {
    id: 'ventas',
    icon: TrendingUp,
    platforms: ['WhatsApp', 'Email', 'CRM', 'Pipeline'],
    title: 'Optimización del Proceso de Venta',
    subtitle: 'Tu embudo de ventas, estructurado',
    description: 'Organizamos tus leads, automatizamos el seguimiento y construimos un embudo de ventas que convierte de forma consistente.',
    items: ['Organización y calificación de leads', 'Automatización en WhatsApp y email', 'Embudos de venta simples y efectivos', 'CRM y pipeline visual de ventas'],
  },
];

export function Services() {
  return (
    <section id="servicios" className="py-24" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Lo que hacemos</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Servicios diseñados para{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              resultados reales
            </span>
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Sin complicaciones. Sin promesas vacías. Implementación concreta que genera ventas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="theme-card relative rounded-3xl p-6 transition-all duration-300 group hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(232,80,10,0.10)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                  style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 12px rgba(232,80,10,0.30)' }}
                >
                  <Icon size={22} className="text-white" />
                </div>

                <h3
                  className="text-lg font-bold mb-1 transition-colors group-hover:opacity-80"
                  style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  {service.title}
                </h3>
                <p className="text-xs font-medium mb-3" style={{ color: 'var(--terracota)' }}>{service.subtitle}</p>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>{service.description}</p>

                <ul className="space-y-2 mb-5">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-body)' }}>
                      <ChevronRight size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  {service.platforms.map((p) => (
                    <span
                      key={p}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full transition-all duration-200"
            style={{ border: '1px solid var(--border-accent)', color: 'var(--amber)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(232,80,10,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            Hablar sobre mi proyecto
            <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
