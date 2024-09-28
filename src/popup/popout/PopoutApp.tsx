import { createMemoryRouter, RouterProvider } from "react-router-dom";
import ConnectPage from "../page/ConnectPage";
import LoadingOperationScreen from "../page/LoadingOperationScreen";
import SignAndSendTxPage from "../page/SignAndSendTxPage";
import SignMessagePage from "../page/SignMessagePage";
import SignTxPage from "../page/SignTxPage";

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

  return <RouterProvider router={router} />;
}

export default PopoutApp;
