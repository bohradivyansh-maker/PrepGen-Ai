# PrepGen - AI-Powered Personalized Learning Platform

An intelligent learning platform that helps university students study more effectively using AI-powered features like document summarization, interactive quizzes, chat-based Q&A, and YouTube video summarization.

## ✨ Features

- 📚 **Document Management** - Upload and manage study materials (PDF, DOCX, PPTX)
- 🤖 **AI Summarization** - Get instant summaries of your documents
- 💬 **AI Chat** - Ask questions about your uploaded documents
- 📝 **Interactive Quizzes** - Auto-generated quizzes with instant feedback
- 📊 **Performance Analytics** - Track your quiz performance over time
- 🎥 **YouTube Summarizer** - Summarize educational YouTube videos
- ⏱️ **Study Timer** - Pomodoro timer for focused study sessions
- ✅ **Daily Tasks** - Manage your to-do list
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 🔐 **Google OAuth** - Secure authentication with your Google account

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Capstone-copilot
```

### 2. Configure Environment
Edit `backend/.env` with your credentials:
- MongoDB connection string
- Google OAuth credentials
- AI Service URL (ngrok)

### 3. Run the Application

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Windows (Command Prompt):**
```cmd
start.bat
```

The application will automatically:
- ✅ Set up the backend environment
- ✅ Install dependencies
- ✅ Start both servers
- ✅ Open in your browser

## 📖 Documentation

- **[Startup Guide](STARTUP.md)** - Detailed startup instructions
- **[Backend README](backend/README.md)** - Backend API documentation
- **[API Documentation](http://127.0.0.1:8000/docs)** - Interactive API docs (when running)

## 🛠️ Technology Stack

### Frontend
- HTML5
- Tailwind CSS
- Vanilla JavaScript
- Lucide Icons
- Chart.js

### Backend
- FastAPI (Python)
- MongoDB (Motor - async driver)
- Google OAuth 2.0
- JWT Authentication
- Authlib

### AI Service
- External FastAPI service (via ngrok)
- Document processing
- RAG (Retrieval Augmented Generation)
- Quiz generation

## 📁 Project Structure

```
Capstone-copilot/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Configuration & security
│   │   ├── db/          # Database connection
│   │   └── schemas/     # Pydantic models
│   ├── uploads/         # File storage
│   └── requirements.txt
├── index.html           # Frontend application
├── script.js            # Frontend JavaScript
├── start.ps1            # PowerShell startup script
├── start.bat            # Batch startup script
└── README.md
```

## 🔧 Development

### Backend Development
```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Development
```bash
python -m http.server 8080
```

## 🌐 Access Points

- **Frontend:** http://127.0.0.1:8080
- **Backend API:** http://127.0.0.1:8000
- **API Docs:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

## 🐛 Troubleshooting

See [STARTUP.md](STARTUP.md) for common issues and solutions.

## 📄 License

This project is part of a university capstone project.

## 👥 Team

Capstone Project - Semester 7

---

**Built with ❤️ for students, by students**
