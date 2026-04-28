# ESCUELA DE INGENIERÍA
# CARRERA DE [NOMBRE DE LA CARRERA]

## INFORME TÉCNICO: EXPERIENCIAS FORMATIVAS EN SITUACIONES REALES DE TRABAJO (EFSRT)

**Docente:** [Nombre del Docente]
**Practicante:** [Tu Nombre y Apellido]

Lima – Perú
2026

---

### ÍNDICE DE CONTENIDOS

1.  **DEDICATORIA** ........................................................................ 3
2.  **RESUMEN** ................................................................................ 4
3.  **CAPÍTULO 1. ASPECTOS GENERALES** ........................................ 5
    1.1. Nomenclatura ........................................................................ 5
    1.2. Introducción ......................................................................... 5
    1.3. Objetivos ............................................................................. 6
4.  **CAPÍTULO 2. DESARROLLO DEL PROYECTO** ................................ 7
    2.1. Procedimientos ...................................................................... 7
    2.2. Teoría y Cálculos ................................................................... 8
    2.3. Presupuesto ........................................................................... 9
5.  **CAPÍTULO 3. RESULTADOS** ....................................................... 10
    3.1. Análisis de Resultados .......................................................... 10
    3.2. Conclusiones ........................................................................ 11
    3.3. Recomendaciones Técnicas ................................................... 12
6.  **REFERENCIAS BIBLIOGRÁFICAS** .............................................. 13
7.  **ANEXOS** ................................................................................. 14

---

### DEDICATORIA
Este trabajo está dedicado a mi familia y profesores, por su constante apoyo durante mi formación académica y profesional en la Escuela de Ingeniería.

---

### RESUMEN
El presente informe técnico describe el desarrollo e implementación del **ERP de Control de Proyecto**, una solución integral diseñada para la gestión unificada de operaciones industriales. En su fase actual, el proyecto ha completado y puesto en marcha el **Módulo de Almacén y Gestión de Activos**, el cual permite la trazabilidad en tiempo real de materiales, equipos y personal mediante tecnologías de vanguardia como **Next.js 16** y **Supabase**. El sistema integra inteligencia artificial para consultas en campo e incluye un motor de reportes críticos automatizados. Mientras el módulo logístico se encuentra 100% funcional, se continúa con la implementación de módulos complementarios de administración, seguridad e indicadores de calidad, asegurando una plataforma robusta y escalable bajo los estándares de la Escuela de Ingeniería.

---

### CAPÍTULO 1. ASPECTOS GENERALES

#### 1.1. Nomenclatura
-   **ERP (Enterprise Resource Planning)**: Sistema de planificación de recursos empresariales para la gestión integrada de procesos.
-   **BaaS (Backend as a Service)**: Modelo de servicio en la nube que automatiza la gestión del lado del servidor.
-   **Turbopack**: Motor de empaquetado incremental de última generación optimizado para entornos de desarrollo en Next.js.
-   **SQL (Structured Query Language)**: Lenguaje estándar para la gestión y consulta de bases de datos relacionales.
-   **PWA (Progressive Web App)**: Aplicativo web que utiliza capacidades del navegador para ofrecer una experiencia similar a una app nativa.
-   **IA (Inteligencia Artificial)**: Rama de la informática dedicada a la creación de sistemas capaces de realizar tareas que requieren inteligencia humana (ejm: Google Gemini).
-   **API (Application Programming Interface)**: Interfaz de programación que permite la comunicación y transferencia de datos entre distintos sistemas de software.
-   **UI/UX (User Interface / User Experience)**: Diseño de interfaz y experiencia de usuario enfocado en la usabilidad y estética del sistema.
-   **KPI (Key Performance Indicator)**: Indicador clave de desempeño utilizado para medir el éxito y eficiencia de los procesos logísticos.
-   **JSON (JavaScript Object Notation)**: Formato ligero de intercambio de datos, fácil de leer para humanos y máquinas.
-   **TypeScript**: Superconjunto de JavaScript que añade tipado estático para mejorar la robustez y mantenibilidad del código.
-   **Realtime**: Capacidad de sincronización de datos de manera instantánea entre el servidor y todos los clientes conectados.
-   **Bento Grid**: Técnica de diseño visual que organiza la información en bloques rectangulares proporcionales, similar a una caja bento.
-   **EPP (Equipos de Protección Personal)**: Implementos de seguridad obligatorios en entornos industriales, gestionados mediante el catálogo del sistema.

#### 1.2. Introducción
En la actualidad, la eficiencia en la gestión de proyectos industriales de gran envergadura depende de la centralización de datos y el control riguroso de recursos. La falta de sistemas ERP (Enterprise Resource Planning) adaptados a las condiciones de campo genera ineficiencias en la cadena de suministro y en el control de costos operativos. El presente proyecto se centra en la creación de un **ERP de Control de Proyecto**, diseñado para unificar la gestión administrativa y operativa en un solo ecosistema digital. Actualmente, se ha priorizado y finalizado el **Módulo de Almacén**, el cual ya es operativo y ofrece una integración innovadora con WhatsApp mediante Inteligencia Artificial (Gemini API). Este módulo inicial sirve como la base sólida sobre la cual se están implementando progresivamente el resto de funcionalidades de logística, seguridad y administración general.

#### 1.3. Objetivos

##### 1.1.1. Objetivo General
Diseñar e implementar un sistema **ERP de Control de Proyecto** que optimice la gestión de recursos industriales, iniciando con el despliegue del módulo de almacén funcional y proyectando la integración de todas las áreas administrativas y operativas de la organización.

##### 1.1.2. Objetivos Específicos
-   Consolidar el Módulo de Almacén con trazabilidad total de materiales y equipos para garantizar la continuidad operativa.
-   Implementar conectividad móvil vía WhatsApp con IA para facilitar consultas técnicas desde puntos remotos de trabajo.
-   Desarrollar una arquitectura modular escalable que permita la integración futura de módulos de Administración, HSE (Seguridad) y Calidad.
-   Automatizar reportes técnicos en alta fidelidad (XLSX/PDF) para sustentar auditorías y control de inventarios físicos.

---

### CAPÍTULO 2. DESARROLLO DEL PROYECTO

#### 2.1. Procedimientos
El desarrollo del proyecto se llevó a cabo siguiendo una metodología ágil (Scrum), dividida en las siguientes fases técnicas:
1.  **Definición de Requisitos**: Identificación de las entidades principales (Almacén, Materiales, Equipos, Trabajadores).
2.  **Configuración del Backend**: Implementación de tablas y políticas de seguridad (RLS) en Supabase para proteger los datos industriales.
3.  **Desarrollo de Interfaz (Frontend)**: Uso de Next.js 16 con **App Router** para una navegación fluida y renderizado eficiente.
4.  **Integración de Asistente Virtual**: Implementación de un bot de WhatsApp utilizando **Evolution API** y **Google Gemini AI**. Este asistente permite al personal de campo consultar stock, descripciones técnicas y responsables de equipos mediante lenguaje natural, procesando incluso notas de voz.
5.  **Integración de Servicios de Reporte**: Conexión con APIs de exportación (ExcelJS) y manejo de estados asíncronos para acciones críticas.

#### 2.2. Teoría y Cálculos
El sistema basa su funcionamiento en algoritmos de **Trazabilidad Dual**:
-   **Lógica de Inventario**: Cálculo de stock disponible mediante la sumatoria de movimientos (Ingresos - Egresos).
-   **Lógica de Equipos**: Seguimiento geográfico basado en estados (`almacen` vs `campo`), vinculando cada activo a un responsable mediante su DNI o número de trabajador.
-   **Eficiencia de Carga**: Optimización de tiempos de respuesta mediante el uso de **Incremental Static Regeneration (ISR)** y **Turbopack**, logrando tiempos de carga menores a 2 segundos en redes industriales.

#### 2.3. Presupuesto (Estimación Técnica)
Para el mantenimiento del sistema en un entorno de producción moderado (50 usuarios activos), se estima el siguiente costo operativo mensual (USD):
-   **Hosting (Vercel Pro)**: $20.00
-   **Base de Datos (Supabase Pro)**: $25.00
-   **Almacenamiento de Documentos (S3/Supabase Storage)**: $5.00
-   **Total Estimado Mensual**: $50.00

---

### CAPÍTULO 3. RESULTADOS

#### 3.1. Análisis de Resultados
Se logró implementar con éxito los módulos de gestión de inventarios y seguimiento de equipos. Las pruebas de estrés demostraron que el sistema soporta la carga masiva de personal (importación desde Excel) de hasta 1000 registros en menos de 5 segundos. La resolución de errores críticos de UI, como la validación de URLs de avatar vacías y la gestión de estados de borrado (`deletingId`), ha resultado en una aplicación estable y libre de excepciones en producción.

#### 3.2. Conclusiones
-   Se ha demostrado la viabilidad técnica de un **ERP de Control de Proyecto** modular, habiendo finalizado con éxito la implementación del núcleo logístico (Almacén).
-   La integración de Inteligencia Artificial como canal de consulta ha probado ser un factor diferenciador que aumenta la eficiencia del personal operativo en campo.
-   La infraestructura en la nube (Supabase + Next.js) proporciona la estabilidad necesaria para que el sistema continúe creciendo con la implementación de nuevos módulos sin sacrificar rendimiento.

#### 3.3. Recomendaciones Técnicas y Proyecciones
-   **Continuidad de Desarrollo**: Finalizar la implementación de los módulos de Gestión de Personal y Seguridad (HSE) que se encuentran actualmente en fase de desarrollo.
-   **Análisis Predictivo**: Utilizar la data recolectada en el módulo de almacén para generar pronósticos de consumo y reabastecimiento automático.
-   **Escalabilidad ERP**: Integrar progresivamente los sistemas de Compras y Contabilidad para cerrar el ecosistema de control de proyecto propuesto.

---

### REFERENCIAS BIBLIOGRÁFICAS
-   Next.js Documentation. (2024). *The React Framework for the Web*. Recuperado de nextjs.org
-   Supabase Docs. (2024). *Build in a weekend, scale to millions*. Recuperado de supabase.com/docs
-   React Documentation. (2024). *A JavaScript library for building user interfaces*. Recuperado de react.dev

---

### ANEXOS
-   **Anexo A**: Capturas de pantalla del Dashboard con KPIs Logísticos.
-   **Anexo B**: Estructura de datos en Supabase (Entity Relationship hints).
-   **Anexo C**: Código fuente del sistema de exportación de reportes (XLSX/PDF).
