/**
 * Instructions for uploading the WellNest logo to Supabase Storage
 * 
 * IMPORTANT: The logo needs to be publicly accessible for email templates to work.
 * 
 * Steps to upload:
 * 
 * 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
 * 2. Select your project
 * 3. Go to Storage section
 * 4. Create a new PUBLIC bucket called "assets" (if not exists)
 * 5. Upload the logo file (wellnest-logo.png) to this bucket
 * 6. Click on the uploaded file and copy the public URL
 * 7. Update the email template in /supabase/functions/server/index.tsx
 *    Replace the placeholder URL with your actual Supabase Storage URL
 * 
 * Example Supabase Storage URL format:
 * https://[your-project-id].supabase.co/storage/v1/object/public/assets/wellnest-logo.png
 * 
 * Alternative: Use a CDN or image hosting service like:
 * - Cloudinary
 * - imgix
 * - GitHub (raw.githubusercontent.com)
 * - Any other public image hosting
 */

// This file is for documentation purposes only
export {};
