# AI Generation 500 Error - Debugging Guide

**Date:** October 28, 2025  
**Error:** 500 Internal Server Error when calling AI generation  
**Status:** 🔍 **DEBUGGING IN PROGRESS**

## Current Status

✅ Backend is running on port 5001  
✅ Database is connected  
✅ Model configured: `gemini-pro`  
✅ Enhanced error logging added  
❌ Getting 500 error when calling `/api/ai/generate`

## What I've Done

### 1. Added Detailed Error Logging

Updated `backend/src/services/ai.service.js` to log:

- Full error object
- Error message
- Error status
- Error details
- Error stack trace

This will help us see the EXACT error from Gemini API.

### 2. Backend Restarted

The backend has been restarted with the new logging code.

## Next Steps to Debug

### Please Try the AI Generation Again

1. **Go to** "Write Post" page
2. **Enter a simple prompt:**
   ```
   Write a blog post about coffee
   ```
3. **Click** "Generate Draft with AI"
4. **Check the backend terminal** for error logs

### What to Look For in Terminal

The backend will now show detailed error information:

```
Gemini API Error (Full): {...}
Error message: [the actual error]
Error status: [status code]
Error details: [additional details]
Error stack: [stack trace]
```

## Possible Causes & Solutions

### 1. API Key Issue

**Symptoms:**

```
Error: invalid API key
Error: API_KEY_INVALID
```

**Solution:**

1. Verify API key at https://makersuite.google.com/app/apikey
2. Check if key is correctly set in `backend/.env`
3. Ensure no extra spaces or quotes around the key

### 2. Model Not Available

**Symptoms:**

```
Error: models/gemini-pro is not found
Error: model not found for generateContent
```

**Solution:**
This would be very strange since `gemini-pro` is the stable model, but if it happens, we may need to check API access.

### 3. Quota Exceeded

**Symptoms:**

```
Error: RESOURCE_EXHAUSTED
Error: quota exceeded
```

**Solution:**

- Wait for quota reset (15 requests/min, 1500/day)
- Check quota at: https://console.cloud.google.com/

### 4. Rate Limit

**Symptoms:**

```
Error: 429
Error: rate limit
```

**Solution:**

- Wait 1 minute before trying again

### 5. Malformed Request

**Symptoms:**

```
Error: invalid request
Error: bad request
```

**Solution:**

- Check if prompt is being sent correctly
- Verify request body format

## Configuration Check

### Verify API Key

```bash
# In backend directory
grep GEMINI_API_KEY .env

# Should show:
# GEMINI_API_KEY=AIzaSy...
```

### Verify Model Name

```javascript
// In backend/src/services/ai.service.js
// Should be:
model: "gemini-pro"; // ✅

// NOT:
model: "models/gemini-pro"; // ❌
model: "gemini-1.5-flash"; // ❌
```

## Manual API Test

If you want to test the Gemini API directly:

```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Write one sentence about AI"
      }]
    }]
  }'
```

Replace `YOUR_API_KEY` with your actual Gemini API key.

## Expected Output

### If Working

Backend logs should show:

```
🤖 Generating AI content for prompt: Write a blog post about coffee
📄 Raw AI response: {"title":"The Perfect Cup...
✅ Successfully parsed AI response
📤 Sending parsed result to frontend
```

Frontend should populate all fields.

### If Error

Backend logs will show:

```
Gemini API Error (Full): [detailed error object]
Error message: [specific error message]
Error status: [HTTP status code if applicable]
```

This will tell us EXACTLY what's wrong.

## Common Error Messages & Meanings

| Error Message        | Meaning                   | Fix                            |
| -------------------- | ------------------------- | ------------------------------ |
| `API_KEY_INVALID`    | API key is wrong/expired  | Get new key                    |
| `PERMISSION_DENIED`  | API key lacks permissions | Enable Generative Language API |
| `RESOURCE_EXHAUSTED` | Quota exceeded            | Wait or upgrade                |
| `NOT_FOUND`          | Model doesn't exist       | Check model name               |
| `INVALID_ARGUMENT`   | Bad request format        | Check request body             |
| `UNAUTHENTICATED`    | No/invalid auth           | Check API key                  |

## Action Required

**Please try the AI generation again and share:**

1. The error message from the browser console (you already did)
2. **The new detailed error logs from the backend terminal**

This will help me pinpoint the exact issue!

---

**Status:** Backend is ready with enhanced logging. Waiting for test results to diagnose the issue.
