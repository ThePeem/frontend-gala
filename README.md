# Gala Premios Piorn - Frontend

Frontend en Next.js (App Router) para el sistema de votación de la Gala Premios Piorn.

## 🚀 Entornos y despliegue

- Producción: https://galapremiospiorn.vercel.app
- Deploy: automático en Vercel con cada push a `main`.

Variables de entorno (Vercel y desarrollo)
```
NEXT_PUBLIC_API_URL=https://galapremiospiorn.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
NEXT_PUBLIC_COUNTDOWN_TARGET=2025-12-01T00:00:00
```

Desarrollo local (opcional)
```
npm install
npm run dev
```

Build
```
npm run build
npm start
```

## 📚 Estructura del Proyecto

```
src/
├── app/              # App Router (Next.js 13+)
│   ├── login/        # Login
│   ├── perfil/       # Perfil (mis nominaciones, etc.)
│   ├── admin/        # Admin (usuarios, premios, nominados)
│   ├── layout.tsx    # Layout principal
│   └── page.tsx      # Página principal
├── components/       # Componentes reutilizables
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
└── utils/            # Utilidades
    └── AuthContext.tsx
```

## 🔧 Funcionalidades

- Autenticación con contexto (`src/utils/AuthContext.tsx`).
- Admin de usuarios, premios y nominados (Cloudinary upload en premios).
- Premios directos/indirectos y soporte de parejas (2 usuarios) vía `vinculos_requeridos`.
- Home con banner de cuenta atrás y efecto de nieve.

## 📱 Rutas principales

- `/` - Home
- `/login` - Iniciar sesión
- `/perfil` - Perfil del usuario
- `/admin/usuarios` - Gestión de usuarios
- `/admin/premios` - Gestión de premios
- `/admin/nominados` - Gestión de nominados

## 🔌 API

- Base URL: `NEXT_PUBLIC_API_URL`
- Auth: Token en cabecera `Authorization: Token <token>` (lo gestiona `AuthContext`).

## 🎨 Estilos

- Tailwind CSS, fuentes Google (Geist y Russo One), componentes propios en `src/components/`.

## 🚀 Próximos pasos

1. Votación en frontend (flujos R1/R2 completos).
2. Página pública de premios con diseño final.
3. Métricas y resultados públicos.

## 📝 Notas

- Las variables públicas deben empezar con `NEXT_PUBLIC_`.
- En producción, configura las variables en Vercel Project Settings.
