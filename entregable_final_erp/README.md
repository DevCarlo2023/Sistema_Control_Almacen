# Sistema Control Almacén - Proyecto EFSRT

## 🏢 Escuela de Ingeniería
Este proyecto ha sido desarrollado como parte del informe técnico de **Experiencias Formativas en Situaciones Reales de Trabajo (EFSRT)**.

---

### 🚀 Descripción
El **Sistema Control Almacén** es una plataforma centralizada para la gestión de activos, materiales y equipos en entornos industriales. Permite la trazabilidad en tiempo real de cada movimiento logístico, vinculando activos con personal responsable y generando reportes de auditoría automáticos.

### 🛠️ Tecnologías
-   **Frontend**: Next.js 16 (App Router), React 19.
-   **Backend**: Supabase (PostgreSQL + Realtime + Auth).
-   **Estilos**: Tailwind CSS 4 con estética Bento Grid.
-   **Reportes**: ExcelJS y jsPDF para exportaciones técnicas.
-   **Iconos**: Lucide React y Material Symbols.

### 📦 Funcionalidades Principales
-   **Dashboard de KPIs**: Visualización instantánea del estado de almacenes.
-   **Control de Inventario**: Ingresos y egresos de materiales con trazabilidad por almacén.
-   **Gestión de Equipos**: Seguimiento de estado (operativo/campo) y responsables.
-   **Asistente WhatsApp (IA)**: Consultas en lenguaje natural desde el campo mediante Google Gemini.
-   **Importación Masiva**: Carga de personal desde archivos Excel.
-   **Reportes Técnicos**: Generación de documentos XLSX y PDF listos para firmar.

### 🔮 Proyección (ERP Industrial)
La meta del proyecto es evolucionar de un Sistema de Almacén a un **ERP Industrial** sólido y escalable que incluya:
-   Módulos de Compras y Proveedores.
-   Contabilidad y Gestión Financiera.
-   Facturación Electrónica e integraciones SUNAT.

### ⚙️ Instalación
1.  **Clonar el repositorio**.
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Configurar Supabase**: Crea un archivo `.env.local` con tus credenciales:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
    ```
4.  **Ejecutar en desarrollo**:
    ```bash
    npm run dev
    ```

### 📄 Documentación Académica
Puedes encontrar el informe detallado para la universidad en:
-   [INFORME_TECNICO_EFSRT.md](./INFORME_TECNICO_EFSRT.md)
-   [GUIA_DE_DEMO.md](./GUIA_DE_DEMO.md)

---
Proyecto desarrollado por: **[Tu Nombre y Apellido]**
Lima - Perú, 2026
