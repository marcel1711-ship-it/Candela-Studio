import { ShoppingBag, Store, Zap, UtensilsCrossed, TrendingUp, ChevronRight, LayoutDashboard } from 'lucide-react';

const services = [
  {
    id: 'marketplaces',
    icon: ShoppingBag,
    title: 'Implementación en Marketplaces',
    subtitle: 'Empieza a vender donde está tu cliente',
    color: 'from-orange-500 to-red-600',
    glow: 'shadow-orange-500/20',
    platforms: ['Amazon', 'TikTok Shop', 'Mercado Libre', 'Walmart'],
    description:
      'Te acompañamos desde cero hasta el primer pedido. Configuramos tu cuenta, estructuramos tus productos, cargamos el catálogo y lanzamos.',
    items: [
      'Configuración completa de cuenta',
      'Estructura y optimización de productos',
      'Carga de catálogo y variantes',
      'Lanzamiento y primeras ventas',
    ],
  },
  {
    id: 'tienda',
    icon: Store,
    title: 'Creación de Tienda Online',
    subtitle: 'Tu tienda, lista para vender en días',
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
    platforms: ['Shopify', 'WooCommerce', 'Otras plataformas'],
    description:
      'Configuramos tu tienda online con pasarela de pagos, diseño optimizado para conversión y todo listo para empezar a vender.',
    items: [
      'Configuración de plataforma',
      'Pasarela de pagos integrada',
      'Diseño orientado a conversión',
      'Dominio y SSL configurados',
    ],
  },
  {
    id: 'automatizaciones',
    icon: Zap,
    title: 'Automatizaciones de Negocio',
    subtitle: 'Trabaja menos, vende más',
    color: 'from-red-600 to-rose-700',
    glow: 'shadow-red-500/20',
    platforms: ['GoHighLevel', 'Make', 'Zapier', 'n8n'],
    description:
      'Automatizamos la captación de leads, el seguimiento de clientes, las notificaciones de pedidos y más con herramientas como GoHighLevel.',
    items: [
      'Captación y organización de leads',
      'Seguimiento automático por email/WhatsApp',
      'Notificaciones de pedidos',
      'CRM completo y pipeline de ventas',
    ],
  },
  {
    id: 'locales',
    icon: UtensilsCrossed,
    title: 'Automatización para Negocios Locales',
    subtitle: 'Ideal para carnicerías, restaurantes y más',
    color: 'from-orange-600 to-amber-600',
    glow: 'shadow-orange-500/20',
    platforms: ['Carnicerías', 'Restaurantes', 'Comercios', 'Servicios'],
    description:
      'Transforma tu negocio local con formularios de pedido, notificaciones automáticas y organización sin caos desde el primer día.',
    items: [
      'Formularios de pedido automatizados',
      'Notificaciones al cliente y al negocio',
      'Organización y seguimiento de pedidos',
      'Base de datos de clientes integrada',
    ],
  },
  {
    id: 'gestion-marketplaces',
    icon: LayoutDashboard,
    title: 'Gestión de Tiendas en Marketplaces',
    subtitle: 'Nosotros operamos, tú vendes',
    color: 'from-rose-500 to-red-600',
    glow: 'shadow-rose-500/20',
    platforms: ['Amazon', 'TikTok Shop', 'Mercado Libre', 'Walmart'],
    description:
      'Nos encargamos del día a día de tu tienda en los marketplaces: actualización de listings, gestión de inventario, atención a reseñas y reportes de rendimiento.',
    items: [
      'Actualización y optimización de listings',
      'Control de inventario y precios',
      'Gestión de reseñas y atención al cliente',
      'Reportes mensuales de rendimiento',
    ],
  },
  {
    id: 'ventas',
    icon: TrendingUp,
    title: 'Optimización del Proceso de Venta',
    subtitle: 'Tu embudo de ventas, estructurado',
    color: 'from-red-500 to-orange-600',
    glow: 'shadow-red-500/20',
    platforms: ['WhatsApp', 'Email', 'CRM', 'Pipeline'],
    description:
      'Organizamos tus leads, automatizamos el seguimiento y construimos un embudo de ventas que convierte de forma consistente.',
    items: [
      'Organización y calificación de leads',
      'Automatización en WhatsApp y email',
      'Embudos de venta simples y efectivos',
      'CRM y pipeline visual de ventas',
    ],
  },
];

export function Services() {
  return (
    <section id="servicios" className="bg-[#0a0a0a] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">Lo que hacemos</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Servicios diseñados para{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              resultados reales
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            Sin complicaciones. Sin promesas vacías. Implementación concreta que genera ventas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className={`relative bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-orange-500/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${service.glow}`}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${service.color} mb-5 shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-300 transition-colors">
                  {service.title}
                </h3>
                <p className="text-orange-400/70 text-xs font-medium mb-3">{service.subtitle}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{service.description}</p>

                {/* Features list */}
                <ul className="space-y-2 mb-5">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <ChevronRight size={14} className="text-orange-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Platform tags */}
                <div className="flex flex-wrap gap-2">
                  {service.platforms.map((p) => (
                    <span
                      key={p}
                      className="text-xs bg-white/5 border border-white/8 text-gray-400 px-2.5 py-1 rounded-full"
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
            className="inline-flex items-center gap-2 border border-orange-500/50 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 font-semibold px-8 py-4 rounded-full transition-all duration-200"
          >
            Hablar sobre mi proyecto
            <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
