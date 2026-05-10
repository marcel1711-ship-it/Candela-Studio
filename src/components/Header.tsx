import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { FlameLogo } from './FlameLogo';

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Marketplaces', href: '#marketplaces' },
  { label: 'Automatizaciones', href: '#automatizaciones' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Contacto', href: '#contacto' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        backgroundColor: scrolled ? 'color-mix(in srgb, var(--bg-primary) 96%, transparent)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.2)' : 'none',
      }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <a href="#inicio" className="flex items-center gap-3 group">
            <FlameLogo size={38} />
            <div className="flex flex-col leading-none">
              <span
                className="text-xl font-bold tracking-tight transition-colors duration-200"
                style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Candela
              </span>
              <span className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--terracota)' }}>
                Ecommerce Agency
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wide transition-colors duration-200"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contacto"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#FFFAF5',
                boxShadow: '0 4px 14px rgba(232,80,10,0.30)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            >
              Agendar llamada
            </a>
            <button
              className="md:hidden p-1 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden backdrop-blur-md"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 98%, transparent)', borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-2 font-medium transition-colors"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setMenuOpen(false)}
              className="mt-2 text-center font-semibold py-3 rounded-full"
              style={{ backgroundColor: 'var(--accent)', color: '#FFFAF5' }}
            >
              Agendar llamada
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
