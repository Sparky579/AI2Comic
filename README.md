# AI Manga Generator

## Setup

1.  **Backend**
    ```bash
    cd backend
    pip install -r requirements.txt
    # Create .env and set GOOGLE_API_KEY
    cp .env.example .env
    uvicorn main:app --reload
    ```

2.  **Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Features
- **Storyboard Generation**: Uses Gemini 3 Pro (High Thinking) to create structured manga layouts.
- **Image Generation**: Parallel generation of panels using Gemini 3 Pro Image.
- **Redraw/Edit**: Click any panel to redraw it, optionally using the previous image as a reference (Img2Img).
