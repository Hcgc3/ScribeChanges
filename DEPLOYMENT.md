# Guia de Deployment - Sheet Music Viewer

Este documento fornece instruções detalhadas para fazer o deployment do aplicativo Sheet Music Viewer em diferentes ambientes.

## 🚀 Opções de Deployment

### 1. Netlify (Recomendado)
Ideal para aplicações React estáticas com CI/CD automático.

#### Configuração
```bash
# Build do projeto
pnpm build

# Deploy manual
npx netlify-cli deploy --prod --dir=dist

# Deploy automático via Git
# 1. Conecte seu repositório ao Netlify
# 2. Configure build command: pnpm build
# 3. Configure publish directory: dist
```

#### Configurações Netlify
```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Vercel
Excelente para aplicações React com otimizações automáticas.

#### Configuração
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Ou conecte via GitHub para deploy automático
```

#### Configurações Vercel
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 3. GitHub Pages
Gratuito para repositórios públicos.

#### Configuração
```bash
# Instalar gh-pages
pnpm add -D gh-pages

# Adicionar scripts no package.json
"scripts": {
  "predeploy": "pnpm build",
  "deploy": "gh-pages -d dist"
}

# Deploy
pnpm deploy
```

#### Configuração Vite para GitHub Pages
```js
// vite.config.js
export default defineConfig({
  base: '/sheet-music-viewer/', // Nome do repositório
  plugins: [react()],
})
```

### 4. Firebase Hosting
Hosting rápido e confiável do Google.

#### Configuração
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Deploy
firebase deploy
```

#### Configuração Firebase
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 5. AWS S3 + CloudFront
Para aplicações enterprise com CDN global.

#### Configuração
```bash
# Build
pnpm build

# Sync para S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 Configurações de Build

### Variáveis de Ambiente
```bash
# .env.production
VITE_APP_TITLE="Sheet Music Viewer"
VITE_APP_VERSION="1.0.0"
VITE_API_URL="https://api.yourapp.com"
```

### Otimizações de Build
```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          audio: ['tone', '@tonejs/midi'],
          ui: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

## 🌐 Configuração de Domínio

### DNS Configuration
```
# Para domínio personalizado
CNAME www.yourapp.com -> your-app.netlify.app
A     yourapp.com     -> 192.0.2.1 (IP do provider)
```

### SSL/HTTPS
- **Netlify/Vercel**: SSL automático
- **CloudFlare**: SSL gratuito + CDN
- **Let's Encrypt**: SSL gratuito para servidores próprios

## 📊 Monitoramento e Analytics

### Google Analytics
```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Sentry)
```bash
# Install Sentry
pnpm add @sentry/react @sentry/tracing

# Configure
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

## 🔒 Segurança

### Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.youtube.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  media-src 'self' blob:;
  connect-src 'self' https://api.youtube.com;
">
```

### Headers de Segurança
```
# _headers (Netlify)
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

## 🚀 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run tests
      run: pnpm test
    
    - name: Build
      run: pnpm build
    
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📱 PWA Configuration

### Service Worker
```js
// public/sw.js
const CACHE_NAME = 'sheet-music-viewer-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

### Manifest
```json
{
  "name": "Sheet Music Viewer",
  "short_name": "MusicViewer",
  "description": "Interactive sheet music visualization",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#7c3aed",
  "background_color": "#0f172a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔍 SEO Optimization

### Meta Tags
```html
<!-- index.html -->
<meta name="description" content="Interactive sheet music viewer with MIDI playback and audio synchronization">
<meta name="keywords" content="sheet music, MIDI, music notation, audio sync">
<meta property="og:title" content="Sheet Music Viewer">
<meta property="og:description" content="Interactive sheet music visualization">
<meta property="og:image" content="/og-image.png">
<meta property="og:url" content="https://yourapp.com">
<meta name="twitter:card" content="summary_large_image">
```

### Sitemap
```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourapp.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

## 📈 Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
pnpm add -D rollup-plugin-visualizer

# Generate report
pnpm build --analyze
```

### Lazy Loading
```jsx
// Lazy load components
const MyScoresManager = lazy(() => import('./components/MyScoresManager'));
const PerformanceMonitor = lazy(() => import('./components/PerformanceMonitor'));
```

### Preloading
```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/api/sample.mid" as="fetch" crossorigin>
```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache
pnpm store prune
rm -rf node_modules
pnpm install

# Check Node version
node --version  # Should be 18+
```

#### MIME Type Issues
```
# _redirects (Netlify)
/static/js/*  /static/js/:splat  200
/static/css/* /static/css/:splat 200
```

#### CORS Issues
```js
// vite.config.js
export default defineConfig({
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
```

### Performance Issues
- Use React DevTools Profiler
- Monitor bundle size
- Implement code splitting
- Optimize images and assets

## 📞 Support

Para problemas de deployment:
1. Verifique logs de build
2. Teste localmente primeiro
3. Consulte documentação do provider
4. Use ferramentas de debug do navegador

---

**Deployment bem-sucedido = Aplicativo acessível ao mundo! 🌍**

