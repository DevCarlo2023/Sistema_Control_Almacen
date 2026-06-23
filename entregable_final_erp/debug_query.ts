import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('Searching for equipment 1AP-08607...');
    const { data: equip } = await supabase.from('equipment').select('id, name, serial_number').eq('serial_number', '1AP-08607').single();
    if (!equip) {
        console.log('No equipment found');
        return;
    }
    console.log('Equipment:', equip);
    const { data: movs } = await supabase.from('equipment_movements').select('movement_type, created_at, worker_id, worker:workers(full_name)').eq('equipment_id', equip.id).order('created_at', { ascending: false }).limit(5);
    console.log('Movements:', JSON.stringify(movs, null, 2));
}

debug();
