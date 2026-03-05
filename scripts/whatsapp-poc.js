/**
 * CARLOS TECH - WhatsApp Bot PoC
 * Este script es una prueba de concepto para ejecutar en el servidor Oracle.
 * Requiere: npm install @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración (Se recomienda usar variables de entorno)
const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = 'TU_SERVICE_ROLE_KEY'; // Necesario para saltar RLS en consultas de bot

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Consulta el stock de un material específico
 */
async function consultarStock(nombreMaterial) {
    console.log(`🔍 Buscando stock para: ${nombreMaterial}...`);

    const { data, error } = await supabase
        .from('inventory_items')
        .select(`
            quantity,
            material:materials(name, unit_of_measure),
            warehouse:warehouses(name)
        `)
        .ilike('material.name', `%${nombreMaterial}%`);

    if (error) {
        return `❌ Error en la base de datos: ${error.message}`;
    }

    if (!data || data.length === 0) {
        return `⚠️ No se encontró ningún material que coincida con "${nombreMaterial}".`;
    }

    let respuesta = `📦 *Resultados para "${nombreMaterial}":*\n\n`;
    data.forEach(item => {
        respuesta += `• *${item.material.name}*: ${item.quantity} ${item.material.unit_of_measure}\n`;
        respuesta += `  📍 Ubicación: ${item.warehouse.name}\n\n`;
    });

    return respuesta;
}

// Ejemplo de ejecución
const query = process.argv[2] || 'cemento';
consultarStock(query).then(res => {
    console.log('--- RESPUESTA DEL BOT ---');
    console.log(res);
});
