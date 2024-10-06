import { createMemoryRouter, RouterProvider } from "react-router-dom";
import ConnectPage from "../page/ConnectPage";
import LoadingOperationScreen from "../page/LoadingOperationScreen";
import SignAndSendTxPage from "../page/SignAndSendTxPage";
import SignMessagePage from "../page/SignMessagePage";
import SignTxPage from "../page/SignTxPage";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function PopoutApp() {
  const routes = [
    {
      path: "/",
      element: <LoadingOperationScreen>Loading...</LoadingOperationScreen>,
    },
    {
      path: "/connect",
      element: <ConnectPage />,
    },
    {
      path: "/signMessage",
      element: <SignMessagePage />,
    },
    {
      path: "/signAndSendTx",
      element: <SignAndSendTxPage />,
    },
    {
      path: "/signTx",
      element: <SignTxPage />,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ["/"],
    initialIndex: 0,
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default PopoutApp;
