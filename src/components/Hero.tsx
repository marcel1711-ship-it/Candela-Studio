import { ArrowRight, Play } from 'lucide-react';
import { FlameLogo } from './FlameLogo';

const marketplaceLogos = [
  { name: 'Amazon', color: '#FF9900' },
  { name: 'TikTok Shop', color: '#EE1D52' },
  { name: 'Mercado Libre', color: '#FFE600' },
  { name: 'Shopify', color: '#96BF48' },
  { name: 'Walmart', color: '#0071CE' },
];

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden pt-6"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl animate-pulse-slow" style={{ backgroundColor: 'var(--glow-orb-1)' }} />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl animate-pulse-slow-delay" style={{ backgroundColor: 'var(--glow-orb-2)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ backgroundColor: 'var(--glow-center)' }} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 w-fit"
              style={{ backgroundColor: 'rgba(232,80,10,0.08)', border: '1px solid rgba(232,80,10,0.28)' }}
            >
              <div className="w-2 h-2 rounded-full bg-[#E8500A] animate-pulse" />
              <span className="text-sm font-medium" style={{ color: 'var(--amber)' }}>Agencia de implementación digital</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight"
              style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Lanza y automatiza{' '}
              <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                tus ventas online
              </span>{' '}
              con Candela
            </h1>

            <p className="text-lg leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Ayudamos a negocios a vender en Amazon, TikTok Shop, Mercado Libre y más, mientras
              automatizamos sus procesos, pedidos y seguimiento de clientes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5 text-base"
                style={{ backgroundColor: 'var(--accent)', color: '#FFFAF5', boxShadow: '0 8px 24px rgba(232,80,10,0.30)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
              >
                Agendar llamada gratuita
                <ArrowRight size={18} />
              </a>
              <a
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-4 rounded-full transition-all duration-200 text-base"
                style={{ backgroundColor: 'var(--border-subtle)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              >
                <Play size={16} style={{ color: 'var(--amber)' }} />
                Ver servicios
              </a>
            </div>

            <div className="flex items-center gap-6 pt-2">
              {[
                { stat: '50+', label: 'Negocios digitalizados' },
                { stat: '7', label: 'Marketplaces integrados' },
                { stat: '3x', label: 'Promedio de crecimiento' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6">
                  {i > 0 && <div className="w-px h-10" style={{ backgroundColor: 'var(--border-subtle)' }} />}
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{item.stat}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative z-10 flame-float">
              <FlameLogo size={160} />
              <div className="absolute inset-0 rounded-full scale-150 -z-10 blur-3xl" style={{ backgroundColor: 'rgba(232,80,10,0.18)' }} />
            </div>

            {marketplaceLogos.map((mp, i) => {
              const angle = (i / marketplaceLogos.length) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const radius = 160;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <div
                  key={mp.name}
                  className="absolute flex items-center gap-2 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm cursor-default transition-all duration-300"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: mp.color }} />
                  <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-body)' }}>{mp.name}</span>
                </div>
              );
            })}

            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 500 500">
              <circle cx="250" cy="250" r="160" stroke="url(#circleGrad)" strokeWidth="1" fill="none" strokeDasharray="4 8" />
              <defs>
                <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8500A" />
                  <stop offset="100%" stopColor="#FBBF80" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--bg-primary), transparent)' }}
      />
    </section>
  );
}
