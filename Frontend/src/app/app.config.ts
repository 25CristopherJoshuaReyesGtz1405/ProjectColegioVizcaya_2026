import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// Importa las rutas (aunque aún no las hemos modificado, las necesitamos)
import { routes } from './app.routes';

// ¡IMPORTACIÓN MANUAL! (Esto reemplaza lo que 'ng add' no pudo hacer)
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { authInterceptor } from '../ConfiguracionesActivas/Interceptores/auth.interceptor';

const firebaseConfig = {
  apiKey: "AIzaSyCtgS-c78GQKNDjyU2puOz-u41DQONMa7o",
  authDomain: "projectcolegiovizcaya-849a1.firebaseapp.com",
  projectId: "projectcolegiovizcaya-849a1",
  storageBucket: "projectcolegiovizcaya-849a1.firebasestorage.app",
  messagingSenderId: "141454005675",
  appId: "1:141454005675:web:bf64085426cc4eab006eee",
  measurementId: "G-X7BBF1E1QB"
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Proveedor de Rutas
    provideRouter(routes),
    
    // Proveedor de HttpClient (para conectar con tu Backend API)
    // (Aún no creamos el interceptor, pero preparamos el espacio)
    provideHttpClient(
      withInterceptors([authInterceptor]) // <-- Lo descomentaremos en Fase 1
    ),

    //  * Proveedores De La Base De Datos... 
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
};