import { supabase } from './lib/supabase';
async function test() {
  const { data, error } = await supabase.from('equipment').select('*').limit(1);
  console.log('Columns:', data ? Object.keys(data[0]) : 'None');
  if (error) console.error('Error:', error);
}
test();
