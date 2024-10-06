import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { envStore } from "../../store/envStore.ts";
import PopupApp from "./PopupApp.tsx";

envStore.getState().setEnv("POPUP_SCRIPT");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>
);
