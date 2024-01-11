import ZoomVideo from "@zoom/videosdk";
import { generateSignature, getVideoXandY, useWorkAroundForSafari, } from "./utils";
import "./style.css";

const sdkKey = import.meta.env.VITE_SDK_KEY as string;
const sdkSecret = import.meta.env.VITE_SDK_SECRET as string;
let videoCanvas = document.querySelector("#videos-canvas") as HTMLCanvasElement;
const topic = "TestOne";
const role = 1;
const username = `User-${String(new Date().getTime()).slice(6)}`;
const client = ZoomVideo.createClient();
export const vidHeight = 270;
export const vidWidth = 480;

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
};

const renderVideo = async (event: { action: "Start" | "Stop"; userId: number; }) => {
  const mediaStream = client.getMediaStream();
  if (event?.action === 'Stop') {
    await mediaStream.stopRenderVideo(videoCanvas, event.userId);
  }

  // get user list with video on
  const usersWithVideo = client.getAllUser().filter(e => e.bVideoOn).reverse();
  const numberOfUser = usersWithVideo.length;
  // iterate through the list and render the video of each user
  for await (const [index, user] of usersWithVideo.entries()) {
    // calculate the x and y position of the video
    const { x, y } = getVideoXandY(index, numberOfUser);
    if (event.userId === user.userId && user.bVideoOn) {
      // if it's a new user, render the video
      await mediaStream.renderVideo(videoCanvas, user.userId, vidWidth, vidHeight, x, y, 2);
    } else if (user.bVideoOn) {
      // if it's an existing user, adjust the position of the video
      await mediaStream.adjustRenderedVideoPosition(videoCanvas, user.userId, vidWidth, vidHeight, x, y).catch(e => console.log(e));
    }
  }

  const canvasHeight = numberOfUser > 4 ? vidHeight * 3 : numberOfUser > 1 ? vidHeight * 2 : vidHeight;
  const canvasWidth = numberOfUser > 4 ? vidWidth * 3 : numberOfUser > 1 ? vidWidth * 2 : vidWidth;
  try {
    // adjust the height of the canvas to fit all the videos
    videoCanvas.height = canvasHeight;
    videoCanvas.width = canvasWidth;
  } catch (e) {
    // if the canvas is handled offscreen, update using this function call
    mediaStream?.updateVideoCanvasDimension(videoCanvas, canvasWidth, canvasHeight);
  }
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
const toggleVideoBtn = document.querySelector("#toggle-video-btn") as HTMLButtonElement;

startBtn.addEventListener("click", async () => {
  if (!sdkKey || !sdkSecret) {
    alert("Please enter SDK Key and SDK Secret in the .env file");
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