# Portafolio Teatral · Annia Victoria García Páez

Portafolio artístico estático, construido con HTML, CSS y JavaScript puros — sin frameworks ni build steps.

## Cómo ver el sitio

Abrir `index.html` en cualquier navegador. No requiere servidor.

## Estructura

```
PortafolioArtistico/
├── index.html          ← Sitio principal
├── styles.css
├── script.js
├── favicon.svg
├── resources/
│   └── photos-manifests/   ← Manifests JSON de cada categoría de galería
└── scripts/
    └── rename-photos.js    ← Renombra fotos y arma manifests
```

Las fotos, el video del hero y la foto de "Sobre mí" se sirven desde Cloudflare R2.

## Despliegue

Cualquier hosting estático sirve:

- GitHub Pages — habilitar Pages sobre la rama `main` (raíz `/`)
- Netlify Drop, Cloudflare Pages, Vercel

## Renombrar fotos nuevas

Cuando se agregan fotos a `resources/photos/<Categoria>/`:

```bash
node scripts/rename-photos.js           # dry-run
node scripts/rename-photos.js --apply   # ejecuta
```

El script crea/actualiza el manifest correspondiente en `resources/photos-manifests/`. Después hay que subir las fotos a R2 y registrar la categoría en `GALLERY_DATA` dentro de `script.js`.
