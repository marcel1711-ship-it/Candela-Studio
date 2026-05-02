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
    <section id="automatizaciones" className="bg-[#0a0a0a] py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">Transformación real</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            De procesos manuales a{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              sistemas automatizados
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            Así se ve el negocio antes y después de trabajar con Candela.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Before */}
          <div className="bg-[#141414] border border-red-900/30 rounded-3xl p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-900/40 border border-red-700/40 rounded-full px-4 py-1.5">
                  <span className="text-red-400 text-sm font-semibold">Antes</span>
                </div>
                <div className="flex-1 h-px bg-red-900/30" />
              </div>
              <ul className="space-y-3">
                {before.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                    <XCircle size={16} className="text-red-500/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* After */}
          <div className="bg-[#141414] border border-orange-500/30 rounded-3xl p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5">
                  <span className="text-orange-400 text-sm font-semibold">Con Candela</span>
                </div>
                <div className="flex-1 h-px bg-orange-500/20" />
              </div>
              <ul className="space-y-3">
                {after.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-200 text-sm">
                    <CheckCircle size={16} className="text-orange-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Center arrow */}
        <div className="flex justify-center my-6 md:hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-3 shadow-lg shadow-orange-500/30">
            <ArrowRight size={20} className="text-white" />
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-xl shadow-orange-500/25 hover:-translate-y-0.5"
          >
            Quiero automatizar mi negocio
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
