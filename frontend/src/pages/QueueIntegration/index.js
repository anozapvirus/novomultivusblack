import React, { useState, useEffect, useContext, useReducer } from "react";
import { toast } from "react-toastify";
import n8n from "../../assets/n8n.png";
import dialogflow from "../../assets/dialogflow.png";
import webhooks from "../../assets/webhook.png";
import typebot from "../../assets/typebot.jpg";
import flowbuilder from "../../assets/flowbuilders.png";

import { makeStyles } from "@material-ui/core/styles";
import {
  Avatar,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  Chip
} from "@material-ui/core";

import {
  DeleteOutline,
  Edit,
  Search as SearchIcon,
  AddCircleOutline
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import IntegrationModal from "../../components/QueueIntegrationModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ForbiddenPage from "../../components/ForbiddenPage";
import QueueIntegrationEditModal from "../../components/QueueIntegrationEditModal";
import { socketConnection } from "../../services/socket";
import QueueIntegrationModal from "../../components/QueueIntegrationModal";

const reducer = (state, action) => {
  if (action.type === "LOAD_INTEGRATION") {
    const integration = action.payload;
    const newIntegration = [...state];

    const integrationIndex = newIntegration.findIndex(u => u.id === integration.id);
    if (integrationIndex !== -1) {
      newIntegration[integrationIndex] = integration;
      return newIntegration;
    } else {
      return [integration, ...state];
    }
  }

  if (action.type === "UPDATE_INTEGRATION") {
    const integration = action.payload;
    const newIntegration = [...state];

    const integrationIndex = newIntegration.findIndex(u => u.id === integration.id);
    if (integrationIndex !== -1) {
      newIntegration[integrationIndex] = integration;
    }
    return newIntegration;
  }

  if (action.type === "DELETE_INTEGRATION") {
    const integrationId = action.payload;

    const newIntegration = state.filter(u => u.id !== integrationId);
    return newIntegration;
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "LOAD_MORE") {
    const integration = action.payload;
    const newIntegration = [...state];

    integration.forEach(integration => {
      const integrationIndex = newIntegration.findIndex(u => u.id === integration.id);
      if (integrationIndex !== -1) {
        newIntegration[integrationIndex] = integration;
      } else {
        newIntegration.push(integration);
      }
    });

    return newIntegration;
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
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
  },
  searchInput: {
    width: "300px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
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
  avatar: {
    width: "140px",
    height: "40px",
    borderRadius: 4
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
  chip: {
    padding: 0
  },
}));

const QueueIntegration = () => {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);
  const history = useHistory();
  const { getPlanCompany } = usePlans();
  const companyId = user.companyId;

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [deletingIntegration, setDeletingIntegration] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [queueIntegration, dispatch] = useReducer(reducer, []);
  const [queueIntegrationEditModalOpen, setQueueIntegrationEditModalOpen] = useState(false);
  const [queueIntegrationModalOpen, setQueueIntegrationModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useIntegrations) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
  }, [getPlanCompany, companyId, history]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchQueueIntegration = async () => {
        try {
          const { data } = await api.get("/queueIntegration/", {
            params: { searchParam, pageNumber }
          });
          dispatch({ type: "LOAD_MORE", payload: data.queueIntegrations });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchQueueIntegration();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const onQueueEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "LOAD_INTEGRATION", payload: data.queueIntegration });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_INTEGRATION", payload: +data.integrationId });
      }
    };

    socket.on(`company-${companyId}-queueIntegration`, onQueueEvent);
    return () => {
      socket.off(`company-${companyId}-queueIntegration`, onQueueEvent);
    };
  }, [socket, companyId]);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditIntegration = (integration) => {
    console.log("Tentando editar integração:", integration);
    if (!integration || !integration.id) {
      console.error("Tentativa de editar integração sem ID");
      toast.error("Erro ao editar: integração inválida");
      return;
    }
    
    setSelectedIntegration(integration);
    
    if (integration.type === "gemini") {
      // Para Gemini, usar o modal específico
      console.log("Abrindo modal específico para Gemini");
      setQueueIntegrationEditModalOpen(true);
    } else {
      // Para outros tipos, usar o modal padrão
      console.log("Abrindo modal padrão (QueueIntegrationModal)");
      setQueueIntegrationModalOpen(true);
    }
  };

  const handleDeleteIntegration = async (queueIntegrationId) => {
    try {
      await api.delete(`/queueIntegration/${queueIntegrationId}`);
      toast.success(i18n.t("queueIntegration.toasts.deleted"));
    } catch (err) {
      console.error("Erro ao excluir integração:", err);
      if (err.response && err.response.status === 403) {
        toast.error("Você não tem permissão para excluir integrações. Apenas administradores podem realizar esta ação.");
      } else {
        toastError(err);
      }
    }
    setDeletingIntegration(null);
    setConfirmModalOpen(false);
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const handleOpenQueueIntegrationEditModal = (queueIntegration) => {
    console.log("Abrindo modal de edição específico para Gemini:", queueIntegration);
    if (!queueIntegration || !queueIntegration.id) {
      console.error("Tentativa de editar Gemini sem ID");
      toast.error("Erro ao editar: integração inválida");
      return;
    }
    
    setSelectedIntegration(queueIntegration);
    setQueueIntegrationEditModalOpen(true);
  };

  const handleCloseQueueIntegrationEditModal = () => {
    setSelectedIntegration(null);
    setQueueIntegrationEditModalOpen(false);
    loadMore();
  };

  const handleOpenQueueIntegrationModal = () => {
    setSelectedIntegration(null);
    setQueueIntegrationModalOpen(true);
  };

  const handleCloseQueueIntegrationModal = () => {
    setSelectedIntegration(null);
    setQueueIntegrationModalOpen(false);
  };

  const renderChip = (type) => {
    switch (type) {
      case "dialogflow":
        return <Chip size="small" label="Dialogflow" style={{ backgroundColor: "#1de9b6", marginRight: 2 }} className={classes.chip} />;
      case "n8n":
        return <Chip size="small" label="N8N" style={{ backgroundColor: "#ff9800", marginRight: 2 }} className={classes.chip} />;
      case "webhook":
        return <Chip size="small" label="Webhook" style={{ backgroundColor: "#536dfe", marginRight: 2 }} className={classes.chip} />;
      case "typebot":
        return <Chip size="small" label="Typebot" style={{ backgroundColor: "#03a9f4", marginRight: 2 }} className={classes.chip} />;
      case "flowbuilder":
        return <Chip size="small" label="Flowbuilder" style={{ backgroundColor: "#9c27b0", marginRight: 2 }} className={classes.chip} />;
      default:
        return <Chip size="small" label="Outro" style={{ backgroundColor: "#9c27b0", marginRight: 2 }} className={classes.chip} />;
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingIntegration &&
          `${i18n.t("queueIntegration.confirmationModal.deleteTitle")} ${deletingIntegration.name}?`
        }
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteIntegration(deletingIntegration.id)}
      >
        {i18n.t("queueIntegration.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <QueueIntegrationModal
        open={queueIntegrationModalOpen}
        onClose={handleCloseQueueIntegrationModal}
        queueIntegrationId={selectedIntegration && selectedIntegration.id}
      />

      {selectedIntegration && (
        <QueueIntegrationEditModal
          open={queueIntegrationEditModalOpen}
          onClose={handleCloseQueueIntegrationEditModal}
          queueIntegrationId={selectedIntegration.id}
        />
      )}

      {user.profile === "user" ? (
        <ForbiddenPage />
      ) : (
        <>
          <div className={classes.searchContainer}>
              <Typography variant="h6" style={{ color: '#333' }}>
                {i18n.t("queueIntegration.title")} ({queueIntegration.length})
              </Typography>
            <div style={{
              display: "flex",
              gap: "16px",
              alignItems: "center"
            }}>
              <TextField
                className={classes.searchInput}
                placeholder={i18n.t("queueIntegration.searchPlaceholder")}
                type="search"
                value={searchParam}
                onChange={handleSearch}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon style={{ color: "#25b6e8" }} />
                    </InputAdornment>
                  ),
                }}
              />
              
            </div>

            <Button
              variant="contained"
              onClick={handleOpenQueueIntegrationModal}
              className={classes.actionButtons}
              startIcon={<AddCircleOutline />}
            >
              {i18n.t("queueIntegration.buttons.add")}
            </Button>
          </div>

          <Paper className={classes.mainPaper} onScroll={handleScroll}>
            <div className={classes.tableContainer}>
              <Table size="small" className={classes.customTable}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell align="center">{i18n.t("queueIntegration.table.id")}</TableCell>
                    <TableCell align="center">{i18n.t("queueIntegration.table.name")}</TableCell>
                    <TableCell align="center">{i18n.t("queueIntegration.table.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queueIntegration.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        {integration.type === "dialogflow" && (
                          <Avatar src={dialogflow} className={classes.avatar} />
                        )}
                        {integration.type === "n8n" && (
                          <Avatar src={n8n} className={classes.avatar} />
                        )}
                        {integration.type === "webhook" && (
                          <Avatar src={webhooks} className={classes.avatar} />
                        )}
                        {integration.type === "typebot" && (
                          <Avatar src={typebot} className={classes.avatar} />
                        )}
                        {integration.type === "flowbuilder" && (
                          <Avatar src={flowbuilder} className={classes.avatar} />
                        )}
                      </TableCell>
                      <TableCell align="center">{integration.id}</TableCell>
                      <TableCell align="center">{integration.name}</TableCell>
                      <TableCell align="center">
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditIntegration(integration)}
                            className={`${classes.iconButton} edit`}
                          >
                            <Edit fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={() => {
                              setConfirmModalOpen(true);
                              setDeletingIntegration(integration);
                            }}
                            className={`${classes.iconButton} delete`}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && <TableRowSkeleton columns={4} />}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default QueueIntegration;