# QR Code Troubleshooting Guide

## ✅ Quick Checklist

### 1. **Same WiFi Network**
- ✓ Computer and phone MUST be on the same WiFi
- ✓ Not on mobile data
- ✓ Not on different networks (e.g., guest WiFi vs main WiFi)

### 2. **Verify IP Address**
Run this command on your computer:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Current IP: **192.168.5.212**

If IP changed, update these files:
- `app/conductor/page.tsx` (line 262)
- `app/audience/page.tsx` (line 31)

### 3. **Test URLs Manually**

**On Computer:**
- Open: http://192.168.5.212:3000/conductor
- Should see conductor page

**On Phone Browser:**
- Type: http://192.168.5.212:3000
- Should see home page
- If this works, QR code should work too!

### 4. **QR Code Scanning Methods**

**Method 1: Phone Camera App**
- Open native camera app
- Point at QR code
- Tap notification that appears

**Method 2: QR Scanner App**
- Download QR scanner app
- Scan the code
- Should open URL in browser

**Method 3: Manual Entry**
- Copy the URL shown below QR code
- Type it in phone browser
- Or use the "Copy URL" button

### 5. **Firewall Check**

Your Mac firewall might be blocking connections.

**Check Firewall:**
1. System Preferences → Security & Privacy → Firewall
2. If ON, click "Firewall Options"
3. Make sure Node.js is allowed
4. Or temporarily disable firewall for testing

### 6. **Port Check**

Make sure ports 3000 and 3001 are not blocked:
```bash
lsof -i :3000
lsof -i :3001
```

Both should show Node.js processes running.

## 🔧 Common Issues

### Issue: QR Code doesn't scan
**Solution:**
- Use phone camera app (not third-party scanner)
- Make sure QR code is clear and well-lit
- Try zooming in/out
- Use the "Copy URL" button instead

### Issue: URL opens but shows error
**Solution:**
- Check if server is running: `npm run dev`
- Verify IP address hasn't changed
- Make sure both devices on same WiFi

### Issue: "Cannot connect" error
**Solution:**
- Check Mac firewall settings
- Restart the server
- Try accessing http://192.168.5.212:3000 directly first

### Issue: QR code shows localhost
**Solution:**
- Code has been updated to use 192.168.5.212
- Refresh the conductor page
- Check browser console for the correct URL

## 🧪 Testing Steps

1. **On Computer:**
   ```
   Open: http://192.168.5.212:3000/conductor
   Check console (F12) for "Audience URL: http://192.168.5.212:3000/audience?session=XXXXX"
   ```

2. **On Phone:**
   ```
   Open browser
   Type: http://192.168.5.212:3000
   Should see home page
   ```

3. **If step 2 works:**
   - QR code should work
   - Try scanning again
   - Or manually type the full URL with session ID

4. **If step 2 doesn't work:**
   - Check WiFi connection
   - Check firewall
   - Verify IP address

## 📱 Alternative: Manual URL Entry

If QR code still doesn't work:

1. On conductor page, click "Copy URL" button
2. Send URL to yourself (email, messages, etc.)
3. Open on phone and paste in browser
4. Should work perfectly!

## 🆘 Still Not Working?

Try this diagnostic:

**On Phone:**
```
http://192.168.5.212:3000/test
```

If you see a page, server is accessible.
If not, it's a network/firewall issue.

**On Computer Console:**
Look for these logs:
```
Conductor page loaded
Session ID: XXXXXXXXX
Audience URL: http://192.168.5.212:3000/audience?session=XXXXXXXXX
```

The URL shown here is what the QR code contains!
