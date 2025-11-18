## Objetivo
- Usar el nuevo logo en todas las pantallas (home, header, owner, login).
- Usar "pantalla_carga" como splash al abrir la app en Android.

## Hallazgos
- El proyecto usa imports `figma:asset` mapeados vía `vite.config.ts`.
- El logo se importa y usa en `src/components/screens/home/HomeScreen.tsx:7` y se muestra con `<img src={logoIcon} ...>`.
- En `src/components/screens/auth/LoginScreen.tsx:131-135` el `<img>` del logo no tiene `src`, por eso no se ve.
- El splash de Android está configurado por Capacitor y usa `@drawable/splash` en varios `res/drawable-*`.

## Cambios Propuestos
- Agregar assets:
  - `src/assets/logo.png`: el ícono redondeado que enviaste.
  - `src/assets/splash.png`: la imagen vertical "pantalla_carga".
- Actualizar imports para dejar de usar `figma:asset` y referenciar archivos estáticos:
  - `src/components/screens/home/HomeScreen.tsx:7` → `import logoIcon from '../../assets/logo.png'`.
  - `src/components/common/AppHeader.tsx:3` → `import logoIcon from '../../assets/logo.png'`.
  - `src/components/screens/owner/OwnerDashboard.tsx:10` → `import logoIcon from '../../assets/logo.png'`.
  - `src/components/screens/owner/OwnerDashboard_new.tsx:9` → `import logoIcon from '../../assets/logo.png'`.
- Corregir `LoginScreen` para mostrar el logo:
  - `src/components/screens/auth/LoginScreen.tsx:120` (aprox.) añadir `import logoIcon from '../../assets/logo.png'`.
  - `src/components/screens/auth/LoginScreen.tsx:131-135` asignar `src={logoIcon}` al `<img>` del encabezado.
- Actualizar splash de Android:
  - Reemplazar `android/app/src/main/res/drawable/splash.png` y variantes en `drawable-port-*` y `drawable-land-*` con `src/assets/splash.png` exportado en los tamaños correspondientes.
  - Mantener `capacitor.config.json` con `androidScaleType: 'CENTER_CROP'` para cubrir bien proporciones.
- Opcional (para consistencia): crear `src/components/common/Logo.tsx` que encapsule el `<img>` del logo con tamaños predefinidos; reemplazar usos en header y pantallas.

## Verificación
- Web: arrancar el servidor de desarrollo y revisar que el logo se vea en Login y Home.
- Android: generar build/capacitor sync y ejecutar en emulador/dispositivo; confirmar que el splash muestra "pantalla_carga" sin bandas.

## Archivos a tocar
- `src/components/screens/home/HomeScreen.tsx`
- `src/components/common/AppHeader.tsx`
- `src/components/screens/owner/OwnerDashboard.tsx`
- `src/components/screens/owner/OwnerDashboard_new.tsx`
- `src/components/screens/auth/LoginScreen.tsx`
- `android/app/src/main/res/drawable*/splash.png` (todas densidades)
- `src/assets/logo.png`, `src/assets/splash.png`

¿Confirmo y aplico estos cambios?