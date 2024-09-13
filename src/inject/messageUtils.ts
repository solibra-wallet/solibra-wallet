import {
  BaseCommandType,
  CommandSource,
} from "../command/base/baseCommandType";

export function getExtensionId() {
  return document?.getElementById("solibra-extension-id")?.getAttribute("data");
}

// export async function sendMsgToBackground(msg: BaseCommandType): Promise<any> {
//   console.log("[message] send message from inject script to background");
//   const extensionId = getExtensionId();

//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage(
//       extensionId,
//       {
//         ...msg,
//         from: CommandSource.INJECT_SCRIPT,
//       },
//       (ret) => {
//         if (ret === undefined && chrome.runtime.lastError) {
//           console.error(
//             "[message] send message from inject script to background error",
//             chrome.runtime.lastError
//           );
//           return reject(chrome.runtime.lastError);
//         }
//         console.log(
//           "[message] receive reply from background at inject script",
//           ret
//         );
//         return resolve(ret);
//       }
//     );
//   });
// }

export async function sendMsgToContentScript(msg: BaseCommandType) {
  // send msg: inject script -> content script
  console.log("[message] send message from inject script to content script");
  window.postMessage({
    ...msg,
    from: CommandSource.INJECT_SCRIPT,
  });
}
