import { Phone, Search, FileText, Settings, GraduationCap, TrendingUp } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Phone,
    title: 'Llamada inicial',
    desc: 'Conversación sin compromiso. Te escuchamos, entendemos tu negocio y aclaramos todas tus dudas.',
  },
  {
    num: '02',
    icon: Search,
    title: 'Diagnóstico',
    desc: 'Analizamos tu situación actual, tus objetivos y diseñamos el camino más eficiente para ti.',
  },
  {
    num: '03',
    icon: FileText,
    title: 'Plan de implementación',
    desc: 'Te presentamos un plan claro y detallado con tiempos, entregables y resultados esperados.',
  },
  {
    num: '04',
    icon: Settings,
    title: 'Configuración',
    desc: 'Implementamos todo de forma ordenada: cuentas, automatizaciones, catálogos, integraciones.',
  },
  {
    num: '05',
    icon: GraduationCap,
    title: 'Entrega + formación',
    desc: 'Te entregamos todo funcionando y te formamos para que puedas gestionarlo con confianza.',
  },
  {
    num: '06',
    icon: TrendingUp,
    title: 'Optimización',
    desc: 'Seguimiento post-implementación para ajustar, mejorar y asegurarnos de que escales.',
  },
];

export function Process() {
  return (
    <section id="proceso" className="bg-[#0d0d0d] py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-orange-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-red-700/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">Metodología</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Cómo{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              trabajamos
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Un proceso simple, transparente y orientado a resultados desde el primer día.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative bg-[#141414] border border-white/5 rounded-3xl p-6 hover:border-orange-500/25 transition-all duration-300 group hover:-translate-y-1"
              >
                {/* Step number */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-2.5 shadow-lg shadow-orange-500/20">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-3xl font-black text-white/5 group-hover:text-orange-500/15 transition-colors">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-white font-bold text-base mb-2 group-hover:text-orange-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>

                {/* Connector line (not last) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-orange-500/30 to-transparent z-10" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-xl shadow-orange-500/25 hover:-translate-y-0.5"
          >
            Empezar con la llamada inicial
          </a>
        </div>
      </div>
    </section>
  );
}
