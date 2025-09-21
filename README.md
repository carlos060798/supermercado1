🏪 Minisupermercado PWA - Setup Completo
🚀 PASO 1: Instalación Inicial
Crear el proyecto
bash
# Crear proyecto Next.js 14 con TypeScript
npx create-next-app@latest minisupermercado-pwa --typescript --tailwind --eslint --app --src-dir
cd minisupermercado-pwa

# Limpiar archivos innecesarios
rm -rf src/app/globals.css
rm -rf src/app/page.module.css
Instalar todas las dependencias
bash
# 📦 Backend Dependencies (Días 1-3)
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
npm install openai anthropic groq-sdk
npm install uuid @types/uuid
npm install zod

# 📦 PWA Dependencies (Días 4-5)
npm install next-pwa workbox-webpack-plugin
npm install dexie

# 📦 UI Dependencies
npm install @heroicons/react lucide-react
npm install react-hook-form @hookform/resolvers
npm install recharts
npm install xlsx

# 📦 Dev Dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D prisma
________________________________________
📁 PASO 2: Estructura de Carpetas
minisupermercado-pwa/
├── 📁 prisma/
│   ├── schema.prisma           # Esquema de base de datos
│   ├── seed.ts                 # Datos iniciales
│   └── 📁 migrations/          # Migraciones automáticas
├── 📁 src/
│   ├── 📁 app/                 # Next.js 14 App Router
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Página de inicio
│   │   ├── globals.css         # Estilos globales
│   │   ├── 📁 api/             # ⭐ BACKEND APIs
│   │   │   ├── 📁 auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── profile/route.ts
│   │   │   ├── 📁 products/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── 📁 sales/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── 📁 users/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── 📁 reports/
│   │   │   │   ├── daily/route.ts
│   │   │   │   ├── excel/route.ts
│   │   │   │   └── analytics/route.ts
│   │   │   ├── 📁 ai/
│   │   │   │   ├── assistant/route.ts
│   │   │   │   ├── predictions/route.ts
│   │   │   │   └── insights/route.ts
│   │   │   ├── 📁 cash/
│   │   │   │   ├── open/route.ts
│   │   │   │   └── close/route.ts
│   │   │   └── 📁 sync/
│   │   │       ├── upload/route.ts
│   │   │       └── download/route.ts
│   │   ├── 📁 login/
│   │   │   └── page.tsx
│   │   └── 📁 dashboard/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── 📁 products/
│   │       │   └── page.tsx
│   │       ├── 📁 sales/
│   │       │   └── page.tsx
│   │       ├── 📁 reports/
│   │       │   └── page.tsx
│   │       └── 📁 settings/
│   │           └── page.tsx
│   ├── 📁 lib/                 # ⭐ LÓGICA DE NEGOCIO
│   │   ├── 📁 database/
│   │   │   ├── connection.ts
│   │   │   └── models.ts
│   │   ├── 📁 auth/
│   │   │   ├── middleware.ts
│   │   │   ├── utils.ts
│   │   │   └── session.ts
│   │   ├── 📁 ai/
│   │   │   ├── balancer.ts
│   │   │   ├── assistant.ts
│   │   │   ├── openai.ts
│   │   │   ├── claude.ts
│   │   │   └── groq.ts
│   │   ├── 📁 offline/
│   │   │   ├── indexeddb.ts
│   │   │   ├── sync-manager.ts
│   │   │   └── pwa-utils.ts
│   │   ├── 📁 reports/
│   │   │   ├── excel-generator.ts
│   │   │   └── analytics.ts
│   │   └── utils.ts
│   ├── 📁 components/          # ⭐ COMPONENTES UI
│   │   ├── 📁 ui/              # Componentes base
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   └── table.tsx
│   │   ├── 📁 layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   ├── 📁 forms/
│   │   │   ├── product-form.tsx
│   │   │   ├── sale-form.tsx
│   │   │   └── login-form.tsx
│   │   ├── 📁 dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── sales-chart.tsx
│   │   │   └── inventory-alerts.tsx
│   │   └── 📁 pwa/
│   │       ├── install-prompt.tsx
│   │       ├── offline-indicator.tsx
│   │       └── sync-status.tsx
│   ├── 📁 hooks/               # React Hooks personalizados
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useSales.ts
│   │   ├── useOffline.ts
│   │   └── useAI.ts
│   ├── 📁 types/               # Definiciones TypeScript
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── sale.ts
│   │   └── api.ts
│   └── 📁 utils/               # Utilidades generales
│       ├── constants.ts
│       ├── formatters.ts
│       └── validators.ts
├── 📁 public/                  # ⭐ PWA FILES
│   ├── manifest.json           # PWA Manifest
│   ├── sw.js                   # Service Worker
│   ├── 📁 icons/               # Íconos PWA
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── favicon.ico
│   └── 📁 images/
├── .env.local                  # Variables de entorno
├── .env.example                # Ejemplo de variables
├── next.config.js              # Configuración Next.js + PWA
├── tailwind.config.js          # Configuración Tailwind
├── package.json
└── README.md
________________________________________
⚙️ PASO 3: Archivos de Configuración
📄 .env.local
bash
# Base de datos PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/minisupermercado"

# JWT Authentication
JWT_SECRET="tu-super-secreto-jwt-muy-largo-y-seguro-aqui-2024"
JWT_EXPIRES_IN="7d"

# OpenAI API (Gratis con límites)
OPENAI_API_KEY="sk-tu-api-key-openai-aqui"

# Claude API (Anthropic)
ANTHROPIC_API_KEY="sk-ant-tu-api-key-claude-aqui"

# Groq API (Gratis, muy rápido)
GROQ_API_KEY="gsk_tu-api-key-groq-aqui"

# App Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Minisupermercado PWA"
📄 next.config.js
javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Solo en producción
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = withPWA(nextConfig)
📄 public/manifest.json
json
{
  "name": "Minisupermercado PWA",
  "short_name": "MiniSuper",
  "description": "Sistema de inventario y ventas offline-first",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1f2937",
  "orientation": "portrait-
}