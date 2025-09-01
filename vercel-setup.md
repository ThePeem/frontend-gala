# 🚀 Configuración de Vercel para el Frontend

## 📋 Pasos para Configurar Vercel

### 1. Crear Cuenta en Vercel
- Ve a [vercel.com](https://vercel.com)
- Crea una cuenta o inicia sesión
- Conecta tu cuenta de GitHub

### 2. Importar Proyecto
- Haz clic en "New Project"
- Selecciona tu repositorio de GitHub del frontend
- Vercel detectará automáticamente que es Next.js

### 3. Configuración del Proyecto

**Información Básica:**
- **Project Name**: `gala-premios-frontend`
- **Framework Preset**: Next.js (se detecta automáticamente)
- **Root Directory**: `./` (o `frontend-gala` si está en subdirectorio)

**Build & Deploy:**
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

### 4. Variables de Entorno

**Configura esta variable en Vercel:**

```env
NEXT_PUBLIC_API_URL=https://galapremiospiorn.onrender.com
```

**Para desarrollo local, crea `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Configuración Avanzada

**Domains:**
- **Production**: `galapremiospiorn.vercel.app`
- **Preview**: Se genera automáticamente para cada PR

**Deployment:**
- **Auto-Deploy**: ✅ Habilitado
- **Branch**: `main`
- **Preview Deployments**: ✅ Habilitado para PRs

### 6. Configuración de Next.js

Tu `next.config.ts` ya está configurado correctamente:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno Locales
Crea `.env.local` en el directorio `frontend-gala`:

```env
# Desarrollo local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Para cambiar a producción
# NEXT_PUBLIC_API_URL=https://galapremiospiorn.onrender.com
```

### Scripts de Desarrollo
```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Construir para producción
npm run build

# Ejecutar producción local
npm start

# Linting
npm run lint
```

## 📱 Funcionalidades del Frontend

### ✅ Implementado
- Sistema de autenticación con AuthContext
- Formularios de login y registro
- Página principal con resultados públicos
- Configuración de API con Axios
- Manejo de estados y errores
- Responsive design básico

### 🚧 Pendiente
- Dashboard del usuario
- Sistema de votación
- Panel de administración
- Gestión de premios y nominados
- Sistema de resultados en tiempo real
- Mejoras de UI/UX

## 🌐 URLs y Rutas

### Rutas Disponibles
- `/` - Página principal (resultados públicos)
- `/login` - Iniciar sesión
- `/register` - Registro de usuario

### API Integration
- **Base URL**: Configurada en `NEXT_PUBLIC_API_URL`
- **Autenticación**: Tokens JWT
- **Endpoints**: REST API del backend Django

## 🎨 Estilos y UI

### Sistema de Estilos
- **CSS Modules**: Para estilos específicos de componentes
- **Estilos Inline**: Para formularios (se puede migrar)
- **Fuentes**: Google Fonts (Geist Sans, Geist Mono)

### Componentes Disponibles
- `LoginForm` - Formulario de login
- `RegisterForm` - Formulario de registro
- `AuthContext` - Contexto de autenticación

## 🔄 Despliegue Automático

### Flujo de Trabajo
1. **Push a `main`** → Deploy automático a producción
2. **Pull Request** → Deploy de preview automático
3. **Merge a `main`** → Deploy de producción

### Monitoreo
- **Vercel Dashboard**: Métricas de rendimiento
- **Analytics**: Visitas y comportamiento de usuarios
- **Logs**: Errores y debugging

## 🚨 Solución de Problemas

### Error: "Build Failed"
- Verifica que `npm run build` funcione localmente
- Revisa los logs de build en Vercel
- Asegúrate de que todas las dependencias estén en `package.json`

### Error: "API Connection Failed"
- Verifica que `NEXT_PUBLIC_API_URL` esté configurada
- Asegúrate de que el backend esté funcionando
- Revisa la consola del navegador para errores CORS

### Error: "Environment Variables Not Found"
- Verifica que las variables empiecen con `NEXT_PUBLIC_`
- Asegúrate de que estén configuradas en Vercel
- Reinicia el servidor de desarrollo después de cambios

## 📊 Optimizaciones

### Performance
- **Image Optimization**: Next.js optimiza imágenes automáticamente
- **Code Splitting**: Automático por rutas
- **Static Generation**: Para páginas que no cambian

### SEO
- **Meta Tags**: Configurados en `layout.tsx`
- **Open Graph**: Para redes sociales
- **Structured Data**: Para motores de búsqueda

## 🔮 Próximos Pasos

### Desarrollo Inmediato
1. **Dashboard del Usuario**: Página principal después del login
2. **Sistema de Votación**: Interfaz para votar premios
3. **Panel de Administración**: Gestión de premios y usuarios

### Mejoras Futuras
1. **PWA**: Aplicación web progresiva
2. **Offline Support**: Funcionalidad sin conexión
3. **Real-time Updates**: WebSockets para resultados en vivo
4. **Analytics**: Métricas de uso y votación

## 📞 Soporte

- **Documentación Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Documentación Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Comunidad Vercel**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**¡Tu frontend estará funcionando en Vercel en minutos! 🎉**
