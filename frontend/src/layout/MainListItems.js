import React, { useContext, useEffect, useReducer, useState, useRef } from "react";
import { Link as RouterLink, useLocation, useHistory, useParams } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useHelps from "../hooks/useHelps";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Collapse from "@material-ui/core/Collapse";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
//newicons
import { HomeTrendUp, Whatsapp, Flash, Kanban, People, Tag, Calendar, MessageFavorite, Task, CalendarEdit, VolumeHigh, VolumeUp, Profile2User, Setting2, HierarchySquare3, Messages1, Information, CodeCircle, UserAdd, ArrowSquare, KeyboardOpen, Hierarchy, ArrowSwapHorizontal, Brodcast, Paperclip, MoneySend, Setting, Buliding } from "iconsax-react";


import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import Schedule from "@material-ui/icons/Schedule";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import BusinessIcon from "@material-ui/icons/Business";
import {
  AllInclusive,
  AttachFile,
  Dashboard,
  Description,
  DeviceHubOutlined,
  GridOn,
  ListAlt,
  PhonelinkSetup,
} from "@material-ui/icons";

import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { useActiveMenu } from "../context/ActiveMenuContext";
import { TicketsContext } from "../context/Tickets/TicketsContext";

import { Can } from "../components/Can";

import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";
import { i18n } from "../translate/i18n";
import { Campaign, ShapeLine, Webhook } from "@mui/icons-material";

const useStyles = makeStyles((theme) => ({
  listItem: {
    height: "48px",
    width: "auto",
    borderRadius: "12px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    }
  },
  listSubheader: {
    color: "#25b6e8",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "24px 16px 8px 16px",
    backgroundColor: "transparent",
  },
  listItemText: {
    fontSize: "14px",
    fontWeight: 500,
    color: theme.mode === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.7)",
    fontFamily: "Inter, sans-serif",
    transition: "all 0.2s",
    "&:hover": {
      color: "#fff",
    }
  },
  iconHoverActive: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "12px",
    height: 36,
    width: 36,
    transition: "all 0.2s ease",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    color: "rgba(255, 255, 255, 0.7)",
    "&:hover, &.active": {
      backgroundColor: "#25b6e8",
      color: "#fff",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(37, 182, 232, 0.2)",
    },
    "& svg": {
      fontSize: "1.3rem",
      transition: "all 0.2s",
    }
  },
  collapseContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    margin: "0 8px",
    borderRadius: "12px",
    overflow: "hidden",
  },
  badge: {
    "& .MuiBadge-badge": {
      backgroundColor: "#ef5350",
      color: "#fff",
      boxShadow: "0 0 0 2px rgb(9, 11, 17)",
      "&::after": {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        animation: "$ripple 1.2s infinite ease-in-out",
        border: "1px solid #ef5350",
        content: '""',
      },
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
  menuContainer: {
    background: "linear-gradient(180deg, rgb(71, 76, 79) 0%, rgb(9, 11, 17) 100%)",
    height: "100%",
    position: "relative",
    overflowX: "hidden",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    }
  },
  expandIcon: {
    color: "rgba(255, 255, 255, 0.7)",
    transition: "all 0.2s",
    "&.open": {
      transform: "rotate(180deg)",
      color: "#25b6e8",
    }
  },
  submenuItem: {
    paddingLeft: theme.spacing(2),
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    }
  },
  versionText: {
    fontSize: "12px",
    padding: "16px",
    textAlign: "center",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: "0.5px",
  }
}));

function ListItemLink(props) {
  const { icon, primary, to, tooltip, showBadge } = props;
  const classes = useStyles();
  const { activeMenu } = useActiveMenu();
  const location = useLocation();
  const isActive = activeMenu === to || location.pathname === to;

  const renderLink = React.useMemo(
    () => React.forwardRef((itemProps, ref) => <RouterLink to={to} ref={ref} {...itemProps} />),
    [to]
  );

  const ConditionalTooltip = ({ children, tooltipEnabled }) =>
    tooltipEnabled ? (
      <Tooltip title={primary} placement="right">
        {children}
      </Tooltip>
    ) : (
      children
    );

  return (
    <ConditionalTooltip tooltipEnabled={!!tooltip}>
      <li>
        <ListItem button component={renderLink} className={classes.listItem}>
          {icon ? (
            <ListItemIcon>
              {showBadge ? (
                <Badge badgeContent="!" color="error" overlap="circular" className={classes.badge}>
                  <Avatar className={`${classes.iconHoverActive} ${isActive ? "active" : ""}`}>{icon}</Avatar>
                </Badge>
              ) : (
                <Avatar className={`${classes.iconHoverActive} ${isActive ? "active" : ""}`}>{icon}</Avatar>
              )}
            </ListItemIcon>
          ) : null}
          <ListItemText primary={<Typography className={classes.listItemText}>{primary}</Typography>} />
        </ListItem>
      </li>
    </ConditionalTooltip>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = ({ collapsed, drawerClose }) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const { whatsApps } = useContext(WhatsAppsContext);
  const { tickets } = useContext(TicketsContext);
  const { companyId } = useParams();
  const isMountedRef = useRef(true);
  const { setActiveMenu } = useActiveMenu();
  const location = useLocation();

  // Cleanup quando componente é desmontado
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [chats, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [invisible, setInvisible] = useState(false);
  const [openDashboardSubmenu, setOpenDashboardSubmenu] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openFlowSubmenu, setOpenFlowSubmenu] = useState(false);
  const [managementHover, setManagementHover] = useState(false);
  const [campaignHover, setCampaignHover] = useState(false);
  const [flowHover, setFlowHover] = useState(false);
  const [isManagementActive, setIsManagementActive] = useState(false);
  const [version, setVersion] = useState("");
  const [hasHelps, setHasHelps] = useState(false);

  const { list } = useHelps();

  useEffect(() => {
    async function checkHelps() {
      const helps = await list();
      setHasHelps(helps.length > 0);
    }
    checkHelps();
  }, []);

  const isManagementActiveRoute =
    location.pathname === "/" || location.pathname.startsWith("/reports") || location.pathname.startsWith("/moments");

  const isCampaignRouteActive =
    location.pathname === "/campaigns" ||
    location.pathname.startsWith("/contact-lists") ||
    location.pathname.startsWith("/campaigns-config");

  const isFlowbuilderRouteActive = 
    location.pathname.startsWith("/phrase-lists") ||
    location.pathname.startsWith("/flowbuilders");

  useEffect(() => {
    if (location.pathname.startsWith("/tickets")) {
      setActiveMenu("/tickets");
    } else {
      setActiveMenu("");
    }
  }, [location, setActiveMenu]);

  const { getPlanCompany } = usePlans();

  const { getVersion } = useVersion();

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    async function fetchVersion() {
      try {
        const _version = await getVersion();
        if (isMountedRef.current) {
          setVersion(_version.version);
        }
      } catch (error) {
        console.error("Erro ao buscar versão:", error);
      }
    }
    fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    async function fetchData() {
      try {
        const companyId = user.companyId;
        const planConfigs = await getPlanCompany(undefined, companyId);

        if (isMountedRef.current) {
          setShowCampaigns(planConfigs.plan.useCampaigns);
          setShowKanban(planConfigs.plan.useKanban);
          setShowOpenAi(planConfigs.plan.useOpenAi);
          setShowIntegrations(planConfigs.plan.useIntegrations);
          setShowSchedules(planConfigs.plan.useSchedules);
          setShowInternalChat(planConfigs.plan.useInternalChat);
          setShowExternalApi(planConfigs.plan.useExternalApi);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações do plano:", error);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (!user?.id || !socket || !isMountedRef.current) return;
    
    // Verificar se o socket é válido
    if (typeof socket.on !== 'function') {
      console.error('Socket inválido no MainListItems');
      return;
    }
    
    const companyId = user.companyId;
    //    const socket = socketManager.GetSocket();
    // console.log('socket nListItems')
    const onCompanyChatMainListItems = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    };

    socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems);
    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off(`company-${companyId}-chat`, onCompanyChatMainListItems);
      }
    };
  }, [socket, user?.id]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  // useEffect(() => {
  //   if (localStorage.getItem("cshow")) {
  //     setShowCampaigns(true);
  //   }
  // }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      if (isMountedRef.current) {
        dispatch({ type: "LOAD_CHATS", payload: data.records });
      }
    } catch (err) {
      if (isMountedRef.current) {
        toastError(err);
      }
    }
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={
          (user.profile === "user" && user.showDashboard === "enabled") || user.allowRealTime === "enabled"
            ? "admin"
            : user.profile
        }
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <Tooltip title={collapsed ? i18n.t("mainDrawer.listItems.management") : ""} placement="right">
              <ListItem
                dense
                button
                onClick={() => setOpenDashboardSubmenu((prev) => !prev)}
                onMouseEnter={() => setManagementHover(true)}
                onMouseLeave={() => setManagementHover(false)}
              >
                <ListItemIcon>
                  <Avatar
                    className={`${classes.iconHoverActive} ${isManagementActiveRoute || managementHover ? "active" : ""}`}
                  >
                    <HomeTrendUp />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography className={classes.listItemText}>
                      {i18n.t("mainDrawer.listItems.management")}
                    </Typography>
                  }
                />
                {openDashboardSubmenu ? <ExpandLessIcon style={{ color: "#25b6e8" }} /> : <ExpandMoreIcon style={{ color: "#25b6e8" }} />}
              </ListItem>
            </Tooltip>
            <Collapse
              in={openDashboardSubmenu}
              timeout="auto"
              unmountOnExit
              style={{
                backgroundColor: theme.mode === "light" ? "rgba(120,120,120,0.1)" : "rgba(120,120,120,0.5)",
              }}
            >
              <Can
                role={user.profile === "user" && user.showDashboard === "enabled" ? "admin" : user.profile}
                perform={"drawer-admin-items:view"}
                yes={() => (
                  <>
                    <ListItemLink
                      small
                      to="/"
                      primary="Dashboard"
                      icon={<DashboardOutlinedIcon />}
                      tooltip={collapsed}
                    />
                    {/* <ListItemLink
                      small
                      to="/reports"
                      primary={i18n.t("mainDrawer.listItems.reports")}
                      icon={<Description />}
                      tooltip={collapsed}
                    /> */}
                  </>
                )}
              />
              {/* <Can
                role={user.profile === "user" && user.allowRealTime === "enabled" ? "admin" : user.profile}
                perform={"drawer-admin-items:view"}
                yes={() => (
                  <ListItemLink
                    to="/moments"
                    primary={i18n.t("mainDrawer.listItems.chatsTempoReal")}
                    icon={<GridOn />}
                    tooltip={collapsed}
                  />
                )}
              /> */}
            </Collapse>
          </>
        )}
      />
      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<Whatsapp />}
        tooltip={collapsed}
      />

      <ListItemLink
        to="/quick-messages"
        primary={i18n.t("mainDrawer.listItems.quickMessages")}
        icon={<Flash />}
        tooltip={collapsed}
      />

      {showKanban && (
        <>
          <ListItemLink
            to="/kanban"
            primary={i18n.t("mainDrawer.listItems.kanban")}
            icon={<Kanban />}
            tooltip={collapsed}
          />
        </>
      )}

      <ListItemLink
        to="/contacts"
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={<UserAdd />}
        tooltip={collapsed}
      />

      {showSchedules && (
        <>
          <ListItemLink
            to="/schedules"
            primary={i18n.t("mainDrawer.listItems.schedules")}
            icon={<Calendar />}
            tooltip={collapsed}
          />
        </>
      )}

      <ListItemLink
        to="/tags"
        primary={i18n.t("mainDrawer.listItems.tags")}
        icon={<Tag />}
        tooltip={collapsed}
      />

      {showInternalChat && (
        <>
          <ListItemLink
            to="/chats"
            primary={i18n.t("mainDrawer.listItems.chats")}
            icon={
              <Badge color="secondary" variant="dot" invisible={invisible}>
                <MessageFavorite />
              </Badge>
            }
            tooltip={collapsed}
          />
        </>
      )}

      <ListItemLink
        to="/todolist"
        primary={i18n.t("Tarefas")}
        icon={<Task />}
      />
      {hasHelps && (
        <ListItemLink
          to="/helps"
          primary={i18n.t("mainDrawer.listItems.helps")}
          icon={<CalendarEdit />}
          tooltip={collapsed}
        />
      )}
      <Can
        role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
        perform="dashboard:view"
        yes={() => (
          <>
          {!collapsed && (
            <ListSubheader className={classes.listSubheader} inset disableSticky={true}>{i18n.t("mainDrawer.listItems.administration")}</ListSubheader>
          )}
            {showCampaigns && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <>
                    <Tooltip title={collapsed ? i18n.t("mainDrawer.listItems.campaigns") : ""} placement="right">
                      <ListItem
                        dense
                        button
                        onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                        onMouseEnter={() => setCampaignHover(true)}
                        onMouseLeave={() => setCampaignHover(false)}
                      >
                        <ListItemIcon>
                          <Avatar
                            className={`${classes.iconHoverActive} ${isCampaignRouteActive || campaignHover ? "active" : ""
                              }`}
                          >
                            <VolumeHigh />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography className={classes.listItemText}>
                              {i18n.t("mainDrawer.listItems.campaigns")}
                            </Typography>
                          }
                        />
                        {openCampaignSubmenu ? <ExpandLessIcon style={{ color: "#25b6e8" }} /> : <ExpandMoreIcon style={{ color: "#25b6e8" }} />}
                      </ListItem>
                    </Tooltip>
                    <Collapse
                      in={openCampaignSubmenu}
                      timeout="auto"
                      unmountOnExit
                      style={{
                        backgroundColor: theme.mode === "light" ? "rgba(120,120,120,0.1)" : "rgba(120,120,120,0.5)",
                      }}
                    >
                      <List dense component="div" disablePadding>
                        <ListItemLink
                          to="/campaigns"
                          primary={i18n.t("campaigns.subMenus.list")}
                          icon={<VolumeUp />}
                          tooltip={collapsed}
                        />
                        <ListItemLink
                          to="/contact-lists"
                          primary={i18n.t("campaigns.subMenus.listContacts")}
                          icon={<Profile2User />}
                          tooltip={collapsed}
                        />
                        <ListItemLink
                          to="/campaigns-config"
                          primary={i18n.t("campaigns.subMenus.settings")}
                          icon={<Setting2 />}
                          tooltip={collapsed}
                        />
                      </List>
                    </Collapse>
                  </>
                )}
              />
            )}

            {/* FLOWBUILDER */}
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <>
                  <Tooltip title={collapsed ? i18n.t("mainDrawer.listItems.campaigns") : ""} placement="right">
                    <ListItem
                      dense
                      button
                      onClick={() => setOpenFlowSubmenu((prev) => !prev)}
                      onMouseEnter={() => setFlowHover(true)}
                      onMouseLeave={() => setFlowHover(false)}
                    >
                      <ListItemIcon>
                        <Avatar
                          className={`${classes.iconHoverActive} ${isFlowbuilderRouteActive || flowHover ? "active" : ""
                            }`}
                        >
                          <HierarchySquare3 />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography className={classes.listItemText}>
                            {i18n.t("Construtor de fluxos")}
                          </Typography>
                        }
                      />
                      {openFlowSubmenu ? <ExpandLessIcon style={{ color: "#25b6e8" }} /> : <ExpandMoreIcon style={{ color: "#25b6e8" }} />}
                    </ListItem>
                  </Tooltip>

                  <Collapse
                    in={openFlowSubmenu}
                    timeout="auto"
                    unmountOnExit
                    style={{
                      backgroundColor: theme.mode === "light" ? "rgba(120,120,120,0.1)" : "rgba(120,120,120,0.5)",
                    }}
                  >
                    <List dense component="div" disablePadding>
                      <ListItemLink
                        to="/phrase-lists"
                        primary={"Fluxo de Campanha"}
                        icon={<VolumeHigh />}
                        tooltip={collapsed}
                      />

                      <ListItemLink
                        to="/flowbuilders"
                        primary={'Fluxo de conversa'}
                        icon={<Messages1 />}
                      />
                    </List>
                  </Collapse>
                </>
              )}
            />


            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={<Information />}
                tooltip={collapsed}
              />
            )}

            {showExternalApi && (
              <>
                <Can
                  role={user.profile}
                  perform="dashboard:view"
                  yes={() => (
                    <ListItemLink
                      to="/messages-api"
                      primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                      icon={<CodeCircle />}
                      tooltip={collapsed}
                    />
                  )}
                />
              </>
            )}
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/users"
                  primary={i18n.t("mainDrawer.listItems.users")}
                  icon={<People />}
                  tooltip={collapsed}
                />
              )}
            />
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/queues"
                  primary={i18n.t("mainDrawer.listItems.queues")}
                  icon={<ArrowSquare />}
                  tooltip={collapsed}
                />
              )}
            />

            {showOpenAi && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ListItemLink
                    to="/prompts"
                    primary={i18n.t("mainDrawer.listItems.prompts")}
                    icon={<KeyboardOpen />}
                    tooltip={collapsed}
                  />
                )}
              />
            )}

            {showIntegrations && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ListItemLink
                    to="/queue-integration"
                    primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                    icon={<Hierarchy />}
                    tooltip={collapsed}
                  />
                )}
              />
            )}
            <Can
              role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
              perform={"drawer-admin-items:view"}
              yes={() => (
                <ListItemLink
                  to="/connections"
                  primary={i18n.t("mainDrawer.listItems.connections")}
                  icon={<ArrowSwapHorizontal />}
                  showBadge={connectionWarning}
                  tooltip={collapsed}
                />
              )}
            />
            {user.super && (
              <ListItemLink
                to="/allConnections"
                primary={i18n.t("mainDrawer.listItems.allConnections")}
                icon={<Brodcast />}
                tooltip={collapsed}
              />
            )}
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/files"
                  primary={i18n.t("mainDrawer.listItems.files")}
                  icon={<Paperclip />}
                  tooltip={collapsed}
                />
              )}
            />
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/financeiro"
                  primary={i18n.t("mainDrawer.listItems.financeiro")}
                  icon={<MoneySend />}
                  tooltip={collapsed}
                />
              )}
            />
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/settings"
                  primary={i18n.t("mainDrawer.listItems.settings")}
                  icon={<Setting />}
                  tooltip={collapsed}
                />
              )}
            />
            {/* {user.super && (
              <ListSubheader inset>
                {i18n.t("mainDrawer.listItems.administration")}
              </ListSubheader>
            )} */}

            {user.super && (
              <ListItemLink
                to="/companies"
                primary={i18n.t("mainDrawer.listItems.companies")}
                icon={<Buliding />}
                tooltip={collapsed}
              />
            )}

          </>

        )}
      />
      {!collapsed && (
        <React.Fragment>
          <Divider />
          {/* 
              // IMAGEM NO MENU
              <Hidden only={['sm', 'xs']}>
                <img style={{ width: "100%", padding: "10px" }} src={logo} alt="image" />            
              </Hidden> 
              */}
          <Typography
            style={{
              fontSize: "12px",
              padding: "10px",
              textAlign: "center",
              fontWeight: "bold",
              color: "#898989",
            }}
          >
            Versão {`${version}`}
          </Typography>
        </React.Fragment>
      )}
    </div>
  );
};

export default MainListItems;
