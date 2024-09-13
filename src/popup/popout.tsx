import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import { envStore } from "../store/envStore.ts";
import {
  createMemoryRouter,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import KeyStorePage from "./page/KeyStorePage.tsx";
import SignMessagePage from "./page/SignMessagePage.tsx";
import ConnectPage from "./page/ConnectPage.tsx";
import { useOperationStore } from "../store/operationStore.ts";
import { vanillaKeysStore } from "../store/keysStore.ts";
envStore.getState().setEnv("POPUP_SCRIPT");

function App({ children }: { children: React.ReactNode }) {
  const operation = useOperationStore((state) => state.operation);
  const [loadTimer, setLoadTimer] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (operation === null) {
      if (!loadTimer) {
        setLoadTimer(
          setInterval(async () => {
            console.log("reload operation store for popout...");
            await vanillaKeysStore.persist.rehydrate();
          }, 1000)
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

  console.log("operation", operation);
  let currentPage = "/";
  if (operation === "connect") {
    currentPage = "/connect";
  } else if (operation === "signMessage") {
    currentPage = "/signMessage";
  }

  useEffect(() => {
    if (currentPage && currentPage !== "/") {
      navigate(currentPage);
    }
  }, [currentPage, navigate]);

  return <div className="App">{children}</div>;
}

function RoutedApp() {
  const routes = [
    {
      path: "/",
      element: <App>Loading...</App>,
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

  const router = createMemoryRouter(routes, {
    initialEntries: ["/"],
    initialIndex: 0,
  });

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RoutedApp />
  </StrictMode>
);
