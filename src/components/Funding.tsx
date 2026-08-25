const banners = [
  {
    src: '/banner-axudas-retorno-emprendedor.png',
    width: 1598,
    height: 1107,
    alt: 'Este negocio púxose en marcha coas Axudas ao Retorno Emprendedor da Secretaría Xeral da Emigración. Xunta de Galicia, Estratexia Galicia Retorna, Xacobeo 2027.',
  },
  {
    src: '/banner-empleo-autonomo-galicia.png',
    width: 1601,
    height: 1132,
    alt: 'Ayudas a la promoción del empleo autónomo en Galicia (TR341D-2026). Xunta de Galicia, Xacobeo 2027, cofinanciado por la Unión Europea, Fondos Europeos.',
  },
];

export function Funding() {
  return (
    <section id="financiacion" className="py-20" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="font-semibold text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
            Financiación
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Con el apoyo de
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.src}
              className="rounded-2xl overflow-hidden p-4 flex items-center justify-center"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)' }}
            >
              <img
                src={banner.src}
                width={banner.width}
                height={banner.height}
                alt={banner.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-xfaint)' }}>
          Este proyecto ha sido puesto en marcha con las Axudas ao Retorno Emprendedor de la Secretaría Xeral da
          Emigración y las Ayudas a la promoción del empleo autónomo en Galicia (TR341D-2026) de la Xunta de Galicia,
          cofinanciadas por la Unión Europea.
        </p>
      </div>
    </section>
  );
}
