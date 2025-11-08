#!/bin/bash

# =====================================================
# Backend Setup Script for Language Exchange App
# =====================================================
# This script helps you set up the Supabase backend
# =====================================================

echo "🚀 Language Exchange App - Backend Setup"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📋 Setup Steps:"
echo ""
echo "1. ✅ Run SQL scripts in Supabase Dashboard"
echo "2. ✅ Enable Realtime on tables"
echo "3. ✅ Create Storage buckets"
echo "4. ✅ Set up Storage policies"
echo "5. ✅ Test the application"
echo ""

# Function to combine SQL files
combine_sql_files() {
    echo "📦 Combining SQL files..."
    cat > combined_setup.sql << 'EOF'
-- =====================================================
-- COMBINED BACKEND SETUP SCRIPT
-- Language Exchange App - Complete Supabase Setup
-- =====================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

EOF

    # List of SQL files in order
    FILES=(
        "scripts/003_complete_database_schema.sql"
        "scripts/006_postgis_location_discovery.sql"
        "scripts/005_realtime_chat_system.sql"
        "scripts/009_notification_system.sql"
        "scripts/007_gamification_system.sql"
        "scripts/008_rating_review_system.sql"
        "scripts/010_stories_feed_system.sql"
        "scripts/012_security_privacy_system.sql"
        "scripts/011_analytics_admin_system.sql"
        "scripts/013_scheduled_jobs_system.sql"
    )

    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "-- =====================================================" >> combined_setup.sql
            echo "-- From: $file" >> combined_setup.sql
            echo "-- =====================================================" >> combined_setup.sql
            cat "$file" >> combined_setup.sql
            echo "" >> combined_setup.sql
            echo "" >> combined_setup.sql
        else
            echo "⚠️  Warning: $file not found"
        fi
    done

    echo "✅ Combined SQL file created: combined_setup.sql"
    echo "   Copy this file content to Supabase SQL Editor"
}

# Check if we should combine files
if [ "$1" == "combine" ]; then
    combine_sql_files
    exit 0
fi

echo "📝 Manual Setup Instructions:"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Run each SQL script in this order:"
echo ""
echo "   a) scripts/003_complete_database_schema.sql"
echo "   b) scripts/006_postgis_location_discovery.sql"
echo "   c) scripts/005_realtime_chat_system.sql"
echo "   d) scripts/009_notification_system.sql"
echo "   e) scripts/007_gamification_system.sql"
echo "   f) scripts/008_rating_review_system.sql"
echo "   g) scripts/010_stories_feed_system.sql"
echo "   h) scripts/012_security_privacy_system.sql"
echo "   i) scripts/011_analytics_admin_system.sql"
echo "   j) scripts/013_scheduled_jobs_system.sql"
echo ""
echo "4. Enable Realtime:"
echo "   - Go to Database → Replication"
echo "   - Enable for: messages, conversations, users, notifications"
echo ""
echo "5. Create Storage buckets:"
echo "   - avatars (public)"
echo "   - chat-images (public)"
echo "   - voice-messages (public)"
echo ""
echo "💡 Tip: Run './scripts/setup_backend.sh combine' to create a single SQL file"
echo ""

