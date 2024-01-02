import ZoomVideo, { LiveTranscriptionLanguage } from "@zoom/videosdk";
import { generateSignature, useWorkAroundForSafari } from "./utils";
import "./style.css";

let sdkKey = "";
let sdkSecret = "";
const topic = "TestTwo";
const role = 1;
const username = "User-" + String(new Date().getTime()).slice(8);
const vidHeight = 270;
const vidWidth = 480;
const client = ZoomVideo.createClient();

const startCall = async () => {
  const token = generateSignature(topic, role, sdkKey, sdkSecret);
  await client.init("en-US", "Global", { patchJsMedia: true });
  client.on("peer-video-state-change", renderVideo);
  await client.join(topic, token, username);
  const mediaStream = client.getMediaStream();
  // @ts-expect-error https://stackoverflow.com/questions/7944460/detect-safari-browser/42189492#42189492
  window.safari ? await useWorkAroundForSafari(client) : await mediaStream.startAudio();
  await mediaStream.startVideo();
  await renderVideo();
  await startTranscription();
};

const renderVideo = async () => {
  const userList = client.getAllUser().reverse();
  const numberOfUser = userList.length;
  const mediaStream = client.getMediaStream();
  const videoCanvas = document.querySelector("#participant-videos-canvas") as HTMLCanvasElement;
  try {
    videoCanvas.style.height = `${vidHeight * numberOfUser}px`;
    videoCanvas.height = vidHeight * numberOfUser;
  } catch (e) {
    mediaStream?.updateVideoCanvasDimension(videoCanvas, vidWidth, vidHeight * numberOfUser);
  }
  for await (const [index, user] of userList.entries()) {
    if (user.bVideoOn) {
      await mediaStream.renderVideo(videoCanvas, user.userId, vidWidth, vidHeight, 0, index * vidHeight, 3);
    }
  }
};

const startTranscription = async () => {
  const liveTranscriptionTranslation = client.getLiveTranscriptionClient();
  const captionsElement = document.querySelector("#captions") as HTMLDivElement;
  client.on("caption-message", (payload) => {
    const caption = document.getElementById(payload.msgId) || document.createElement("div");
    caption.setAttribute("id", payload.msgId);
    caption.innerHTML = `${payload.displayName} said: ${payload.text}`;
    captionsElement.appendChild(caption);
  });
  try {
    await liveTranscriptionTranslation.startLiveTranscription();
    await liveTranscriptionTranslation.setSpeakingLanguage(LiveTranscriptionLanguage.English);
  } catch (e) {
    console.log("error:", e);
  }
};

const leaveCall = async () => await client.leave();

// UI Logic
const startBtn = document.querySelector("#start-btn") as HTMLButtonElement;
const stopBtn = document.querySelector("#stop-btn") as HTMLButtonElement;
const sdkKeyInput = document.querySelector("#sdk-key") as HTMLInputElement;
const sdkSecretInput = document.querySelector("#sdk-secret") as HTMLInputElement;

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
});

stopBtn.addEventListener("click", async () => {
  await leaveCall();
  document.querySelector("#participant-videos-canvas")?.remove();
  document.querySelector("#captions")?.remove();
  stopBtn.innerHTML = "Disconnected";
});

sdkKeyInput.addEventListener("change", (e) => {
  sdkKey = (e.target as HTMLInputElement).value;
});

sdkSecretInput.addEventListener("change", (e) => {
  sdkSecret = (e.target as HTMLInputElement).value;
});
