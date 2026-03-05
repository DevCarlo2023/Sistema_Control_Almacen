/**
 * CARLO TECH V2.0 - WhatsApp Bot
 * Bot inteligente para consulta de stock e inventario via WhatsApp
 * 
 * Instalación: npm install @supabase/supabase-js express
 * Uso: node whatsapp-bot.js
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURACIÓN - Edita estos valores
// ============================================
const CONFIG = {
    // Tus credenciales de Supabase (las encuentras en Settings > API de tu proyecto)
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://TU_PROYECTO.supabase.co',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || 'TU_SERVICE_ROLE_KEY',

    // Evolution API
    EVOLUTION_URL: process.env.EVOLUTION_URL || 'http://10.0.2.13:8080',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11',
    INSTANCE_NAME: process.env.INSTANCE_NAME || 'carlos_tech_bot',

    // Números autorizados para hacer consultas (con código de país)
    // Ejemplo: ['51943236437', '51987654321']
    NUMEROS_AUTORIZADOS: (process.env.NUMEROS_AUTORIZADOS || '51943236437').split(','),

    // Puerto del servidor webhook
    PORT: process.env.PORT || 3001,
};

// ============================================
// INICIALIZACIÓN
// ============================================
const app = express();
app.use(express.json());

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

// ============================================
// FUNCIONES DE CONSULTA A SUPABASE
// ============================================

async function consultarStock(filtro = '') {
    let query = supabase
        .from('inventory_items')
        .select('quantity, material:materials(name, unit_of_measure), warehouse:warehouses(name)');

    if (filtro) {
        query = query.ilike('materials.name', `%${filtro}%`);
    }

    const { data, error } = await query.order('quantity', { ascending: false }).limit(15);
    if (error) throw error;

    if (!data || data.length === 0) {
        return filtro
            ? `❌ No encontré material "${filtro}" en el inventario.`
            : '❌ No hay datos en el inventario.';
    }

    let resp = `📦 *STOCK ACTUAL${filtro ? ` - "${filtro.toUpperCase()}"` : ''}*\n\n`;
    data.forEach(item => {
        if (item.material && item.quantity > 0) {
            resp += `• *${item.material.name}*: ${item.quantity} ${item.material.unit_of_measure || 'und'}\n`;
            if (item.warehouse) resp += `  📍 ${item.warehouse.name}\n`;
        }
    });
    resp += `\n_Consultado: ${new Date().toLocaleString('es-PE')}_`;
    return resp;
}

async function consultarMovimientos(tipo = '', limite = 10) {
    let query = supabase
        .from('inventory_movements')
        .select('movement_type, quantity, created_at, notes, material:materials(name), warehouse:warehouses(name)')
        .order('created_at', { ascending: false })
        .limit(limite);

    if (tipo === 'entrada' || tipo === 'salida') {
        query = query.eq('movement_type', tipo);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) return '❌ No hay movimientos registrados.';

    const titulo = tipo ? tipo.toUpperCase() + 'S' : 'ÚLTIMOS MOVIMIENTOS';
    let resp = `📋 *${titulo}*\n\n`;
    data.forEach(m => {
        const icono = m.movement_type === 'entrada' ? '🟢' : '🔴';
        const fecha = new Date(m.created_at).toLocaleDateString('es-PE');
        resp += `${icono} *${m.material?.name || 'Sin nombre'}* - ${m.quantity} und\n`;
        resp += `  📅 ${fecha}`;
        if (m.warehouse) resp += ` | 🏭 ${m.warehouse.name}`;
        if (m.notes) resp += `\n  📝 ${m.notes}`;
        resp += '\n\n';
    });
    return resp.trim();
}

async function consultarEquipos(filtro = '') {
    let query = supabase
        .from('equipment')
        .select('name, status, category, current_location, brand, model, serial_number');

    if (filtro) {
        query = query.or(`name.ilike.%${filtro}%,brand.ilike.%${filtro}%`);
    }

    const { data, error } = await query.limit(10);
    if (error) throw error;

    if (!data || data.length === 0) {
        return filtro ? `❌ No encontré equipo "${filtro}".` : '❌ No hay equipos registrados.';
    }

    const statusIcon = { operativo: '✅', en_reparacion: '🔧', baja: '❌' };
    const locIcon = { almacen: '🏭', campo: '🏗️' };

    let resp = `🔧 *EQUIPOS${filtro ? ` - "${filtro.toUpperCase()}"` : ''}*\n\n`;
    data.forEach(e => {
        resp += `${statusIcon[e.status] || '❓'} *${e.name}*\n`;
        if (e.brand || e.model) resp += `  📱 ${e.brand || ''} ${e.model || ''}\n`;
        if (e.serial_number) resp += `  🔢 S/N: ${e.serial_number}\n`;
        resp += `  ${locIcon[e.current_location] || '📍'} ${e.current_location}\n\n`;
    });
    return resp.trim();
}

async function consultarPersonal() {
    const { data, error } = await supabase
        .from('workers')
        .select('full_name, position, worker_number, dni')
        .order('full_name')
        .limit(20);

    if (error) throw error;
    if (!data || data.length === 0) return '❌ No hay personal registrado.';

    let resp = `👥 *PERSONAL REGISTRADO*\n\n`;
    data.forEach(w => {
        resp += `• *${w.full_name}*`;
        if (w.position) resp += ` - ${w.position}`;
        if (w.worker_number) resp += ` (#${w.worker_number})`;
        resp += '\n';
    });
    return resp.trim();
}

// ============================================
// PROCESADOR DE MENSAJES
// ============================================

function parsearMensaje(texto) {
    const t = texto.toLowerCase().trim();

    // Stock
    if (t.includes('stock') || t.includes('inventario') || t.includes('almacen') || t.includes('almacén') || t.includes('hay')) {
        const filtro = t.replace(/stock|inventario|almacen|almacén|cuanto hay de|hay|de|?/g, '').trim();
        return { tipo: 'stock', filtro };
    }
    // Movimientos
    if (t.includes('movimiento') || t.includes('ingreso') || t.includes('egreso') || t.includes('entrada') || t.includes('salida')) {
        const tipo = t.includes('entrada') || t.includes('ingreso') ? 'entrada'
            : t.includes('salida') || t.includes('egreso') ? 'salida' : '';
        return { tipo: 'movimientos', subtipo: tipo };
    }
    // Equipos
    if (t.includes('equipo') || t.includes('herramienta') || t.includes('maquina') || t.includes('máquina')) {
        const filtro = t.replace(/equipo|equipos|herramienta|maquina|máquina|s/g, '').trim();
        return { tipo: 'equipos', filtro };
    }
    // Personal
    if (t.includes('personal') || t.includes('trabajador') || t.includes('empleado') || t.includes('quien')) {
        return { tipo: 'personal' };
    }
    // Ayuda
    if (t.includes('ayuda') || t.includes('help') || t.includes('menu') || t.includes('menú') || t === 'hola' || t === 'hi') {
        return { tipo: 'ayuda' };
    }

    return { tipo: 'desconocido' };
}

function menuAyuda() {
    return `👋 *¡Hola! Soy el Bot de CARLO TECH V2.0*\n\n*Puedo consultarte:*\n\n📦 *Stock/Inventario*\n  → "stock cemento"\n  → "inventario"\n  → "cuánto hay de tornillos"\n\n📋 *Movimientos*\n  → "últimos movimientos"\n  → "entradas"\n  → "salidas"\n\n🔧 *Equipos*\n  → "equipos"\n  → "equipo taladro"\n\n👥 *Personal*\n  → "personal"\n  → "trabajadores"\n\nEscribe cualquiera de estos comandos y te respondo al instante 🚀`;
}

// ============================================
// FUNCIÓN PARA ENVIAR MENSAJES
// ============================================

async function enviarMensaje(numero, mensaje) {
    const url = `${CONFIG.EVOLUTION_URL}/message/sendText/${CONFIG.INSTANCE_NAME}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
                number: `${numero}@s.whatsapp.net`,
                text: mensaje,
            }),
        });
        const data = await res.json();
        console.log(`✅ Mensaje enviado a ${numero}:`, data.key?.id || 'ok');
    } catch (err) {
        console.error(`❌ Error enviando mensaje a ${numero}:`, err.message);
    }
}

// ============================================
// WEBHOOK - RECIBE MENSAJES DE WHATSAPP
// ============================================

app.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Responder rápido a Evolution API

    try {
        const body = req.body;
        if (body.event !== 'messages.upsert') return;

        const message = body.data?.messages?.[0];
        if (!message || message.key?.fromMe) return; // Ignorar mensajes propios

        const numero = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
        const texto = message.message?.conversation || message.message?.extendedTextMessage?.text;

        if (!numero || !texto) return;

        console.log(`📨 Mensaje de ${numero}: "${texto}"`);

        // Verificar autorización
        if (!CONFIG.NUMEROS_AUTORIZADOS.includes(numero)) {
            console.log(`⚠️ Número no autorizado: ${numero}`);
            return;
        }

        // Procesar mensaje
        const { tipo, filtro, subtipo } = parsearMensaje(texto);
        let respuesta = '';

        switch (tipo) {
            case 'stock':
                respuesta = await consultarStock(filtro);
                break;
            case 'movimientos':
                respuesta = await consultarMovimientos(subtipo);
                break;
            case 'equipos':
                respuesta = await consultarEquipos(filtro);
                break;
            case 'personal':
                respuesta = await consultarPersonal();
                break;
            case 'ayuda':
                respuesta = menuAyuda();
                break;
            default:
                respuesta = `❓ No entendí: *"${texto}"*\n\nEscribe *ayuda* para ver los comandos disponibles.`;
        }

        await enviarMensaje(numero, respuesta);

    } catch (err) {
        console.error('❌ Error en webhook:', err.message);
    }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', bot: 'CARLO TECH V2.0', version: '1.0' }));

// ============================================
// INICIO DEL SERVIDOR
// ============================================
app.listen(CONFIG.PORT, () => {
    console.log(`\n🚀 CARLO TECH WhatsApp Bot corriendo en puerto ${CONFIG.PORT}`);
    console.log(`📡 Webhook: http://localhost:${CONFIG.PORT}/webhook`);
    console.log(`✅ Instancia: ${CONFIG.INSTANCE_NAME}`);
    console.log(`👥 Números autorizados: ${CONFIG.NUMEROS_AUTORIZADOS.join(', ')}\n`);
});
