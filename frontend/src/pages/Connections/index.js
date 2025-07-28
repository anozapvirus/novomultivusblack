import React, { useState, useCallback, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { add, format, parseISO } from "date-fns";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
  Button,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Table,
  TableHead,
  Paper,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Grid
} from "@material-ui/core";
import {
  Edit,
  CheckCircle,
  SignalCellularConnectedNoInternet2Bar,
  SignalCellularConnectedNoInternet0Bar,
  SignalCellular4Bar,
  CropFree,
  DeleteOutline,
  Facebook,
  Instagram,
  WhatsApp,
  AddCircleOutline,
  CloudDownload,
  Schedule,
  Info
} from "@material-ui/icons";

import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import ImportMessagesModal from "../../components/ImportMessagesModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import formatSerializedId from '../../utils/formatSerializedId';
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ForbiddenPage from "../../components/ForbiddenPage";
import { Can } from "../../components/Can";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
    overflow: "auto",
    maxHeight: "calc(100vh - 180px)",
    ...theme.scrollbarStyles,
  },
  searchContainer: {
    backgroundColor: "white",
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    overflow: "auto",
    maxHeight: "calc(100vh - 220px)",
    ...theme.scrollbarStyles,
  },
  customTable: {
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: "#333",
      borderBottom: "2px solid #f5f5f5",
    },
    "& .MuiTableCell-body": {
      borderBottom: "1px solid #f5f5f5",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#f9f9f9",
    },
  },
  actionButtons: {
    backgroundColor: "#25b6e8",
    color: "white",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  iconButton: {
    padding: theme.spacing(1),
    backgroundColor: "#f5f5f5",
    marginLeft: theme.spacing(1),
    "&.edit": {
      color: "#25b6e8",
    },
    "&.delete": {
      color: "#E57373",
    },
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: theme.typography.pxToRem(14),
    border: "1px solid #dadde9",
    maxWidth: 450,
  },
  tooltipPopper: {
    textAlign: "center",
  },
  buttonProgress: {
    color: green[500],
  },
  statusCard: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
}));

function CircularProgressWithLabel(props) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" {...props} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="caption"
          component="div"
          color="textSecondary"
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const CustomToolTip = ({ title, content, children }) => {
  const classes = useStyles();

  return (
    <Tooltip
      arrow
      classes={{
        tooltip: classes.tooltip,
        popper: classes.tooltipPopper,
      }}
      title={
        <React.Fragment>
          <Typography gutterBottom color="inherit">
            {title}
          </Typography>
          {content && <Typography>{content}</Typography>}
        </React.Fragment>
      }
    >
      {children}
    </Tooltip>
  );
};

const IconChannel = (channel) => {
  switch (channel) {
    case "facebook":
      return <Facebook style={{ color: "#3b5998" }} />;
    case "instagram":
      return <Instagram style={{ color: "#e1306c" }} />;
    case "whatsapp":
      return <WhatsApp style={{ color: "#25d366" }} />;
    default:
      return "error";
  }
};
const Connections = () => {
  const classes = useStyles();
  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [statusImport, setStatusImport] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const history = useHistory();
  const confirmationModalInitialState = {
    action: "",
    title: "",
    message: "",
    whatsAppId: "",
    open: false,
  };
  const [confirmModalInfo, setConfirmModalInfo] = useState(confirmationModalInitialState);
  const [planConfig, setPlanConfig] = useState(false);
  const { user, socket } = useContext(AuthContext);
  const companyId = user.companyId;
  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const planConfigs = await getPlanCompany(undefined, companyId);
      setPlanConfig(planConfigs)
    }
    fetchData();
  }, []);

  useEffect(() => {
    socket.on(`importMessages-${user.companyId}`, (data) => {
      if (data.action === "refresh") {
        setStatusImport([]);
        history.go(0);
      }
      if (data.action === "update") {
        setStatusImport(data.status);
      }
    });
  }, [whatsApps, user.companyId, socket, history]);

  const handleStartWhatsAppSession = async (whatsAppId) => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleRequestNewQrCode = async (whatsAppId) => {
    try {
      await api.put(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenWhatsAppModal = () => {
    setSelectedWhatsApp(null);
    setWhatsAppModalOpen(true);
  };

  const handleCloseWhatsAppModal = useCallback(() => {
    setWhatsAppModalOpen(false);
    setSelectedWhatsApp(null);
  }, [setSelectedWhatsApp, setWhatsAppModalOpen]);

  const handleOpenQrModal = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, [setQrModalOpen, setSelectedWhatsApp]);

  const handleEditWhatsApp = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setWhatsAppModalOpen(true);
  };

  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenConfirmationModal = (action, whatsAppId) => {
    if (action === "disconnect") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.disconnectTitle"),
        message: i18n.t("connections.confirmationModal.disconnectMessage"),
        whatsAppId: whatsAppId,
      });
    }

    if (action === "delete") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.deleteTitle"),
        message: i18n.t("connections.confirmationModal.deleteMessage"),
        whatsAppId: whatsAppId,
      });
    }
    if (action === "closedImported") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.closedImportedTitle"),
        message: i18n.t("connections.confirmationModal.closedImportedMessage"),
        whatsAppId: whatsAppId,
      });
    }
    setConfirmModalOpen(true);
  };

  const handleSubmitConfirmationModal = async () => {
    if (confirmModalInfo.action === "disconnect") {
      try {
        await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
      } catch (err) {
        toastError(err);
      }
    }

    if (confirmModalInfo.action === "delete") {
      try {
        await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.deleted"));
      } catch (err) {
        toastError(err);
      }
    }
    if (confirmModalInfo.action === "closedImported") {
      try {
        await api.post(`/closedimported/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.closedimported"));
      } catch (err) {
        toastError(err);
      }
    }

    setConfirmModalInfo(confirmationModalInitialState);
  };

  const renderImportButton = (whatsApp) => {
    if (whatsApp?.statusImportMessages === "renderButtonCloseTickets") {
      return (
        <Button
          style={{ marginLeft: 12 }}
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => {
            handleOpenConfirmationModal("closedImported", whatsApp.id);
          }}
        >
          {i18n.t("connections.buttons.closedImported")}
        </Button>
      );
    }

    if (whatsApp?.importOldMessages) {
      let isTimeStamp = !isNaN(
        new Date(Math.floor(whatsApp?.statusImportMessages)).getTime()
      );

      if (isTimeStamp) {
        const ultimoStatus = new Date(
          Math.floor(whatsApp?.statusImportMessages)
        ).getTime();
        const dataLimite = +add(ultimoStatus, { seconds: +35 }).getTime();
        if (dataLimite > new Date().getTime()) {
          return (
              <Button
                disabled
                style={{ marginLeft: 12 }}
                size="small"
                endIcon={
                  <CircularProgress
                    size={12}
                    className={classes.buttonProgress}
                  />
                }
                variant="outlined"
                color="primary"
              >
                {i18n.t("connections.buttons.preparing")}
              </Button>
          );
        }
      }
    }

    // Botão de importação melhorado
    if (whatsApp?.status === "CONNECTED") {
      return (
        <Button
          style={{ marginLeft: 12 }}
          size="small"
          variant="contained"
          color="primary"
          startIcon={<CloudDownload />}
          onClick={() => {
            setSelectedWhatsApp(whatsApp);
            setImportModalOpen(true);
          }}
        >
          Importar Mensagens
        </Button>
      );
    }

    return null;
  };

  const renderActionButtons = (whatsApp) => {
    return (
      <>
        {whatsApp.status === "qrcode" && (
          <Can
            role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
            perform="connections-page:addConnection"
            yes={() => (
              <Button
                size="small"
                variant="contained"
                className={classes.actionButtons}
                onClick={() => handleOpenQrModal(whatsApp)}
              >
                {i18n.t("connections.buttons.qrcode")}
              </Button>
            )}
          />
        )}
        {whatsApp.status === "DISCONNECTED" && (
          <Can
            role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
            perform="connections-page:addConnection"
            yes={() => (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  className={classes.actionButtons}
                  style={{ marginRight: 8 }}
                  onClick={() => handleStartWhatsAppSession(whatsApp.id)}
                >
                  {i18n.t("connections.buttons.tryAgain")}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  className={classes.actionButtons}
                  onClick={() => handleRequestNewQrCode(whatsApp.id)}
                >
                  {i18n.t("connections.buttons.newQr")}
                </Button>
              </>
            )}
          />
        )}
        {(whatsApp.status === "CONNECTED" ||
          whatsApp.status === "PAIRING" ||
          whatsApp.status === "TIMEOUT") && (
            <Can
              role={user.profile}
              perform="connections-page:addConnection"
              yes={() => (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    className={classes.actionButtons}
                    onClick={() => {
                      handleOpenConfirmationModal("disconnect", whatsApp.id);
                    }}
                  >
                    {i18n.t("connections.buttons.disconnect")}
                  </Button>
                  {renderImportButton(whatsApp)}
                </>
              )}
            />
          )}
        {whatsApp.status === "OPENING" && (
          <Button
            size="small"
            variant="outlined"
            disabled
            className={classes.actionButtons}
          >
            {i18n.t("connections.buttons.connecting")}
          </Button>
        )}
      </>
    );
  };

  const renderStatusToolTips = (whatsApp) => {
    return (
      <div className={classes.customTableCell}>
        {whatsApp.status === "DISCONNECTED" && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.disconnected.title")}
            content={i18n.t("connections.toolTips.disconnected.content")}
          >
            <SignalCellularConnectedNoInternet0Bar style={{ color: "#E57373" }} />
          </CustomToolTip>
        )}
        {whatsApp.status === "OPENING" && (
          <CircularProgress size={24} className={classes.buttonProgress} />
        )}
        {whatsApp.status === "qrcode" && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.qrcode.title")}
            content={i18n.t("connections.toolTips.qrcode.content")}
          >
            <CropFree />
          </CustomToolTip>
        )}
        {whatsApp.status === "CONNECTED" && (
          <CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
            <SignalCellular4Bar style={{ color: green[500] }} />
          </CustomToolTip>
        )}
        {(whatsApp.status === "TIMEOUT" || whatsApp.status === "PAIRING") && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.timeout.title")}
            content={i18n.t("connections.toolTips.timeout.content")}
          >
            <SignalCellularConnectedNoInternet2Bar style={{ color: "#E57373" }} />
          </CustomToolTip>
        )}
      </div>
    );
  };

  const responseFacebook = (response) => {
    if (response.status !== "unknown") {
      const { accessToken, id } = response;
      api.post("/facebook", {
        facebookUserId: id,
        facebookUserToken: accessToken,
      })
        .then(() => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch((error) => {
          toastError(error);
        });
    }
  };

  const responseInstagram = (response) => {
    if (response.status !== "unknown") {
      const { accessToken, id } = response;
      api.post("/facebook", {
        addInstagram: true,
        facebookUserId: id,
        facebookUserToken: accessToken,
      })
        .then(() => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch((error) => {
          toastError(error);
        });
    }
  };

  const restartWhatsapps = async () => {
    try {
      await api.post(`/whatsapp-restart/`);
      toast.success(i18n.t("connections.waitConnection"));
    } catch (err) {
      toastError(err);
    }
  }

  return (
    <MainContainer>
      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSubmitConfirmationModal}
      >
        {confirmModalInfo.message}
      </ConfirmationModal>

      {qrModalOpen && (
        <QrcodeModal
          open={qrModalOpen}
          onClose={handleCloseQrModal}
          whatsAppId={!whatsAppModalOpen && selectedWhatsApp?.id}
        />
      )}

      <WhatsAppModal
        open={whatsAppModalOpen}
        onClose={handleCloseWhatsAppModal}
        whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
      />

      {user.profile === "user" && user.allowConnections === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <>
          <div className={classes.searchContainer}>
            <div style={{
              display: "flex",
              gap: "16px",
              alignItems: "center"
            }}>
              <Typography variant="h6" style={{ color: '#333' }}>
                {i18n.t("connections.title")} ({whatsApps.length})
              </Typography>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <Button
                variant="contained"
                className={classes.actionButtons}
                onClick={restartWhatsapps}
              >
                {i18n.t("connections.restartConnections")}
              </Button>

              <Button
                variant="contained"
                className={classes.actionButtons}
                onClick={() => openInNewTab(`https://wa.me/${process.env.REACT_APP_NUMBER_SUPPORT}`)}
              >
                {i18n.t("connections.callSupport")}
              </Button>

              <PopupState variant="popover" popupId="demo-popup-menu">
                {(popupState) => (
                  <React.Fragment>
                    <Can
                      role={user.profile}
                      perform="connections-page:addConnection"
                      yes={() => (
                        <>
                          <Button
                            variant="contained"
                            className={classes.actionButtons}
                            startIcon={<AddCircleOutline />}
                            {...bindTrigger(popupState)}
                          >
                            {i18n.t("connections.newConnection")}
                          </Button>
                          <Menu {...bindMenu(popupState)}>
                            <MenuItem
                              disabled={planConfig?.plan?.useWhatsapp ? false : true}
                              onClick={() => {
                                handleOpenWhatsAppModal();
                                popupState.close();
                              }}
                            >
                              <WhatsApp
                                fontSize="small"
                                style={{
                                  marginRight: "10px",
                                  color: "#25D366",
                                }}
                              />
                              WhatsApp
                            </MenuItem>
                            <FacebookLogin
                              appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                              autoLoad={false}
                              fields="name,email,picture"
                              version="9.0"
                              scope={process.env.REACT_APP_REQUIRE_BUSINESS_MANAGEMENT?.toUpperCase() === "TRUE" ?
                                "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                                : "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement"}
                              callback={responseFacebook}
                              render={(renderProps) => (
                                <MenuItem
                                  disabled={planConfig?.plan?.useFacebook ? false : true}
                                  onClick={renderProps.onClick}
                                >
                                  <Facebook
                                    fontSize="small"
                                    style={{
                                      marginRight: "10px",
                                      color: "#3b5998",
                                    }}
                                  />
                                  Facebook
                                </MenuItem>
                              )}
                            />
                            <FacebookLogin
                              appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                              autoLoad={false}
                              fields="name,email,picture"
                              version="9.0"
                              scope={process.env.REACT_APP_REQUIRE_BUSINESS_MANAGEMENT?.toUpperCase() === "TRUE" ?
                                "public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                                : "public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement"}
                              callback={responseInstagram}
                              render={(renderProps) => (
                                <MenuItem
                                  disabled={planConfig?.plan?.useInstagram ? false : true}
                                  onClick={renderProps.onClick}
                                >
                                  <Instagram
                                    fontSize="small"
                                    style={{
                                      marginRight: "10px",
                                      color: "#e1306c",
                                    }}
                                  />
                                  Instagram
                                </MenuItem>
                              )}
                            />
                          </Menu>
                        </>
                      )}
                    />
                  </React.Fragment>
                )}
              </PopupState>
            </div>
          </div>

          {statusImport?.all && (
            <Card className={classes.statusCard}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CloudDownload color="primary" />
                  {statusImport?.this === -1 ?
                      "Preparando mensagens para importação..." :
                      "Importando mensagens do WhatsApp"}
                </Typography>
                  <Chip 
                    label={statusImport?.this === -1 ? "Preparando" : "Importando"} 
                    color={statusImport?.this === -1 ? "default" : "primary"}
                    size="small"
                  />
                </Box>
                
                {statusImport?.this === -1 ? (
                  <Box textAlign="center" py={2}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" style={{ marginTop: 8 }}>
                      Aguardando conexão para iniciar a importação...
                  </Typography>
                  </Box>
                ) : (
                  <>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="primary">
                            {statusImport?.this}
                    </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Mensagens Processadas
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="primary">
                            {statusImport?.all}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total de Mensagens
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="primary">
                            {Math.round((statusImport?.this / statusImport?.all) * 100)}%
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Progresso
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          Progresso da importação
                        </Typography>
                        <Typography variant="body2">
                          {Math.round((statusImport?.this / statusImport?.all) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(statusImport?.this / statusImport?.all) * 100}
                        style={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    {statusImport?.date && (
                      <Paper 
                        elevation={1} 
                        style={{ 
                          backgroundColor: '#e3f2fd',
                          border: '1px solid #2196f3',
                          padding: 12,
                          marginTop: 8
                        }}
                      >
                        <Typography variant="body2" style={{ color: '#1976d2', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Schedule fontSize="small" />
                          Processando mensagem de: <strong>{statusImport?.date}</strong>
                    </Typography>
                      </Paper>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Paper className={classes.mainPaper}>
            <div className={classes.tableContainer}>
              <Table size="small" className={classes.customTable}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Channel</TableCell>
                    <TableCell align="center">{i18n.t("connections.table.name")}</TableCell>
                    <TableCell align="center">{i18n.t("connections.table.number")}</TableCell>
                    <TableCell align="center">{i18n.t("connections.table.status")}</TableCell>
                    <TableCell align="center">{i18n.t("connections.table.session")}</TableCell>
                    <TableCell align="center">{i18n.t("connections.table.lastUpdate")}</TableCell>
                    <TableCell align="center">{i18n.t("connections.table.default")}</TableCell>
                    <Can
                      role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
                      perform="connections-page:addConnection"
                      yes={() => (
                        <TableCell align="center">{i18n.t("connections.table.actions")}</TableCell>
                      )}
                    />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRowSkeleton />
                  ) : (
                    <>
                      {whatsApps?.length > 0 &&
                        whatsApps.map((whatsApp) => (
                          <TableRow key={whatsApp.id}>
                            <TableCell align="center">{IconChannel(whatsApp.channel)}</TableCell>
                            <TableCell align="center">{whatsApp.name}</TableCell>
                            <TableCell align="center">
                              {whatsApp.number && whatsApp.channel === 'whatsapp' ?
                                formatSerializedId(whatsApp.number) :
                                whatsApp.number}
                            </TableCell>
                            <TableCell align="center">{renderStatusToolTips(whatsApp)}</TableCell>
                            <TableCell align="center">{renderActionButtons(whatsApp)}</TableCell>
                            <TableCell align="center">
                              {format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
                            </TableCell>
                            <TableCell align="center">
                              {whatsApp.isDefault && (
                                <div className={classes.customTableCell}>
                                  <CheckCircle style={{ color: green[500] }} />
                                </div>
                              )}
                            </TableCell>
                            <Can
                              role={user.profile}
                              perform="connections-page:addConnection"
                              yes={() => (
                                <TableCell align="center">
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditWhatsApp(whatsApp)}
                                      className={`${classes.iconButton} edit`}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>

                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenConfirmationModal("delete", whatsApp.id)}
                                      className={`${classes.iconButton} delete`}
                                    >
                                      <DeleteOutline fontSize="small" />
                                    </IconButton>
                                  </div>
                                </TableCell>
                              )}
                            />
                          </TableRow>
                        ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </>
      )}

      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleSubmitConfirmationModal}
      >
        {confirmModalInfo.message}
      </ConfirmationModal>

      <ImportMessagesModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        whatsApp={selectedWhatsApp}
        onImportComplete={() => {
          setImportModalOpen(false);
          setSelectedWhatsApp(null);
        }}
      />
    </MainContainer>
  );
};

export default Connections;