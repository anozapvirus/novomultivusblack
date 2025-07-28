import React, { useEffect, useReducer, useState, useContext } from "react";

import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  Tooltip,
  Alert,
  Divider,
  Avatar,
  Badge,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@material-ui/core";

import {
  DeleteOutline,
  Edit,
  Search as SearchIcon,
  AddCircleOutline,
  Business,
  Schedule,
  Message,
  ColorLens,
  Info,
  Help,
  TrendingUp,
  People,
  Settings,
  CheckCircle,
  Warning,
  Star,
  AccessTime,
  Chat,
  Palette,
  Queue,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import QueueModal from "../../components/QueueModal";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import ForbiddenPage from "../../components/ForbiddenPage";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1),
    },
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  header: {
    marginBottom: theme.spacing(4),
    textAlign: "center",
  },
  headerTitle: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      fontSize: "2rem",
    },
  },
  headerSubtitle: {
    fontSize: "1.1rem",
    color: theme.palette.text.secondary,
    maxWidth: 600,
    margin: "0 auto",
  },
  statsContainer: {
    marginBottom: theme.spacing(4),
  },
  statCard: {
    height: "100%",
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[3],
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[6],
    },
  },
  statCardContent: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
  statIcon: {
    fontSize: "2.5rem",
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  statLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.9rem",
  },
  tipsContainer: {
    marginBottom: theme.spacing(4),
  },
  tipCard: {
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[2],
    marginBottom: theme.spacing(2),
  },
  tipHeader: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
    padding: theme.spacing(2),
    borderRadius: `${theme.spacing(2)}px ${theme.spacing(2)}px 0 0`,
  },
  tipContent: {
    padding: theme.spacing(2),
  },
  tipList: {
    margin: 0,
    paddingLeft: theme.spacing(3),
  },
  tipItem: {
    marginBottom: theme.spacing(1),
    lineHeight: 1.6,
  },
  searchContainer: {
    backgroundColor: "white",
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[3],
    marginBottom: theme.spacing(3),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "stretch",
    },
  },
  searchField: {
    flex: 1,
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  addButton: {
    borderRadius: theme.spacing(2),
    padding: theme.spacing(1.5, 3),
    textTransform: "none",
    fontWeight: 600,
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[3],
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
  },
  customTable: {
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: theme.palette.primary.contrastText,
      borderBottom: "none",
      padding: theme.spacing(2),
    },
    "& .MuiTableCell-body": {
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(2),
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  queueCard: {
    marginBottom: theme.spacing(2),
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[2],
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: theme.shadows[4],
      transform: "translateY(-2px)",
    },
  },
  queueCardContent: {
    padding: theme.spacing(2),
  },
  queueHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  queueName: {
    fontWeight: 600,
    fontSize: "1.1rem",
    color: theme.palette.text.primary,
  },
  queueColor: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: `2px solid ${theme.palette.divider}`,
  },
  queueDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    },
  queueDetail: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
  queueActions: {
    display: "flex",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    "&.edit": {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.light,
      "&:hover": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      },
    },
    "&.delete": {
      color: theme.palette.error.main,
      backgroundColor: theme.palette.error.light,
      "&:hover": {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
      },
    },
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 1000,
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  emptyIcon: {
    fontSize: "4rem",
    color: theme.palette.divider,
    marginBottom: theme.spacing(2),
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_QUEUES") {
    const queues = action.payload;
    const newQueues = [];

    queues.forEach((queue) => {
      const queueIndex = state.findIndex((q) => q.id === queue.id);
      if (queueIndex !== -1) {
        state[queueIndex] = queue;
      } else {
        newQueues.push(queue);
      }
    });

    return [...state, ...newQueues];
  }

  if (action.type === "UPDATE_QUEUES") {
    const queue = action.payload;
    const queueIndex = state.findIndex((u) => u.id === queue.id);

    if (queueIndex !== -1) {
      state[queueIndex] = queue;
      return [...state];
    } else {
      return [queue, ...state];
    }
  }

  if (action.type === "DELETE_QUEUE") {
    const queueId = action.payload;
    const queueIndex = state.findIndex((q) => q.id === queueId);
    if (queueIndex !== -1) {
      state.splice(queueIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Queues = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [queues, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { user, socket } = useContext(AuthContext);
  const companyId = user.companyId;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/queue");
        dispatch({ type: "LOAD_QUEUES", payload: data });
        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onQueueEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUEUES", payload: data.queue });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUEUE", payload: data.queueId });
      }
    };
    socket.on(`company-${companyId}-queue`, onQueueEvent);

    return () => {
      socket.off(`company-${companyId}-queue`, onQueueEvent);
    };
  }, [socket, companyId]);

  const handleOpenQueueModal = () => {
    setQueueModalOpen(true);
    setSelectedQueue(null);
  };

  const handleCloseQueueModal = () => {
    setQueueModalOpen(false);
    setSelectedQueue(null);
  };

  const handleEditQueue = (queue) => {
    setSelectedQueue(queue);
    setQueueModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async (queueId) => {
    try {
      await api.delete(`/queue/${queueId}`);
      toast.success(i18n.t("Queue deleted successfully!"));
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const filteredQueues = queues.filter(queue =>
    queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    queue.greetingMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStats = () => (
    <Grid container spacing={3} className={classes.statsContainer}>
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.statCard}>
          <CardContent className={classes.statCardContent}>
            <Queue className={classes.statIcon} />
            <Typography className={classes.statNumber}>
              {queues.length}
            </Typography>
            <Typography className={classes.statLabel}>
              Setores Ativos
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.statCard}>
          <CardContent className={classes.statCardContent}>
            <People className={classes.statIcon} />
            <Typography className={classes.statNumber}>
              {queues.filter(q => q.greetingMessage).length}
            </Typography>
            <Typography className={classes.statLabel}>
              Com Saudação
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.statCard}>
          <CardContent className={classes.statCardContent}>
            <Schedule className={classes.statIcon} />
            <Typography className={classes.statNumber}>
              {queues.filter(q => q.schedules && q.schedules.length > 0).length}
            </Typography>
            <Typography className={classes.statLabel}>
              Com Horários
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.statCard}>
          <CardContent className={classes.statCardContent}>
            <Message className={classes.statIcon} />
            <Typography className={classes.statNumber}>
              {queues.filter(q => q.outOfHoursMessage).length}
            </Typography>
            <Typography className={classes.statLabel}>
              Com Mensagem de Ausência
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTips = () => (
    <div className={classes.tipsContainer}>
      <Card className={classes.tipCard}>
        <div className={classes.tipHeader}>
          <Typography variant="h6" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Help /> Dicas para Configurar Setores
          </Typography>
        </div>
        <div className={classes.tipContent}>
          <Typography variant="body1" gutterBottom>
            Configure seus setores de atendimento de forma eficiente para melhorar a experiência dos clientes:
          </Typography>
          <ul className={classes.tipList}>
            <li className={classes.tipItem}>
              <strong>Nome do Setor:</strong> Use nomes claros e objetivos (ex: "Suporte Técnico", "Vendas", "Financeiro")
            </li>
            <li className={classes.tipItem}>
              <strong>Cores:</strong> Escolha cores diferentes para cada setor, facilitando a identificação visual
            </li>
            <li className={classes.tipItem}>
              <strong>Mensagem de Saudação:</strong> Personalize a mensagem de boas-vindas para cada setor
            </li>
            <li className={classes.tipItem}>
              <strong>Horários de Funcionamento:</strong> Configure os horários específicos de cada setor
            </li>
            <li className={classes.tipItem}>
              <strong>Mensagem de Ausência:</strong> Defina mensagens para quando o setor estiver fora do horário
            </li>
            <li className={classes.tipItem}>
              <strong>Ordem de Atendimento:</strong> Organize a prioridade dos setores na fila de atendimento
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );

  const renderQueueCard = (queue) => (
    <Card key={queue.id} className={classes.queueCard}>
      <CardContent className={classes.queueCardContent}>
        <div className={classes.queueHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing(1) }}>
            <div
              className={classes.queueColor}
              style={{ backgroundColor: queue.color }}
            />
            <Typography className={classes.queueName}>
              {queue.name}
            </Typography>
            <Chip
              label={`ID: ${queue.id}`}
              size="small"
              variant="outlined"
              color="primary"
            />
          </div>
          <div className={classes.queueActions}>
            <Tooltip title="Editar Setor">
              <IconButton
                size="small"
                onClick={() => handleEditQueue(queue)}
                className={`${classes.actionButton} edit`}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir Setor">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedQueue(queue);
                  setConfirmModalOpen(true);
                }}
                className={`${classes.actionButton} delete`}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        
        <div className={classes.queueDetails}>
          <Chip
            icon={<AccessTime />}
            label={`Ordem: ${queue.orderQueue || "Padrão"}`}
            size="small"
            variant="outlined"
          />
          {queue.greetingMessage && (
            <Chip
              icon={<Chat />}
              label="Saudação Configurada"
              size="small"
              color="primary"
            />
          )}
          {queue.outOfHoursMessage && (
            <Chip
              icon={<Schedule />}
              label="Mensagem de Ausência"
              size="small"
              color="secondary"
            />
          )}
          {queue.schedules && queue.schedules.length > 0 && (
            <Chip
              icon={<Business />}
              label="Horários Configurados"
              size="small"
              color="default"
            />
          )}
        </div>
        
        {queue.greetingMessage && (
          <Typography variant="body2" color="textSecondary" style={{ marginTop: theme.spacing(1) }}>
            <strong>Saudação:</strong> {queue.greetingMessage}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (user.profile === "user") {
    return <ForbiddenPage />;
  }

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        {/* Header */}
        <div className={classes.header}>
          <Typography className={classes.headerTitle}>
            Gerenciamento de Setores
          </Typography>
          <Typography className={classes.headerSubtitle}>
            Configure e gerencie os setores de atendimento da sua empresa para organizar melhor o fluxo de tickets
          </Typography>
        </div>

        {/* Stats */}
        {renderStats()}

        {/* Tips */}
        {renderTips()}

        {/* Search and Add */}
        <div className={classes.searchContainer}>
          <TextField
            className={classes.searchField}
            variant="outlined"
            placeholder="Buscar setores por nome ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenQueueModal}
            className={classes.addButton}
            startIcon={<AddCircleOutline />}
          >
            Novo Setor
          </Button>
        </div>

        {/* Queues List */}
        <div className={classes.tableContainer}>
          {filteredQueues.length > 0 ? (
            <div style={{ padding: theme.spacing(2) }}>
              {filteredQueues.map(renderQueueCard)}
            </div>
          ) : !loading ? (
            <div className={classes.emptyState}>
              <Queue className={classes.emptyIcon} />
              <Typography variant="h6" gutterBottom>
                Nenhum setor encontrado
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm ? "Nenhum setor corresponde à sua busca." : "Comece criando seu primeiro setor de atendimento."}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenQueueModal}
                  style={{ marginTop: theme.spacing(2) }}
                  startIcon={<AddCircleOutline />}
                >
                  Criar Primeiro Setor
                </Button>
              )}
            </div>
          ) : (
            <div style={{ padding: theme.spacing(2) }}>
              <div style={{ textAlign: "center", padding: theme.spacing(4) }}>
                <CircularProgress />
                <Typography variant="body2" style={{ marginTop: theme.spacing(2) }}>
                  Carregando setores...
                </Typography>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Zoom in={true}>
            <Fab
              color="primary"
              className={classes.fab}
              onClick={handleOpenQueueModal}
            >
              <AddCircleOutline />
            </Fab>
          </Zoom>
        )}

        {/* Modals */}
      <ConfirmationModal
          title={selectedQueue && `Excluir setor "${selectedQueue.name}"?`}
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
          Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita.
      </ConfirmationModal>

      <QueueModal
        open={queueModalOpen}
        onClose={handleCloseQueueModal}
        queueId={selectedQueue?.id}
        onEdit={(res) => {
          if (res) {
            setTimeout(() => {
              handleEditQueue(res)
            }, 500)
          }
        }}
      />
                        </div>
            </div>
  );
};

export default Queues;