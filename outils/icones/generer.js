// Génère toutes les icônes (site, iOS, Android) à partir de outils/icones/icone.svg.
// Usage : node outils/icones/generer.js   (nécessite Playwright et Chromium)
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const svg = fs.readFileSync(path.join(__dirname, 'icone.svg'), 'utf8');
const font = fs.readFileSync(path.join(ROOT, 'public', 'fonts', 'bricolage-var-latin.woff2')).toString('base64');

// Sans fond : premier plan de l'icône adaptative Android (fond = couleur unie).
const foreground = svg.replace(/<rect id="fond-rect"[^>]*\/>/, '');

const ANDROID = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const targets = [
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, 'square'],
  ['public/icons/icon-512.png', 512, 'square'],
  ['public/icons/icon-maskable-512.png', 512, 'maskable'],
  ['public/icons/icon-192.png', 192, 'square'],
  ['public/icons/apple-touch-icon.png', 180, 'square'],
  ['public/icons/favicon-64.png', 64, 'square'],
  ...Object.entries(ANDROID).flatMap(([d, s]) => [
    [`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, s, 'rounded'],
    [`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, s, 'round'],
    [`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, Math.round(s * 2.25), 'foreground'],
  ]),
];

function page(size, shape) {
  const body = shape === 'foreground' ? foreground : svg;
  // maskable / foreground : zone de sécurité, le dessin est réduit au centre
  const inner = shape === 'maskable' ? 0.8 : shape === 'foreground' ? 0.54 : 1;
  const radius = shape === 'round' ? '50%' : shape === 'rounded' ? '22%' : '0';
  return `<!doctype html><html><head><style>
@font-face { font-family: 'Bricolage Grotesque'; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }
html, body { margin: 0; background: transparent; }
.box { width: ${size}px; height: ${size}px; border-radius: ${radius}; overflow: hidden; display: grid; place-items: center;
  background: ${shape === 'foreground' ? 'transparent' : 'linear-gradient(135deg, #ffd64a, #ffb21e)'}; }
.box svg { width: ${size * inner}px; height: ${size * inner}px; display: block; }
</style></head><body><div class="box">${body}</div></body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  for (const [rel, size, shape] of targets) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(page(size, shape));
    await p.evaluate(() => document.fonts.ready);
    const transparent = shape === 'round' || shape === 'rounded' || shape === 'foreground';
    await p.locator('.box').screenshot({ path: path.join(ROOT, rel), omitBackground: transparent });
    console.log(`${rel} (${size}px)`);
  }
  await browser.close();
})();
