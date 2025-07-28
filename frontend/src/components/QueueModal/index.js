import React, { useState, useEffect, useRef, useContext, Fragment } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { 
  FormControl, 
  FormControlLabel, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Tab, 
  Tabs,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button as MuiButton,
  Collapse,
  Fade,
  Zoom,
  Fab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Switch,
  TextField,
  Button,
  InputAdornment,
  IconButton as MuiIconButton,
} from "@material-ui/core";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { green, blue, orange, red } from "@material-ui/core/colors";
import SaveIcon from "@material-ui/icons/Save";
import EditIcon from "@material-ui/icons/Edit";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import { i18n } from "../../translate/i18n";
import { isArray } from "lodash";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ColorPicker from "../ColorPicker";
import { Colorize, ExpandMore, Add, Delete, Settings, Schedule, Message, Business, Extension, AttachFile, People, Queue, CheckCircle, Warning, Info, Close, Save, Cancel } from "@material-ui/icons";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import ConfirmationModal from "../ConfirmationModal";
import Checkbox from '@material-ui/core/Checkbox';

import OptionsChatBot from "../ChatBots/options";
import CustomToolTip from "../ToolTips";

import SchedulesForm from "../SchedulesForm";
import { AuthContext } from "../../context/Auth/AuthContext";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
import UserStatusIcon from "../UserModal/statusIcon";
import ColorBoxModal from "../ColorBoxModal";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  modal: {
    margin: theme.spacing(1),
    maxWidth: "calc(100% - 16px)",
  },
  modalContent: {
    padding: theme.spacing(1),
  },
  header: {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
  },
  headerTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  headerSubtitle: {
    opacity: 0.9,
    fontSize: "0.9rem",
  },
  tabs: {
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    "& .MuiTab-root": {
      minHeight: 48,
      fontSize: "0.8rem",
      fontWeight: 500,
      textTransform: "none",
    },
  },
  tabContent: {
    padding: theme.spacing(2),
  },
  formSection: {
    marginBottom: theme.spacing(4),
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  sectionCard: {
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[2],
    marginBottom: theme.spacing(2),
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
  },
  cardContent: {
    padding: theme.spacing(2),
  },
  formGrid: {
    marginBottom: theme.spacing(2),
  },
  textField: {
    marginBottom: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.spacing(1),
    },
  },
  colorField: {
    position: "relative",
    marginBottom: theme.spacing(2),
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    border: `2px solid ${theme.palette.divider}`,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "scale(1.05)",
      boxShadow: theme.shadows[4],
    },
  },
  colorPickerButton: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  switchContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  switchLabel: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    fontWeight: 500,
  },
  selectField: {
    marginBottom: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.spacing(1),
    },
  },
  chatbotSection: {
    marginTop: theme.spacing(3),
  },
  chatbotCard: {
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    overflow: "hidden",
  },
  chatbotHeader: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatbotContent: {
    padding: theme.spacing(2),
  },
  chatbotTypeChip: {
    marginLeft: theme.spacing(1),
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
  },
  btnWrapper: {
    position: "relative",
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  addButton: {
    borderRadius: theme.spacing(2),
    textTransform: "none",
    fontWeight: 600,
    padding: theme.spacing(1.5, 3),
  },
  cancelButton: {
    borderRadius: theme.spacing(2),
    textTransform: "none",
    fontWeight: 600,
    padding: theme.spacing(1.5, 3),
  },
  helpText: {
    fontSize: "0.8rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    fontStyle: "italic",
  },
  infoAlert: {
    marginBottom: theme.spacing(2),
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.info.main}`,
  },
  stepperContainer: {
    marginTop: theme.spacing(2),
  },
  stepContent: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  mobileFab: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 1000,
    display: "none",
  },
}));

const QueueSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  color: Yup.string().min(3, "Too Short!").max(9, "Too Long!").required(),
  greetingMessage: Yup.string(),
  chatbots: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().min(4, "too short").required("Required"),
      })
    )
    .required("Must have friends"),
});

const QueueModal = ({ open, onClose, queueId, onEdit }) => {
  const classes = useStyles();
  const theme = useTheme();

  const initialState = {
    name: "",
    color: "#1976d2",
    greetingMessage: "",
    chatbots: [],
    outOfHoursMessage: "",
    orderQueue: "",
    tempoRoteador: 0,
    ativarRoteador: false,
    integrationId: "",
    fileListId: "",
    closeTicket: false
  };

  const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
  const [queue, setQueue] = useState(initialState);
  const greetingRef = useRef();
  const [activeStep, setActiveStep] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isStepContent, setIsStepContent] = useState(true);
  const [isNameEdit, setIsNamedEdit] = useState(null);
  const [isGreetingMessageEdit, setGreetingMessageEdit] = useState(null);
  const [queues, setQueues] = useState([]);

  const [integrations, setIntegrations] = useState([]);
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);
  const [tab, setTab] = useState(0);
  const [file, setFile] = useState([]);
  const { user, socket } = useContext(AuthContext);
  const [searchParam, setSearchParam] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedQueueOption, setSelectedQueueOption] = useState("");
  const [allQueues, setAllQueues] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const isMounted = useRef(true);

  const initialStateSchedule = [
    { weekday: i18n.t("queueModal.serviceHours.monday"), weekdayEn: "monday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.tuesday"), weekdayEn: "tuesday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.wednesday"), weekdayEn: "wednesday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.thursday"), weekdayEn: "thursday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.friday"), weekdayEn: "friday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: "Sábado", weekdayEn: "saturday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: "Domingo", weekdayEn: "sunday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" }
  ];

  const [schedules, setSchedules] = useState(initialStateSchedule);

  const companyId = user.companyId;

  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);

  useEffect(() => {
    // Temporarily set these to true to avoid errors
    setShowOpenAi(true);
    setShowIntegrations(true);
  }, []);

  useEffect(() => {
    // Temporarily enable schedules
    setSchedulesEnabled(true);
  }, []);

  useEffect(() => {
    if (queueId && isMounted.current) {
      const fetchQueue = async () => {
        try {
          const { data } = await api.get(`/queue/${queueId}`);
          setQueue(data);
          if (data.schedules) {
            setSchedules(data.schedules);
          }
      } catch (err) {
        toastError(err);
      }
      };
      fetchQueue();
    }
    if (!queueId) {
      setQueue(initialState);
      setSchedules(initialStateSchedule);
    }
  }, [queueId]);

  useEffect(() => {
    const loadQueues = async () => {
      try {
        const { data } = await api.get("/queue");
        setAllQueues(data);
        setQueues(data);
      } catch (err) {
        toastError(err);
      }
      };
      loadQueues();
  }, []);

  useEffect(() => {
      const fetchUsers = async () => {
      if (searchParam.length >= 3) {
        setLoading(true);
        try {
          const { data } = await api.get("/users/", {
            params: { searchParam },
          });
          setUserOptions(data.users);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      }
      if (searchParam.length === 0) {
        setUserOptions([]);
        }
      };
      fetchUsers();
  }, [searchParam]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const { data } = await api.get("/integration");
        setIntegrations(data || []);
      } catch (err) {
        console.log("Erro ao carregar integrações:", err);
        setIntegrations([]);
      }
    };
    fetchIntegrations();
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await api.get("/file");
        setFile(data || []);
      } catch (err) {
        console.log("Erro ao carregar arquivos:", err);
        setFile([]);
      }
    };
    fetchFiles();
  }, []);

  const handleClose = () => {
    setQueue(initialState);
    setSchedules(initialStateSchedule);
    setTab(0);
    onClose();
  };

  const handleSaveSchedules = async (values) => {
    try {
      await api.put(`/queue/${queueId}`, { schedules: values });
      toast.success(i18n.t("queueModal.success.schedules"));
    } catch (err) {
      toastError(err);
    }
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async (optionsId) => {
    try {
      await api.delete(`/queue-options/${optionsId}`);
      toast.success(i18n.t("queueModal.success.delete"));
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const handleSaveQueue = async (values) => {
    try {
      if (queueId) {
        await api.put(`/queue/${queueId}`, values);
        toast.success(i18n.t("queueModal.success.edit"));
      } else {
        const { data } = await api.post("/queue", values);
        toast.success(i18n.t("queueModal.success.add"));
        if (onEdit) {
          onEdit(data);
      }
      }
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveBot = async (values) => {
    try {
      await api.put(`/queue-options/${values.id}`, values);
      toast.success(i18n.t("queueModal.success.bot"));
    } catch (err) {
      toastError(err);
    }
  };

  const filterOptions = createFilterOptions({
    stringify: (option) => option.name,
  });

  const getChatbotTypeIcon = (type) => {
    switch (type) {
      case "text":
        return <Message />;
      case "queue":
        return <Queue />;
      case "attendent":
        return <People />;
      case "integration":
        return <Extension />;
      case "file":
        return <AttachFile />;
      default:
        return <Message />;
    }
  };

  const getChatbotTypeColor = (type) => {
    switch (type) {
      case "text":
        return blue[500];
      case "queue":
        return green[500];
      case "attendent":
        return orange[500];
      case "integration":
        return blue[700];
      case "file":
        return red[500];
      default:
        return blue[500];
    }
  };

  const renderBasicInfo = (values, setFieldValue, touched, errors) => (
    <Card className={classes.sectionCard}>
      <div className={classes.cardHeader}>
        <Typography className={classes.sectionTitle}>
          <Business /> Informações Básicas
        </Typography>
      </div>
      <div className={classes.cardContent}>
        <Grid container spacing={2} className={classes.formGrid}>
          <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
              label="Nome do Setor"
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    variant="outlined"
              fullWidth
                    className={classes.textField}
              placeholder="Ex: Suporte Técnico, Vendas, Financeiro"
                  />
          </Grid>
          <Grid item xs={12} md={6}>
            <div className={classes.colorField}>
                  <Field
                    as={TextField}
                label="Cor do Setor"
                    name="color"
                variant="outlined"
                fullWidth
                className={classes.textField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{ backgroundColor: values.color }}
                        className={classes.colorPreview}
                        onClick={() => setColorPickerModalOpen(true)}
                      />
                        </InputAdornment>
                      ),
                      endAdornment: (
                    <MuiIconButton
                      className={classes.colorPickerButton}
                      onClick={() => setColorPickerModalOpen(true)}
                        >
                          <Colorize />
                    </MuiIconButton>
                  ),
                }}
              />
            </div>
          </Grid>
        </Grid>
                  
                  <Field
                    as={TextField}
          label="Ordem da Fila"
                    name="orderQueue"
                    variant="outlined"
          fullWidth
          className={classes.textField}
          placeholder="Número para definir a prioridade do setor"
          helperText="Números menores têm maior prioridade"
        />
      </div>
    </Card>
  );

  const renderSettings = (values, setFieldValue) => (
    <Card className={classes.sectionCard}>
      <div className={classes.cardHeader}>
        <Typography className={classes.sectionTitle}>
          <Settings /> Configurações
        </Typography>
      </div>
      <div className={classes.cardContent}>
        <div className={classes.switchContainer}>
          <div className={classes.switchLabel}>
            <CheckCircle /> Fechar Ticket Automaticamente
          </div>
                  <FormControlLabel
                    control={
                      <Field
                        as={Switch}
                        color="primary"
                        name="closeTicket"
                        checked={values.closeTicket}
                      />
                    }
            label=""
          />
        </div>

        <div className={classes.switchContainer}>
          <div className={classes.switchLabel}>
            <Queue /> Ativar Rodízio de Atendimento
          </div>
                    <FormControlLabel
                      control={
                        <Field
                          as={Switch}
                          color="primary"
                          name="ativarRoteador"
                          checked={values.ativarRoteador}
                        />
                      }
            label=""
                    />
        </div>

        {values.ativarRoteador && (
          <FormControl fullWidth className={classes.selectField}>
            <InputLabel>Tempo de Rodízio</InputLabel>
                    <Field
                      as={Select}
                      name="tempoRoteador"
                      variant="outlined"
            >
              <MenuItem value={2}>2 minutos</MenuItem>
              <MenuItem value={5}>5 minutos</MenuItem>
              <MenuItem value={10}>10 minutos</MenuItem>
              <MenuItem value={15}>15 minutos</MenuItem>
              <MenuItem value={30}>30 minutos</MenuItem>
              <MenuItem value={45}>45 minutos</MenuItem>
              <MenuItem value={60}>60 minutos</MenuItem>
                    </Field>
          </FormControl>
        )}
                  </div>
    </Card>
  );

  const renderIntegrations = (values, setFieldValue) => (
    <Card className={classes.sectionCard}>
      <div className={classes.cardHeader}>
        <Typography className={classes.sectionTitle}>
          <Extension /> Integrações
        </Typography>
      </div>
      <div className={classes.cardContent}>
                    {showIntegrations && (
          <FormControl fullWidth className={classes.selectField}>
            <InputLabel>Integração</InputLabel>
                        <Field
                          as={Select}
                          name="integrationId"
              variant="outlined"
                        >
              <MenuItem value="">Nenhuma</MenuItem>
              {integrations && integrations.length > 0 && integrations.map((integration) => (
                            <MenuItem key={integration.id} value={integration.id}>
                              {integration.name}
                            </MenuItem>
                          ))}
                        </Field>
                      </FormControl>
                    )}

        <FormControl fullWidth className={classes.selectField}>
          <InputLabel>Lista de Arquivos</InputLabel>
                      <Field
                        as={Select}
                        name="fileListId"
            variant="outlined"
                      >
            <MenuItem value="">Nenhuma</MenuItem>
            {file && file.length > 0 && file.map(f => (
                          <MenuItem key={f.id} value={f.id}>
                            {f.name}
                          </MenuItem>
                        ))}
                      </Field>
                    </FormControl>
                  </div>
    </Card>
  );

  const renderGreetingMessage = (values, setFieldValue, touched, errors) => (
    <Card className={classes.sectionCard}>
      <div className={classes.cardHeader}>
        <Typography className={classes.sectionTitle}>
          <Message /> Mensagem de Saudação
        </Typography>
      </div>
      <div className={classes.cardContent}>
                    <Field
                      as={TextField}
          label="Mensagem de Boas-vindas"
                      name="greetingMessage"
                        multiline
          rows={4}
                        fullWidth
                        variant="outlined"
          className={classes.textField}
          placeholder="Digite a mensagem que será exibida quando um cliente entrar no setor..."
          helperText="Use variáveis como {{firstName}} para personalizar a mensagem"
        />
        
                 <Paper className={classes.infoAlert}>
           <Typography variant="body2">
             <strong>Dica:</strong> Personalize a mensagem para dar as boas-vindas aos clientes e orientá-los sobre como proceder.
           </Typography>
         </Paper>
                  </div>
    </Card>
  );

  const renderChatbots = (values, setFieldValue, touched, errors, isSubmitting) => (
    <div className={classes.chatbotSection}>
      <Card className={classes.sectionCard}>
        <div className={classes.cardHeader}>
          <Typography className={classes.sectionTitle}>
            <Message /> Chatbot e Opções
                  </Typography>
        </div>
        <div className={classes.cardContent}>
                     <Paper className={classes.infoAlert}>
             <Typography variant="body2">
               Configure opções de chatbot para automatizar respostas e direcionar clientes.
             </Typography>
           </Paper>

                    <FieldArray name="chatbots">
                      {({ push, remove }) => (
                        <>
                {values.chatbots.map((chatbot, index) => (
                  <Card key={index} className={classes.chatbotCard}>
                    <div className={classes.chatbotHeader}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {getChatbotTypeIcon(chatbot.queueType)}
                        <Typography variant="h6" style={{ marginLeft: 8 }}>
                          {chatbot.name || `Opção ${index + 1}`}
                        </Typography>
                        <Chip
                          label={chatbot.queueType || "text"}
                                          size="small"
                          className={classes.chatbotTypeChip}
                          style={{ backgroundColor: getChatbotTypeColor(chatbot.queueType) }}
                        />
                      </div>
                      <div>
                                          <IconButton
                                            size="small"
                          onClick={() => handleSaveBot(values)}
                                            disabled={isSubmitting}
                                          >
                                            <SaveIcon />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() => remove(index)}
                                            disabled={isSubmitting}
                                          >
                                            <DeleteOutline />
                                            </IconButton>
                                          </div>
                                            </div>
                    
                    <div className={classes.chatbotContent}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                                                  <Field
                                                    as={TextField}
                            name={`chatbots[${index}].name`}
                            label="Nome da Opção"
                                                    variant="outlined"
                                                    fullWidth
                                                    className={classes.textField}
                                                  />
                                                </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth className={classes.selectField}>
                            <InputLabel>Tipo</InputLabel>
                                                    <Field
                                                      as={Select}
                              name={`chatbots[${index}].queueType`}
                              variant="outlined"
                            >
                              <MenuItem value="text">Texto</MenuItem>
                              <MenuItem value="queue">Fila</MenuItem>
                              <MenuItem value="attendent">Atendente</MenuItem>
                              <MenuItem value="integration">Integração</MenuItem>
                              <MenuItem value="file">Arquivo</MenuItem>
                                                    </Field>
                                                  </FormControl>
                                                </Grid>
                        
                        <Grid item xs={12}>
                                                  <Field
                                                    as={TextField}
                                                    name={`chatbots[${index}].greetingMessage`}
                            label="Mensagem"
                                                    variant="outlined"
                                                    fullWidth
                                                    multiline
                            rows={3}
                                                    className={classes.textField}
                                                  />
                                                </Grid>

                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                                                  <Field
                                as={Checkbox}
                                color="primary"
                                name={`chatbots[${index}].closeTicket`}
                                checked={chatbot.closeTicket || false}
                              />
                            }
                            label="Fechar ticket após esta opção"
                                                  />
                                                </Grid>
                                                </Grid>
                    </div>
                  </Card>
                ))}

                <Button
                                                    variant="outlined"
                  color="primary"
                  startIcon={<Add />}
                  onClick={() => push({ name: "", queueType: "text", greetingMessage: "" })}
                  className={classes.addButton}
                                                    fullWidth
                >
                  Adicionar Opção
                </Button>
                                              </>
                                            )}
          </FieldArray>
        </div>
      </Card>
    </div>
  );

  return (
    <div className={classes.root}>
      <ConfirmationModal
        title={selectedQueue && `Excluir opção "${selectedQueue.name}"?`}
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        Tem certeza que deseja excluir esta opção? Esta ação não pode ser desfeita.
      </ConfirmationModal>

      <Dialog
        maxWidth="lg"
        fullWidth
        open={open}
        onClose={handleClose}
        scroll="paper"
        className={classes.modal}
      >
        <div className={classes.header}>
          <Typography className={classes.headerTitle}>
            {queueId ? "Editar Setor" : "Novo Setor"}
          </Typography>
          <Typography className={classes.headerSubtitle}>
            Configure as informações e opções do setor de atendimento
          </Typography>
                  </div>

        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          className={classes.tabs}
          variant="fullWidth"
        >
          <Tab label="Dados do Setor" />
          {schedulesEnabled && <Tab label="Horários" />}
        </Tabs>

        {tab === 0 && (
          <div className={classes.tabContent}>
            <Formik
              initialValues={queue}
              validateOnChange={false}
              enableReinitialize={true}
              validationSchema={QueueSchema}
              onSubmit={(values, actions) => {
                setTimeout(() => {
                  handleSaveQueue(values);
                  actions.setSubmitting(false);
                }, 400);
              }}
            >
              {({ setFieldValue, touched, errors, isSubmitting, values, handleChange, handleBlur, ...formikProps }) => (
                <Form>
                  {renderBasicInfo(values, setFieldValue, touched, errors)}
                  {renderSettings(values, setFieldValue)}
                  {renderIntegrations(values, setFieldValue)}
                  {renderGreetingMessage(values, setFieldValue, touched, errors)}
                  {renderChatbots(values, setFieldValue, touched, errors, isSubmitting)}

                  <div className={classes.actionButtons}>
                  <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                      className={classes.cancelButton}
                      variant="outlined"
                  >
                      Cancelar
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting}
                    variant="contained"
                      className={`${classes.addButton} ${classes.btnWrapper}`}
                      startIcon={<Save />}
                  >
                      {queueId ? "Salvar Alterações" : "Criar Setor"}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />
                    )}
                  </Button>
                  </div>

                  <ColorBoxModal
                    open={colorPickerModalOpen}
                    handleClose={() => setColorPickerModalOpen(false)}
                    onChange={(color) => {
                      if (color && color.hex) {
                        setFieldValue("color", `#${color.hex}`);
                      }
                    }}
                    currentColor={values.color}
                  />
              </Form>
            )}
          </Formik>
          </div>
        )}

        {tab === 1 && (
          <div className={classes.tabContent}>
            <Card className={classes.sectionCard}>
              <div className={classes.cardHeader}>
                <Typography className={classes.sectionTitle}>
                  <Schedule /> Horários de Funcionamento
                </Typography>
              </div>
              <div className={classes.cardContent}>
            <SchedulesForm
              loading={false}
              onSubmit={handleSaveSchedules}
              initialValues={schedules}
                  labelSaveButton="Salvar Horários"
            />
              </div>
            </Card>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default QueueModal;