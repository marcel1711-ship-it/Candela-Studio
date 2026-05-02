import { CheckCircle } from 'lucide-react';

const pillars = [
  {
    title: 'Soluciones prácticas',
    desc: 'No teoría, no promesas vacías. Implementamos lo que tu negocio realmente necesita para funcionar.',
  },
  {
    title: 'Sin complicaciones innecesarias',
    desc: 'Buscamos la solución más simple y efectiva. Sin tecnología por el gusto de la tecnología.',
  },
  {
    title: 'Adaptado a tu negocio',
    desc: 'Cada negocio es diferente. Diseñamos soluciones a medida, no plantillas genéricas.',
  },
  {
    title: 'Enfocado en resultados reales',
    desc: 'Nos importa que vendas más y trabajes menos. Eso es lo que medimos al final del día.',
  },
];

export function Trust() {
  return (
    <section className="bg-[#0a0a0a] py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-orange-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Top section */}
        <div className="text-center mb-16">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">Por qué Candela</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-3xl mx-auto">
            Diseñado para negocios que quieren crecer{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              con estructura
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="bg-[#141414] border border-white/5 rounded-3xl p-7 hover:border-orange-500/25 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/20 rounded-xl p-2 mt-0.5 flex-shrink-0">
                  <CheckCircle size={18} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-2 group-hover:text-orange-300 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA bar */}
        <div className="mt-14 bg-gradient-to-r from-[#1a1008] to-[#160808] border border-orange-500/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Listo para dar el siguiente paso?</h3>
            <p className="text-gray-400 text-sm">Una llamada gratuita de 30 minutos puede cambiar tu negocio.</p>
          </div>
          <a
            href="#contacto"
            className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-xl shadow-orange-500/25 hover:-translate-y-0.5 whitespace-nowrap"
          >
            Agendar llamada gratuita
          </a>
        </div>
      </div>
    </section>
  );
}
