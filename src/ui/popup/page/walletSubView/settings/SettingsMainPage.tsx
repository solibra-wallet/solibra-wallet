import {
  AppBar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import RouteIcon from "@mui/icons-material/Route";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router-dom";
import { configConstants } from "../../../../../common/configConstants";

function SettingsMainPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="sticky">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="walletHome"
              sx={{ mr: 2 }}
              onClick={() => {
                navigate("/walletHome");
              }}
            >
              <HomeIcon />
            </IconButton>

            {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {currentKey?.name}
            </Typography> */}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Settings
            </Typography>

            <Box sx={{ marginRight: "16px" }} />
          </Toolbar>
        </AppBar>
      </Box>

      <List>
        <ListItem disablePadding divider={true}>
          <ListItemButton>
            <ListItemIcon sx={{ ml: "20px" }}>
              <RouteIcon />
            </ListItemIcon>
            <ListItemText primary="Cluster & RPC" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}

export default SettingsMainPage;
