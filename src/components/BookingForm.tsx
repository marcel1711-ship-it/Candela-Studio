import { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, AlertCircle, Instagram, Facebook, ArrowRight, Calendar } from 'lucide-react';

const CALENDLY_URL = 'https://calendly.com/ma-rodriguezlorenzo89/30min';

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
  business_type: string;
  service_needed: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  message: string;
}

const initialState: FormState = {
  name: '', email: '',
  business_type: '', service_needed: '',
  instagram: '', tiktok: '', facebook: '',
  message: '',
};

const focusOn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = 'rgba(201,66,8,0.55)';
  e.target.style.boxShadow = '0 0 0 3px rgba(201,66,8,0.10)';
};
const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = 'var(--border-subtle)';
  e.target.style.boxShadow = 'none';
};

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement; prefill?: Record<string, string>; utm?: Record<string, string> }) => void;
    };
  }
}

function CalendlyWidget({ name, email }: { name: string; email: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = () => {
      if (containerRef.current && window.Calendly) {
        containerRef.current.innerHTML = '';
        window.Calendly.initInlineWidget({
          url: CALENDLY_URL,
          parentElement: containerRef.current,
          prefill: { name, email },
        });
      }
    };

    if (window.Calendly) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.Calendly) {
          clearInterval(interval);
          init();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [name, email]);

  return (
    <div
      ref={containerRef}
      style={{ minWidth: '320px', height: '700px' }}
      className="rounded-2xl overflow-hidden"
    />
  );
}

export function BookingForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState<'form' | 'calendly' | 'done'>('form');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.service_needed) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      return;
    }
    setSubmitStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-lead-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error desconocido');
    } catch (err) {
      console.error('send-lead-email error:', err);
      setSubmitStatus('error');
      setErrorMsg('Hubo un problema al enviar. Por favor intenta de nuevo.');
      return;
    }

    setSubmitStatus('idle');
    setStep('calendly');
  };

  useEffect(() => {
    if (step !== 'calendly') return;
    const handler = (e: MessageEvent) => {
      if (e.data?.event === 'calendly.event_scheduled') {
        setStep('done');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [step]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '11px 14px',
    color: 'var(--text-body)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
  };

  return (
    <section id="contacto" className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl" style={{ backgroundColor: 'var(--glow-orb-1)' }} />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Dar el primer paso</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Empieza a organizar y{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              escalar tu negocio
            </span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            {step === 'form'
              ? 'Completa el formulario y elige el horario que mejor te venga para la llamada gratuita de 30 minutos.'
              : step === 'calendly'
              ? 'Elige el día y la hora que más te convenga.'
              : 'Tu llamada está confirmada.'}
          </p>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {(['form', 'calendly'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      backgroundColor: step === s ? 'var(--accent)' : (step === 'calendly' && s === 'form') ? 'rgba(34,197,94,0.15)' : 'var(--bg-input)',
                      color: step === s ? '#fff' : (step === 'calendly' && s === 'form') ? '#22c55e' : 'var(--text-faint)',
                      border: `1px solid ${step === s ? 'var(--accent)' : (step === 'calendly' && s === 'form') ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {step === 'calendly' && s === 'form' ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium" style={{ color: step === s ? 'var(--text-primary)' : 'var(--text-faint)' }}>
                    {s === 'form' ? 'Tus datos' : 'Elige horario'}
                  </span>
                </div>
                {i === 0 && (
                  <div className="w-8 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className="theme-card rounded-3xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >

          {/* ── STEP 1: Form ── */}
          {step === 'form' && (
            <div className="p-7 md:p-10">
              <form onSubmit={handleFormSubmit} className="space-y-6">

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-xfaint)' }}>Datos de contacto</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Nombre <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre completo" style={inputStyle} required onFocus={focusOn} onBlur={focusOff} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" style={inputStyle} required onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-xfaint)' }}>Redes sociales</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-xfaint)' }}>Opcional — nos ayuda a conocer tu negocio antes de la llamada</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <Instagram size={11} style={{ color: 'var(--accent)' }} />
                          Instagram
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none" style={{ color: 'var(--text-xfaint)' }}>@</span>
                        <input type="text" name="instagram" value={form.instagram} onChange={handleChange} placeholder="usuario" style={{ ...inputStyle, paddingLeft: '28px' }} onFocus={focusOn} onBlur={focusOff} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--accent)"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.82 1.55V6.79a4.85 4.85 0 0 1-1.05-.1z"/></svg>
                          TikTok
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none" style={{ color: 'var(--text-xfaint)' }}>@</span>
                        <input type="text" name="tiktok" value={form.tiktok} onChange={handleChange} placeholder="usuario" style={{ ...inputStyle, paddingLeft: '28px' }} onFocus={focusOn} onBlur={focusOff} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <Facebook size={11} style={{ color: 'var(--accent)' }} />
                          Facebook
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none" style={{ color: 'var(--text-xfaint)' }}>@</span>
                        <input type="text" name="facebook" value={form.facebook} onChange={handleChange} placeholder="pagina" style={{ ...inputStyle, paddingLeft: '28px' }} onFocus={focusOn} onBlur={focusOff} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-xfaint)' }}>Tu negocio</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Tipo de negocio</label>
                      <select name="business_type" value={form.business_type} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' }} onFocus={focusOn} onBlur={focusOff}>
                        <option value="">Selecciona una opción</option>
                        {businessTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Qué necesitas <span style={{ color: 'var(--accent)' }}>*</span></label>
                      <select name="service_needed" value={form.service_needed} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' }} required onFocus={focusOn} onBlur={focusOff}>
                        <option value="">Selecciona un servicio</option>
                        {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Cuéntanos más (opcional)</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                    placeholder="Describe brevemente tu situación actual y qué quieres conseguir..."
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={focusOn} onBlur={focusOff}
                  />
                </div>

                {errorMsg && (
                  <div
                    className="flex items-center gap-2 rounded-xl px-4 py-3"
                    style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.18)' }}
                  >
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-500">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitStatus === 'loading'}
                  className="w-full flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--accent)', color: '#FFFAF5', boxShadow: '0 4px 14px rgba(201,66,8,0.25)' }}
                  onMouseEnter={(e) => { if (submitStatus !== 'loading') (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent)'; }}
                >
                  {submitStatus === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Continuar y elegir horario
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs" style={{ color: 'var(--text-xfaint)' }}>
                  Sin compromiso. Llamada gratuita de 30 minutos.
                </p>
              </form>
            </div>
          )}

          {/* ── STEP 2: Calendly ── */}
          {step === 'calendly' && (
            <div>
              <div className="px-7 md:px-10 pt-8 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="rounded-xl p-2.5" style={{ backgroundColor: 'rgba(201,66,8,0.10)' }}>
                  <Calendar size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Elige fecha y hora para tu llamada</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    Hola <strong style={{ color: 'var(--text-muted)' }}>{form.name}</strong> — selecciona el horario que mejor te venga
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <CalendlyWidget name={form.name} email={form.email} />
              </div>
            </div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 'done' && (
            <div className="p-7 md:p-10 flex flex-col items-center gap-4 py-16 text-center">
              <div
                className="rounded-full p-4 mb-2"
                style={{ backgroundColor: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <CheckCircle size={44} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                Llamada confirmada
              </h3>
              <p className="max-w-sm text-base" style={{ color: 'var(--text-muted)' }}>
                Perfecto, <strong>{form.name}</strong>. Revisa tu email — te hemos enviado la confirmacion con el enlace de la llamada.
              </p>
              <div
                className="mt-4 rounded-2xl px-6 py-4 text-sm text-left"
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Que esperar:</p>
                <ul className="space-y-1" style={{ color: 'var(--text-muted)' }}>
                  <li>• Confirmacion por email con enlace de videollamada</li>
                  <li>• Llamada de 30 minutos sin compromiso</li>
                  <li>• Plan de accion personalizado para tu negocio</li>
                </ul>
              </div>
              <button
                onClick={() => { setStep('form'); setForm(initialState); }}
                className="mt-4 text-sm underline"
                style={{ color: 'var(--amber)' }}
              >
                Volver al inicio
              </button>
            </div>
          )}

        </div>

        {/* Send another */}
        {step === 'form' && (
          <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-xfaint)' }}>
            <Send size={11} className="inline mr-1" />
            Tambien puedes escribirnos directamente a{' '}
            <a href="mailto:hola@candelaconversion.com" style={{ color: 'var(--amber)' }}>
              hello@wearecandela.com
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
