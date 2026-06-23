# DOSSIER TÉCNICO: SISTEMA ERP INDUSTRIAL "CARLO TECH"
**Proyecto: Gestión de Activos, Almacén y Recursos Humanos**

---

## 1. RESUMEN DEL PROYECTO
Plataforma integral diseñada para el control operativo de proyectos de infraestructura. El sistema permite la gestión en tiempo real de materiales, maquinaria pesada y personal, integrando inteligencia artificial para la consulta de stock y procesos automatizados de despacho.

---

## 2. ARQUITECTURA DE INFORMACIÓN
El sistema se organiza en módulos críticos para la operación industrial:

### Mapa del Sitio (Sitemap)
- **Login**: Autenticación segura mediante Supabase Auth.
- **Dashboard**: Panel de control con indicadores clave (KPIs).
- **Almacén**:
    - Stock de Materiales (Ingresos/Egresos/Traslados).
    - Control de Equipos (Asignación y Mantenimiento).
    - Centro de Documentación (PDFs, Planos, Certificados).
- **SSOMA / Calidad**: Registro de inspecciones y seguridad en campo.
- **Administración**: Gestión de Recursos Humanos y carga masiva de personal.

---

## 3. DISEÑO Y WIREFRAMES (PRE-PROGRAMACIÓN)
Antes de la fase de desarrollo, se diseñaron wireframes de alta fidelidad para validar la experiencia de usuario (UX).

### Wireframe de Planificación
![Wireframe Dashboard](file:///Users/carlo/.gemini/antigravity/brain/58e365ff-bc6d-4bb7-9630-d1ba2c83e651/wireframe_erp_dashboard_arquitectura_1777422416050.png)

---

## 4. GALERÍA DE MÓDULOS (SISTEMA REAL)

### Dashboard Principal
Monitoreo de eficiencia de cadena, alertas rojas y actividad reciente.
![Dashboard Real](file:///Users/carlo/.gemini/antigravity/brain/58e365ff-bc6d-4bb7-9630-d1ba2c83e651/erp_dashboard_real.png)

### Gestión de Materiales
Interfaz de control de stock con selector de almacenes y búsqueda avanzada.
![Materiales Real](file:///Users/carlo/.gemini/antigravity/brain/58e365ff-bc6d-4bb7-9630-d1ba2c83e651/erp_materials_real.png)

### Control de Maquinaria y Equipos
Seguimiento de flota pesada y estado de operatividad.
![Equipos Real](file:///Users/carlo/.gemini/antigravity/brain/58e365ff-bc6d-4bb7-9630-d1ba2c83e651/erp_equipment_real.png)

---

## 5. FLUJO DE PROCESOS (BPMN)
Modelo de negocio para el despacho de materiales y equipos:

1. **Solicitud**: El personal solicita vía sistema o WhatsApp.
2. **Validación**: La IA consulta el stock en tiempo real.
3. **Ejecución**: 
   - Si es **Material**: Registro de egreso y generación de PDF.
   - Si es **Equipo**: Asignación, uso en campo y registro de retorno con inspección.

---

## 6. STACK TECNOLÓGICO
- **Frontend**: React 18, Next.js 14 (App Router).
- **Estilos**: Tailwind CSS con diseño industrial personalizado.
- **Base de Datos**: PostgreSQL (Supabase).
- **Autenticación**: Supabase GoTrue.
- **Despliegue**: Vercel (CI/CD).
