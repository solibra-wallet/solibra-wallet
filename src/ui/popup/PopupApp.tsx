import "./index.css";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import KeyStorePage from "./page/KeyStorePage.tsx";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import WalletViewLayout from "./page/WalletViewLayout.tsx";
import SettingsMainPage from "./page/walletSubView/settings/SettingsMainPage.tsx";
import { Box } from "@mui/material";
import { configConstants } from "../../common/configConstants.ts";

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
    {
      path: "/walletHome",
      element: <WalletViewLayout />,
    },
    {
      path: "/settings",
      element: <SettingsMainPage />,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ["/walletHome"],
    initialIndex: 0,
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          width: configConstants.popup.width,
          height: configConstants.popup.height,
          wordWrap: "break-word",
        }}
      >
        <RouterProvider router={router} />
      </Box>
    </ThemeProvider>
  );
}

export default PopupApp;
