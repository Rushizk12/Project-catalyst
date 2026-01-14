<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kwC3DqQefKvJSrr-wdrTWYLPJJA7DMck

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env` file in the project root (or copy from `.env.example`) and set:
   - `GEMINI_API_KEY=your_api_key_here`
   - Optionally `PORT=3001`
    - Google Sheets (service account):
       - `GOOGLE_SHEETS_SPREADSHEET_ID=...`
       - `GOOGLE_SERVICE_ACCOUNT_EMAIL=...`
       - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
    - Emails (SMTP):
       - `SMTP_HOST=smtp.example.com`
       - `SMTP_PORT=587` (465 for SSL)
       - `SMTP_SECURE=false` (true if port 465)
       - `SMTP_USER=your_smtp_username`
       - `SMTP_PASS=your_smtp_password`
       - `EMAIL_FROM=Project Catalyst <no-reply@example.com>`
       - `NOTIFY_EMAIL=you@yourdomain.com`
3. Start both frontend and backend:
   `npm run dev`
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001` (health: `/api/health`)

## Expose with ngrok (Optional)

To make your local development server accessible from the internet:

1. **Sign up for ngrok** (free): https://ngrok.com/
2. **Get your authtoken** from the ngrok dashboard
3. **Set your authtoken**:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```
4. **Start with tunnel**:
   ```bash
   npm run dev:tunnel
   ```
   This will start your app locally AND create a public tunnel via ngrok.

   - Your app will be accessible via the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - The tunnel URL will be displayed in the terminal
   - Perfect for testing webhooks, sharing with others, or mobile testing

**Alternative commands:**
- `npm run tunnel` - Only start ngrok tunnel (requires dev server to already be running)
- `npm run dev` - Regular local development without tunnel
