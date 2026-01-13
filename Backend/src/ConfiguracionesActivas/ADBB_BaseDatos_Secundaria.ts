/**
 * ====================================================================
 * CONFIGURACIÓN DE FIREBASE (ADMIN)
 * ====================================================================
 * Carga la llave de servicio y exporta las instancias de Auth y DB.
 *
 */
import admin from 'firebase-admin'; // <-- Usamos el import default
import { type ServiceAccount } from 'firebase-admin';

// --- ¡NUEVO! Importamos los TIPOS para la anotación ---
import { type Auth } from 'firebase-admin/auth';
import { type Firestore } from 'firebase-admin/firestore';

// 1. Importa tu llave de servicio (ColegioVizcaya.json)
import serviceAccount from './ColegioVizcaya.json' with { type: 'json' };

// 2. Convierte el JSON importado al tipo que Firebase espera
const firebaseAdminCredentials = {
  credential: admin.credential.cert(serviceAccount as ServiceAccount)
};

// 3. Inicializa la aplicación CON las credenciales
admin.initializeApp(firebaseAdminCredentials);

// 4. Exporta las instancias que usarás
// --- ¡CORREGIDO! Se añaden los tipos explícitos ---
export const auth: Auth = admin.auth();
export const db: Firestore = admin.firestore();

// 5. Exporta 'admin' (para el middleware)
export { admin };

db.settings({
  ignoreUndefinedProperties: true
});
  