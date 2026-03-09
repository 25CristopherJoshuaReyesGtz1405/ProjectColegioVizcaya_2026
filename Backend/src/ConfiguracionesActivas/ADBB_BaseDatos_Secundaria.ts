/**
 * CONFIGURACIÓN DE FIREBASE (ADMIN)
 * Carga la llave de servicio y exporta las instancias de Auth y DB.
 */
import admin from 'firebase-admin'; // <-- Usamos el import default
import { type ServiceAccount } from 'firebase-admin';

import { type Auth } from 'firebase-admin/auth';
import { type Firestore } from 'firebase-admin/firestore';

//  * Importa tu llave de servicio (ColegioVizcaya.json)
import serviceAccount from './ColegioVizcaya.json' with { type: 'json' };

//  * Convierte el JSON importado al tipo que Firebase espera
const firebaseAdminCredentials = {
  credential: admin.credential.cert(serviceAccount as ServiceAccount)
};

//  * Inicializa la aplicación con las credenciales
admin.initializeApp(firebaseAdminCredentials);

//  * Exporta las instancias que se usará
export const auth: Auth = admin.auth();
export const db: Firestore = admin.firestore();

export { admin };

db.settings({
  ignoreUndefinedProperties: true
});
  