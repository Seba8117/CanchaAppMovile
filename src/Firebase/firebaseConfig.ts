// Importa las funciones que SÍ necesitas para tu app
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Esta es la configuración correcta que acabas de encontrar
const firebaseConfig = {
  apiKey: "AIzaSyCcOpI-oUxG2TLC3af7YgdzsCSUqdFcaM4",
  authDomain: "canchaapp-8df2c.firebaseapp.com",
  projectId: "canchaapp-8df2c",
  storageBucket: "canchaapp-8df2c.appspot.com",
  messagingSenderId: "199638668823",
  appId: "1:199638668823:web:2b03df30cedbd26fa56e52",
  measurementId: "G-1LYYC1G85S"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que usarás en tu app (Autenticación y Base de Datos)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);