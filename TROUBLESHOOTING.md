# Free-Forever Stack - Troubleshooting & FAQs

Solutions for common issues when deploying to GitHub Pages, Render.com, and MongoDB Atlas.

---

## MongoDB Atlas Issues

### ❌ "Connect ECONNREFUSED"
**Problem:** Backend can't connect to MongoDB

**Solutions:**
1. ✅ Check MONGODB_URI is correct
   ```bash
   # Verify format: mongodb+srv://username:password@cluster.mongodb.net/dbname
   # No typos in password
   ```

2. ✅ Verify network access
   - MongoDB Atlas → Network Access
   - Make sure your IP is whitelisted (or use 0.0.0.0/0 for dev)

3. ✅ Confirm database user exists
   - Database Access → Check user `brightenlighting` exists
   - Password hasn't expired

4. ✅ Check cluster is running
   - Clusters → Green status indicator
   - If red/orange, wait for recovery

---

### ❌ "Authentication Failed"
**Problem:** Database user credentials rejected

**Solutions:**
1. ✅ Re-generate password
   - Database Access → Edit user → Auto-generate new password
   - Update MONGODB_URI with new password

2. ✅ Check for special characters
   - If password has `@`, `%`, `#`, etc., they need URL encoding
   - Use MongoDB Atlas generated passwords (no special chars)

3. ✅ Verify username
   - Should be exactly: `brightenlighting`
   - Check for extra spaces or typos

---

### ❌ "Operation timed out"
**Problem:** MongoDB taking too long to respond

**Solutions:**
1. ✅ Check cluster size
   - M0 free tier may be slow with many queries
   - Consider upgrading to M2 for better performance

2. ✅ Check network connection
   - Verify internet connection is stable
   - Try again in a few minutes

3. ✅ Restart backend
   ```bash
   # In backend terminal:
   npm start
   ```

---

### ❌ "Quota exceeded"
**Problem:** Exceeded free tier limits

**Current limits (M0 free tier):**
- 512MB storage
- 100 connections
- 3 automatic backups

**Solutions:**
1. ✅ Delete old orders/test data
   ```bash
   # Via MongoDB Compass or mongosh:
   db.orders.deleteMany({})
   ```

2. ✅ Upgrade cluster
   - Atlas Dashboard → Clusters → Scale tier
   - Upgrade to M2 (2GB, $57/month)

3. ✅ Monitor usage
   - Atlas Dashboard → Metrics
   - Check storage usage

---

## Render.com Issues

### ❌ "Service unavailable (503)"
**Problem:** Backend returning error on first request

**This is normal!** Free tier services sleep after 15 minutes of inactivity.

**Solutions:**
1. ✅ Wait 30 seconds for wake-up
   - First request after sleep takes time to start container
   - Second and subsequent requests are instant

2. ✅ Prevent sleep
   - Upgrade to "Starter" tier ($7/month)
   - Or set up uptime monitor to ping every 10 minutes

3. ✅ Check service status
   - Render Dashboard → Your service
   - Look for "Live" status (green)

---

### ❌ "Build failed"
**Problem:** Render can't deploy backend

**Solutions:**
1. ✅ Check build command
   ```bash
   # Should be: cd backend && npm install
   # Not: npm install (from root)
   ```

2. ✅ Check start command
   ```bash
   # Should be: cd backend && npm start
   # Not: node index.js (won't find modules)
   ```

3. ✅ View build logs
   - Render Dashboard → Service → "Logs"
   - Look for error message

4. ✅ Check environment variables
   - All required vars must be set
   - Missing MONGODB_URI will fail

---

### ❌ "CORS error in browser console"
**Problem:** Frontend can't reach backend due to CORS

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solutions:**
1. ✅ Verify FRONTEND_URL env var
   ```bash
   # Should match your GitHub Pages domain exactly:
   # https://yourusername.github.io/brightenlighting
   # No trailing slash, no http (must be https)
   ```

2. ✅ Check Render environment
   - Dashboard → Service → Environment
   - Confirm FRONTEND_URL is set correctly

3. ✅ Restart backend
   - Manual deploy to apply env changes
   - Or wait for auto-deploy

4. ✅ Verify frontend API URL
   - Open browser console
   - Check what API_BASE is being used
   - Should match your Render backend URL

---

### ❌ "Port already in use"
**Problem:** Local backend won't start (port 3000 in use)

**Solutions:**
1. ✅ Kill process using port 3000
   ```bash
   # Windows:
   netstat -ano | findstr :3000
   taskkill /PID [PID] /F

   # macOS/Linux:
   lsof -i :3000
   kill -9 [PID]
   ```

2. ✅ Use different port
   ```bash
   PORT=3001 npm start
   ```

---

## GitHub Pages Issues

### ❌ Site not deploying
**Problem:** Changes not showing on GitHub Pages

**Solutions:**
1. ✅ Check GitHub Pages is enabled
   - Settings → Pages
   - Source should be `main` branch, `/root` folder

2. ✅ Verify files are committed
   ```bash
   git status  # Should show clean working tree
   ```

3. ✅ Wait for build
   - GitHub Pages takes 30-60 seconds to deploy
   - Check Actions tab for build status

4. ✅ Clear browser cache
   ```bash
   # Hard refresh:
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

---

### ❌ "GitHub Pages not found"
**Problem:** Custom domain not working

**Solutions:**
1. ✅ Check CNAME file
   ```bash
   # If using custom domain, create CNAME file:
   echo "yourdomain.com" > CNAME
   git add CNAME && git commit -m "Add CNAME" && git push
   ```

2. ✅ Verify DNS records
   - If using custom domain, DNS should point to GitHub Pages
   - A record: 185.199.108.153
   - Or ALIAS/CNAME to username.github.io

3. ✅ Use repository GitHub Pages URL
   - Should be: https://yourusername.github.io/brightenlighting
   - Not just: https://yourusername.github.io

---

## Frontend Issues

### ❌ Products not showing
**Problem:** Public site loads but products don't appear

**Solutions:**
1. ✅ Check API endpoint
   ```javascript
   // In browser console:
   fetch('https://brighten-lighting-api.onrender.com/api/products')
       .then(r => r.json())
       .then(d => console.log(d))
   // Should return: [array of products]
   ```

2. ✅ Verify API_BASE variable
   ```javascript
   // In script.js:
   console.log('API_BASE:', API_BASE)
   // Should show: https://brighten-lighting-api.onrender.com
   ```

3. ✅ Add products in admin
   - Go to admin dashboard
   - Add at least one product
   - Products only show if stock > 0 and publicVisible = true

4. ✅ Check browser console
   - Open DevTools (F12)
   - Look for error messages
   - Note any CORS or 404 errors

---

### ❌ Admin login doesn't work
**Problem:** Can't access admin dashboard

**Solutions:**
1. ✅ Verify credentials
   ```bash
   # Check env vars on Render:
   # ADMIN_USER=admin
   # ADMIN_PASS=your_password
   # Make sure ADMIN_PASS has no typos
   ```

2. ✅ Check database connection
   - Backend logs should show MongoDB connection
   - If "not connected", verify MONGODB_URI

3. ✅ Restart backend
   - Manual deploy on Render dashboard
   - Wait for service to show "Live"

4. ✅ Clear browser storage
   ```javascript
   // In browser console:
   localStorage.clear()
   sessionStorage.clear()
   // Reload page
   ```

---

### ❌ Images not loading
**Problem:** Product images show as broken

**Solutions:**
1. ✅ Check image paths
   ```javascript
   // Should start with: /assets/
   // Not: ../assets/ or ./assets/
   // Not: http://localhost:5500/assets/
   ```

2. ✅ Verify image files exist
   - Check `assets/` folder has image files
   - Files must be: .jpg, .png, .gif, .webp

3. ✅ Check image names match
   - In admin, set image path exactly
   - Example: `/assets/pendant-light.jpg`

4. ✅ Check CORS headers
   - Render backend serves images via static middleware
   - Should work automatically

---

## Payment Issues

### ❌ M-Pesa payment fails
**Problem:** "Payment initiation failed" error

**Solutions:**
1. ✅ Check M-Pesa credentials
   ```bash
   # Verify env vars on Render:
   MPESA_CONSUMER_KEY=your_key
   MPESA_CONSUMER_SECRET=your_secret
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=your_passkey
   ```

2. ✅ Use sandbox mode for testing
   ```bash
   MPESA_ENV=sandbox
   ```

3. ✅ Use valid test phone number
   ```bash
   Format: 254712345678
   Must be 12 digits starting with 254
   ```

4. ✅ Check callback URL
   ```bash
   # Must be exact Render URL:
   https://brighten-lighting-api.onrender.com/mpesa/callback
   # Not: http:// (must be https://)
   ```

---

## Performance Issues

### ❌ Site loading slowly
**Problem:** Long wait times to load products

**Causes:**
1. 🛌 Backend is sleeping (free Render tier)
   - **Solution:** Upgrade to Starter tier ($7/month)
   - Or ping service every 10 min with uptime monitor

2. 📊 Database taking time
   - **Solution:** Normal for first query after sleep
   - Queries should be <100ms normally

3. 🌐 Network latency
   - **Solution:** Use CDN (GitHub Pages already does this)
   - Consider upgrading MongoDB cluster

---

### ❌ Admin dashboard sluggish
**Problem:** Dashboard operations are slow

**Solutions:**
1. ✅ Check browser performance
   ```javascript
   // In console, check time:
   console.time('API call');
   fetch('...').then(...);
   console.timeEnd('API call');
   ```

2. ✅ Clear local data
   ```javascript
   localStorage.clear()
   // Reload page
   ```

3. ✅ Close other tabs
   - Frees up browser memory
   - May help with performance

---

## Data Loss Issues

### ❌ "Lost all my data!"
**Problem:** Products disappeared

**Solutions:**
1. ✅ Check if data is still in database
   - MongoDB Atlas → Collections → products
   - Data is safe even if frontend can't show it

2. ✅ Check if products are set to private
   ```javascript
   // In MongoDB:
   db.products.find({publicVisible: false})
   // Change to true:
   db.products.updateMany({}, {$set: {publicVisible: true}})
   ```

3. ✅ Check stock levels
   ```javascript
   // Only show products with stock > 0:
   db.products.find({stock: {$gt: 0}})
   // Increase stock:
   db.products.updateOne({id: "prod-xxx"}, {$set: {stock: 10}})
   ```

4. ✅ Restore from backup
   - MongoDB Atlas keeps 3 automatic backups
   - Snapshots tab → Restore previous version

---

## Environment Variable Issues

### ❌ "Missing environment variable"
**Problem:** Backend won't start - missing env var

**Solutions:**
1. ✅ Add to Render dashboard
   - Service → Settings → Environment
   - Add missing variable
   - Manual deploy

2. ✅ Use .env.example as template
   ```bash
   # Copy from backend/.env.example
   cp backend/.env.example backend/.env
   # Fill in all variables
   ```

3. ✅ Check variable names are exact
   - No typos: `MONGODB_URI` not `MONGO_URI`
   - No spaces: `ADMIN_PASS=value` not `ADMIN_PASS = value`

---

## Git/Deployment Issues

### ❌ "Permission denied" on push
**Problem:** Can't push to GitHub

**Solutions:**
1. ✅ Authenticate with git
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```

2. ✅ Use personal access token
   - GitHub Settings → Developer settings → Tokens
   - Create new token with repo access
   - Use token as password when pushing

3. ✅ Set up SSH (preferred)
   ```bash
   ssh-keygen -t ed25519
   # Add public key to GitHub Settings
   ```

---

### ❌ "Merge conflicts"
**Problem:** Git merge conflict when updating

**Solutions:**
1. ✅ Pull latest changes
   ```bash
   git pull origin main
   ```

2. ✅ View conflicts
   ```bash
   git status  # Shows conflicted files
   ```

3. ✅ Resolve conflicts manually
   - Open file, find `<<<<<<<` markers
   - Keep the version you want
   - Remove conflict markers

4. ✅ Complete merge
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   git push origin main
   ```

---

## Support Matrix

| Issue | First Try | If Still Broken |
|-------|-----------|-----------------|
| Backend won't start | Check env vars | View Render logs |
| Products not showing | Check API call | Verify MongoDB connected |
| Admin login fails | Restart backend | Check database |
| CORS errors | Verify FRONTEND_URL | Restart service |
| Images broken | Check paths | Verify files exist |
| Site not deploying | Wait 60 sec | Check GitHub Actions |
| M-Pesa fails | Check credentials | Use sandbox mode |

---

## Quick Checklist

When things aren't working:

- [ ] Is backend running and showing "Live" on Render?
- [ ] Is MongoDB connected (check Render logs)?
- [ ] Are environment variables set correctly?
- [ ] Has frontend been updated with correct API URL?
- [ ] Are there any CORS errors in browser console?
- [ ] Is the service sleeping? (Wait 30-60 sec)
- [ ] Is HTTPS being used everywhere?
- [ ] Are database credentials correct?
- [ ] Is GitHub Pages enabled?
- [ ] Have changes been pushed to main branch?

---

## Getting Help

### Useful Debug Commands

```bash
# Check backend status
curl -I https://brighten-lighting-api.onrender.com/api/products

# Check MongoDB connection
# (via MongoDB Compass or mongosh)

# View git history
git log --oneline -10

# Check current config
git config -l
```

### Where to Look for Errors

1. **Browser Console** (F12)
   - Frontend errors, API calls, CORS issues

2. **Render Logs**
   - Backend startup errors, MongoDB connection, API errors

3. **MongoDB Atlas Metrics**
   - Connection issues, storage usage, performance

4. **GitHub Actions** (if enabled)
   - Deployment logs, build errors

---

**Most issues are fixed by:**
1. Checking environment variables
2. Restarting the backend
3. Waiting for services to wake up
4. Clearing browser cache

If still stuck, check the logs! 📋
