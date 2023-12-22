import ZoomVideo from "@zoom/videosdk";
import { generateSignature } from "./sign";
import "./style.css";

const sessionName = "TestSessionOne";
const role = 1;
const vidHeight = 270;
const vidWidth = 480;
const remoteCanvasEle = document.querySelector("#participant-videos-canvas") as HTMLCanvasElement;
const client = ZoomVideo.createClient();

const startCall = async () => {
  await client.init("en-US", "Global", { patchJsMedia: true });
  const token = generateSignature(sessionName, role);
  client.on("peer-video-state-change", renderVideo);
  await client.join(sessionName, token, "Test");
  await client.getMediaStream().startVideo();
  renderVideo();
}

const renderVideo = async () => {
  const userList = client.getAllUser().reverse();
  const numberOfUser = userList.length;
  try {
    remoteCanvasEle.style.height = `${vidHeight * numberOfUser}px`;
    remoteCanvasEle.height = vidHeight * numberOfUser;
  } catch (e) {
    client.getMediaStream()?.updateVideoCanvasDimension(remoteCanvasEle, vidWidth, vidHeight * numberOfUser);
  }
  for await (const [index, user] of userList.entries()) {
    if (user.bVideoOn) {
      await client.getMediaStream().renderVideo(remoteCanvasEle, user.userId, vidWidth, vidHeight, 0, (index * vidHeight), 3);
    }
  }
}

// audio logic

const leaveCall = async () => await client.leave();

// UI Logic
const startBtn = document.querySelector("#start-btn") as HTMLButtonElement;
const stopBtn = document.querySelector("#stop-btn") as HTMLButtonElement;
startBtn.addEventListener("click", async () => {
  startBtn.innerHTML = "Connecting...";
  startBtn.disabled = true;
  await startCall();
  startBtn.innerHTML = "Connected";
  startBtn.style.display = "none";
  stopBtn.style.display = "block";
});
stopBtn.addEventListener("click", async () => {
  await leaveCall();
  remoteCanvasEle.remove();
  stopBtn.innerHTML = "Disconnected";
});