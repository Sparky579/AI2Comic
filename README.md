# AI2Comic - AI Manga Generator

AI2Comic is a full-stack application that leverages Google's Gemini Models (Gemini 2.0/3.0) to generate structured manga storyboards and high-quality manga pages from simple text prompts.

## 🏗 System Architecture

The system consists of a Python FastAPI backend and a React (Vite) frontend.

### Architecture Overview

```mermaid
graph TD
    Client[React Frontend] <-->|REST / SSE| API[FastAPI Backend]
    API <-->|gRPC/HTTP| Gemini[Google Gemini API]
    
    subgraph Backend
        API -- /generate/storyboard --> GeminiText[Gemini Pro (Text/Thinking)]
        API -- /generate/image --> GeminiImage[Gemini Pro Vision (Image Gen)]
    end
    
    subgraph Frontend
        Store[Local Storage] -- Config --> Client
    end
```

### Backend (`/backend`)
-   **Framework**: FastAPI (Python)
-   **Core Logic**: `gemini_client.py` handles interactions with Google GenAI.
-   **Features**:
    -   **Streaming Support**: Server-Sent Events (SSE) for real-time "thinking process" display.
    -   **Context Management**: Handles style references and image-to-image generation.
    -   **Concurrency**: Uses `asyncio` for parallel batch generation of panels/pages.
-   **Key Endpoints**:
    -   `POST /generate/storyboard`: Generates JSON storyboard.
    -   `POST /generate/images/batch`: Generates multiple panels in parallel.
    -   `POST /generate/page/stream`: Generates a single page with progress streaming.

### Frontend (`/frontend`)
-   **Framework**: React + Vite
-   **Styling**: Vanilla CSS (Cyber/Dark theme).
-   **State Management**: React Hooks (`useState`, `useEffect`).
-   **Features**:
    -   **Interactive Workflow**: Step-by-step wizard (Prompt -> Storyboard -> First Page Preview -> Full Gen).
    -   **Configuration Persistence**: Saves API keys and style preferences to Browser LocalStorage.
    -   **Gallery Editor**: Allows regenerating specific pages with fine-grained control (changing references, editing prompts).

---

## 🚀 Operation Guide (Deployment & Daemonization)

To ensure the system runs persistently on this machine (even after terminal closure), we use `nohup`.

### Prerequisites
-   Python 3.10+
-   Node.js & npm
-   Google Gemini API Key

### 1. Backend Setup & Start

Navigate to the backend directory:
```bash
cd /home/sizhe/AI2Comic/backend
```

Install dependencies (if not already installed):
```bash
# Create/Activate venv
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

**Start with Daemon (Background Process):**
```bash
# Kills existing process on port 16331 (Optional, if restarting)
lsof -ti:16331 | xargs kill -9

# Start server in background, piping output to log file
nohup python main.py > backend.log 2>&1 &

# Verify it's running
tail -f backend.log
```
*Backend runs on port `16331`.*

### 2. Frontend Setup & Start

Navigate to the frontend directory:
```bash
cd /home/sizhe/AI2Comic/frontend
```

Install dependencies:
```bash
npm install
```

**Start with Daemon (Background Process):**
```bash
# Start Vite in background
nohup npm run dev -- --host > frontend.log 2>&1 &

# Verify it's running
tail -f frontend.log
```
*Frontend runs on port `16332` (typically).*

---

## 📖 Usage Guide

1.  **Open the App**: Navigate to `http://<your-server-ip>:16332`.
2.  **Configuration (Sidebar)**:
    -   **API Key**: Enter your Google Gemini API Key. Click "Save".
    -   **Art Style**: Describe the desired style (e.g., "Detailed Shonen Manga, Black and White").
    -   **Reference Image**: (Optional) Upload an image to guide the visual style.
3.  **Step 1: Storyboard**:
    -   Enter a story prompt (e.g., "A robot discovering a flower in a cyberpunk city").
    -   Click **Start Creating**. The system will generate a detailed page-by-page plan.
    -   Review and edit the storyboard text if needed.
4.  **Step 2: First Page Preview**:
    -   The system generates the first page to establish the style.
    -   **Refine**: If you don't like it, edit the prompt or upload a stronger reference image and click **Regenerate First Page**.
    -   **Confirm**: Once satisfied, click **Confirm & Generate All**.
    -   *Note: The verified first page will now become the strict style reference for all subsequent pages.*
5.  **Step 3: Gallery**:
    -   View all generated pages.
    -   **Regenerate Single Page**: Use the "Regenerate" button on a specific page.
        -   **"Use current image as reference"**: Check this to iterate on the specific composition of that page.
        -   **Unchecked**: Resets style to match the Global First Page (keeps coherence).
    -   **Download**: Download individual pages or the entire set.

---

## 🔧 Troubleshooting

-   **Backend Issues**: Check `backend/backend.log`. Common errors are invalid API keys or quotas.
-   **Frontend Issues**: Check Browser Console (F12).
-   **Ports in use**: Use `lsof -i :16331` to check if ports are blocked.
