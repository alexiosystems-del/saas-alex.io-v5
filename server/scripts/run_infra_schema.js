const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  const sqlFile = path.join(__dirname, 'fix_schema_infra.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log("Running INFRA SQL script...");
  try {
    console.log("This should be run in the Supabase SQL editor:");
    console.log("===============================");
    console.log(sql);
    console.log("===============================");
  } catch(e) {
    console.error("Error:", e);
  }
}
runSQL();
