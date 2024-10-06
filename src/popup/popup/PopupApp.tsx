import "./index.css";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import KeyStorePage from "../page/KeyStorePage.tsx";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

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

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default PopupApp;
