import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const serviceOptions = [
  'Marketplaces (Amazon, TikTok Shop, etc.)',
  'Tienda online',
  'Automatización de procesos',
  'CRM y seguimiento de clientes',
  'No estoy seguro, necesito orientación',
];

const businessTypes = [
  'Tienda física / local',
  'Ecommerce existente',
  'Negocio de servicios',
  'Restaurante / alimentación',
  'Otro',
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  business_type: string;
  service_needed: string;
  preferred_date: string;
  message: string;
}

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  business_type: '',
  service_needed: '',
  preferred_date: '',
  message: '',
};

export function BookingForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.service_needed) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.from('leads').insert([form]);

    if (error) {
      setStatus('error');
      setErrorMsg('Hubo un problema al enviar el formulario. Por favor intenta de nuevo.');
    } else {
      setStatus('success');
      setForm(initialState);
    }
  };

  return (
    <section id="contacto" className="bg-[#0d0d0d] py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <p className="text-orange-500 font-semibold text-sm tracking-widest uppercase mb-3">Dar el primer paso</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Empieza a organizar y{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              escalar tu negocio
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Rellena el formulario y te contactamos para agendar una llamada gratuita de 30 minutos.
          </p>
        </div>

        {/* Calendar integration placeholder */}
        <div className="bg-[#141414] border border-dashed border-orange-500/30 rounded-2xl p-5 mb-8 text-center">
          <p className="text-orange-400/70 text-sm">
            Calendly / GoHighLevel Calendar se integrará aquí para seleccionar fecha y hora automáticamente.
          </p>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-3xl p-7 md:p-10 shadow-2xl">
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded-full p-4">
                <CheckCircle size={40} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Solicitud recibida</h3>
              <p className="text-gray-400 max-w-sm">
                Genial! Hemos recibido tu solicitud y te contactaremos en menos de 24 horas para confirmar tu llamada.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-2 text-orange-400 hover:text-orange-300 text-sm underline"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Nombre <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                    className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Email <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Teléfono <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+34 600 000 000"
                    className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Empresa / Negocio
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Nombre de tu empresa"
                    className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Tipo de negocio
                  </label>
                  <select
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
                    className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all appearance-none text-white"
                  >
                    <option value="" className="text-gray-600 bg-[#1c1c1c]">Selecciona una opción</option>
                    {businessTypes.map((bt) => (
                      <option key={bt} value={bt} className="bg-[#1c1c1c]">{bt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Qué necesitas <span className="text-orange-500">*</span>
                  </label>
                  <select
                    name="service_needed"
                    value={form.service_needed}
                    onChange={handleChange}
                    className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all appearance-none text-white"
                    required
                  >
                    <option value="" className="text-gray-600 bg-[#1c1c1c]">Selecciona un servicio</option>
                    {serviceOptions.map((s) => (
                      <option key={s} value={s} className="bg-[#1c1c1c]">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Fecha / hora preferida
                </label>
                <input
                  type="text"
                  name="preferred_date"
                  value={form.preferred_date}
                  onChange={handleChange}
                  placeholder="Ej: Lunes por la tarde, cualquier miércoles..."
                  className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Cuéntanos más (opcional)
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe brevemente tu situación actual y qué quieres conseguir..."
                  className="w-full bg-[#1c1c1c] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 text-base"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Agendar llamada gratuita
                    <Send size={16} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-600">
                Sin compromiso. Te contactaremos en menos de 24 horas.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
