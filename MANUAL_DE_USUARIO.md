# Manual de Usuario - Sistema de Control de Almacén

## 1. Introducción
El **Sistema de Control de Almacén** es una plataforma diseñada para la gestión logística de materiales y equipos. Permite llevar un registro detallado de los ingresos y egresos, asignando responsabilidades al personal de la empresa, todo ello con una interfaz moderna y tiempos de respuesta en tiempo real.

## 2. Acceso al Sistema
Para ingresar al sistema, diríjase a la URL proporcionada por el administrador del sistema e introduzca sus credenciales en la pantalla de **Login**.
Una vez autenticado, será redirigido automáticamente al Dashboard principal.

## 3. Dashboard Principal
El Dashboard ofrece una vista general del estado de su almacén mediante indicadores clave (KPIs):
- **Stock Total**: Cantidad global de ítems almacenados.
- **Flota/Equipos Activos**: Equipos que actualmente se encuentran operando en campo.
- **Alertas de Stock**: Notificaciones sobre materiales que han alcanzado su nivel de reabastecimiento mínimo (Stock Crítico).

## 4. Módulos del Sistema

### 4.1 Stock de Materiales
Ubicación: `Menú Lateral > Almacén > Stock Materiales`
En este módulo podrá visualizar el inventario de materiales fungibles (ej. EPPs, consumibles).
- **Ingreso de Material**: Seleccione el botón de "Ingreso", indique el material, la cantidad y el almacén destino. El stock se actualizará inmediatamente.
- **Egreso de Material**: Para retirar material, seleccione el ítem, indique la cantidad a retirar y asigne a qué trabajador se le entrega.

### 4.2 Control de Equipos
Ubicación: `Menú Lateral > Almacén > Control Equipos`
Gestione herramientas y equipos que deben ser devueltos al almacén.
- **Equipos en Almacén / Campo**: Visualice rápidamente qué equipos están disponibles y cuáles han sido asignados.
- **Egreso a Campo**: Asigne un equipo disponible a un trabajador y especifique el área de trabajo.
- **Retorno a Almacén**: Registre la devolución de un equipo por parte de un trabajador.

### 4.3 Gestión de Personal
El sistema permite administrar el personal al cual se le asignan equipos o materiales.
- **Importación Masiva**: A través de la interfaz de carga, suba un archivo Excel con la lista de sus trabajadores para registrarlos rápidamente en el sistema.

## 5. Reportes y Auditoría
Ubicación: `Menú Lateral > Historial de Movimientos`
El sistema mantiene un registro inalterable de cada transacción realizada.
- **Filtros**: Busque movimientos por fecha, usuario responsable, material o tipo de movimiento.
- **Exportar a PDF**: Genera un documento formateado y profesional, ideal para impresión y firmas físicas.
- **Exportar a Excel (XLSX)**: Descarga un archivo de hoja de cálculo con todos los datos detallados, ideal para conciliaciones o análisis en otras herramientas.

## 6. Asistente Virtual IA (WhatsApp)
El sistema cuenta con un bot integrado vía WhatsApp potenciado por inteligencia artificial.
- Envíe un mensaje al número asignado consultando por el stock de un material o por el responsable de un equipo (Ej: *"¿Cuántos cascos blancos quedan en el almacén principal?"*).
- El asistente procesará su solicitud en lenguaje natural y le responderá inmediatamente consultando la base de datos en tiempo real.

## 7. Cierre de Sesión
Para salir del sistema de forma segura, haga clic en su avatar de usuario en la esquina superior derecha o inferior del menú y seleccione **Cerrar Sesión**.
