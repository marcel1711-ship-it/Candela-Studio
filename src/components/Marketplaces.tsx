export function Marketplaces() {
  const platforms = [
    { name: 'Amazon', icon: '📦', color: '#FF9900', bg: '#FF990015' },
    { name: 'TikTok Shop', icon: '🎵', color: '#EE1D52', bg: '#EE1D5215' },
    { name: 'Mercado Libre', icon: '🛒', color: '#FFE600', bg: '#FFE60015' },
    { name: 'Shopify', icon: '🏪', color: '#96BF48', bg: '#96BF4815' },
    { name: 'Etsy', icon: '🎨', color: '#F56400', bg: '#F5640015' },
    { name: 'eBay', icon: '🔖', color: '#E53238', bg: '#E5323815' },
    { name: 'Walmart', icon: '⭐', color: '#0071CE', bg: '#0071CE15' },
  ];

  return (
    <section id="marketplaces" className="bg-[#0d0d0d] py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-700/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">Dónde te ayudamos a vender</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Plataformas con las que{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              trabajamos
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Te ayudamos desde cero o a mejorar lo que ya tienes.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="group bg-[#141414] border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-white/15 hover:-translate-y-1 transition-all duration-300"
              style={{ '--platform-color': platform.color } as React.CSSProperties}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: platform.bg, border: `1px solid ${platform.color}20` }}
              >
                {platform.icon}
              </div>
              <span
                className="font-semibold text-sm text-gray-200 group-hover:text-white transition-colors"
              >
                {platform.name}
              </span>
            </div>
          ))}

          {/* "More coming" card */}
          <div className="bg-[#141414] border border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center text-gray-600 text-xl">
              +
            </div>
            <span className="text-xs text-gray-500 text-center">Y más plataformas</span>
          </div>
        </div>

        <div className="mt-14 bg-gradient-to-r from-orange-500/10 to-red-600/10 border border-orange-500/20 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            ¿No ves tu plataforma aquí?
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">
            Trabajamos con la mayoría de plataformas de ecommerce y marketplaces. Cuéntanos lo que necesitas y buscamos la solución.
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5"
          >
            Consultarnos
          </a>
        </div>
      </div>
    </section>
  );
}
