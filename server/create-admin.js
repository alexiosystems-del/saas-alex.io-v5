/**
 * Script para crear un usuario SuperAdmin en Supabase
 * Uso: node create-admin.js <email> <password>
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://euknjjnjcgdlksrcbkde.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY. Ejecutá así:');
    console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="tu-key-aqui"; node create-admin.js tu@email.com tuPassword123');
    process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('❌ Uso: node create-admin.js <email> <password>');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log(`\n🔧 Creando usuario: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'SUPERADMIN', plan: 'ENTERPRISE' }
    });

    if (error) {
        if (error.message.includes('already been registered')) {
            console.log('⚠️  El usuario ya existe. Intentando actualizar rol...');
            
            // Get user by email
            const { data: users } = await supabase.auth.admin.listUsers();
            const user = users?.users?.find(u => u.email === email);
            
            if (user) {
                await supabase.auth.admin.updateUserById(user.id, {
                    user_metadata: { role: 'SUPERADMIN', plan: 'ENTERPRISE' }
                });
                console.log(`✅ Usuario actualizado a SUPERADMIN: ${email} (ID: ${user.id})`);
            }
            return;
        }
        console.error('❌ Error:', error.message);
        process.exit(1);
    }

    console.log(`✅ Usuario creado exitosamente:`);
    console.log(`   📧 Email: ${data.user.email}`);
    console.log(`   🆔 ID: ${data.user.id}`);
    console.log(`   👑 Rol: SUPERADMIN`);
    console.log(`   💎 Plan: ENTERPRISE`);
    console.log(`\n🚀 Ya podés iniciar sesión en https://whatsapp-fullstack-1-yjao.onrender.com/#/login`);
}

main();
