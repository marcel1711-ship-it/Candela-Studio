import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import './globals.css';

/**
 * Tipografías auto-hospedadas.
 *
 * NO se usa `next/font/google`: esa API descarga las fuentes desde Google
 * DURANTE el build, así que una falla de red en ese momento tumba el deploy
 * entero con un error que no dice nada ("Cannot read properties of null").
 * Ya nos pasó en el primer despliegue a Vercel.
 *
 * Con los .woff2 en el repo el build no depende de nadie. De paso: una
 * petición menos para el visitante, y ningún dato suyo viaja a Google.
 *
 * Son fuentes VARIABLES, así que un solo archivo cubre todo el rango de
 * pesos. El subconjunto `latin` (U+0000–00FF) ya incluye ñ, acentos, ¿ y ¡.
 */
const display = localFont({
  src: [
    { path: '../fonts/playfair.woff2',        weight: '400 700', style: 'normal' },
    { path: '../fonts/playfair-italic.woff2', weight: '400 700', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const sans = localFont({
  src: [{ path: '../fonts/inter.woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Tienda',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#171210',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
