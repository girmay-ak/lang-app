#!/usr/bin/env node

/**
 * Execute Backend Setup Script via Supabase API
 * This script runs the SQL setup script directly via Supabase REST API
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseServiceKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const match = line.match(/^([^=]+)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      
      if (key === 'SUPABASE_URL' || key === 'NEXT_PUBLIC_SUPABASE_URL') {
        supabaseUrl = value;
      }
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
        supabaseServiceKey = value;
      }
    }
  });
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Read SQL script
const sqlPath = path.join(__dirname, 'SETUP_ALL_10_STEPS.sql');
if (!fs.existsSync(sqlPath)) {
  console.error(`❌ SQL script not found: ${sqlPath}`);
  process.exit(1);
}

const sqlScript = fs.readFileSync(sqlPath, 'utf8');

// Execute SQL via Supabase REST API
async function executeSQL() {
  console.log('🚀 Executing backend setup script...\n');
  
  try {
    // Split SQL into statements (basic split by semicolon)
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 10);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute via Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: sqlScript
      })
    });
    
    if (!response.ok) {
      // Try alternative method - direct SQL execution
      console.log('⚠️  API method not available, trying alternative...\n');
      console.log('📋 Please run the script manually in Supabase Dashboard:\n');
      console.log('1. Go to: https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Go to: SQL Editor');
      console.log('4. Click: New Query');
      console.log('5. Open: scripts/SETUP_ALL_10_STEPS.sql');
      console.log('6. Copy entire content and paste');
      console.log('7. Click: Run\n');
      
      // Open the SQL file content
      console.log('📄 SQL Script Content:\n');
      console.log('---');
      console.log(sqlScript);
      console.log('---\n');
      
      process.exit(0);
    }
    
    const result = await response.json();
    console.log('✅ Script executed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error executing script:', error.message);
    console.log('\n📋 Manual execution required:\n');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to: SQL Editor');
    console.log('4. Click: New Query');
    console.log('5. Copy the content from: scripts/SETUP_ALL_10_STEPS.sql');
    console.log('6. Paste into SQL Editor');
    console.log('7. Click: Run\n');
    
    process.exit(1);
  }
}

executeSQL();

