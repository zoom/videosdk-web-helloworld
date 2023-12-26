import ZoomVideo from "@zoom/videosdk";
import { generateSignature, useWorkAroundForSafari, } from "./utils";
import "./style.css";

let sdkKey = '';
let sdkSecret = '';
const topic = "TestOne";
const role = 1;
const vidHeight = 270;
const vidWidth = 480;
const client = ZoomVideo.createClient();
const videoCanvas = document.querySelector("#participant-videos-canvas") as HTMLCanvasElement;

const startCall = async () => {
  const token = generateSignature(topic, role, sdkKey, sdkSecret);
  await client.init("en-US", "Global", { patchJsMedia: true });
  client.on("peer-video-state-change", renderVideo);
  await client.join(topic, token, "Test");
  const mediaStream = client.getMediaStream();
  // @ts-expect-error https://stackoverflow.com/questions/7944460/detect-safari-browser/42189492#42189492
  window.safari ? await useWorkAroundForSafari(client) : await mediaStream.startAudio();
  await mediaStream.startVideo();
  await renderVideo();
}

const renderVideo = async () => {
  const userList = client.getAllUser().reverse();
  const numberOfUser = userList.length;
  const mediaStream = client.getMediaStream();
  try {
    videoCanvas.style.height = `${vidHeight * numberOfUser}px`;
    videoCanvas.height = vidHeight * numberOfUser;
  } catch (e) {
    mediaStream?.updateVideoCanvasDimension(videoCanvas, vidWidth, vidHeight * numberOfUser);
  }
  for await (const [index, user] of userList.entries()) {
    if (user.bVideoOn) {
      await mediaStream.renderVideo(videoCanvas, user.userId, vidWidth, vidHeight, 0, (index * vidHeight), 3);
    }
  }
}

const leaveCall = async () => await client.leave();

// UI Logic
const startBtn = document.querySelector("#start-btn") as HTMLButtonElement;
const stopBtn = document.querySelector("#stop-btn") as HTMLButtonElement;
const sdkKeyInput = document.querySelector("#sdk-key") as HTMLInputElement;
const sdkSecretInput = document.querySelector("#sdk-secret") as HTMLInputElement;

startBtn.addEventListener("click", async () => {
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
});

stopBtn.addEventListener("click", async () => {
  await leaveCall();
  videoCanvas.remove();
  stopBtn.innerHTML = "Disconnected";
});

sdkKeyInput.addEventListener("change", (e) => {
  sdkKey = (e.target as HTMLInputElement).value;
});

sdkSecretInput.addEventListener("change", (e) => {
  sdkSecret = (e.target as HTMLInputElement).value;
});
