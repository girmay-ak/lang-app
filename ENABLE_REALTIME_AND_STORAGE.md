# 🔧 Enable Realtime & Storage - Free Setup Guide

## ⚠️ Important: Free Tier Limits

### **Storage (Free Tier)**
- ✅ **1 GB free storage** included
- ✅ **2 GB bandwidth** per month
- ✅ Perfect for avatars, chat images, voice messages (small files)
- 💰 **Paid plans** start at $25/month for more storage

### **Realtime (Free Tier)**
- ✅ **Realtime is FREE** - unlimited connections
- ✅ Just needs to be enabled in Dashboard
- ✅ No additional cost

---

## 📋 **Step 1: Enable Realtime (FREE)**

### **Option A: Via Dashboard (Recommended)**

1. Go to: https://app.supabase.com
2. Select project: `lnmgmxblinnqfsecjkdu`
3. Go to: **Database → Replication** (left sidebar)
4. Find these tables:
   - `messages`
   - `conversations`
   - `users`
   - `notifications`
5. **Toggle ON** the switch next to each table name
6. ✅ Done! Realtime is now enabled (FREE)

### **Option B: Via SQL (Alternative)**

If you can't see the Realtime toggle, run this SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 📋 **Step 2: Create Storage Buckets (FREE - 1GB included)**

### **You Already Have a Bucket: `lang-exg`**

I see you have a bucket called `lang-exg`. You can either:
1. **Use this bucket** for all files (simpler)
2. **Create separate buckets** as recommended

### **Option A: Use Existing Bucket (Simpler)**

1. Go to: https://supabase.com/dashboard/project/lnmgmxblinnqfsecjkdu/storage/buckets
2. Click on `lang-exg` bucket
3. Make sure it's **Public** (toggle ON)
4. Set policies:

**Go to "Policies" tab and add:**

```sql
-- Policy 1: Anyone can read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'lang-exg');

-- Policy 2: Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lang-exg' AND
  auth.role() = 'authenticated'
);

-- Policy 3: Users can update own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lang-exg' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lang-exg' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### **Option B: Create Separate Buckets (Recommended)**

If you want separate buckets, create these:

1. **`avatars`** - Public, 5MB limit
2. **`chat-images`** - Public, 10MB limit  
3. **`voice-messages`** - Public, 25MB limit

**Storage is FREE up to 1GB** - More than enough for development!

---

## 💰 **Storage Pricing (If You Need More)**

### **Free Tier:**
- ✅ 1 GB storage
- ✅ 2 GB bandwidth/month
- ✅ Unlimited requests

### **Pro Plan ($25/month):**
- 100 GB storage
- 200 GB bandwidth/month
- Unlimited requests

**For development/testing, 1GB is plenty!** Most files are small:
- Avatars: ~50-100 KB each
- Chat images: ~200-500 KB each
- Voice messages: ~500 KB - 2 MB each

---

## 🎯 **Quick Setup (Using Existing Bucket)**

Since you already have `lang-exg` bucket:

1. **Enable Realtime** (Database → Replication)
2. **Set bucket to Public** (Storage → Buckets → lang-exg → Toggle Public)
3. **Add Storage Policies** (see SQL above)
4. **Update app code** to use `lang-exg` bucket instead of separate buckets

---

## ✅ **What You Need to Do**

1. ✅ **Enable Realtime** (Database → Replication) - **FREE**
2. ✅ **Use existing bucket** `lang-exg` or create new ones - **FREE (1GB)**
3. ✅ **Set bucket to Public**
4. ✅ **Add Storage Policies** (via SQL Editor)

---

## 📝 **Storage Policy SQL (Run in SQL Editor)**

Run this to add policies to your `lang-exg` bucket:

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'lang-exg');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lang-exg' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lang-exg' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lang-exg' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

**Realtime is FREE - just enable it!**
**Storage is FREE up to 1GB - you're covered!** 🎉

