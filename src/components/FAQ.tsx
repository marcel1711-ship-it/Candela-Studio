import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: '¿Candela es una agencia de marketing?',
    a: 'No. Nos especializamos en implementación y automatización. No hacemos publicidad ni gestionamos redes sociales. Nos enfocamos en configurar tus canales de venta (marketplaces, tiendas) y automatizar los procesos operativos de tu negocio.',
  },
  {
    q: '¿Trabajan con negocios que empiezan desde cero?',
    a: 'Sí. De hecho, es nuestro punto de partida más común. No necesitas experiencia previa en ecommerce ni en herramientas digitales. Nosotros te guiamos en cada paso desde el principio.',
  },
  {
    q: '¿Ayudan a vender en Amazon, TikTok Shop y Mercado Libre?',
    a: 'Sí. Trabajamos con todos estos marketplaces. Nos encargamos de abrir la cuenta, configurarla correctamente, cargar tu catálogo de productos y lanzar tus primeras ventas.',
  },
  {
    q: '¿También automatizan negocios locales como carnicerías o restaurantes?',
    a: 'Sí. Tenemos soluciones específicas para negocios locales: formularios de pedido automatizados, notificaciones al cliente y al negocio, organización de pedidos y seguimiento. Todo sin necesidad de una tienda online compleja.',
  },
  {
    q: '¿Qué pasa después de la implementación?',
    a: 'Incluimos formación para que puedas gestionar todo de forma independiente. Además, ofrecemos acompañamiento y optimización post-implementación para asegurarnos de que todo funciona bien y sigue creciendo.',
  },
  {
    q: '¿Cuánto tiempo tarda la implementación?',
    a: 'Depende del proyecto. Una tienda básica en Shopify puede estar lista en una semana. Una implementación completa en varios marketplaces con automatizaciones puede tomar 3-6 semanas. Lo definimos en el plan de implementación.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[#0a0a0a] py-24 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Preguntas{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              frecuentes
            </span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`bg-[#141414] border rounded-2xl overflow-hidden transition-all duration-300 ${
                open === i ? 'border-orange-500/40' : 'border-white/5 hover:border-white/10'
              }`}
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className={`font-semibold text-sm leading-relaxed transition-colors ${open === i ? 'text-orange-300' : 'text-white'}`}>
                  {faq.q}
                </span>
                <div className={`flex-shrink-0 rounded-lg p-1 transition-colors ${open === i ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-400'}`}>
                  {open === i ? <Minus size={14} /> : <Plus size={14} />}
                </div>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm mb-4">Tienes otra pregunta?</p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 border border-orange-500/40 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 font-semibold px-6 py-3 rounded-full transition-all duration-200 text-sm"
          >
            Escríbenos directamente
          </a>
        </div>
      </div>
    </section>
  );
}
