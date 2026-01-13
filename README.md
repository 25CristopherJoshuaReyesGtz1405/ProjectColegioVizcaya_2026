# Sistema Integral de Gestión Académica - Colegio Vizcaya (Nivel Secundaria)

Plataforma web integral diseñada para centralizar, digitalizar y automatizar los procesos académicos y administrativos del **Colegio Vizcaya de las Américas (Durango)**. Este sistema sustituye los métodos manuales tradicionales, garantizando la integridad de la información, reduciendo la carga operativa y facilitando la toma de decisiones estratégicas.

## 📋 Descripción del Proyecto

El **Sistema de Gestión Escolar Interno** es una solución tecnológica desarrollada para atender las necesidades críticas del área de Control Escolar, Docencia y Dirección. La plataforma permite la captura remota de calificaciones, el control de asistencias en tiempo real, la gestión de planeaciones docentes y la generación automatizada de documentación oficial.

### Objetivos Principales
* **Centralización:** Unificación de datos académicos (calificaciones, asistencias, expedientes) en una base de datos segura en la nube.
* **Automatización:** Generación instantánea de reportes oficiales (boletas, listas de asistencia) en formato PDF.
* **Eficiencia:** Reducción significativa de tiempos administrativos y errores de transcripción humana.
* **Supervisión:** Herramientas para el seguimiento del desempeño académico y cumplimiento docente.

---

## 🚀 Módulos y Funcionalidades

El sistema cuenta con roles de acceso diferenciados y seguridad basada en autenticación:

### 1. 🎓 Control Escolar (Administrador)
* **Gestión de Usuarios:** Altas, bajas y modificaciones de perfiles (Alumnos y Personal).
* [cite_start]**Carga Masiva:** Importación de estudiantes mediante archivos CSV para inicio de ciclo rápido[cite: 980].
* **Estructura Académica:** Administración de ciclos escolares, grupos, materias y periodos de evaluación.
* **Reportes Oficiales:** Generación de boletas y documentación institucional membretada.

### 2. 👨‍🏫 Módulo Docente
* [cite_start]**Captura de Calificaciones:** Interfaz optimizada para el registro de notas por rubros y periodos con validación automática[cite: 859].
* [cite_start]**Control de Asistencia:** Registro diario de incidencias (Faltas, Retardos, Asistencias)[cite: 1163].
* [cite_start]**Planeaciones Didácticas:** Carga y gestión de planeaciones con integración directa a **Google Drive**[cite: 874].
* **Reportes de Conducta:** Registro y seguimiento de incidencias disciplinarias.

### 3. 📈 Módulo de Dirección
* **Dashboard (KPIs):** Visualización de estadísticas globales y rendimiento académico.
* **Supervisión:** Validación de planeaciones docentes y revisión de expedientes.
* **Consulta:** Acceso a historial académico y disciplinario de los estudiantes.

---

## 🛠 Stack Tecnológico

[cite_start]El proyecto fue desarrollado utilizando una arquitectura **Cliente-Servidor (MVC)** desacoplada y servicios en la nube [cite: 884-911].

### Frontend (Cliente)
* **Framework:** Angular (TypeScript, HTML5, SCSS).
* **Diseño:** Interfaz modular y responsiva.
* **Comunicación:** RxJS para manejo reactivo de datos.

### Backend (Servidor)
* **Runtime:** Node.js.
* **Framework:** Express.js (RESTful API).
* **Integraciones:** Google Drive API v3 (Almacenamiento de evidencias).

### Base de Datos & Cloud (Firebase)
* **Base de Datos:** Google Cloud Firestore (NoSQL) para escalabilidad y flexibilidad de esquemas.
* **Autenticación:** Firebase Authentication (Manejo de sesiones y seguridad).
* **Hosting:** Firebase Hosting (Despliegue del cliente).

---

## 🔧 Instalación y Despliegue Local

Sigue estos pasos para ejecutar el proyecto en un entorno local de desarrollo.

### Prerrequisitos
* Node.js (v18 o superior)
* Angular CLI
* Cuenta de Google Firebase configurada

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/25CristopherJoshuaReyesGtz1405/ProjectColegioVizcaya_2026.git](https://github.com/25CristopherJoshuaReyesGtz1405/ProjectColegioVizcaya_2026.git)
    ```

2.  **Configurar el Backend:**
    ```bash
    cd Backend
    npm install
    # Configurar las variables de entorno (.env) con las credenciales de Firebase y Google Cloud
    npm run dev
    ```

3.  **Configurar el Frontend:**
    ```bash
    cd Frontend
    npm install
    # Asegurarse de tener los environments de Angular configurados
    ng serve
    ```

4.  **Acceso:**
    Navegar a `http://localhost:4200/` para ver la aplicación.

---

## 👥 Autores

* [cite_start]**Christopher Joshua Reyes Gutiérrez** - *Developer (Diseño técnico, implementación full-stack e integración)*[cite: 429].
* [cite_start]**Christian Gibran Espituñal Villanueva** - *Project Manager (Análisis de requerimientos, documentación y gestión)*[cite: 426].

---

## 📄 Estado del Proyecto
* **Versión:** 1.3
* [cite_start]**Estado:** Funcional (~90% implementado)[cite: 989].
* **Licencia:** Privada / Uso exclusivo para el Colegio Vizcaya de las Américas.

---
*Desarrollado como proyecto de Residencia Profesional para la carrera de Ingeniería en Sistemas Computacionales.*
