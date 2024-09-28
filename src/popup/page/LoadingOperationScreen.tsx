import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { vanillaKeysStore } from "../../store/keysStore";
import { useOperationStore } from "../../store/operationStore";

function LoadingOperationScreen({ children }: { children: React.ReactNode }) {
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
    return () => {
      if (loadTimer) {
        console.log("clear reload operation store for popout timer...");
        clearInterval(loadTimer);
        setLoadTimer(null);
      }
    };
  }, [loadTimer, operation]);

  console.log("operation", operation);
  let currentPage = "/";
  if (operation === "connect") {
    currentPage = "/connect";
  } else if (operation === "signMessage") {
    currentPage = "/signMessage";
  } else if (operation === "signAndSendTx") {
    currentPage = "/signAndSendTx";
  } else if (operation === "signTx") {
    currentPage = "/signTx";
  }

  useEffect(() => {
    if (currentPage && currentPage !== "/") {
      navigate(currentPage);
    }
  }, [currentPage, navigate]);

  return <div className="App">{children}</div>;
}

export default LoadingOperationScreen;
