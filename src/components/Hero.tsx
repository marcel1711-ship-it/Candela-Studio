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
      className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a0a] pt-20"
    >
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-700/15 rounded-full blur-3xl animate-pulse-slow-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-orange-500/30 rounded-full px-4 py-2 w-fit">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm text-orange-400 font-medium">Agencia de implementación digital</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Lanza y automatiza{' '}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                tus ventas online
              </span>{' '}
              con Candela
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
              Ayudamos a negocios a vender en Amazon, TikTok Shop, Mercado Libre y más, mientras
              automatizamos sus procesos, pedidos y seguimiento de clientes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold px-7 py-4 rounded-full transition-all duration-200 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 text-base"
              >
                Agendar llamada gratuita
                <ArrowRight size={18} />
              </a>
              <a
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold px-7 py-4 rounded-full transition-all duration-200 text-base"
              >
                <Play size={16} className="text-orange-400" />
                Ver servicios
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-xs text-gray-500 mt-0.5">Negocios digitalizados</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">7</p>
                <p className="text-xs text-gray-500 mt-0.5">Marketplaces integrados</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">3x</p>
                <p className="text-xs text-gray-500 mt-0.5">Promedio de crecimiento</p>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative flex items-center justify-center">
            {/* Central flame */}
            <div className="relative z-10 flame-float">
              <FlameLogo size={160} />
              {/* Glow effect behind flame */}
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 -z-10" />
            </div>

            {/* Orbiting marketplace cards */}
            {marketplaceLogos.map((mp, i) => {
              const angle = (i / marketplaceLogos.length) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const radius = 160;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <div
                  key={mp.name}
                  className="absolute flex items-center gap-2 bg-[#141414] border border-white/10 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300 cursor-default"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: mp.color }}
                  />
                  <span className="text-xs text-gray-300 font-medium whitespace-nowrap">{mp.name}</span>
                </div>
              );
            })}

            {/* Automation flow lines */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 500 500">
              <circle cx="250" cy="250" r="160" stroke="url(#circleGrad)" strokeWidth="1" fill="none" strokeDasharray="4 8" />
              <defs>
                <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B1A" />
                  <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
    </section>
  );
}