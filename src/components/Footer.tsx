import { Mail, Instagram, Linkedin } from 'lucide-react';
import { FlameLogo } from './FlameLogo';

const links = {
  Servicios: [
    { label: 'Marketplaces', href: '#marketplaces' },
    { label: 'Automatizaciones', href: '#automatizaciones' },
    { label: 'Gestión de Tiendas', href: '#servicios' },
  ],
  Empresa: [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Proceso', href: '#proceso' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contacto', href: '#contacto' },
  ],
};

export function Footer() {
  return (
    <footer
      className="pt-16 pb-8"
      style={{ backgroundColor: 'var(--bg-footer)', borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 pb-12" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="md:col-span-2">
            <a href="#inicio" className="flex items-center gap-3 mb-4 group w-fit">
              <FlameLogo size={30} />
              <div className="flex flex-col leading-none">
                <span
                  className="text-xl font-bold transition-colors"
                  style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  Candela
                </span>
                <span className="text-[9px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'var(--terracota)' }}>
                  Ecommerce Agency
                </span>
              </div>
            </a>
            <p className="text-sm leading-relaxed max-w-xs mb-6" style={{ color: 'var(--text-faint)' }}>
              Agencia especializada en implementación y gestión de tiendas en marketplaces, y en automatización de procesos de venta. Ayudamos a negocios a vender más y trabajar menos.
            </p>
            <a
              href="mailto:wearecandelastudio@gmail.com"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Mail size={15} />
              wearecandelastudio@gmail.com
            </a>
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/wearecandelastudio/', label: 'Instagram' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--border-subtle)',
                    border: '1px solid var(--border-mid)',
                    color: 'var(--text-faint)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--amber)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(232,80,10,0.10)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-mid)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--border-subtle)';
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--text-xfaint)' }}
              >
                {category}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'var(--text-xxfaint)' }}>
            © {new Date().getFullYear()} Candela Agency. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--text-xxfaint)' }}>Hecho con</span>
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mx-0.5">
              <path d="M10 17C10 17 3 13 3 8C3 5.5 5 3 7.5 3C8.5 3 9.5 3.5 10 4.5C10.5 3.5 11.5 3 12.5 3C15 3 17 5.5 17 8C17 13 10 17 10 17Z" fill="#E8500A" opacity="0.6" />
            </svg>
            <span className="text-xs" style={{ color: 'var(--text-xxfaint)' }}>en Espana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
