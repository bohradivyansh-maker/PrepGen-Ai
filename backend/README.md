# PrepGen Backend API

FastAPI backend for PrepGen - AI-Powered Personalized Learning Platform

## Setup

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Update the values with your actual credentials

4. **Run the Server:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

## Project Structure

```
backend/
├── app/
│   ├── routers/        # API endpoints
│   ├── models/         # Database models
│   ├── services/       # Business logic
│   ├── config.py       # Configuration
│   ├── database.py     # Database connection
│   └── main.py         # FastAPI application
├── uploads/            # Uploaded files storage
├── .env                # Environment variables (create from .env.example)
├── .env.example        # Example environment file
└── requirements.txt    # Python dependencies
```

## API Endpoints

### Authentication
- `GET /auth/google/login` - Google OAuth login
- `GET /auth/google/callback` - OAuth callback
- `GET /users/me` - Get current user

### Content
- `POST /content/upload` - Upload file
- `GET /content` - Get all content
- `DELETE /content/{id}` - Delete content
- `POST /content/{id}/summarize` - Generate summary
- `POST /content/{id}/ask` - Ask question
- `POST /content/{id}/quiz` - Generate quiz

### Quiz
- `POST /quiz/save` - Save quiz result
- `GET /quiz/results` - Get quiz results

### YouTube
- `POST /api/youtube/summarize` - Summarize YouTube video

### Health
- `GET /health` - Health check
