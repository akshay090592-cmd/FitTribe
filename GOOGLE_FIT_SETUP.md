# Google Fit Integration Setup Guide 🐼

This guide provides a detailed walkthrough for setting up the Google Fit integration in FitTribe. You will need to configure settings in both the **Google Cloud Console** and your **Supabase Project**.

---

## 1. Google Cloud Console Configuration

### Step 1: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown and select **"New Project"**.
3. Name it (e.g., `FitTribe Tracker`) and click **Create**.

### Step 2: Enable APIs
1. Navigate to **APIs & Services > Library**.
2. Search for and **Enable** the following API:
   - **Fitness API**

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in the required App Information (App name, support email, developer contact).
4. **Scopes:** Add the following scopes:
   - `.../auth/fitness.activity.write` (To log workouts)
   - `.../auth/fitness.body.read` (To fetch weight/fat %)
   - `.../auth/fitness.body.write` (Optional, for completeness)
5. **Test Users:** While in "Testing" mode, you must explicitly add your Google email address as a test user to be able to log in.

### Step 4: Create OAuth Client ID
1. Go to **APIs & Services > Credentials**.
2. Click **+ Create Credentials > OAuth client ID**.
3. **Application type:** Web application.
4. **Authorized JavaScript origins:**
   - Add your local dev URL: `http://localhost:3000` (or `http://localhost:5173`)
   - Add your production URL: `https://your-app.netlify.app`
5. Click **Create** and copy your **Client ID**.

---

## 2. Supabase Database Updates

You need to add new columns to your `profiles` table to store the body fat percentage and Google sync configuration. Run the following SQL in your Supabase SQL Editor:

```sql
-- Add fat_percentage column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fat_percentage NUMERIC;

-- Add google_sync_config column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS google_sync_config JSONB DEFAULT '{}'::jsonb;

-- (Optional) Update the select policy if you have RLS enabled
-- and it doesn't already cover all columns.
```

---

## 3. Environment Variables

Update your `.env` file (and your deployment platform settings, e.g., Netlify) with your Google Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

---

## 4. Implementation Details

- **Activity Mapping:** FitTribe activity names (Walking, Running, HIIT, etc.) are automatically mapped to Google Fit's internal activity IDs.
- **Sync Logic:** Synchronization happens automatically in the background when you save or update a workout log.
- **Metrics:** You can manually trigger a "Sync Weight & Fat %" from your Profile Settings once connected.

---

### Troubleshooting
- **GIS Error:** If the Google login popup doesn't appear, ensure the script `<script src="https://accounts.google.com/gsi/client" async defer></script>` is present in `index.html`.
- **CORS Errors:** Double-check that your URL is exactly matched in the "Authorized JavaScript origins" section of the Google Cloud Console.
