# Guía de Instalación y Despliegue - Sistema de Control de Almacén

El proyecto está construido sobre un stack moderno utilizando **Next.js 16 (App Router)**, **TypeScript**, y **Supabase** como backend como servicio (BaaS). Siga los pasos a continuación para ejecutar el proyecto en un entorno de desarrollo local.

## 1. Requisitos Previos (Prerrequisitos)
Asegúrese de tener instalado el siguiente software en su equipo:
- **Node.js** (Versión 18.x o superior): Descárguelo desde [nodejs.org](https://nodejs.org/).
- **NPM** (Viene incluido al instalar Node.js) o **Yarn** o **PNPM**.
- **Git**: Descárguelo desde [git-scm.com](https://git-scm.com/) (si va a clonar el repositorio).
- Un editor de código, se recomienda **Visual Studio Code (VSCode)**.

## 2. Preparación del Proyecto

### Opción A: A partir del Código Fuente Comprimido (Zip)
1. Extraiga el contenido del archivo `entregable_final_erp.zip` en una carpeta de su preferencia.
2. Abra la carpeta extraída utilizando su editor de código (ej. VSCode).
3. Abra una nueva terminal en su editor (En VSCode: `Ver > Terminal` o `Ctrl + \``).

### Opción B: Clonar Repositorio (Si aplica)
1. Abra su terminal.
2. Ejecute el comando: `git clone <URL_DEL_REPOSITORIO>`
3. Navegue a la carpeta del proyecto: `cd Sistema_Control_Almacen`

## 3. Instalación de Dependencias
Dentro de la raíz del proyecto en su terminal, ejecute el siguiente comando para descargar todos los paquetes necesarios especificados en el `package.json`:

```bash
npm install
```
*(Nota: Este proceso puede tardar un par de minutos dependiendo de su conexión a internet).*

## 4. Configuración de Variables de Entorno (Supabase)
El sistema requiere conectarse a una base de datos de Supabase. Para ello:

1. En la raíz del proyecto, busque o cree un archivo llamado `.env.local`. (Puede basarse en `.env.example` si existe).
2. Dentro de `.env.local`, deberá incluir las credenciales de su proyecto de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[TU-PROYECTO-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJh...[TU-CLAVE-ANONIMA]"
```
> **Nota de Evaluación**: Si el docente está evaluando el proyecto a través de la carpeta comprimida, es posible que el archivo `.env.local` ya haya sido proveído para propósitos de demostración.

## 5. Ejecución del Servidor de Desarrollo
Una vez instaladas las dependencias y configuradas las variables de entorno, proceda a levantar el servidor:

```bash
npm run dev
```

El servidor iniciará en su entorno local. La terminal le indicará que la aplicación está lista.

## 6. Acceso a la Aplicación
Abra su navegador web preferido (Google Chrome, Firefox, Safari) y diríjase a la siguiente dirección:

```
http://localhost:3000
```

Verá la pantalla de inicio de sesión de la aplicación, lista para ser utilizada.

## 7. Construcción para Producción (Opcional)
Si desea generar el proyecto optimizado para producción, ejecute:
```bash
npm run build
```
Y luego inícielo con:
```bash
npm run start
```
