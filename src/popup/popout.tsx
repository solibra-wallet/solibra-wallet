import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import { envStore } from "../store/envStore.ts";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import KeyStorePage from "./page/KeyStorePage.tsx";
import SignMessagePage from "./page/SignMessagePage.tsx";
import ConnectPage from "./page/ConnectPage.tsx";
import { useOperationStore } from "../store/operationStore.ts";
import { vanillaKeysStore } from "../store/keysStore.ts";
envStore.getState().setEnv("POPUP_SCRIPT");

function App() {
  const operation = useOperationStore((state) => state.operation);
  const [loadTimer, setLoadTimer] = useState<NodeJS.Timeout | null>(null);

  const routes = [
    {
      path: "/",
      element: <div>Loading...</div>,
    },
    {
      path: "/connect",
      element: <ConnectPage />,
    },
    {
      path: "/signMessage",
      element: <SignMessagePage />,
    },
  ];

  useEffect(() => {
    if (operation === null) {
      if (!loadTimer) {
        setLoadTimer(
          setInterval(async () => {
            console.log("reload operation store for popout...");
            await vanillaKeysStore.persist.rehydrate();
          }, 300)
        );
      }
    } else {
      if (loadTimer) {
        console.log("clear reload operation store for popout timer...");
        clearInterval(loadTimer);
        setLoadTimer(null);
      }
    }
  }, [loadTimer, operation]);

  let currentPage = "/";
  if (operation === "connect") {
    currentPage = "/connect";
  } else if (operation === "signMessage") {
    currentPage = "/signMessage";
  }

  const router = createMemoryRouter(routes, {
    initialEntries: [currentPage],
    initialIndex: 0,
  });

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
