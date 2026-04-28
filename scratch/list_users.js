const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://csmynzxymstfouivdsik.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbXluenh5bXN0Zm91aXZkc2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk0MzM5OCwiZXhwIjoyMDg3NTE5Mzk4fQ.BeGva6qWk9zQNFDfa_Qz2POJrXxq-pe_sexAMhm89rU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  console.log('Users found:');
  users.forEach(user => {
    console.log(`- ${user.email}`);
  });
}

listUsers();
