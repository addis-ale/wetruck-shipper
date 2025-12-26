# Troubleshooting "Failed to fetch" Error

## Quick Checklist

### 1. ✅ Restart Next.js Dev Server (IMPORTANT!)
Next.js only loads `.env.local` on startup. After creating the file, you MUST restart:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. ✅ Verify Backend is Running
Your FastAPI server should be running on `http://127.0.0.1:8000`

```bash
# Start FastAPI (if not already running):
uvicorn main:app --reload
```

Test in browser: Open `http://127.0.0.1:8000/docs` - You should see the Swagger docs.

### 3. ✅ Check CORS Configuration
Your FastAPI needs to allow requests from `http://localhost:3000`

Add this to your FastAPI main file (usually `main.py`):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. ✅ Check Browser Console
Open DevTools (F12) → Console tab. You should see:
- `🔗 API URL: http://127.0.0.1:8000`
- `📡 Request: POST http://127.0.0.1:8000/auth/login`

If you see `undefined` for API URL, the `.env.local` wasn't loaded.

### 5. ✅ Test Backend Directly
Use curl or Postman to verify the backend works:

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shipper@example.com",
    "password": "shipper123",
    "role": "shipper"
  }'
```

You should get a response with `access_token`.

## Common Solutions

| Error Message | Solution |
|--------------|----------|
| "Cannot connect to backend" | Start your FastAPI server |
| API URL is `undefined` | Restart Next.js dev server after creating `.env.local` |
| CORS error in console | Add CORS middleware to FastAPI |
| 404 Not Found | Check endpoint path matches backend route |

