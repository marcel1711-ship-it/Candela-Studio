import { CheckCircle } from 'lucide-react';

const pillars = [
  { title: 'Soluciones prácticas', desc: 'No teoría, no promesas vacías. Implementamos lo que tu negocio realmente necesita para funcionar.' },
  { title: 'Sin complicaciones innecesarias', desc: 'Buscamos la solución más simple y efectiva. Sin tecnología por el gusto de la tecnología.' },
  { title: 'Adaptado a tu negocio', desc: 'Cada negocio es diferente. Diseñamos soluciones a medida, no plantillas genéricas.' },
  { title: 'Enfocado en resultados reales', desc: 'Nos importa que vendas más y trabajes menos. Eso es lo que medimos al final del día.' },
];

export function Trust() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full blur-3xl" style={{ backgroundColor: 'var(--glow-center)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Por qué Candela</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl mx-auto"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Diseñado para negocios que quieren crecer{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              con estructura
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="theme-card rounded-3xl p-7 transition-all duration-300 group"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="rounded-xl p-2 mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: 'rgba(232,80,10,0.12)', border: '1px solid rgba(232,80,10,0.20)' }}
                >
                  <CheckCircle size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h3
                    className="font-bold text-base mb-2"
                    style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{pillar.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-14 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: 'linear-gradient(135deg, rgba(232,80,10,0.10), rgba(184,132,90,0.08))', border: '1px solid var(--border-accent)' }}
        >
          <div>
            <h3
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Listo para dar el siguiente paso?
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Una llamada gratuita de 30 minutos puede cambiar tu negocio.</p>
          </div>
          <a
            href="#contacto"
            className="flex-shrink-0 font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent)', color: '#FFFAF5', boxShadow: '0 8px 24px rgba(232,80,10,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            Agendar llamada gratuita
          </a>
        </div>
      </div>
    </section>
  );
}
