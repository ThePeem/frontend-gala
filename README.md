# Gala Premios Piorn - Frontend

Frontend Next.js para el sistema de votación de la Gala Premios Piorn.

## 🚀 Despliegue Rápido

### 1. Clonar y configurar
```bash
git clone <tu-repositorio-frontend>
cd frontend-gala
npm install
```

### 2. Configurar variables de entorno
```bash
cp env.example .env.local
# Editar .env.local con tus valores
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Construir para producción
```bash
npm run build
npm start
```

## 🌐 Despliegue en Vercel

### Variables de entorno necesarias:
- `NEXT_PUBLIC_API_URL`: https://galapremiospiorn.onrender.com

### Configuración automática:
- Vercel detectará automáticamente que es un proyecto Next.js
- El build command será: `npm run build`
- El output directory será: `.next`

## 📚 Estructura del Proyecto

```
src/
├── app/              # App Router (Next.js 13+)
│   ├── login/        # Página de login
│   ├── register/     # Página de registro
│   ├── layout.tsx    # Layout principal
│   └── page.tsx      # Página principal
├── components/       # Componentes reutilizables
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
└── utils/            # Utilidades
    └── AuthContext.tsx
```

## 🔧 Funcionalidades Implementadas

### ✅ Completado:
- Sistema de autenticación con contexto
- Formularios de login y registro
- Página principal con resultados públicos
- Configuración de API con Axios
- Manejo de estados de carga y error

### 🚧 Pendiente:
- Dashboard del usuario
- Sistema de votación
- Panel de administración
- Gestión de premios y nominados
- Sistema de resultados en tiempo real

## 📱 Páginas Disponibles

- `/` - Página principal (resultados públicos)
- `/login` - Iniciar sesión
- `/register` - Registro de usuario

## 🔌 API Integration

El frontend se comunica con el backend a través de:
- **Base URL**: Configurada en `NEXT_PUBLIC_API_URL`
- **Autenticación**: Tokens JWT
- **Endpoints**: REST API del backend Django

## 🎨 Estilos

- CSS Modules para estilos específicos de componentes
- Estilos inline para formularios (se puede migrar a CSS Modules)
- Fuentes de Google Fonts (Geist)

## 🚀 Próximos Pasos

1. **Implementar dashboard del usuario**
2. **Crear sistema de votación**
3. **Añadir panel de administración**
4. **Mejorar UI/UX con componentes más sofisticados**
5. **Implementar notificaciones en tiempo real**
6. **Añadir tests unitarios**

## 📝 Notas de Desarrollo

- Usar `npm run dev` para desarrollo local
- El backend debe estar corriendo en `http://localhost:8000` para desarrollo
- Las variables de entorno deben empezar con `NEXT_PUBLIC_` para ser accesibles en el cliente
