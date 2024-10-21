import { useKeysStore } from "../../../store/keysStore.ts";
import {
  generateNewKeypair,
  generateNewKeyRecord,
  generateNewViewOnlyKeyRecord,
} from "../../../store/keyRecord.ts";
import { useRef, useState } from "react";
import { configConstants } from "../../../common/configConstants.ts";
import { toAddressShortName } from "../../../common/stringUtils.ts";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  IconButton,
  List,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import FolderIcon from "@mui/icons-material/Folder";
import RestoreIcon from "@mui/icons-material/Restore";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PaidIcon from "@mui/icons-material/Paid";
import ImageIcon from "@mui/icons-material/Image";
import ListIcon from "@mui/icons-material/List";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import { useNavigate } from "react-router-dom";

function WalletViewLayout() {
  const navigate = useNavigate();
  const currentKey = useKeysStore((state) => state.currentKey);

  const [state, setState] = useState({
    subview: "tokens",
  });

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setState((prevState) => ({ ...prevState, subview: newValue }));
  };

  return (
    <Box>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="sticky">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="keysStore"
              sx={{ mr: 2 }}
              onClick={() => {
                navigate("/keysStore");
              }}
            >
              <AccountBoxIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 2 }}>
              {currentKey?.name}
            </Typography>

            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="settings"
              onClick={() => {
                navigate("/settings");
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List>Placeholder content</List>
      </Box>

      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          sx={{ minWidth: configConstants.popup.width }}
          showLabels
          value={state.subview}
          onChange={handleChange}
        >
          <BottomNavigationAction
            label="Placeholder"
            value="placeholder"
            icon={<PaidIcon />}
          />
          {/* <BottomNavigationAction
            label="Tokens"
            value="tokens"
            icon={<PaidIcon />}
          />
          <BottomNavigationAction
            label="Collectibles"
            value="collectibles"
            icon={<ImageIcon />}
          />
          <BottomNavigationAction
            label="Activities"
            value="activities"
            icon={<ListIcon />}
          /> */}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

export default WalletViewLayout;
