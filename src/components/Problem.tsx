import { XCircle } from 'lucide-react';

const problems = [
  'No sabes por dónde empezar a vender online',
  'No entiendes cómo funcionan los marketplaces',
  'Pierdes tiempo gestionando pedidos manualmente',
  'No tienes seguimiento automático con clientes',
  'Tu negocio depende de WhatsApp y procesos manuales',
  'Quieres escalar pero no tienes la estructura para hacerlo',
];

export function Problem() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--border-accent), transparent)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>El problema</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Vender online no debería{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ser un caos
            </span>
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Si reconoces alguna de estas situaciones, Candela fue diseñado exactamente para ti.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="theme-card flex items-start gap-4 rounded-2xl px-5 py-5 transition-all duration-300 group"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid rgba(232,80,10,0.12)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,80,10,0.32)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,80,10,0.12)'; }}
            >
              <div className="mt-0.5 flex-shrink-0">
                <XCircle size={20} style={{ color: 'var(--accent)', opacity: 0.6 }} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{problem}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--accent)', color: '#FFFAF5', boxShadow: '0 8px 24px rgba(232,80,10,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            Quiero solucionar esto
          </a>
        </div>
      </div>
    </section>
  );
}
