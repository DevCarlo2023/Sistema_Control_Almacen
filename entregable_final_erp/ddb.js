const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    let token = "alambre";
    let query = supabase.from('inventory').select('quantity, material:materials!inner(name, description, code), warehouse:warehouses(name)');
    query = query.or(`name.ilike.%${token}%,description.ilike.%${token}%,code.ilike.%${token}%`, { foreignTable: "materials" });
    const { data, error } = await query.limit(10);
    console.log("DATA LENGTH:", data?.length);
    if (data) console.log(JSON.stringify(data.slice(0, 2), null, 2));
    console.log("ERROR:", error);
}
check();
