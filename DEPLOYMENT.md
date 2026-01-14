# Deployment Guide

## Overview
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js + Express)

---

## Step 1: Deploy Backend on Render

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to [Render Dashboard](https://dashboard.render.com/)**

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

4. **Configure the service**:
   - **Name**: `project-catalyst-api` (or your choice)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node --loader tsx server/index.ts`
   - **Instance Type**: Free (or paid for better performance)

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=your_private_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM=Your Name <your_email@gmail.com>
   EMAIL_FROM_NAME=Project Catalyst
   ADMIN_NOTIFICATION_EMAILS=admin@example.com
   CLIENT_CTA_URL=https://calendly.com/your-link
   BRAND_COLOR=#0f766e
   ```

6. **Deploy**: Click "Create Web Service"

7. **Copy your backend URL**: (e.g., `https://project-catalyst-api.onrender.com`)

---

## Step 2: Deploy Frontend on Vercel

1. **Update vercel.json** with your Render backend URL:
   - Open `vercel.json`
   - Replace `https://your-backend-url.onrender.com` with your actual Render URL

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

3. **Import your project**:
   - Click "Add New..." → "Project"
   - Import from GitHub
   - Select your repository

4. **Configure the project**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Add Environment Variables** (optional for frontend):
   - Usually not needed since API calls go through the backend
   - Click "Environment Variables" if needed

6. **Deploy**: Click "Deploy"

7. **Your site will be live** at: `https://your-project.vercel.app`

---

## Step 3: Update Backend CORS (if needed)

If you encounter CORS errors, update your backend's CORS configuration in `server/index.ts`:

```typescript
app.use(cors({ 
  origin: ['https://your-project.vercel.app', 'http://localhost:5173'], 
  credentials: false 
}));
```

Then redeploy your backend on Render (it will auto-redeploy when you push to GitHub).

---

## Testing Your Deployment

1. **Test Backend**: Visit `https://your-backend-url.onrender.com/api/health`
   - Should return: `{"ok": true}`

2. **Test Frontend**: Visit `https://your-project.vercel.app`
   - Fill out the form and test submission

3. **Check Google Sheets**: Verify data appears in your spreadsheet

4. **Check Email**: Verify confirmation emails are sent

---

## Troubleshooting

### Backend Issues:
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set correctly
- Ensure Google Service Account has access to the spreadsheet

### Frontend Issues:
- Check Vercel deployment logs
- Verify the backend URL in `vercel.json` is correct
- Check browser console for errors

### CORS Issues:
- Update CORS origin in `server/index.ts`
- Redeploy backend

---

## Updating Your Site

### Frontend Updates:
- Push changes to GitHub → Vercel auto-deploys

### Backend Updates:
- Push changes to GitHub → Render auto-deploys

---

## Free Tier Limitations

**Render Free Tier**:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free

**Vercel Free Tier**:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS

**Upgrade for Production**:
- Render: $7/month for always-on instance
- Vercel: Pro plan if needed ($20/month)
