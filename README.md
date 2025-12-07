
# Brand Promoter KPI Tracker (v1.1.0)

A comprehensive dashboard for amusement park brand promoters to track sales, manage customer data, and verify KPIs.

## 🚀 How to Deploy to Vercel

This is the recommended deployment method.

1. **Get the Code**: 
   - If GitHub sync works: Commit and push this code to your repository.
   - If GitHub sync fails: Download this project as a ZIP, extract it, and upload it to a new GitHub repository manually.

2. **Connect to Vercel**:
   - Go to [Vercel.com](https://vercel.com) and log in.
   - Click **"Add New..."** -> **"Project"**.
   - Import your GitHub repository.

3. **Configure**:
   - Framework Preset: **Vite** (Vercel usually detects this automatically).
   - **Environment Variables**:
     - Name: `API_KEY`
     - Value: Paste your Google Gemini API Key here.

4. **Deploy**:
   - Click **Deploy**. Vercel will build your app and give you a live link (e.g., `your-app.vercel.app`).

## ⚠️ Important Note on Database
This application currently uses **LocalStorage** (Browser Data).
- Data is stored **on the device** where it is entered.
- **It does not sync automatically** between different users (e.g., A Promoter on a phone cannot instantly see data on the Lead's laptop).
- **Solution**: Use the **"Backup Database"** button in the Team Lead Dashboard to save a JSON file, and send that file to the other user to "Restore" if data sharing is needed.

## Features
- **Team Lead Dashboard**: Track KPIs, manage promoters, and export data.
- **Promoter App**: Log sales, collect feedback, and view history.
- **Sales Verifier**: Verify customer codes.
- **Customer Service**: Log complaints.

## Technologies
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
