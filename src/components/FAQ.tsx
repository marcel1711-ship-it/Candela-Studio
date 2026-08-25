import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  { q: '¿Candela es una agencia de marketing?', a: 'No. Nos especializamos en implementación y automatización. No hacemos publicidad ni gestionamos redes sociales. Nos enfocamos en configurar y gestionar tus canales de venta en marketplaces y automatizar los procesos operativos de tu negocio.' },
  { q: '¿Trabajan con negocios que empiezan desde cero?', a: 'Sí. De hecho, es nuestro punto de partida más común. No necesitas experiencia previa en ecommerce ni en herramientas digitales. Nosotros te guiamos en cada paso desde el principio.' },
  { q: '¿Ayudan a vender en Amazon, TikTok Shop, Walmart y Faire?', a: 'Sí. Trabajamos con todos estos marketplaces. Nos encargamos de abrir la cuenta, configurarla correctamente, cargar tu catálogo de productos y lanzar tus primeras ventas.' },
  { q: '¿Qué pasa después de la implementación?', a: 'Incluimos formación para que puedas gestionar todo de forma independiente. Además, ofrecemos acompañamiento y optimización post-implementación para asegurarnos de que todo funciona bien y sigue creciendo.' },
  { q: '¿Cuánto tiempo tarda la implementación?', a: 'Depende del proyecto. Una cuenta de marketplace configurada y con catálogo cargado puede estar lista en una semana. Una implementación completa en varios marketplaces con automatizaciones puede tomar 3-6 semanas. Lo definimos en el plan de implementación.' },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>FAQ</p>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Preguntas{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              frecuentes
            </span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="theme-card rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: `1px solid ${open === i ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
              }}
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="font-semibold text-sm leading-relaxed transition-colors"
                  style={{ color: open === i ? 'var(--amber)' : 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  {faq.q}
                </span>
                <div
                  className="flex-shrink-0 rounded-lg p-1 transition-colors"
                  style={{
                    backgroundColor: open === i ? 'rgba(232,80,10,0.15)' : 'var(--border-subtle)',
                    color: open === i ? 'var(--amber)' : 'var(--text-faint)',
                  }}
                >
                  {open === i ? <Minus size={14} /> : <Plus size={14} />}
                </div>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--text-faint)' }}>Tienes otra pregunta?</p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all duration-200 text-sm"
            style={{ border: '1px solid var(--border-accent)', color: 'var(--amber)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(232,80,10,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            Escríbenos directamente
          </a>
        </div>
      </div>
    </section>
  );
}
