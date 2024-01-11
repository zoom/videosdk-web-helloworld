# Zoom Video SDK Web Hello World Sample

Use of this sample app is subject to our [Terms of Use](https://explore.zoom.us/en/video-sdk-terms/).

The [Zoom Video SDK for web](https://developers.zoom.us/docs/video-sdk/web/) enables you to build custom video experiences on a webpage with Zoom's core technology through a highly optimized WebAssembly module.

## Installation

To get started, clone the repo:

`git clone https://github.com/zoom/videosdk-web-helloworld.git`

## Setup

1. Install the dependencies:

   `npm install`

1. Create a `.env` file in the root directory of the project, you can do this by copying the `.env.example` file (`cp .env.example .env`) and replacing the values with your own. The `.env` file should look like this:

   ```
   VITE_SDK_KEY=YourZoomVideoSDKKey
   VITE_SDK_SECRET=YourZoomVideoSDKSecret
   ```

   Replace `YourZoomVideoSDKKey` and `YourZoomVideoSDKSecret` with your Zoom Video SDK key and secret.

   > Note: Do not expose your SDK Secret to the client, when using the Video SDK in production please make sure to use a backend service to sign the tokens.

1. Run the app:

   `npm run dev`

## Usage

1. Navigate to http://localhost:5173

1. Click "Join" to join the session

> Learn more about [rendering multiple video streams](https://developers.zoom.us/docs/video-sdk/web/gallery-view/)

For the full list of features and event listeners, as well as additional guides, see our [Video SDK docs](https://developers.zoom.us/docs/video-sdk/web/).

## Need help?

If you're looking for help, try [Developer Support](https://devsupport.zoom.us) or our [Developer Forum](https://devforum.zoom.us). Priority support is also available with [Premier Developer Support](https://explore.zoom.us/docs/en-us/developer-support-plans.html) plans.

## Disclaimer

Do not expose your SDK Secret to the client, when using the Video SDK in production please make sure to use a backend service to sign the tokens.
