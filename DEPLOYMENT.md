# Deployment Guide

## Quick Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Initialize git repository** (if not already done):
```bash
cd smart-meter-dashboard
git init
git add .
git commit -m "Initial commit: Smart Meter Dashboard"
```

2. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/smart-meter-dashboard.git
git branch -M main
git push -u origin main
```

3. **Deploy to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Continue with GitHub"
   - Select your `smart-meter-dashboard` repository
   - Framework: **Next.js**
   - Click "Deploy"
   - Your dashboard will be live at: `https://smart-meter-dashboard.vercel.app`

### Option 2: Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
cd smart-meter-dashboard
vercel
```

3. Follow prompts and your app will be deployed instantly.

## Post-Deployment

### WebSerial Browser Requirement

⚠️ **Important**: WebSerial only works in **HTTPS** connections (Vercel provides this automatically)

Supported browsers:
- ✅ Chrome/Chromium 89+
- ✅ Edge 89+
- ✅ Opera 76+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

### Update Environment

After deployment, your public URL is available. Share it for remote access:
```
https://your-app.vercel.app
```

## Custom Domain

To use a custom domain:

1. In Vercel Dashboard:
   - Select your project
   - Go to **Settings > Domains**
   - Add your custom domain
   - Follow DNS instructions

2. Example: `smartmeter.yourdomain.com`

## Environment Variables

This project uses only client-side code. No backend environment variables needed.

For future backend integration, create `.env.local`:
```
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Monitoring & Logs

### View Logs
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Functions** or **Deployments** tab
4. View real-time logs

### Performance Analytics
- Vercel automatically tracks metrics
- Web Vitals visible in dashboard
- Monitor under **Analytics** tab

## SSL/HTTPS

✅ **Automatic**
- Vercel provides free SSL certificates
- HTTPS enabled by default
- Required for WebSerial API

## CI/CD Pipeline

Every push to `main` branch triggers automatic deployment:

1. Push code to GitHub
2. Vercel detects changes
3. Builds and deploys automatically
4. New version live within minutes

### Preview Deployments

Pull requests automatically get preview URLs:
- Main: `https://smart-meter-dashboard.vercel.app`
- PR Preview: `https://pr-123.smart-meter-dashboard.vercel.app`

## Rollback

To revert to previous version:

1. Vercel Dashboard → **Deployments**
2. Click deployment you want to restore
3. Click **Promote to Production**

## Troubleshooting

### Build Fails
Check build logs:
1. Dashboard → **Deployments**
2. Click failed deployment
3. Expand **Build** section
4. Fix errors shown and push again

### WebSerial Not Working
- Verify HTTPS is used (Vercel auto-enables)
- Check browser compatibility
- Ensure device is plugged in locally (WebSerial runs on client)
- Check browser console for errors

### Map Not Displaying
- Verify internet connection
- Check CDN can reach OpenStreetMap tiles
- Verify geolocation permission granted

## Performance Tips

1. **Network**: Vercel provides global edge network
2. **Images**: Already optimized with Next.js
3. **CSS**: Tailwind CSS is tree-shaken and minimal
4. **JavaScript**: Code splitting handled automatically

## Cost

Vercel Free Tier includes:
- ✅ Unlimited projects
- ✅ Unlimited deployments
- ✅ SSL certificates
- ✅ Global CDN
- ✅ Web Analytics

Perfect for this project!

## Support

Need help?
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Community Discord](https://discord.gg/vercel)

---

**Your Smart Meter Dashboard is now deployed and accessible worldwide! 🚀**
