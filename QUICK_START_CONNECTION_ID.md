# Quick Guide: Getting Your Connection ID from Alloy Automation

## 🎯 Fastest Method: Alloy Dashboard

### Step-by-Step Instructions

1. **Log in to Alloy Dashboard**
   - Go to: https://app.runalloy.com
   - Sign in with your account

2. **Navigate to Connections**
   - In the left sidebar, click on **"Connections"** (or look for **"Integrations"**)
   - You'll see a list of all your connected integrations

3. **Find Your Notion Connection**
   - Look for "Notion" in the list
   - Click on it to view details

4. **Copy the Connection ID**
   - The Connection ID will be displayed in the connection details page
   - It typically looks like: `conn_abc123xyz...` or similar format
   - Click to copy it

5. **Add to Your `.env` File**
   ```env
   CONNECTION_ID=conn_abc123xyz
   ```

## 📋 Visual Guide

```
Alloy Dashboard
├── Connections (in sidebar)
    ├── Notion
    │   ├── Connection ID: conn_abc123xyz  ← Copy this!
    │   ├── Status: Connected
    │   └── Last synced: ...
    └── Other integrations...
```

## 🔍 Alternative: If You Don't See Connections

If you don't have a connection yet:

1. **Create a Connection**
   - In the Alloy Dashboard, go to **Connections**
   - Click **"Add Connection"** or **"Connect Integration"**
   - Select **Notion**
   - Follow the OAuth flow to authorize Alloy to access your Notion workspace
   - After authorization, the Connection ID will be available

2. **OAuth Flow Steps**
   - Click "Connect" on Notion
   - You'll be redirected to Notion to authorize
   - Click "Allow" or "Authorize"
   - You'll be redirected back to Alloy
   - The connection will be created and you'll see the Connection ID

## 💻 Programmatic Method

If you prefer to get it via code, you can use:

```bash
npm run list-connections
```

This will list all your connections and their IDs.

## ❓ Troubleshooting

### "I don't see Connections in the dashboard"
- Make sure you're logged into the correct Alloy account
- Check that you have the right permissions
- Try refreshing the page

### "Connection ID format looks different"
- Connection IDs can have different formats depending on your Alloy plan
- Common formats: `conn_...`, `connection_...`, or UUIDs
- Any format should work as long as you copy it exactly

### "I can't find my Notion connection"
- Make sure you completed the OAuth flow
- Check that the connection wasn't deleted or revoked
- Try disconnecting and reconnecting Notion

## 📚 Additional Resources

- Full documentation: `docs/getting-connection-id.md`
- Alloy Dashboard: https://app.runalloy.com
- Alloy Docs: https://docs.runalloy.com

---

**Quick Tip**: Once you have your Connection ID, add it to your `.env` file and you're ready to use the demo!

