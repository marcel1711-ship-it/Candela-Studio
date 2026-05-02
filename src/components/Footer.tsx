import { Mail, Instagram, Linkedin, Twitter } from 'lucide-react';
import { FlameLogo } from './FlameLogo';

const links = {
  Servicios: [
    { label: 'Marketplaces', href: '#marketplaces' },
    { label: 'Tienda Online', href: '#servicios' },
    { label: 'Automatizaciones', href: '#automatizaciones' },
    { label: 'Negocios Locales', href: '#servicios' },
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
    <footer className="bg-[#080808] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="#inicio" className="flex items-center gap-3 mb-4 group w-fit">
              <FlameLogo size={30} />
              <span className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">Candela</span>
            </a>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              Agencia especializada en implementación de tiendas online y automatización de procesos de venta. Ayudamos a negocios a vender más y trabajar menos.
            </p>
            <a
              href="mailto:hola@candela.agency"
              className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors text-sm"
            >
              <Mail size={15} />
              hola@candela.agency
            </a>
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Twitter, href: '#', label: 'Twitter' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/10 transition-all duration-200"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">{category}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
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
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} Candela Agency. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-700">Hecho con</span>
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mx-0.5">
              <path
                d="M10 17C10 17 3 13 3 8C3 5.5 5 3 7.5 3C8.5 3 9.5 3.5 10 4.5C10.5 3.5 11.5 3 12.5 3C15 3 17 5.5 17 8C17 13 10 17 10 17Z"
                fill="#FF4500"
                opacity="0.7"
              />
            </svg>
            <span className="text-xs text-gray-700">en Espana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
