const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    let { data } = await supabase.from('materials').select('*').or('name.eq.40015170,code.eq.40015170').limit(2);
    console.log(data);
}
check();
