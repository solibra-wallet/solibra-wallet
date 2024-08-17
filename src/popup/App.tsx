import './App.css'
import {
  RouterProvider,
  createMemoryRouter,
} from "react-router-dom";
import KeyStorePage from './page/KeyStorePage';


function App() {
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
    <RouterProvider router={router} />
  )
}

export default App
