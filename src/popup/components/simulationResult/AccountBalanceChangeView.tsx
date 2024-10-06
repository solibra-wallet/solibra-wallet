import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { css } from "@emotion/css";
import { AccountChangeType } from "../../../common/transactionUtils";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { toAddressShortName } from "../../../common/stringUtils";
import { XSpace } from "../common/XSpace";

export const AccountBalanceChangeView = ({
  walletOwner,
  accountBalanceChange,
  accountLabels,
}: {
  walletOwner: string;
  accountBalanceChange: AccountChangeType;
  accountLabels: JSX.Element[];
}) => {
  let solBalanceChangeView = null;

  if (accountBalanceChange.solBalance) {
    solBalanceChangeView = (
      <>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "left" }}
        >
          <div>SOL change: {accountBalanceChange.solBalance.balanceDiff}</div>
          <Box component={"div"} sx={{ display: "flex", alignItems: "center" }}>
            {accountBalanceChange.solBalance.beforeBalance}{" "}
            {<ArrowForwardIcon />}{" "}
            {accountBalanceChange.solBalance.afterBalance}
          </Box>
        </Typography>
      </>
    );
  }

  let tokenBalanceChangeView = null;
  if (accountBalanceChange.tokenBalance) {
    let tokenLogoIcon = null;
    if (accountBalanceChange.tokenBalance.token.logoURI) {
      tokenLogoIcon = (
        <Box
          sx={{
            display: "inline-block",
            width: "24px",
            height: "24px",
            marginRight: "1em",
          }}
        >
          <img
            className={css`
              object-fit: contain;
              max-width: 100%;
            `}
            src={accountBalanceChange.tokenBalance.token.logoURI}
            alt="Token logo"
          />
        </Box>
      );
    }

    tokenBalanceChangeView = (
      <>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "left" }}
        >
          <div>
            <Tooltip title={accountBalanceChange.tokenBalance.token.mint}>
              <Box
                component={"div"}
                sx={{ display: "flex", alignItems: "center" }}
              >
                {tokenLogoIcon}
                <Box sx={{ display: "inline-block", fontSize: 20 }}>
                  {accountBalanceChange.tokenBalance.token.symbol}
                </Box>
              </Box>
            </Tooltip>
          </div>
          {accountBalanceChange.tokenBalance.token.mint !==
            "So11111111111111111111111111111111111111112" && (
            <>
              <div>
                Token change: {accountBalanceChange.tokenBalance.balanceDiff}
              </div>
              <Box
                component={"div"}
                sx={{ display: "flex", alignItems: "center" }}
              >
                {accountBalanceChange.tokenBalance.beforeBalance}{" "}
                {<ArrowForwardIcon />}{" "}
                {accountBalanceChange.tokenBalance.afterBalance}
              </Box>
            </>
          )}
        </Typography>
      </>
    );
  }

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Tooltip title={accountBalanceChange.publicKey}>
            <Typography
              gutterBottom
              variant="body1"
              component="div"
              sx={{ textAlign: "left" }}
            >
              <Box>
                {accountLabels}
                <XSpace width={"1em"} />
                {toAddressShortName(accountBalanceChange.publicKey)}
              </Box>

              {accountBalanceChange.tokenBalance?.owner &&
                accountBalanceChange.tokenBalance.owner !== walletOwner && (
                  <Tooltip title={accountBalanceChange.tokenBalance.owner}>
                    <Box>
                      Owner:
                      <XSpace width="2em" />
                      {toAddressShortName(
                        accountBalanceChange.tokenBalance.owner
                      )}
                    </Box>
                  </Tooltip>
                )}
            </Typography>
          </Tooltip>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", textAlign: "left" }}
          >
            {tokenBalanceChangeView}
            {solBalanceChangeView && tokenBalanceChangeView && <Divider />}
            {solBalanceChangeView}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
};
