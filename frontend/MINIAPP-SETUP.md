# Zyn Prediction Markets - Farcaster Mini App Setup

This guide explains how to set up and deploy Zyn as a Farcaster Mini App.

## What is a Farcaster Mini App?

Farcaster Mini Apps are web applications that can be discovered and used within Farcaster clients like Warpcast. They provide a seamless way for users to interact with your app without leaving the Farcaster ecosystem.

## Features Added

- ✅ Mini App SDK integration
- ✅ Automatic splash screen handling
- ✅ User context detection (FID, username, etc.)
- ✅ Add to Mini App functionality
- ✅ Share to Farcaster feeds
- ✅ Embed metadata for social sharing
- ✅ Responsive design for Mini App environment

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install @farcaster/miniapp-sdk
```

### 2. Configure Your Domain

Update the following files with your actual domain:

- `public/.well-known/farcaster.json` - Update all URLs
- `index.html` - Update meta tag URLs
- `src/hooks/useMiniApp.ts` - Update any hardcoded URLs

### 3. Create Required Images

You'll need these images for your Mini App:

- **Icon**: 200x200px PNG (for app icon)
- **Splash Image**: 200x200px PNG (for loading screen)
- **OG Image**: 1200x630px PNG (3:2 aspect ratio for social sharing)

### 4. Sign Your Manifest

1. Go to [Farcaster Developer Tools](https://farcaster.xyz/~/developers/mini-apps/manifest)
2. Enter your domain and app details
3. Sign the manifest with your Farcaster account
4. Update your `farcaster.json` with the signed `accountAssociation`

### 5. Test Your Mini App

1. Deploy your app to your domain
2. Use the [Mini App Preview Tool](https://farcaster.xyz/~/developers/mini-apps/preview)
3. Test the "Add App" and "Share" functionality

## Mini App Features

### User Context

The app automatically detects when running in a Mini App and displays:
- User's Farcaster ID (FID)
- Username (if available)
- Platform type (web/mobile)

### Add to Mini App

Users can add your app to their Farcaster client for quick access and notifications.

### Share to Farcaster

Users can share their experience with your app directly to their Farcaster feed.

### Automatic Splash Screen

The app automatically hides the Mini App splash screen when ready.

## Development vs Production

### Development

- Use `ngrok` or similar for local testing
- Mini App features will work in preview mode
- `addMiniApp()` action won't work with tunnel domains

### Production

- Deploy to your actual domain
- All Mini App features will work
- Users can add your app and receive notifications

## File Structure

```
frontend/
├── public/
│   └── .well-known/
│       └── farcaster.json          # Mini App manifest
├── src/
│   ├── hooks/
│   │   └── useMiniApp.ts          # Mini App integration hook
│   ├── pages/
│   │   └── Home.tsx               # Updated with Mini App features
│   └── App.tsx                    # Mini App SDK integration
└── index.html                     # Embed metadata
```

## Troubleshooting

### App Not Loading

- Ensure you're calling `sdk.actions.ready()` after initialization
- Check that your manifest is accessible at `/.well-known/farcaster.json`
- Verify your domain matches exactly in the manifest

### Mini App Features Not Working

- Check browser console for SDK errors
- Ensure you're running in a Mini App environment
- Verify the SDK is properly imported

### Manifest Issues

- Use the [Farcaster Developer Tools](https://farcaster.xyz/~/developers/mini-apps/manifest) to validate
- Check that your domain signature is correct
- Ensure all required fields are present

## Next Steps

1. **Deploy to Production**: Get your app running on your actual domain
2. **Add Notifications**: Implement webhook endpoints for push notifications
3. **Enhance Sharing**: Add dynamic embeds for different pages
4. **User Engagement**: Implement features that encourage users to add your app

## Resources

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz/)
- [Mini App SDK](https://www.npmjs.com/package/@farcaster/miniapp-sdk)
- [Developer Tools](https://farcaster.xyz/~/developers)
- [Community Support](https://farcaster.xyz/~/group/X2P7HNc4PHTriCssYHNcmQ)

## Support

If you encounter issues:

1. Check the [Farcaster documentation](https://miniapps.farcaster.xyz/)
2. Join the [Devs: Mini Apps](https://farcaster.xyz/~/group/X2P7HNc4PHTriCssYHNcmQ) group
3. Reach out to the Farcaster team (@pirosb3, @linda, @deodad) on Farcaster
