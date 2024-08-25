import { initialize } from "../wallet-standard/initialize";
import { SolibraWallet } from "./solibra-wallet";
import { sendMsgToBackground, sendMsgToContentScript } from "./message-utils";

console.log("injected script loaded");

// prepare btn for test send message to background
const btnBg = document.createElement("button");
btnBg.style.position = "fixed";
btnBg.style.top = "0";
btnBg.style.left = "0";
btnBg.innerText = "send msg to background";
btnBg.addEventListener("click", () => {
  sendMsgToBackground({
    msg: "ping-ping from injected script",
    from: "injected-script",
  });
});
document.body.appendChild(btnBg);

// prepare btn for test send message to content script
const btnCt = document.createElement("button");
btnCt.style.position = "fixed";
btnCt.style.top = "50px";
btnCt.style.left = "0";
btnCt.innerText = "send msg to content script";
btnCt.addEventListener("click", () => {
  sendMsgToContentScript({
    msg: "ping-ping from injected script",
    from: "injected-script",
  });
});
document.body.appendChild(btnCt);

const solibraWallet = new SolibraWallet();
initialize(solibraWallet);
