# Form & Field Android app

The app uses Expo Router and connects to the live store API. The Android APK can be generated with EAS Build; Expo Go is only for development previews.

## Build an installable APK

From the `mobile` directory:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npm run build:android:apk
```

Sign in with the Expo account that should own the app. The `init` command links this app to that Expo account and records its project ID in `app.json`. On the first build, allow EAS to create and manage Android signing credentials.

Before building, add these public app settings in the Expo dashboard under **Project settings → Environment variables** for both the `preview` and `production` environments:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL` (use `https://hng-ecommerce-shop.vercel.app`)

The Supabase URL and anonymous key are client-side values. Never add the Supabase service-role key, database URL, or Paystack secret key to the mobile app.

Run the build command after configuring the variables:

```powershell
npm run build:android:apk
```

No Expo workflow needs to be created for this. If EAS offers to configure a GitHub workflow, skip that option; it is for automatic CI builds and is not needed to create an APK manually.

When the cloud build completes, open its link **on the Android phone** and download/install the `.apk`. If you open the link on a PC, Windows cannot install an Android APK; download it on the computer only if you plan to transfer it to the phone. Android may ask you to allow installs from the browser or file manager. The `preview` build profile is configured for direct APK installation; `production` creates an Android App Bundle for a store release.

Expo Go and the installed APK are separate builds. Expo Go uses values from `mobile/.env.local` while developing; EAS does not upload that local file. The standalone APK therefore needs the EAS environment variables above. If those variables are missing, the account screen explains that setup is needed instead of crashing, and sign-in will not work until you build again with the variables configured.

Signing in to Expo Go/EAS is only for app development and building. To log in as a shopper, use your Form & Field website account in the app's **Account** tab. This is a separate account from Expo.

## Publish the APK from the store website

The storefront `/download` page reads the server-side `ANDROID_APK_URL` environment variable. To publish the APK:

1. Create a GitHub Release for the tested version.
2. Attach the EAS `.apk` file using the filename `form-field-android.apk`.
3. In Vercel, add `ANDROID_APK_URL` for Production with this value:
   `https://github.com/AnalytiqDigital/hng-ecommerce-shop/releases/latest/download/form-field-android.apk`
4. Redeploy the storefront. The download button will become available on the site.

Keep the release APK signed with the same EAS Android credentials for later updates to install over the existing app.

## App configuration

The app uses the public Supabase URL and anonymous key from `mobile/.env.local` when running locally, and `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the EAS `preview` and `production` environments when building. These are client-side configuration values; never put service-role keys, database passwords, or Paystack secret keys in Expo public variables.

`EXPO_PUBLIC_API_BASE_URL` is optional; without it the app uses the deployed storefront API.
