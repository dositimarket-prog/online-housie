# Converting to iOS and Android Apps

## Overview

This guide will help you convert your Online Housie web app into native iOS and Android apps using **Capacitor**.

### Why Capacitor?
- ✅ Works seamlessly with existing React/Vite apps
- ✅ Modern and actively maintained by Ionic team
- ✅ Single codebase for both iOS and Android
- ✅ Access to native device features (camera, notifications, etc.)
- ✅ Easy to add native plugins later
- ✅ Your existing web code works as-is

### What You'll Need

**For Both Platforms:**
- Node.js installed (you already have this)
- Your web app working and tested

**For iOS:**
- Mac computer (required for iOS development)
- Xcode installed (free from Mac App Store)
- Apple Developer Account ($99/year) for App Store deployment

**For Android:**
- Android Studio installed (free)
- Google Play Console Account ($25 one-time fee) for Play Store deployment

---

## Step 1: Install Capacitor

Run these commands in your project directory:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init
```

When prompted:
- **App name:** `Online Housie` (or your preferred name)
- **App ID:** `com.yourcompany.onlinehousie` (use reverse domain format)
- **Web asset directory:** `dist` (Vite's build output)

---

## Step 2: Configure Capacitor

The `npx cap init` command created a `capacitor.config.ts` file. Update it:

```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.onlinehousie',
  appName: 'Online Housie',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1f2937",
      showSpinner: false
    }
  }
};

export default config;
```

---

## Step 3: Add iOS Platform

**Prerequisites:** Mac with Xcode installed

```bash
# Add iOS platform
npm install @capacitor/ios
npx cap add ios

# Build your web app
npm run build

# Sync web assets to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### In Xcode:

1. **Set up signing:**
   - Click on the project name in the left sidebar
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Select your Apple Developer team

2. **Test on simulator:**
   - Click the device dropdown at the top
   - Select any iPhone simulator
   - Click the Play button (▶️) to run

3. **Test on real device:**
   - Connect your iPhone via USB
   - Select it from the device dropdown
   - Click Play to install and run

---

## Step 4: Add Android Platform

**Prerequisites:** Android Studio installed

```bash
# Add Android platform
npm install @capacitor/android
npx cap add android

# Build your web app
npm run build

# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### In Android Studio:

1. **Wait for Gradle sync** to complete (first time takes a while)

2. **Test on emulator:**
   - Click "Device Manager" on the right side
   - Create a new virtual device (if none exist)
   - Select any recent device (e.g., Pixel 5)
   - Click the Play button (▶️) to run

3. **Test on real device:**
   - Enable Developer Mode on your Android phone:
     - Go to Settings → About Phone
     - Tap "Build Number" 7 times
     - Go back to Settings → Developer Options
     - Enable "USB Debugging"
   - Connect phone via USB
   - Select it from the device dropdown
   - Click Play to install and run

---

## Step 5: Configure App Icons and Splash Screens

### Create App Icons

You'll need an icon in these sizes:
- **iOS:** 1024x1024px (single image, Xcode generates others)
- **Android:** Multiple sizes from 48x48 to 512x512

**Recommended approach:**
1. Create a single 1024x1024px icon
2. Use a tool to generate all sizes:
   - [https://appicon.co/](https://appicon.co/)
   - [https://www.appicon.build/](https://www.appicon.build/)

**For iOS:**
- Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**For Android:**
- Place icons in `android/app/src/main/res/mipmap-*/`
- Or use Android Studio's Image Asset tool

### Create Splash Screens

Capacitor uses a simple splash screen by default. To customize:

```bash
# Install splash screen plugin
npm install @capacitor/splash-screen
```

Add splash screen images:
- **iOS:** 2732x2732px in `ios/App/App/Assets.xcassets/Splash.imageset/`
- **Android:** 2732x2732px in `android/app/src/main/res/drawable/`

---

## Step 6: Update Development Workflow

After making changes to your web app:

```bash
# 1. Build the web app
npm run build

# 2. Sync changes to both platforms
npx cap sync

# Or sync to specific platform
npx cap sync ios
npx cap sync android
```

**Pro tip:** Add scripts to `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "build:mobile": "vite build && npx cap sync",
    "open:ios": "npx cap open ios",
    "open:android": "npx cap open android"
  }
}
```

Then just run: `npm run build:mobile`

---

## Step 7: Handle Mobile-Specific Features

### Update Supabase for Mobile

Your Supabase configuration should work as-is, but for production you might want to check for the platform:

```javascript
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
```

### Add Status Bar Plugin (Optional)

```bash
npm install @capacitor/status-bar
```

In your main App.jsx:

```javascript
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark });
  }
}, []);
```

---

## Step 8: Build for Production

### iOS Production Build

1. **In Xcode:**
   - Select "Any iOS Device (arm64)" as the target
   - Go to Product → Archive
   - Wait for archive to complete
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard to upload

2. **In App Store Connect:**
   - Go to [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
   - Create a new app
   - Fill in app information
   - Upload screenshots (6.5" and 5.5" required)
   - Submit for review

**iOS Requirements:**
- Privacy policy URL
- App description
- Screenshots for different device sizes
- App category
- Age rating

### Android Production Build

1. **Generate signing key (first time only):**

```bash
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANT:** Save the password! You'll need it later.

2. **Configure signing in `android/app/build.gradle`:**

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'my-key-alias'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Build the release APK/AAB:**

```bash
cd android
./gradlew bundleRelease  # For AAB (recommended)
# or
./gradlew assembleRelease  # For APK
```

The output will be in:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

4. **Upload to Google Play Console:**
   - Go to [https://play.google.com/console/](https://play.google.com/console/)
   - Create a new app
   - Upload your AAB file
   - Fill in app details
   - Add screenshots
   - Submit for review

**Android Requirements:**
- Privacy policy URL
- App description
- Screenshots for phone and tablet
- Feature graphic (1024x500)
- App category
- Content rating questionnaire

---

## Step 9: Testing Checklist

Before submitting to stores:

- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Test all game features (create, join, play)
- [ ] Test ticket selection
- [ ] Test prize claiming
- [ ] Test real-time updates
- [ ] Test on different screen sizes
- [ ] Test offline behavior (should show error)
- [ ] Test app icons appear correctly
- [ ] Test splash screen shows properly
- [ ] Verify no console errors
- [ ] Test deep linking (if implemented)

---

## Troubleshooting

### iOS Issues

**"No provisioning profiles found"**
- Go to Xcode → Preferences → Accounts
- Add your Apple ID
- Download manual profiles

**"Code signing failed"**
- Check Signing & Capabilities tab
- Ensure correct team is selected
- Try cleaning build folder (Product → Clean Build Folder)

**"App crashes on launch"**
- Check Xcode console for errors
- Verify all environment variables are set
- Check capacitor.config.ts settings

### Android Issues

**"Gradle sync failed"**
- Update Android Studio
- File → Invalidate Caches and Restart
- Check internet connection

**"App not installing on device"**
- Enable USB debugging on device
- Check device is authorized
- Try different USB cable/port

**"App crashes on launch"**
- Check Logcat in Android Studio
- Verify all environment variables are set
- Check capacitor.config.ts settings

---

## Ongoing Maintenance

After publishing:

1. **When you make updates:**
   - Update version number in:
     - `package.json`
     - `ios/App/App.xcodeproj/project.pbxproj` (CFBundleShortVersionString)
     - `android/app/build.gradle` (versionCode and versionName)
   - Build and test
   - Submit new version to stores

2. **Monitor reviews:**
   - Respond to user feedback
   - Fix bugs quickly
   - Add requested features

3. **Update dependencies:**
   - Keep Capacitor up to date: `npm update @capacitor/core @capacitor/cli`
   - Update platform-specific dependencies

---

## Cost Summary

- **Apple Developer Account:** $99/year (required for App Store)
- **Google Play Console:** $25 one-time (required for Play Store)
- **Mac computer:** Required for iOS development (if you don't have one)
- **Development time:** Initial setup 1-2 days, then ongoing updates

---

## Next Steps

1. Install Capacitor: `npm install @capacitor/core @capacitor/cli`
2. Initialize: `npx cap init`
3. Add platforms: `npx cap add ios` and `npx cap add android`
4. Build and test
5. Create app store accounts
6. Submit for review

---

## Resources

- **Capacitor Docs:** [https://capacitorjs.com/docs](https://capacitorjs.com/docs)
- **iOS App Store Guidelines:** [https://developer.apple.com/app-store/review/guidelines/](https://developer.apple.com/app-store/review/guidelines/)
- **Google Play Policies:** [https://play.google.com/console/about/guides/](https://play.google.com/console/about/guides/)
- **Capacitor Community Plugins:** [https://github.com/capacitor-community](https://github.com/capacitor-community)

---

## Need Help?

Common issues and solutions:
- Check the Capacitor docs
- Search GitHub issues
- Ask on Capacitor Discord
- Stack Overflow with `capacitor` tag

Good luck with your mobile app launch! 🚀
