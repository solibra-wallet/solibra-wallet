import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import { envStore } from "../../store/envStore.ts";
import {
  createMemoryRouter,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import KeyStorePage from "../page/KeyStorePage.tsx";
import SignMessagePage from "../page/SignMessagePage.tsx";
import ConnectPage from "../page/ConnectPage.tsx";
import { useOperationStore } from "../../store/operationStore.ts";
import { vanillaKeysStore } from "../../store/keysStore.ts";
import SignAndSendTxPage from "../page/SignAndSendTxPage.tsx";
import SignTxPage from "../page/SignTxPage.tsx";
import PopoutApp from "./PopoutApp.tsx";
envStore.getState().setEnv("POPUP_SCRIPT");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PopoutApp />
  </StrictMode>
);
