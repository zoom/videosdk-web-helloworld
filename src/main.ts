import ZoomVideo from "@zoom/videosdk";
import { generateSignature } from "./sign";

const sessionName = "TestASD";
const role = 1;

const remoteCanvasEle = document.querySelector("#participant-videos-canvas") as HTMLCanvasElement;
const localVideoEle = document.querySelector("#my-self-view-video") as HTMLVideoElement;

const startCall = async () => {

  const client = ZoomVideo.createClient();
  await client.init("en-US", "Global", { patchJsMedia: true });
  const token = generateSignature(sessionName, role);
  console.log(token);


  client.on("peer-video-state-change", (payload) => {
    if (payload.action === "Start") {
      console.log("Start", payload.userId);
      currentStream.renderVideo(remoteCanvasEle, payload.userId, 480, 270, 0, 0, 3);
    } else if (payload.action === "Stop") {
      currentStream.stopRenderVideo(remoteCanvasEle, payload.userId);
    }
  });

  await client.join(sessionName, token, "Test");

  try {
    const userList = client.getAllUser();
    for (const user of userList) {
      console.log("Start", user.userId);
      if (user.bVideoOn) {
        client.getMediaStream().renderVideo(remoteCanvasEle, user.userId, 480, 270, 0, 0, 3);
      }
    }
  } catch (e) {
    console.log(e);
  }

  const currentStream = client.getMediaStream();

  if (currentStream.isRenderSelfViewWithVideoElement()) {
    await currentStream.startVideo({ videoElement: localVideoEle });
  } else {
    console.log("video not started, video element is not supported");
  }
}

const startBtn = document.querySelector("#start-btn") as HTMLButtonElement;
startBtn.addEventListener("click", startCall);