import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { css } from "@emotion/css";
import { AccountChangeType } from "../../../common/transactionUtils";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { toAddressShortName } from "../../../common/stringUtils";
import { XSpace } from "../common/XSpace";
import { YSpace } from "../common/YSpace";

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
          <Box
            component={"div"}
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              ml: "50px",
            }}
          >
            <Box>
              SOL : <XSpace width={5} />{" "}
            </Box>

            <Box
              sx={{
                fontWeight: 800,
                color: accountBalanceChange.solBalance.balanceDiff.startsWith(
                  "-"
                )
                  ? "#a84032"
                  : "#32a852",
              }}
            >
              {accountBalanceChange.solBalance.balanceDiff}
            </Box>

            <Box sx={{ flexGrow: 1 }}></Box>

            <Box sx={{ display: "flex" }}>
              {" ( "} {accountBalanceChange.solBalance.beforeBalance}{" "}
              {<ArrowForwardIcon sx={{ ml: "5px", mr: "5px" }} />}{" "}
              {accountBalanceChange.solBalance.afterBalance} {" ) "}
            </Box>
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
                sx={{ display: "flex", alignItems: "center", ml: "30px" }}
              >
                {tokenLogoIcon}
                <Box sx={{ display: "inline-block", fontSize: 20 }}>
                  {accountBalanceChange.tokenBalance.token.symbol}
                </Box>
                <IconButton
                  aria-label="copy"
                  onClick={() => {
                    if (accountBalanceChange?.tokenBalance?.token.mint) {
                      navigator.clipboard.writeText(
                        accountBalanceChange.tokenBalance.token.mint
                      );
                    }
                  }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Box>
            </Tooltip>
          </div>
          {accountBalanceChange.tokenBalance.token.mint !==
            "So11111111111111111111111111111111111111112" && (
            <>
              <Box
                component={"div"}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  ml: "50px",
                }}
              >
                <Box
                  sx={{
                    fontWeight: 800,
                    color:
                      accountBalanceChange.tokenBalance.balanceDiff.startsWith(
                        "-"
                      )
                        ? "#a84032"
                        : "#32a852",
                  }}
                >
                  {accountBalanceChange.tokenBalance.balanceDiff}
                </Box>

                <Box sx={{ flexGrow: 1 }}></Box>

                <Box sx={{ display: "flex" }}>
                  {" ( "} {accountBalanceChange.tokenBalance.beforeBalance}{" "}
                  {<ArrowForwardIcon sx={{ ml: "5px", mr: "5px" }} />}{" "}
                  {accountBalanceChange.tokenBalance.afterBalance} {" ) "}
                </Box>
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
                <IconButton
                  aria-label="copy"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      accountBalanceChange.publicKey
                    );
                  }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Box>

              <YSpace height={"0.5em"} />

              {accountBalanceChange.tokenBalance?.owner &&
                accountBalanceChange.tokenBalance.owner !== walletOwner && (
                  <Tooltip title={accountBalanceChange.tokenBalance.owner}>
                    <Box>
                      Owner :
                      <XSpace width="5px" />
                      {toAddressShortName(
                        accountBalanceChange.tokenBalance.owner
                      )}
                      <IconButton
                        aria-label="copy"
                        onClick={() => {
                          if (accountBalanceChange.tokenBalance?.owner) {
                            navigator.clipboard.writeText(
                              accountBalanceChange.tokenBalance.owner
                            );
                          }
                        }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Box>
                  </Tooltip>
                )}
            </Typography>
          </Tooltip>

          <Divider />

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
