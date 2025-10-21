
# 🏟️ CanchApp Mobile v2.0

**Una aplicación móvil moderna para la gestión de canchas deportivas, torneos y equipos.**

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-6.x-blue.svg)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blue.svg)](https://tailwindcss.com/)

## 📱 Características Principales

- **🔐 Autenticación completa** - Login, registro y gestión de perfiles
- **🏟️ Gestión de canchas** - Para propietarios y jugadores
- **🏆 Sistema de torneos** - Creación, gestión y participación
- **👥 Gestión de equipos** - Formación y administración de equipos
- **💬 Chat en tiempo real** - Comunicación entre usuarios
- **🔔 Notificaciones** - Sistema de alertas y notificaciones
- **📱 Multiplataforma** - Android e iOS con Capacitor

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 18.x o superior
- **npm** o **yarn**
- **Android Studio** (para desarrollo Android)
- **Xcode** (para desarrollo iOS - solo macOS)

### 📦 Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/AlegriaBarde/CanchApp-2.0.git
cd CanchApp-2.0
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔧 Configuración del Entorno

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Otras configuraciones
VITE_APP_NAME=CanchApp
VITE_APP_VERSION=2.0.0
```

### 🔥 Configuración de Firebase

**¡IMPORTANTE!** Revisa el archivo `FIREBASE_INTEGRATION_GUIDE.md` para instrucciones detalladas de Firebase.

1. **Crear proyecto en Firebase Console**
2. **Habilitar servicios necesarios:**
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage
   - Cloud Messaging
3. **Configurar reglas de seguridad**
4. **Obtener configuración del proyecto**

## 📱 Desarrollo Móvil

### Android

1. **Sincronizar con Capacitor:**
```bash
npx cap sync android
```

2. **Abrir en Android Studio:**
```bash
npx cap open android
```

3. **Ejecutar en dispositivo/emulador:**
```bash
npx cap run android
```

### iOS (solo macOS)

1. **Sincronizar con Capacitor:**
```bash
npx cap sync ios
```

2. **Abrir en Xcode:**
```bash
npx cap open ios
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build

# Capacitor
npm run cap:sync     # Sincronizar con plataformas nativas
npm run cap:android  # Abrir Android Studio
npm run cap:ios      # Abrir Xcode

# Utilidades
npm run lint         # Linter
npm run type-check   # Verificación de tipos TypeScript
```

## 📁 Estructura del Proyecto

```
CanchApp-2.0/
├── src/
│   ├── components/          # Componentes React
│   │   ├── screens/        # Pantallas principales
│   │   ├── ui/            # Componentes UI reutilizables
│   │   ├── common/        # Componentes comunes
│   │   └── navigation/    # Navegación
│   ├── assets/            # Recursos estáticos
│   ├── styles/           # Estilos globales
│   └── guidelines/       # Documentación de desarrollo
├── android/              # Proyecto Android nativo
├── public/              # Archivos públicos
├── FIREBASE_INTEGRATION_GUIDE.md  # Guía de Firebase
└── README.md           # Este archivo
```

## 🎨 Stack Tecnológico

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Mobile:** Capacitor 6
- **Backend:** Firebase (Auth, Firestore, Storage, FCM)
- **Build:** Vite
- **Icons:** Lucide React

## 👥 Colaboración

### Flujo de Trabajo

1. **Crear rama para nueva feature:**
```bash
git checkout -b feature/nombre-feature
```

2. **Hacer commits descriptivos:**
```bash
git commit -m "feat: agregar funcionalidad de chat en tiempo real"
```

3. **Push y crear Pull Request:**
```bash
git push origin feature/nombre-feature
```

### Convenciones de Código

- **Componentes:** PascalCase (`LoginScreen.tsx`)
- **Archivos:** kebab-case (`user-profile.ts`)
- **Variables:** camelCase (`userName`)
- **Constantes:** UPPER_SNAKE_CASE (`API_BASE_URL`)

## 🐛 Solución de Problemas

### Problemas Comunes

**Error de dependencias:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error de Capacitor:**
```bash
npx cap sync
npx cap clean android
```

**Error de Firebase:**
- Verificar configuración en `.env.local`
- Revisar reglas de Firestore
- Comprobar habilitación de servicios

## 📚 Recursos Adicionales

- **Diseño Figma:** [CanchApp Mobile Design](https://www.figma.com/design/dlIlfJdzdFSY4S409siP73/CanchApp-Mobile)
- **Documentación Firebase:** `FIREBASE_INTEGRATION_GUIDE.md`
- **Guidelines de Desarrollo:** `src/guidelines/Guidelines.md`

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- **Issues:** [GitHub Issues](https://github.com/AlegriaBarde/CanchApp-2.0/issues)
- **Documentación:** Revisar archivos `.md` en el proyecto

---

**¡Desarrollado con ❤️ para la comunidad deportiva!** 🏟️⚽🏀
  