import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { vanillaKeysStore } from "../../../store/keysStore";
import { OperationRecord, useOperationStore } from "../../../store/operationStore";

function LoadingOperationScreen({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const operationRequestId = searchParams.get("requestId");
  const getOperationRecord = useOperationStore((state) => state.getOperationRecord);
  const operationRecord :  OperationRecord | null = operationRequestId ? getOperationRecord(operationRequestId, Date.now()) : null;

  const operation = operationRecord?.operation;
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
    currentPage = `/connect?requestId=${operationRequestId}`;
  } else if (operation === "signMessage") {
    currentPage = `/signMessage?requestId=${operationRequestId}`;
  } else if (operation === "signAndSendTx") {
    currentPage = `/signAndSendTx?requestId=${operationRequestId}`;
  } else if (operation === "signTx") {
    currentPage = `/signTx?requestId=${operationRequestId}`;
  }

  useEffect(() => {
    if (currentPage && currentPage !== "/") {
      navigate(currentPage);
    }
  }, [currentPage, navigate]);

  return <div className="App">{children}</div>;
}

export default LoadingOperationScreen;
