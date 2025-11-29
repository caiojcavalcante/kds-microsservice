const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('\nUsage: node scripts/create-user.js <email> <password>');
    console.error('Example: node scripts/create-user.js admin@ferroefogo.com 123456\n');
    process.exit(1);
}

async function createUser() {
    console.log(`Creating user: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (error) {
        console.error('Error creating user:', error.message);
        return;
    }

    console.log('\n✅ User created successfully!');
    console.log(`ID: ${data.user.id}`);
    console.log(`Email: ${data.user.email}`);
    console.log('\nYou can now log in at /login');
}

createUser();
