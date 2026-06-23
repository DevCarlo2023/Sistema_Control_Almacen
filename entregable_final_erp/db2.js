const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    let q = sb.from('inventory').select('quantity, material:materials!inner(name, description, code), warehouse:warehouses(name)');
    q = q.or('name.ilike.%40018512%,description.ilike.%40018512%,code.ilike.%40018512%', { foreignTable: 'materials' });
    let { data, error } = await q.limit(10);
    console.log('DATA:', JSON.stringify(data, null, 2));
    if (error) console.log('ERROR:', error);
})();
