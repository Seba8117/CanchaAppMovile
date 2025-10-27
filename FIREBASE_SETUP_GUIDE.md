# 🔥 Guía de Configuración de Firebase para CanchApp

## 📋 Problemas Identificados

1. **Los partidos creados no aparecen en búsquedas o recomendaciones**
2. **La creación de equipos falla porque no existe la colección**
3. **Faltan reglas de seguridad en Firestore**

## 🚀 Pasos para Configurar Firebase

### 1. Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto CanchApp
3. En el menú lateral, haz clic en **"Firestore Database"**

### 2. Configurar Reglas de Seguridad

1. En Firestore Database, ve a la pestaña **"Reglas"**
2. **Reemplaza** todo el contenido actual con las reglas del archivo `firestore.rules`
3. Haz clic en **"Publicar"**

**⚠️ IMPORTANTE:** Las reglas actuales probablemente están en modo de prueba y expiran pronto.

### 3. Crear las Colecciones Necesarias

#### 3.1 Colección `matches`
1. Ve a la pestaña **"Datos"** en Firestore
2. Haz clic en **"Iniciar colección"**
3. ID de colección: `matches`
4. Crea un documento de ejemplo con estos campos:

```json
{
  "captainId": "ejemplo-user-id",
  "sport": "Fútbol",
  "courtName": "Cancha Ejemplo",
  "date": "2024-01-20T00:00:00.000Z",
  "time": "19:00",
  "duration": 1.5,
  "maxPlayers": 10,
  "currentPlayers": 1,
  "pricePerPlayer": 5000,
  "description": "Partido de ejemplo",
  "status": "open",
  "players": ["ejemplo-user-id"],
  "location": {
    "name": "Cancha Ejemplo",
    "address": "Dirección ejemplo"
  },
  "createdAt": "2024-01-20T00:00:00.000Z",
  "updatedAt": "2024-01-20T00:00:00.000Z"
}
```

#### 3.2 Colección `teams`
1. Haz clic en **"Iniciar colección"**
2. ID de colección: `teams`
3. Crea un documento de ejemplo:

```json
{
  "name": "Equipo Ejemplo",
  "sport": "Fútbol",
  "captainId": "ejemplo-user-id",
  "members": ["ejemplo-user-id"],
  "maxPlayers": 11,
  "currentPlayers": 1,
  "description": "Equipo de ejemplo",
  "status": "active",
  "image": "",
  "createdAt": "2024-01-20T00:00:00.000Z",
  "updatedAt": "2024-01-20T00:00:00.000Z"
}
```

#### 3.3 Colección `courts` (si no existe)
1. Haz clic en **"Iniciar colección"**
2. ID de colección: `courts`
3. Crea un documento de ejemplo:

```json
{
  "name": "Cancha Los Pinos",
  "address": "Av. Providencia 123, Santiago",
  "sport": "Fútbol",
  "pricePerHour": 25000,
  "capacity": 22,
  "amenities": ["Estacionamiento", "Vestuarios", "Iluminación"],
  "availability": {
    "monday": ["09:00-22:00"],
    "tuesday": ["09:00-22:00"],
    "wednesday": ["09:00-22:00"],
    "thursday": ["09:00-22:00"],
    "friday": ["09:00-22:00"],
    "saturday": ["08:00-23:00"],
    "sunday": ["08:00-23:00"]
  },
  "rating": 4.5,
  "images": [],
  "ownerId": "ejemplo-owner-id",
  "createdAt": "2024-01-20T00:00:00.000Z"
}
```

### 4. Configurar Autenticación

1. Ve a **"Authentication"** en el menú lateral
2. En la pestaña **"Sign-in method"**
3. Habilita los métodos que necesites:
   - **Email/Password** (recomendado)
   - **Google** (opcional)
   - **Anonymous** (para pruebas)

### 5. Verificar Configuración

#### 5.1 Índices de Firestore
1. Ve a **"Firestore Database"** > **"Índices"**
2. Firebase creará automáticamente los índices necesarios cuando hagas consultas
3. Si aparecen errores de índices faltantes, Firebase te dará enlaces para crearlos automáticamente

#### 5.2 Configuración de Red
1. Ve a **"Firestore Database"** > **"Uso"**
2. Verifica que no haya límites de cuota excedidos

## 🔧 Solución a Problemas Específicos

### Problema 1: Partidos no aparecen en búsquedas

**Causa:** Probablemente las reglas de Firestore están bloqueando las consultas.

**Solución:**
1. Aplicar las nuevas reglas de seguridad
2. Verificar que los documentos tengan el campo `status: "open"`
3. Verificar que la fecha sea futura

### Problema 2: Creación de equipos falla

**Causa:** La colección `teams` no existe en Firestore.

**Solución:**
1. Crear la colección `teams` como se indica arriba
2. Aplicar las reglas de seguridad

### Problema 3: Errores de permisos

**Causa:** Reglas de seguridad muy restrictivas o inexistentes.

**Solución:**
1. Aplicar las reglas del archivo `firestore.rules`
2. Verificar que el usuario esté autenticado

## 🧪 Cómo Probar

1. **Crear un partido:** Ve a la app y crea un partido nuevo
2. **Verificar en Firebase:** Ve a Firestore y verifica que aparezca en la colección `matches`
3. **Buscar partidos:** Ve a "Buscar Partidos" y verifica que aparezca
4. **Crear equipo:** Ve a "Mis Equipos" > "Crear Equipo"
5. **Verificar equipo:** Verifica que aparezca en la colección `teams`

## 📞 Si Sigues Teniendo Problemas

1. **Revisa la consola del navegador** (F12) para ver errores específicos
2. **Verifica las reglas de Firestore** - deben coincidir exactamente con el archivo `firestore.rules`
3. **Comprueba que el usuario esté autenticado** - muchas operaciones requieren autenticación
4. **Revisa los índices** - Firebase puede necesitar crear índices automáticamente

## 🎯 Resultado Esperado

Después de seguir estos pasos:
- ✅ Los partidos creados aparecerán en búsquedas y recomendaciones
- ✅ Los equipos se crearán correctamente
- ✅ Todas las operaciones CRUD funcionarán sin errores de permisos
- ✅ La aplicación funcionará completamente con Firebase

---

**💡 Tip:** Guarda este archivo para futuras referencias y configuraciones de Firebase.