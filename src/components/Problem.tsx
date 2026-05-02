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
    <section className="bg-[#0d0d0d] py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">El problema</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Vender online no debería{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              ser un caos
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            Si reconoces alguna de estas situaciones, Candela fue diseñado exactamente para ti.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-[#141414] border border-red-900/20 rounded-2xl px-5 py-5 hover:border-red-700/40 transition-all duration-300 group"
            >
              <div className="mt-0.5 flex-shrink-0">
                <XCircle size={20} className="text-red-500/70 group-hover:text-red-500 transition-colors" />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{problem}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-xl shadow-orange-500/25 hover:-translate-y-0.5"
          >
            Quiero solucionar esto
          </a>
        </div>
      </div>
    </section>
  );
}
