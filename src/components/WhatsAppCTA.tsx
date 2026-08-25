import { MessageCircle, Clock, ShieldCheck } from 'lucide-react';

// Numero de WhatsApp en formato internacional, solo digitos (sin + ni espacios).
const WHATSAPP_NUMBER = '13465423212';
const WHATSAPP_DISPLAY = '+1 (346) 542-3212';
const WHATSAPP_MESSAGE = 'Hola Candela Studio, quiero informacion sobre vender en marketplaces.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const CONTACT_EMAIL = 'wearecandelastudio@gmail.com';

const WhatsAppIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.91-9.91a9.85 9.85 0 0 0-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c-.002 4.54-3.7 8.22-8.24 8.22Z"/>
  </svg>
);

export function WhatsAppCTA() {
  return (
    <section id="contacto" className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl" style={{ backgroundColor: 'var(--glow-orb-1)' }} />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>Dar el primer paso</p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Escríbenos y{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--amber), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              empecemos hoy
            </span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Sin formularios ni esperas. Escríbenos por WhatsApp y te respondemos personalmente.
          </p>
        </div>

        <div
          className="theme-card rounded-3xl p-8 md:p-12 text-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ backgroundColor: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.28)', color: '#128C4A' }}
          >
            <WhatsAppIcon size={30} />
          </div>

          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Hablemos por WhatsApp
          </h3>
          <p className="max-w-md mx-auto mb-8" style={{ color: 'var(--text-muted)' }}>
            Cuéntanos qué vendes y qué quieres conseguir. Te decimos si podemos ayudarte y cómo, sin compromiso.
          </p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 font-semibold px-9 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5 text-base w-full sm:w-auto"
            style={{ backgroundColor: '#25D366', color: '#0B2E1A', boxShadow: '0 8px 24px rgba(37,211,102,0.30)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1EBE5A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#25D366'; }}
          >
            <WhatsAppIcon size={20} />
            Escribirnos por WhatsApp
          </a>

          <p className="mt-4 text-sm" style={{ color: 'var(--text-faint)' }}>
            {WHATSAPP_DISPLAY}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-8 pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Clock size={15} style={{ color: 'var(--accent)' }} />
              Respuesta el mismo día
            </span>
            <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <ShieldCheck size={15} style={{ color: 'var(--accent)' }} />
              Sin compromiso
            </span>
            <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <MessageCircle size={15} style={{ color: 'var(--accent)' }} />
              Te atendemos en español
            </span>
          </div>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-xfaint)' }}>
          También puedes escribirnos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--amber)' }}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}
