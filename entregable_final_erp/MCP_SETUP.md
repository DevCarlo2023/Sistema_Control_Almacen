# MCP Setup — PROMET ERP

Este proyecto está configurado para usar **Model Context Protocol (MCP)** con dos servidores:

## 🎨 1. Google Stitch (Generación de UI)

**Stitch** genera pantallas de UI a partir de texto y te permite conectar el código generado directamente con tu editor de IA.

### Cómo obtener tu API Key de Stitch

1. Ve a **[stitch.withgoogle.com](https://stitch.withgoogle.com)**
2. Inicia sesión con tu cuenta Google
3. Abre la configuración o tu perfil → busca **"API Key"** o **"Developer settings"**
4. Copia la clave y pégala en el archivo `.cursor/mcp.json` reemplazando `TU_STITCH_API_KEY_AQUI`

---

## 🗄️ 2. Supabase MCP (Acceso directo a la base de datos)

Permite que tu agente de IA consulte y modifique tablas de Supabase directamente.

### Cómo obtener tu Supabase Access Token

1. Ve a **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. Haz clic en tu avatar → **"Access Tokens"**
3. Crea un nuevo token con nombre `PROMET-MCP`
4. Copia el token y pégalo en el archivo `.cursor/mcp.json` reemplazando `TU_SUPABASE_ACCESS_TOKEN_AQUI`

---

## 🛠️ Configuración para cada editor

### Cursor
El archivo `.cursor/mcp.json` ya está creado. Solo rellena las claves y reinicia Cursor.

### Claude Desktop
Copia el contenido de `mcp.json` a:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```
(en Mac)

### Windsurf / VS Code con Copilot
Usa el archivo `mcp.json` en la raíz del proyecto o configura desde el panel MCP del editor.

---

## ✅ Verificar que funciona

Una vez configurado, en tu editor de IA podrás usar comandos como:

```
"Genera una pantalla de dashboard de inventario industrial para mi ERP, 
usando tonos azul slate y botones redondeados"
```

Y yo podré:
1. Crear el proyecto en Stitch
2. Obtener el HTML/CSS generado
3. Convertirlo automáticamente a un componente React para tu proyecto

---

## 📋 Herramientas disponibles con Stitch MCP

| Herramienta | Descripción |
|---|---|
| `create_project` | Crea un nuevo proyecto de diseño en Stitch |
| `generate_screen_from_text` | Genera una pantalla UI a partir de texto |
| `get_screen` | Obtiene el HTML/CSS o imagen de una pantalla |
| `extract_design_context` | Extrae la paleta y estilos de tu proyecto |
| `list_screens` | Lista todas las pantallas existentes |
