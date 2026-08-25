import { MessageCircle, Search, FileText, Settings, GraduationCap, TrendingUp } from 'lucide-react';

const steps = [
  { num: '01', icon: MessageCircle, title: 'Primer contacto', desc: 'Nos escribes por WhatsApp, sin compromiso. Te escuchamos, entendemos tu negocio y aclaramos todas tus dudas.' },
  { num: '02', icon: Search, title: 'Diagnóstico', desc: 'Analizamos tu situación actual, tus objetivos y diseñamos el camino más eficiente para ti.' },
  { num: '03', icon: FileText, title: 'Plan de implementación', desc: 'Te presentamos un plan claro y detallado con tiempos, entregables y resultados esperados.' },
  { num: '04', icon: Settings, title: 'Configuración', desc: 'Implementamos todo de forma ordenada: cuentas, automatizaciones, catálogos, integraciones.' },
  { num: '05', icon: GraduationCap, title: 'Entrega + formación', desc: 'Te entregamos todo funcionando y te formamos para que puedas gestionarlo con confianza.' },
  { num: '06', icon: TrendingUp, title: 'Optimización', desc: 'Seguimiento post-implementación para ajustar, mejorar y asegurarnos de que escales.' },
];

export function Process() {
  return (
    <section id="proceso" className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'var(--glow-orb-1)' }} />
        <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'var(--glow-orb-2)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Metodología</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Cómo{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              trabajamos
            </span>
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Un proceso simple, transparente y orientado a resultados desde el primer día.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="theme-card relative rounded-3xl p-6 transition-all duration-300 group hover:-translate-y-1"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="rounded-2xl p-2.5"
                    style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 12px rgba(232,80,10,0.20)' }}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <span
                    className="text-3xl font-black transition-colors"
                    style={{ color: 'var(--border-subtle)' }}
                  >
                    {step.num}
                  </span>
                </div>

                <h3
                  className="font-bold text-base mb-2 transition-colors"
                  style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>

                {i < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px z-10"
                    style={{ background: 'linear-gradient(to right, rgba(232,80,10,0.30), transparent)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--accent)', color: '#FFFAF5', boxShadow: '0 8px 24px rgba(232,80,10,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
