import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { envStore } from "../../store/envStore.ts";
import KeyStorePage from "../page/KeyStorePage.tsx";

function PopupApp() {
  const routes = [
    {
      path: "/keysStore",
      element: <KeyStorePage />,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ["/keysStore"],
    initialIndex: 0,
  });

  return <RouterProvider router={router} />;
}

export default PopupApp;
