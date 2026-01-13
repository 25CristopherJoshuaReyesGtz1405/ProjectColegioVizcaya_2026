# 🎓 Sistema de Gestión Académica Interno - Colegio Vizcaya

![Version](https://img.shields.io/badge/versión-1.3-blue) ![Status](https://img.shields.io/badge/estado-Estable-success) ![Angular](https://img.shields.io/badge/frontend-Angular-red) ![NodeJS](https://img.shields.io/badge/backend-Node.js-green) ![Firebase](https://img.shields.io/badge/db-Firestore-orange)

> Plataforma web integral diseñada para centralizar, digitalizar y automatizar los procesos académicos y administrativos del **Colegio Vizcaya de las Américas (Nivel Secundaria)**.

---

## 📋 Descripción del Proyecto

Este sistema implementa una arquitectura moderna para solucionar la dispersión de información académica. Sustituye los registros manuales por un **modelo de datos normalizado** en la nube, garantizando la integridad de la información, auditoría de acciones y optimización de tiempos operativos para la Dirección, Control Escolar y Docentes.

### 🎯 Objetivos Estratégicos
* **Centralización:** Unificación de expedientes (Modelo Persona/Rol) para evitar redundancia de datos.
* **Integridad:** Reglas de negocio estrictas para la captura de calificaciones y control de periodos.
* **Supervisión:** Herramientas de inteligencia de negocios para la toma de decisiones directivas.
* **Seguridad:** Autenticación robusta y registros de auditoría (Logs) de todas las operaciones críticas.

---

## 🌟 Módulos y Funcionalidades

El sistema se divide en módulos funcionales basados en roles de usuario:

### 1. 🏛️ Control Escolar (Administración)
Encargado de la infraestructura de datos y gestión del ciclo escolar.

* **👥 Gestión de Usuarios (CRUD):** Administración de cuentas con baja lógica para Estudiantes, Docentes y Directivos.
* **🚀 Carga Masiva Inteligente:** Importación de estudiantes mediante archivos **CSV**, con creación automática de credenciales y validación de duplicados.
* **📅 Control de Periodos:** Gestión de estatus (**ABIERTO/CERRADO**) para los periodos de evaluación, bloqueando o permitiendo la captura de notas según el calendario oficial.
* **🏫 Estructura Académica:** Administración de catálogos de Materias, Grupos y Asignaciones Docentes.

### 2. 👨‍🏫 Módulo Docente
Herramientas operativas para el seguimiento académico diario.

* **📝 Captura de Calificaciones:**
    * Validación automática según el estatus del periodo (Bloqueo si está cerrado).
    * Gestión de rubros de evaluación personalizados.
* **✅ Control de Asistencia:** Registro diario de incidencias (Faltas, Retardos) vinculado al expediente del alumno.
* **📂 Planeaciones Didácticas:** Registro y entrega de planeaciones con integración a **Google Drive**.
* **⚠️ Reportes de Indisciplina:** Generación de incidencias conductuales con niveles de severidad.

### 3. 📈 Módulo de Dirección
Panel de control para la supervisión y análisis institucional.

* **📊 Dashboard Ejecutivo (KPIs):**
    * Total de estudiantes (Activos/Inactivos) desglosado por grado y género.
    * Promedio general de la escuela en tiempo real.
    * Monitoreo de grupos sin docente o materia asignada.
* **🔍 Supervisión:**
    * Checklist de cumplimiento de planeaciones docentes (Pendiente/Entregada/Revisada).
    * Consulta irrestricta de calificaciones de cualquier grupo.
* **🗓️ Agenda Directiva:** Gestión de tareas y actividades diarias.
* **📄 Actas y Reportes:** Generación de "Actas de Calificaciones" consolidadas por grupo y periodo listas para impresión.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una **Arquitectura Modelo 1 (Backend Dedicado + Frontend)** desacoplada para garantizar escalabilidad y mantenimiento.

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | ![Angular](https://img.shields.io/badge/-Angular-DD0031?logo=angular&logoColor=white) | SPA robusta, TypeScript, RxJS para manejo reactivo. |
| **Backend** | ![NodeJS](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) | Express.js exponiendo una API RESTful segura. |
| **Base de Datos** | ![Firestore](https://img.shields.io/badge/-Firestore-FFCA28?logo=firebase&logoColor=black) | NoSQL con esquema normalizado (Colecciones separadas). |
| **Autenticación** | ![Firebase Auth](https://img.shields.io/badge/-Auth-FFCA28?logo=firebase&logoColor=black) | Gestión de identidad segura (Email/Password). |
| **Infraestructura** | ![Google Cloud](https://img.shields.io/badge/-Google_Cloud-4285F4?logo=google-cloud&logoColor=white) | Hosting y Cloud Functions. |

### 🔒 Seguridad y Auditoría
* **Logs de Sistema:** Registro automático de todas las acciones de creación, actualización y borrado (CUD) en una colección de auditoría.
* **Validación de Periodos:** El backend rechaza intentos de modificación de calificaciones fuera de fechas establecidas.

---

## 💻 Instalación y Despliegue Local

### Prerrequisitos
* Node.js (v18 LTS o superior)
* Angular CLI
* Credenciales de Firebase Admin SDK

### Pasos de Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/25CristopherJoshuaReyesGtz1405/ProjectColegioVizcaya_2026.git](https://github.com/25CristopherJoshuaReyesGtz1405/ProjectColegioVizcaya_2026.git)
    ```

2.  **Configurar Backend:**
    ```bash
    cd Backend
    npm install
    # Crear archivo .env con las credenciales de servicio de Firebase
    npm run dev
    ```

3.  **Configurar Frontend:**
    ```bash
    cd Frontend
    npm install
    ng serve
    ```

4.  **Acceso:** Navegar a `http://localhost:4200/`.

---

## 📄 Licencia
* **Versión:** 1.3
* **Estado:** Funcional (~90% implementado).
* **Christopher Joshua Reyes Gutiérrez** - *Developer (Diseño técnico, implementación full-stack e integración)*.
* **Christian Gibran Espituñal Villanueva** - *Project Manager (Análisis de requerimientos, documentación y gestión)*.
* **Licencia:** Privada / Uso exclusivo para el Colegio Vizcaya de las Américas.
---

*Desarrollado como proyecto de Residencia Profesional para la carrera de Ingeniería en Sistemas Computacionales.*
