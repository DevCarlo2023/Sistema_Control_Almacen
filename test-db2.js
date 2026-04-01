const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    let { data, count } = await supabase.from('materials').select('name', { count: 'exact' });
    console.log("TOTAL MATERIALS:", count);
}
check();
