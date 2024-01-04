import ZoomVideo, { LiveTranscriptionLanguage } from "@zoom/videosdk";
import { generateSignature, useWorkAroundForSafari } from "./utils";
import "./style.css";

let sdkKey = '';
let sdkSecret = '';
let videoCanvas = document.querySelector("#videos-canvas") as HTMLCanvasElement;
const topic = "TestOne";
const role = 1;
const username = `user-${String(new Date().getTime()).slice(6)}`;
const vidHeight = 270;
const vidWidth = 480;
const client = ZoomVideo.createClient();

await client.init("en-US", "Global", { patchJsMedia: true });

const startCall = async () => {
  // generate a token to join the session - in production this will be done by your backend
  const token = generateSignature(topic, role, sdkKey, sdkSecret);
  // call the renderVideo function whenever a user joins or leaves
  client.on("peer-video-state-change", renderVideo);
  await client.join(topic, token, username);
  const mediaStream = client.getMediaStream();
  // @ts-expect-error https://stackoverflow.com/questions/7944460/detect-safari-browser/42189492#42189492
  window.safari ? await useWorkAroundForSafari(client) : await mediaStream.startAudio();
  await mediaStream.startVideo();
  // render the video of the current user
  await renderVideo({ action: 'Start', userId: client.getCurrentUserInfo().userId });
  await startTranscription();
};

const renderVideo = async (event: { action: "Start" | "Stop"; userId: number; }) => {
  const mediaStream = client.getMediaStream();
  if (event?.action === 'Stop') {
    await mediaStream.stopRenderVideo(videoCanvas, event.userId);
  }

  // get user list with video on
  const usersWithVideo = client.getAllUser().filter(e => e.bVideoOn).reverse();
  // iterate through the list and render the video of each user
  for await (const [index, user] of usersWithVideo.entries()) {
    if (event.userId === user.userId && user.bVideoOn) {
      // if it's a new user, render the video
      await mediaStream.renderVideo(videoCanvas, user.userId, vidWidth, vidHeight, 0, (index * vidHeight), 2).catch(e => console.log('renderVideo: ', e));
    } else if (user.bVideoOn) {
      // if it's an existing user, adjust the position of the video
      await mediaStream.adjustRenderedVideoPosition(videoCanvas, user.userId, vidWidth, vidHeight, 0, (index * vidHeight)).catch(e => console.log('adjustRenderedVideoPosition: ', e));;
    }
  }

  const numberOfUser = usersWithVideo.length;
  try {
    // adjust the height of the canvas to fit all the videos
    videoCanvas.style.height = `${vidHeight * numberOfUser}px`;
    videoCanvas.height = vidHeight * numberOfUser;
  } catch (e) {
    // if the canvas is handled offscreen, update using this function call
    await mediaStream?.updateVideoCanvasDimension(videoCanvas, vidWidth, vidHeight * numberOfUser);
  }
};

const startTranscription = async () => {
  const liveTranscriptionTranslation = client.getLiveTranscriptionClient();
  const captionsContainer = document.querySelector("#messages") as HTMLDivElement;
  client.on("caption-message", (payload) => {
    const captionEle = document.getElementById(payload.msgId);
    if (captionEle) {
      captionEle.innerHTML = `${payload.displayName}: ${payload.text}`;
    } else {
      const newCaptionEle = document.createElement("p");
      newCaptionEle.setAttribute("id", payload.msgId);
      newCaptionEle.innerHTML = `${payload.displayName}: ${payload.text}`;
      username !== payload.displayName ?
        newCaptionEle.classList.add("text-sm", "bg-blue-500", "text-white", "rounded", "p-2", "w-fit", "my-2", "mr-32")
        : newCaptionEle.classList.add("text-sm", "bg-gray-200", "text-black", "rounded", "p-2", "w-fit", "my-2", "ml-32", "self-end");
      captionsContainer.appendChild(newCaptionEle);
    }
  });
  await liveTranscriptionTranslation.startLiveTranscription();
  await liveTranscriptionTranslation.setSpeakingLanguage(LiveTranscriptionLanguage.English);
};

const leaveCall = async () => await client.leave();

const toggleVideo = async () => {
  const mediaStream = client.getMediaStream();
  if (mediaStream.isCapturingVideo()) {
    await mediaStream.stopVideo();
    // update the canvas when the video is stopped
    await renderVideo({ action: 'Stop', userId: client.getCurrentUserInfo().userId });
  } else {
    await mediaStream.startVideo();
    // update the canvas when the video is started
    await renderVideo({ action: 'Start', userId: client.getCurrentUserInfo().userId });
  }
};

// UI Logic
const startBtn = document.querySelector("#start-btn") as HTMLButtonElement;
const stopBtn = document.querySelector("#stop-btn") as HTMLButtonElement;
const sdkKeyInput = document.querySelector("#sdk-key") as HTMLInputElement;
const sdkSecretInput = document.querySelector("#sdk-secret") as HTMLInputElement;
const toggleVideoBtn = document.querySelector("#toggle-video-btn") as HTMLButtonElement;

startBtn.addEventListener("click", async () => {
  sdkKey = sdkKeyInput.value;
  sdkSecret = sdkSecretInput.value;
  if (!sdkKey || !sdkSecret) {
    alert("Please enter SDK Key and SDK Secret");
    return;
  }
  startBtn.innerHTML = "Connecting...";
  startBtn.disabled = true;
  await startCall();
  startBtn.innerHTML = "Connected";
  startBtn.style.display = "none";
  stopBtn.style.display = "block";
  toggleVideoBtn.style.display = "block";
});

stopBtn.addEventListener("click", async () => {
  videoCanvas.remove();
  (document.querySelector("#messages") as HTMLDivElement).innerHTML = '<h3 class="text-center text-lg font-bold">Captions</h3>';
  toggleVideoBtn.style.display = "none";
  await leaveCall();
  const newCanvas = document.createElement("canvas");
  newCanvas.id = "videos-canvas";
  newCanvas.width = vidWidth;
  newCanvas.height = vidHeight;
  (document.querySelector("#canvas-container") as HTMLDivElement).appendChild(newCanvas);
  videoCanvas = newCanvas;
  stopBtn.style.display = "none";
  startBtn.style.display = "block";
  startBtn.innerHTML = "Join";
  startBtn.disabled = false;
});

toggleVideoBtn.addEventListener("click", async () => {
  await toggleVideo();
});

sdkKeyInput.addEventListener("change", (e) => {
  sdkKey = (e.target as HTMLInputElement).value;
});

sdkSecretInput.addEventListener("change", (e) => {
  sdkSecret = (e.target as HTMLInputElement).value;
});
