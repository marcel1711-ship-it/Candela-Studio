import { XCircle, CheckCircle, ArrowRight } from 'lucide-react';

const before = [
  'Pedidos por WhatsApp sin organización',
  'Sin base de datos de clientes',
  'Seguimiento manual y olvidado',
  'Caos total en la gestión',
  'Pérdida de ventas por desorden',
  'Sin visibilidad del negocio',
];

const after = [
  'Pedidos automatizados y organizados',
  'CRM con historial de cada cliente',
  'Seguimiento automático sin esfuerzo',
  'Control total del negocio',
  'Más ventas, menos trabajo manual',
  'Métricas claras en tiempo real',
];

export function BeforeAfter() {
  return (
    <section id="automatizaciones" className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl" style={{ backgroundColor: 'var(--glow-center)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Transformación real</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            De procesos manuales a{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              sistemas automatizados
            </span>
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Así se ve el negocio antes y después de trabajar con Candela.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div
            className="theme-card rounded-3xl p-7 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(220,38,38,0.20)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(220,38,38,0.06)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="rounded-full px-4 py-1.5"
                  style={{ backgroundColor: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}
                >
                  <span className="text-sm font-semibold text-red-500">Antes</span>
                </div>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(220,38,38,0.15)' }} />
              </div>
              <ul className="space-y-3">
                {before.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <XCircle size={16} className="text-red-500/50 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="theme-card rounded-3xl p-7 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(232,80,10,0.25)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(232,80,10,0.07)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="rounded-full px-4 py-1.5"
                  style={{ backgroundColor: 'rgba(232,80,10,0.12)', border: '1px solid rgba(232,80,10,0.30)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>Con Candela</span>
                </div>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(232,80,10,0.15)' }} />
              </div>
              <ul className="space-y-3">
                {after.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-body)' }}>
                    <CheckCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center my-6 md:hidden">
          <div
            className="rounded-full p-3"
            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px rgba(232,80,10,0.30)' }}
          >
            <ArrowRight size={20} className="text-white" />
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--accent)', color: '#FFFAF5', boxShadow: '0 8px 24px rgba(232,80,10,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            Quiero automatizar mi negocio
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
