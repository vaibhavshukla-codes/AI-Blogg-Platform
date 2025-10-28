# Testing Guide: Cover Image Upload Fix

## Prerequisites

Before testing, ensure Cloudinary is configured in your backend `.env` file:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

If you don't have Cloudinary credentials:

1. Go to https://cloudinary.com/
2. Sign up for a free account
3. Get your credentials from the dashboard
4. Add them to `backend/.env`

## Running the Application

### Terminal 1 - Backend

```bash
cd backend
npm install  # if not already done
npm start
```

### Terminal 2 - Frontend

```bash
cd frontend
npm install  # if not already done
npm run dev
```

## Test Scenarios

### Test 1: Create New Post with Cover Image

1. Open the app in your browser (usually http://localhost:5173)
2. Login to your account
3. Click "Write" in the navigation
4. Fill in:
   - Title: "Test Post with Cover Image"
   - Content: "This is a test post to verify cover image upload works."
5. Scroll to the "Cover Image" section
6. Click "Choose file" and select an image from your computer
7. You should see a preview of the image appear
8. Open browser console (F12) and check for logs
9. Click "Publish Post"
10. **Expected console logs**:
    ```
    Publishing post. Cover file selected: true filename.jpg
    Uploading cover image: filename.jpg
    Upload successful! URL: https://res.cloudinary.com/...
    New cover URL after upload: https://res.cloudinary.com/...
    Existing cover image URL:
    Final cover URL to be sent: https://res.cloudinary.com/...
    Request body: { ..., coverImageUrl: "https://res.cloudinary.com/...", ... }
    ```
11. **Backend console should show**:
    ```
    Upload request received. File: filename.jpg
    Cloudinary configured. Uploading file...
    Upload successful! URL: https://res.cloudinary.com/...
    Creating post. Cover Image URL received: https://res.cloudinary.com/...
    Post created with coverImageUrl: https://res.cloudinary.com/...
    ```
12. Navigate to the post view
13. **Verify**: The cover image should be visible in the post

### Test 2: Create New Post WITHOUT Cover Image

1. Click "Write" in the navigation
2. Fill in title and content
3. **Do NOT upload a cover image**
4. Click "Publish Post"
5. **Expected**: Post should be created without a cover image (no errors)

### Test 3: Edit Existing Post and Add Cover Image

1. Go to Dashboard
2. Find a post without a cover image
3. Click "Edit"
4. Upload a cover image
5. Click "Update Post"
6. **Expected**: Cover image should now appear in the post

### Test 4: Edit Post and Replace Cover Image

1. Go to Dashboard
2. Find a post WITH a cover image
3. Click "Edit"
4. Click the red delete button on the current cover preview
5. Upload a different image
6. Click "Update Post"
7. **Expected**: The new cover image should replace the old one

### Test 5: Edit Post and Remove Cover Image

1. Go to Dashboard
2. Find a post WITH a cover image
3. Click "Edit"
4. Click the red delete button on the cover preview
5. **Do NOT upload a new image**
6. Click "Update Post"
7. **Expected**: Cover image should be removed from the post

### Test 6: Save as Draft with Cover Image

1. Click "Write"
2. Fill in title and content
3. Upload a cover image
4. Click "Save as Draft" instead of "Publish Post"
5. Go to Dashboard
6. Find your draft
7. **Expected**: Draft should have the cover image saved
8. Edit the draft and publish it
9. **Expected**: Cover image should still be there

## Troubleshooting

### Issue: "Upload error: Failed to upload image"

**Possible causes:**

1. Cloudinary credentials not set in `.env`
2. Invalid Cloudinary credentials
3. Network connectivity issues

**Solution:**

- Check `backend/.env` has all three Cloudinary variables set
- Verify credentials are correct
- Check backend console for detailed error messages

### Issue: Image uploads but doesn't appear in post

**Check:**

1. Browser console for the "Final cover URL to be sent" log
2. Backend console for "Post created with coverImageUrl" log
3. Verify the URL is actually being saved in the database

**Debug:**

- If URL is null in "Final cover URL", the fix wasn't applied correctly
- If URL is present in request but null in database, there's a backend issue
- If URL is in database but not displayed, check PostView component

### Issue: "No file uploaded" error

**Possible causes:**

1. File input is not properly selecting the file
2. FormData is not being constructed correctly

**Solution:**

- Check browser console for "Uploading cover image" log
- Verify the file name appears in the log
- Try with a different image file

## Success Criteria

✅ All test scenarios pass without errors
✅ Console logs show the complete upload flow
✅ Cover images appear correctly in posts
✅ Editing and removing cover images works
✅ Drafts properly save cover images

## Debugging Tips

1. **Always check browser console** (F12) - it has detailed logs for each step
2. **Check backend terminal** - shows server-side upload status
3. **Verify Cloudinary dashboard** - uploaded images should appear there
4. **Check Network tab** (F12 → Network) - see the actual API requests/responses
5. **Look for the response** from `/api/upload/image` - should contain `{ url: "...", public_id: "..." }`

## Need Help?

If cover images still aren't working after following this guide:

1. Check all console logs (frontend and backend)
2. Verify Cloudinary credentials are correct
3. Test with a small image file (< 1MB)
4. Make sure you're on the latest code (pull recent changes)
5. Clear browser cache and localStorage
6. Try a different browser

The comprehensive logging added should help pinpoint exactly where the issue occurs!
