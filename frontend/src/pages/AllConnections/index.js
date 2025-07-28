import React, { useState, useCallback, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import { Stack } from "@mui/material";
import { makeStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
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
  AddCircleOutline
} from "@material-ui/icons";

import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { AuthContext } from "../../context/Auth/AuthContext";
import useCompanies from "../../hooks/useCompanies";
import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import WhatsAppModalCompany from "../../components/CompanyWhatsapps";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import ForbiddenPage from "../../components/ForbiddenPage";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
    overflow: "auto",
    maxHeight: "calc(100vh - 150px)",
    ...theme.scrollbarStyles
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
    maxHeight: "calc(100vh - 200px)",
    ...theme.scrollbarStyles,
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: theme.typography.pxToRem(14),
    border: "1px solid #dadde9",
    maxWidth: 450
  },
  tooltipPopper: {
    textAlign: "center"
  },
  buttonProgress: {
    color: green[500]
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
  totalRow: {
    "& .MuiTableCell-root": {
      color: "inherit",
      fontWeight: "bold",
    }
  },
  mainHeader: {
    padding: theme.spacing(2),
    borderBottom: "1px solid #f5f5f5"
  },
  mainHeaderContent: {
    maxWidth: 1200,
    margin: "0 auto",
  }
}));

const CustomToolTip = ({ title, content, children }) => {
  const classes = useStyles();

  return (
    <Tooltip
      arrow
      classes={{
        tooltip: classes.tooltip,
        popper: classes.tooltipPopper
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

const IconChannel = channel => {
  switch (channel) {
    case "facebook":
      return <Facebook />;
    case "instagram":
      return <Instagram />;
    case "whatsapp":
      return <WhatsApp />;
    default:
      return "error";
  }
};
const AllConnections = () => {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);
  const { list } = useCompanies();
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(true);
  const [loadingComp, setLoadingComp] = useState(false);
  const [whats, setWhats] = useState([]);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [filterConnections, setFilterConnections] = useState([]);
  const [companyWhatsApps, setCompanyWhatsApps] = useState(null);
  const confirmationModalInitialState = {
    action: "",
    title: "",
    message: "",
    whatsAppId: "",
    open: false
  };
  const [confirmModalInfo, setConfirmModalInfo] = useState(
    confirmationModalInitialState
  );

  const history = useHistory();
  if (!user.super) {
    history.push("/tickets")
  }

  useEffect(() => {
    setLoadingWhatsapp(true);
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/whatsapp/all/?session=0");
        setWhats(data);
        setLoadingWhatsapp(false);
      } catch (err) {
        setLoadingWhatsapp(false);
        toastError(err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoadingComp(true);
    try {
      const companyList = await list();
      setCompanies(companyList);
    } catch (e) {
      toast.error("Não foi possível carregar a lista de registros");
    }
    setLoadingComp(false);
  }

  const responseFacebook = response => {
    if (response.status !== "unknown") {
      const { accessToken, id } = response;
      api.post("/facebook", {
        facebookUserId: id,
        facebookUserToken: accessToken
      })
        .then(() => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch(error => {
          toastError(error);
        });
    }
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

    setConfirmModalInfo(confirmationModalInitialState);
  };

  const responseInstagram = response => {
    if (response.status !== "unknown") {
      const { accessToken, id } = response;
      api.post("/facebook", {
        addInstagram: true,
        facebookUserId: id,
        facebookUserToken: accessToken
      })
        .then(() => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch(error => {
          toastError(error);
        });
    }
  };

  const handleOpenWhatsAppModal = (whatsappsFilter, comp) => {
    setSelectedWhatsApp(null);
    setWhatsAppModalOpen(true);
    if (whatsappsFilter?.length > 0) {
      setFilterConnections(whatsappsFilter);
      setCompanyWhatsApps(comp);
    }
  };

  const handleCloseWhatsAppModal = useCallback(() => {
    setWhatsAppModalOpen(false);
    setSelectedWhatsApp(null);
    setFilterConnections([]);
    setCompanyWhatsApps(null);
  }, []);

  const handleOpenQrModal = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, []);

  return (
    <MainContainer>
      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleSubmitConfirmationModal}
      >
        {confirmModalInfo.message}
      </ConfirmationModal>

      <QrcodeModal
        open={qrModalOpen}
        onClose={handleCloseQrModal}
        whatsAppId={!whatsAppModalOpen && selectedWhatsApp?.id}
      />

      <WhatsAppModalCompany
        open={whatsAppModalOpen}
        onClose={handleCloseWhatsAppModal}
        filteredWhatsapps={filterConnections}
        companyInfos={companyWhatsApps}
        whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
      />

      {user.profile === "user" ? (
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
                {i18n.t("connections.title")}
              </Typography>
              <Typography variant="caption" style={{ color: 'rgb(104, 104, 104)' }}>
                Conecte seus canais de atendimento para receber mensagens e iniciar conversas com seus clientes.
              </Typography>
            </div>

            <PopupState variant="popover" popupId="demo-popup-menu">
              {popupState => (
                <React.Fragment>
                  <Button
                    variant="contained"
                    className={classes.actionButtons}
                    startIcon={<AddCircleOutline />}
                    {...bindTrigger(popupState)}
                  >
                    {i18n.t("Adicionar Conexão")}
                  </Button>
                  <Menu {...bindMenu(popupState)}>
                    <MenuItem
                      onClick={() => {
                        handleOpenWhatsAppModal();
                        popupState.close();
                      }}
                    >
                      <WhatsApp
                        fontSize="small"
                        style={{
                          marginRight: "10px",
                          color: "#25D366"
                        }}
                      />
                      WhatsApp
                    </MenuItem>
                    <FacebookLogin
                      appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                      autoLoad={false}
                      fields="name,email,picture"
                      version="13.0"
                      scope="public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                      callback={responseFacebook}
                      render={renderProps => (
                        <MenuItem onClick={renderProps.onClick}>
                          <Facebook
                            fontSize="small"
                            style={{
                              marginRight: "10px",
                              color: "#3b5998"
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
                      version="13.0"
                      scope="public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                      callback={responseInstagram}
                      render={renderProps => (
                        <MenuItem onClick={renderProps.onClick}>
                          <Instagram
                            fontSize="small"
                            style={{
                              marginRight: "10px",
                              color: "#e1306c"
                            }}
                          />
                          Instagram
                        </MenuItem>
                      )}
                    />
                  </Menu>
                </React.Fragment>
              )}
            </PopupState>
          </div>

          <Paper className={classes.mainPaper}>
            <div className={classes.tableContainer}>
              <Table size="small" className={classes.customTable}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">{i18n.t("Cliente")}</TableCell>
                    <TableCell align="center">{i18n.t("Conexões conectadas")}</TableCell>
                    <TableCell align="center">{i18n.t("Conexões desconectadas")}</TableCell>
                    <TableCell align="center">{i18n.t("Total de Conexões")}</TableCell>
                    {user.profile === "admin" && (
                      <TableCell align="center">{i18n.t("connections.table.actions")}</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingWhatsapp ? (
                    <TableRowSkeleton />
                  ) : (
                    <>
                      {companies?.length > 0 && companies.map(company => (
                        <TableRow key={company.id}>
                          <TableCell align="center">{company?.name}</TableCell>
                          <TableCell align="center">
                            {whats?.length && whats.filter((item) => item?.companyId === company?.id && item?.status === 'CONNECTED').length}
                          </TableCell>
                          <TableCell align="center">
                            {whats?.length && whats.filter((item) => item?.companyId === company?.id && item?.status !== 'CONNECTED').length}
                          </TableCell>
                          <TableCell align="center">
                            {whats?.length && whats.filter((item) => item?.companyId === company?.id).length}
                          </TableCell>
                          {user.profile === "admin" && (
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenWhatsAppModal(whats.filter((item) => item?.companyId === company?.id), company)}
                                className={`${classes.iconButton} edit`}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow className={classes.totalRow}>
                        <TableCell align="center">{i18n.t("Total")}</TableCell>
                        <TableCell align="center">
                          {whats?.length && whats.filter((item) => item?.status === 'CONNECTED').length}
                        </TableCell>
                        <TableCell align="center">
                          {whats?.length && whats.filter((item) => item?.status !== 'CONNECTED').length}
                        </TableCell>
                        <TableCell align="center">
                          {whats?.length && whats.length}
                        </TableCell>
                        {user.profile === "admin" && <TableCell align="center"></TableCell>}
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default AllConnections;