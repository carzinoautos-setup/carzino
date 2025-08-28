# Environment Setup for Carzino Vehicle Search

## 🚨 URGENT: Environment Variables Required

Your application is currently showing "Loading vehicles..." because environment variables are not configured. Follow these steps:

## Step 1: Create Environment File

Create a new file called `.env.local` in your project root (same level as package.json):

```bash
# WordPress Site Configuration
REACT_APP_WP_SITE_URL=https://yourdomain.com
REACT_APP_WC_CONSUMER_KEY=ck_your_consumer_key_here
REACT_APP_WC_CONSUMER_SECRET=cs_your_consumer_secret_here
```

## Step 2: Get WooCommerce API Credentials

1. Log into your WordPress admin panel
2. Go to **WooCommerce** → **Settings** → **Advanced** → **REST API**
3. Click **Add Key**
4. Fill in:
   - **Description**: Carzino Vehicle Search
   - **User**: Select an admin user
   - **Permissions**: Read
5. Click **Generate API Key**
6. Copy the **Consumer Key** and **Consumer Secret**

## Step 3: Update Your .env.local File

Replace the placeholder values with your actual credentials:

```bash
REACT_APP_WP_SITE_URL=https://yourwordpresssite.com
REACT_APP_WC_CONSUMER_KEY=ck_1234567890abcdef1234567890abcdef12345678
REACT_APP_WC_CONSUMER_SECRET=cs_1234567890abcdef1234567890abcdef12345678
```

## Step 4: Restart Development Server

After creating the .env.local file:

1. Stop your development server (Ctrl+C)
2. Run `npm start` again
3. The application should now load vehicle data

## 🔧 Troubleshooting

### If you still see "Loading vehicles...":

1. **Check Environment Variables**: Click the "🔧 Debug Data" button in the bottom-right corner
2. **Verify API Credentials**: Make sure your WooCommerce API keys are correct
3. **Check CORS Settings**: Your WordPress site may need CORS headers configured

### CORS Configuration (if needed):

Add this to your WordPress theme's functions.php or use a plugin:

```php
// Allow CORS for Carzino app
add_action('init', function() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
});
```

## 🎯 Quick Test

Once configured, you should see:
- ✅ Vehicle cards displaying
- ✅ Filter options populated (Makes, Models, etc.)
- ✅ "Connected to WooCommerce inventory" message

## 📞 Need Help?

1. Use the Debug Panel (🔧 button) to identify specific issues
2. Check browser console for detailed error messages
3. Verify your WordPress site is accessible and WooCommerce is active

## 🔒 Security Note

- Never commit your `.env.local` file to version control
- The `.env.local` file is already in .gitignore
- Keep your API credentials secure
