const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to Supabase...');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials.');
    process.exit(1);
}

async function testConnection() {
    try {
        const start = Date.now();
        const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: {
                'apikey': supabaseKey,
            },
        });
        const duration = Date.now() - start;

        console.log(`Response status: ${response.status}`);
        console.log(`Duration: ${duration}ms`);

        if (response.ok) {
            console.log('✅ Connection successful!');
        } else {
            console.error('❌ Connection failed:', await response.text());
        }
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

testConnection();
