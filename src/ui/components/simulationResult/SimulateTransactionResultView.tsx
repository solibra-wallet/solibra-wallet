import { PublicKey, TransactionError } from "@solana/web3.js";
import { SimulateTransactionResult } from "../../../common/transactionUtils";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { AccountBalanceChangeView } from "./AccountBalanceChangeView";
import FaceIcon from "@mui/icons-material/Face";
import TokenIcon from "@mui/icons-material/Token";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { configConstants } from "../../../common/configConstants";

export const SimulateTransactionResultView = ({
  walletOwner,
  result,
}: {
  walletOwner: string;
  result: SimulateTransactionResult;
}) => {
  const txError: TransactionError | string | null =
    result.simulationResponse.value.err;
  const errorInfoDisplay = txError ? (
    <>
      <Typography gutterBottom variant="h5" component="div">
        Error
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {typeof txError === "string" ? txError : JSON.stringify(txError)}
      </Typography>
    </>
  ) : null;

  const resultDisplay = (
    <>
      {result.accountChanges.map((accountChange) => {
        const labels: JSX.Element[] = [];

        if (accountChange.publicKey === walletOwner) {
          labels.push(
            <Chip
              icon={<FaceIcon />}
              label="You"
              variant="outlined"
              color="primary"
            />
          );
        } else if (accountChange.tokenBalance?.owner === walletOwner) {
          labels.push(
            <Chip
              icon={<TokenIcon />}
              label="Your Token Account"
              variant="outlined"
              color="secondary"
            />
          );
        } else if (accountChange.tokenBalance?.token) {
          labels.push(
            <Chip
              icon={<TokenIcon />}
              label="Token Account"
              variant="outlined"
              color="warning"
            />
          );
        } else {
          labels.push(
            <Chip
              icon={<QuestionMarkIcon />}
              label=""
              variant="outlined"
              color="warning"
            />
          );
        }

        return (
          <Box key={accountChange.publicKey} sx={{ marginBottom: 2 }}>
            <AccountBalanceChangeView
              walletOwner={walletOwner}
              accountBalanceChange={accountChange}
              accountLabels={labels}
            />
          </Box>
        );
      })}
    </>
  );

  return (
    <Box sx={{ width: "95%" }}>
      {errorInfoDisplay}
      {resultDisplay}
    </Box>
  );
};
