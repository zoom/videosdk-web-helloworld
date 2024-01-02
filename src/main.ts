import ZoomVideo from "@zoom/videosdk";
import { generateSignature, useWorkAroundForSafari, } from "./utils";
import "./style.css";

let sdkKey = '';
let sdkSecret = '';
let videoCanvas = document.querySelector("#videos-canvas") as HTMLCanvasElement;
const topic = "TestOne";
const role = 1;
const username = `User${String(new Date().getTime()).slice(6)}`;
const vidHeight = 270;
const vidWidth = 480;
const client = ZoomVideo.createClient();

await client.init("en-US", "Global", { patchJsMedia: true });

const startCall = async () => {
  const token = generateSignature(topic, role, sdkKey, sdkSecret);
  client.on("peer-video-state-change", renderVideo);
  await client.join(topic, token, username);
  const mediaStream = client.getMediaStream();
  // @ts-expect-error https://stackoverflow.com/questions/7944460/detect-safari-browser/42189492#42189492
  window.safari ? await useWorkAroundForSafari(client) : await mediaStream.startAudio();
  await mediaStream.startVideo();
  await renderVideo({ action: 'Start', userId: client.getCurrentUserInfo().userId });
}

const renderVideo = async (event: { action: "Start" | "Stop"; userId: number; }) => {
  const mediaStream = client.getMediaStream();
  if (event?.action === 'Stop') {
    await mediaStream.stopRenderVideo(videoCanvas, event.userId);
  }

  const usersWithVideo = client.getAllUser().filter(e => e.bVideoOn).reverse();
  for await (const [index, user] of usersWithVideo.entries()) {
    if (event.userId === user.userId) {
      await mediaStream.renderVideo(videoCanvas, user.userId, vidWidth, vidHeight, 0, (index * vidHeight), 2);
    } else {
      await mediaStream.adjustRenderedVideoPosition(videoCanvas, user.userId, vidWidth, vidHeight, 0, (index * vidHeight));
    }
  }

  const numberOfUser = usersWithVideo.length;
  try {
    videoCanvas.style.height = `${vidHeight * numberOfUser}px`;
    videoCanvas.height = vidHeight * numberOfUser;
  } catch (e) {
    mediaStream?.updateVideoCanvasDimension(videoCanvas, vidWidth, vidHeight * numberOfUser);
  }
}

const leaveCall = async () => await client.leave();

const toggleVideo = async () => {
  const mediaStream = client.getMediaStream();
  if (mediaStream.isCapturingVideo()) {
    await mediaStream.stopVideo();
    await renderVideo({ action: 'Stop', userId: client.getCurrentUserInfo().userId });
  } else {
    await mediaStream.startVideo();
    await renderVideo({ action: 'Start', userId: client.getCurrentUserInfo().userId });
  }
}

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
