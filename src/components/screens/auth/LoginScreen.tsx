import { useState } from 'react';
import { User, Building, MapPin, Hash, Phone, Building2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Textarea } from '../../ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Label } from '../../ui/label';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';

// --- INICIO: Importaciones de Firebase (ACTUALIZADAS) ---
import { auth, db } from '../../../Firebase/firebaseConfig'; // Asegúrate de que esta ruta sea correcta
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Importamos getDoc para verificar el rol
// --- FIN: Importaciones de Firebase ---

interface LoginScreenProps {
  onLogin: (userType: 'player' | 'owner', user: FirebaseUser) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'player' | 'owner'>('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Player registration fields
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  
  // Owner registration fields
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessRut, setBusinessRut] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- LÓGICA DE INICIO DE SESIÓN MEJORADA ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ¡Paso clave! Verificamos el rol del usuario en Firestore.
        const collectionName = userType === 'player' ? 'jugador' : 'dueno';
        const userDocRef = doc(db, collectionName, user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // El usuario existe en la colección correcta, ¡éxito!
          console.log(`Inicio de sesión exitoso como ${userType}`);
          onLogin(userType, user);
        } else {
          // El usuario existe en Auth pero no tiene este rol.
          // Cerramos su sesión para evitar problemas de seguridad.
          await signOut(auth);
          throw new Error(`Este usuario no está registrado como ${userType}.`);
        }
      } else {
        // --- LÓGICA DE REGISTRO MEJORADA ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log("Usuario creado en Firebase Auth:", user.uid);

        let userData;
        const collectionName = userType === 'player' ? 'jugador' : 'dueno';

        if (userType === 'player') {
          userData = {
            uid: user.uid,
            email: user.email,
            userType: 'player',
            name: playerName,
            phone: playerPhone,
            createdAt: new Date(),
          };
        } else { // owner
          userData = {
            uid: user.uid,
            email: user.email,
            userType: 'owner',
            ownerName: ownerName,
            businessName: businessName,
            rut: businessRut,
            address: businessAddress,
            phone: businessPhone,
            description: businessDescription,
            createdAt: new Date(),
          };
        }
        
        // Guardamos al usuario en la colección correcta ('jugador' o 'dueno')
        await setDoc(doc(db, collectionName, user.uid), userData);
        console.log(`Datos del usuario guardados en la colección "${collectionName}".`);

        onLogin(userType, user);
      }
    } catch (err: any) {
      console.error("Error de autenticación:", err);
      
      let friendlyMessage = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = "Correo o contraseña invalidas";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "Este correo electrónico ya está registrado.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = "Correo inválido.";
      }
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <img 
          src={logoIcon}
          alt="CanchApp Logo" 
          className="w-24 h-24 mx-auto rounded-3xl shadow-2xl"
        />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-[#172c44] mb-2 text-3xl font-bold">
            {isLogin ? 'Bienvenido a CanchaApp' : 'Únete a CanchApp'}
          </CardTitle>
          <p className="text-gray-600 text-base font-medium">
            {isLogin ? 'Encuentra y organiza partidos cerca de ti' : 'La red social deportiva que buscabas'}
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <Tabs value={userType} onValueChange={(value: string) => setUserType(value as 'player' | 'owner')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="player" className="flex items-center gap-2">
                  <User size={16} />
                  Jugador
                </TabsTrigger>
                <TabsTrigger value="owner" className="flex items-center gap-2">
                  <Building size={16} />
                  Dueño
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLogin ? (
            // Login Form
            <form onSubmit={handleAuthAction} className="space-y-4">
              <Input
                type="email"
                placeholder={userType === 'player' ? 'Correo electrónico' : 'Correo empresarial'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button 
                type="submit"
                className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
                disabled={loading}
              >
                {loading ? 'Cargando...' : `Iniciar Sesión como ${userType === 'player' ? 'Jugador' : 'Dueño'}`}
              </Button>
            </form>
          ) : (
            // Registration Forms
            <div className="space-y-4">
              {userType === 'player' ? (
                // Player Registration
                <form onSubmit={handleAuthAction} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[#172c44] flex items-center gap-2">
                      <User size={16} />
                      Información Personal
                    </Label>
                    <Input type="text" placeholder="Nombre completo" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required />
                    <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input type="tel" placeholder="Teléfono (opcional)" value={playerPhone} onChange={(e) => setPlayerPhone(e.target.value)} className="pl-10" />
                    </div>
                    <Input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta de Jugador'}
                  </Button>
                </form>
              ) : (
                // Owner Registration
                <form onSubmit={handleAuthAction} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[#172c44] flex items-center gap-2"><User size={16} />Información Personal</Label>
                    <Input type="text" placeholder="Nombre del propietario" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                    <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[#172c44] flex items-center gap-2"><Building2 size={16} />Información del Negocio</Label>
                    <Input type="text" placeholder="Nombre del complejo deportivo" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input type="text" placeholder="RUT de la empresa (ej: 12.345.678-9)" value={businessRut} onChange={(e) => setBusinessRut(e.target.value)} className="pl-10" required />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                      <Textarea placeholder="Dirección completa del complejo" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="pl-10 min-h-[60px]" required />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input type="tel" placeholder="Teléfono del negocio" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="pl-10" required />
                    </div>
                    <Textarea placeholder="Descripción breve del complejo (opcional)" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} className="min-h-[60px]" />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
                    disabled={loading}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta de Negocio'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-red-600 font-semibold">{error}</p>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[#00a884] hover:underline"
              disabled={loading}
            >
              {isLogin 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}