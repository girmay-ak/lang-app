#!/bin/bash

# =====================================================
# Run Backend Setup Script
# =====================================================

echo "🚀 Running Backend Setup Script..."
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    
    # Check if .env.local exists
    if [ -f .env.local ]; then
        source .env.local
        
        if [ -z "$SUPABASE_POSTGRES_URL" ]; then
            echo "❌ SUPABASE_POSTGRES_URL not found in .env.local"
            echo "   Please run the script manually in Supabase Dashboard"
            exit 1
        fi
        
        echo "📋 Attempting to run SQL script via Supabase CLI..."
        echo ""
        
        # Try to run via psql if available
        if command -v psql &> /dev/null; then
            echo "✅ psql found, running script..."
            psql "$SUPABASE_POSTGRES_URL" -f scripts/SETUP_ALL_10_STEPS.sql
            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ Script executed successfully!"
                exit 0
            else
                echo ""
                echo "❌ Script execution failed"
                echo "   Please run manually in Supabase Dashboard"
                exit 1
            fi
        else
            echo "⚠️  psql not found"
            echo "   Please install PostgreSQL client or run manually"
        fi
    else
        echo "❌ .env.local not found"
    fi
else
    echo "⚠️  Supabase CLI not found"
fi

echo ""
echo "📋 Manual Setup Required:"
echo ""
echo "1. Go to: https://app.supabase.com"
echo "2. Select your project"
echo "3. Go to: SQL Editor"
echo "4. Click: New Query"
echo "5. Open: scripts/SETUP_ALL_10_STEPS.sql"
echo "6. Copy entire file content"
echo "7. Paste into SQL Editor"
echo "8. Click: Run"
echo ""

