# GUÍA DE DEMOSTRACIÓN - ERP DE CONTROL DE PROYECTO

Esta guía detalla los pasos recomendados para realizar una presentación en vivo del núcleo logístico del ERP ante un jurado o docente de la Escuela de Ingeniería.

## 1. Preparación previa
-   Asegúrate de tener una conexión a internet estable para la sincronización con Supabase.
-   Limpia el historial de movimientos si deseas empezar una demo "limpia" (opcional).
-   Ten a la mano un archivo Excel de ejemplo para la importación de personal.

## 2. Flujo de la Presentación

### Paso 1: Dashboard y Visión General
-   **Acción**: Entra al Dashboard (`/erp/dashboard`).
-   **Puntos a destacar**:
    -   Diseño moderno ("Vibe Design") con Bento Grid.
    -   Indicadores de KPI en tiempo real (Stock total, Flota activa).
    -   Sección de alertas críticas de stock.

### Paso 2: Gestión de Inventario (Materiales)
-   **Acción**: Navega a Almacén > Stock Materiales (`/erp/inventory/materials`).
-   **Puntos a destacar**:
    -   La lista de materiales segmentada por almacén.
    -   Realiza un **Ingreso** rápido de un material y muestra cómo el stock se actualiza al instante sin recargar la página (Realtime).
    -   Muestra el **Historial Reciente** de movimientos en la parte inferior.

### Paso 3: Gestión de Equipos y Herramientas
-   **Acción**: Navega a Almacén > Control Equipos (`/erp/inventory/equipment`).
-   **Puntos a destacar**:
    -   Muestra la diferencia entre equipos en "Almacén" y equipos en "Campo".
    -   Realiza un **Egreso a Campo**: Selecciona un equipo, un trabajador responsable y el área.
    -   Resalta que el sistema bloquea acciones imposibles (ejm: no puedes dar egreso a un equipo que ya está en campo).

### Paso 4: Trazabilidad de Personal
-   **Acción**: En la pestaña de Equipos, ve a la sub-pestaña "Trabajadores" o usa el componente de **Importar Personal**.
-   **Puntos a destacar**:
    -   Muestra cómo se pueden cargar cientos de trabajadores desde un archivo Excel en segundos.
    -   Explica que cada movimiento queda vinculado al DNI del trabajador para deslindar responsabilidades.

### Paso 5: Reportes y Auditoría
-   **Acción**: Ve al Historial de Movimientos.
-   **Puntos a destacar**:
    -   Descarga un reporte en **PDF**. Muestra el diseño limpio y profesional del PDF generado.
    -   Descarga un reporte en **Excel**. Explica que este es el formato estándar usado en la industria para conciliaciones mensuales.

### Paso 6: Asistente Virtual (WhatsApp Bot)
-   **Acción**: Abre WhatsApp y envía un mensaje al bot (ejm: "¿Qué stock hay de guantes nitrilo?" o "¿Quién tiene el taladro Bosch?").
-   **Puntos a destacar**:
    -   Procesamiento de lenguaje natural mediante **Google Gemini AI**.
    -   Sincronización instantánea con la base de datos de Supabase.
    -   Capacidad de respuesta rápida para personal que no tiene acceso a una PC en el campo.

## 3. Conclusión de la Demo
-   Muestra los **Ajustes de Perfil** para demostrar que el sistema es multi-usuario y personalizable.
-   Finaliza reafirmando que la arquitectura Next.js garantiza rapidez, Supabase garantiza la integridad de los datos y la IA de Google potencia la accesibilidad desde el campo.
-   **Proyección**: Menciona que el siguiente paso es escalar este Módulo de Almacén a un **ERP** completo con Compras y Contabilidad.
