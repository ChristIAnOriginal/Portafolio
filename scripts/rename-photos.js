#!/usr/bin/env node
/**
 * Renombra las fotos de resources/photos/<categoria>/ a un esquema limpio:
 *   <slug-categoria>-NN.<ext>
 *
 * Lee y actualiza los manifiestos en resources/photos-manifests/<Categoria>.json
 * preservando el orden original que ya esta en el JSON.
 *
 * Si encuentra una carpeta nueva en resources/photos/ sin manifest, la crea
 * automaticamente usando un orden natural (numerico) de los nombres actuales.
 *
 * Uso:
 *   node scripts/rename-photos.js           -> dry-run (no toca archivos)
 *   node scripts/rename-photos.js --apply   -> ejecuta los renames
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PHOTOS_DIR = path.join(ROOT, 'resources', 'photos');
const MANIFESTS_DIR = path.join(ROOT, 'resources', 'photos-manifests');
const APPLY = process.argv.includes('--apply');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic']);

const slugify = (str) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// "BatallaDeLasEstrellas" -> "Batalla De Las Estrellas"
const humanizeFolder = (name) => {
  if (/\s/.test(name)) return name;
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
};

const naturalCompare = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const pad = (n, w) => String(n).padStart(w, '0');

if (!fs.existsSync(MANIFESTS_DIR)) {
  console.error(`Manifests dir not found: ${MANIFESTS_DIR}`);
  process.exit(1);
}
if (!fs.existsSync(PHOTOS_DIR)) {
  console.error(`Photos dir not found: ${PHOTOS_DIR}`);
  process.exit(1);
}

console.log(APPLY ? 'Mode: APPLY (renaming files)' : 'Mode: DRY-RUN (no files touched, use --apply to execute)');
console.log('');

// Discover folders without manifest and create one
const existingManifestFolders = new Set(
  fs.readdirSync(MANIFESTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, f), 'utf8'));
      return data.folder;
    })
);

const photoFolders = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let totalCreated = 0;
for (const folderName of photoFolders) {
  if (existingManifestFolders.has(folderName)) continue;

  const folderPath = path.join(PHOTOS_DIR, folderName);
  const images = fs.readdirSync(folderPath)
    .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort(naturalCompare);

  if (images.length === 0) {
    console.warn(`SKIP new folder (no images): ${folderName}`);
    continue;
  }

  const label = humanizeFolder(folderName);
  const manifest = {
    category: label,
    folder: folderName,
    count: images.length,
    images,
  };
  const manifestPath = path.join(MANIFESTS_DIR, `${label}.json`);

  console.log(`NEW manifest: ${path.basename(manifestPath)} (${images.length} fotos)`);
  if (APPLY) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }
  totalCreated++;
}

if (totalCreated > 0) console.log('');

const manifestFiles = fs.readdirSync(MANIFESTS_DIR).filter(f => f.endsWith('.json'));
let totalRenamed = 0;
let totalSkipped = 0;
let totalMissing = 0;

for (const manifestFile of manifestFiles) {
  const manifestPath = path.join(MANIFESTS_DIR, manifestFile);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const folder = path.join(PHOTOS_DIR, manifest.folder);

  if (!fs.existsSync(folder)) {
    console.warn(`SKIP folder (missing): ${manifest.folder}`);
    continue;
  }

  const slug = slugify(manifest.folder);
  const width = Math.max(2, String(manifest.images.length).length);

  const plan = [];
  const newImages = [];

  manifest.images.forEach((oldName, idx) => {
    const ext = path.extname(oldName).toLowerCase();
    const newName = `${slug}-${pad(idx + 1, width)}${ext}`;
    newImages.push(newName);

    if (oldName === newName) {
      plan.push({ skip: true, oldName, newName });
      return;
    }

    const oldPath = path.join(folder, oldName);
    if (!fs.existsSync(oldPath)) {
      plan.push({ missing: true, oldName, newName });
      return;
    }

    plan.push({ oldName, newName, oldPath, newPath: path.join(folder, newName) });
  });

  const renames = plan.filter(p => !p.skip && !p.missing);
  const skips = plan.filter(p => p.skip);
  const missing = plan.filter(p => p.missing);

  console.log(`\n[${manifest.folder}] ${renames.length} rename(s), ${skips.length} already ok, ${missing.length} missing`);

  for (const r of renames) {
    console.log(`  ${r.oldName}  ->  ${r.newName}`);
  }
  for (const m of missing) {
    console.log(`  MISSING ${m.oldName}`);
  }

  if (APPLY) {
    // Phase 1: rename source -> source.tmp to avoid intra-folder collisions
    for (const r of renames) {
      const tmpPath = r.newPath + '.renaming.tmp';
      fs.renameSync(r.oldPath, tmpPath);
      r.tmpPath = tmpPath;
    }
    // Phase 2: tmp -> final
    for (const r of renames) {
      fs.renameSync(r.tmpPath, r.newPath);
    }
    // Update manifest
    manifest.images = newImages;
    manifest.count = newImages.length;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`  manifest updated: ${manifestFile}`);
  }

  totalRenamed += renames.length;
  totalSkipped += skips.length;
  totalMissing += missing.length;
}

console.log('');
console.log('============================================================');
console.log(`New manifests: ${totalCreated}  |  Renames: ${totalRenamed}  |  Already ok: ${totalSkipped}  |  Missing: ${totalMissing}`);
if (!APPLY) console.log('Dry run only. Re-run with --apply to execute.');
else console.log('Done.');
