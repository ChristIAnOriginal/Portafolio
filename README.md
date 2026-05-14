# Portafolio Teatral

Portafolio artístico estático para una actriz de teatro, construido con HTML, CSS y JavaScript puros — sin frameworks ni build steps. Tres versiones visuales seleccionables desde una landing común.

## Cómo ver el sitio

Abre `index.html` con doble clic en cualquier navegador. No requiere servidor.

## Estructura

```
PortafolioArtistico/
├── index.html              ← Landing: selector de versión
├── expresivo/              ← Versión 1
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── mosaico/                ← Versión 2
│   ├── index.html          (galería principal)
│   ├── sobre.html
│   ├── contacto.html
│   ├── css/ (base, mosaic, pages)
│   └── js/ (nav, mosaic, contact)
└── lineas/                 ← Versión 3
    ├── index.html
    ├── styles.css
    └── script.js
```

## Las tres versiones

**01 — Expresivo.** Single-page con paleta vibrante (borgoña, mostaza, magenta), layout asimétrico tipo collage, fotos rotadas con sombras duras. Incluye un selector secundario para alternar a un sub-tema *Clásico teatral* (negro velvet + dorado antiguo + todo serif).

**02 — Mosaico.** Multi-página editorial fotográfico con fondo negro, fotos protagonistas en grid masonry asimétrico, hover reveals con título/rol/año, lightbox con navegación por teclado, filtros por categoría y páginas separadas para Obras, Sobre y Contacto.

**03 — Líneas.** Single-page tipográfico con sólo tres colores (papel cremoso, tinta, acento rojo terracota). Líneas como protagonistas: reglas horizontales con topes, subrayados SVG ondulados, leaders punteados estilo índice de libro, tachados diagonales, timeline con markers, textura sutil de papel rayado.

## Navegación entre versiones

Cada versión tiene una barra fija en la parte superior con un botón `← Inicio` y un selector con las tres opciones (Expresivo · Mosaico · Líneas), de modo que se puede saltar entre ellas en cualquier momento.

## Contenido

Los datos del portafolio son de ejemplo (nombre, obras, trayectoria, contacto) y se reemplazan editando directamente el HTML. Las imágenes usan `picsum.photos` con seeds estables — sustituir los `src` por fotos reales.

## Despliegue

Cualquier hosting estático funciona. Sugeridos:

- [Netlify Drop](https://app.netlify.com/drop) — arrastra la carpeta y queda publicado
- GitHub Pages — habilita Pages sobre la rama `main`
- Cloudflare Pages
