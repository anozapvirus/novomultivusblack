import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  makeStyles,
  Paper,
  CircularProgress
} from "@material-ui/core";
import {
  Schedule,
  Business,
  Queue,
  WhatsApp,
  AccessTime,
  Info,
  CheckCircle,
  Warning,
  Close,
  Save,
  Refresh
} from "@material-ui/icons";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import moment from "moment";
import SchedulesForm from "../SchedulesForm";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 800,
    maxWidth: 1200,
  },
  dialogTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2, 3),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  titleContent: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  closeButton: {
    color: theme.palette.primary.contrastText,
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
  sectionCard: {
    marginBottom: theme.spacing(3),
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[2],
  },
  sectionHeader: {
    backgroundColor: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    fontWeight: 600,
  },
  sectionContent: {
    padding: theme.spacing(2),
  },
  configTypeCard: {
    marginBottom: theme.spacing(2),
    border: `2px solid ${theme.palette.divider}`,
    transition: "all 0.3s ease",
    cursor: "pointer",
    "&:hover": {
      borderColor: theme.palette.primary.main,
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[4],
    },
    "&.selected": {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.light + "10",
    },
  },
  configTypeHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2),
  },
  configTypeInfo: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  configTypeIcon: {
    fontSize: 32,
    color: theme.palette.primary.main,
  },
  configTypeDetails: {
    flex: 1,
  },
  configTypeTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  configTypeDescription: {
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
  },
  statusChip: {
    marginLeft: theme.spacing(1),
  },
  formGrid: {
    marginTop: theme.spacing(2),
  },
  textField: {
    marginBottom: theme.spacing(2),
  },
  alert: {
    marginBottom: theme.spacing(2),
    borderRadius: theme.spacing(1),
  },
  previewCard: {
    backgroundColor: theme.palette.grey[50],
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  previewTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  previewContent: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  saveButton: {
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
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
}));

const ScheduleConfigModal = ({ open, onClose, onSave }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configType, setConfigType] = useState("disabled");
  const [selectedQueue, setSelectedQueue] = useState("");
  const [selectedWhatsApp, setSelectedWhatsApp] = useState("");
  const [queues, setQueues] = useState([]);
  const [whatsapps, setWhatsapps] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState("");
  const [schedules, setSchedules] = useState([]);

  const configTypes = [
    {
      value: "disabled",
      title: "Desabilitado",
      description: "Sistema de horário de funcionamento desabilitado",
      icon: <Close />,
      color: "default"
    },
    {
      value: "company",
      title: "Por Empresa",
      description: "Horário único para toda a empresa",
      icon: <Business />,
      color: "primary"
    },
    {
      value: "queue",
      title: "Por Fila",
      description: "Horário específico para cada fila/setor",
      icon: <Queue />,
      color: "secondary"
    },
    {
      value: "connection",
      title: "Por Conexão",
      description: "Horário específico para cada conexão WhatsApp",
      icon: <WhatsApp />,
      color: "primary"
    }
  ];

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (configType !== "disabled") {
      loadCurrentSchedule();
    }
  }, [configType, selectedQueue, selectedWhatsApp]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar configurações da empresa
      const { data: settings } = await api.get(`/companySettings/${user.companyId}`);
      setCompanySettings(settings);
      setConfigType(settings.scheduleType || "disabled");
      setOutOfHoursMessage(settings.outOfHoursMessage || "");

      // Carregar filas
      const { data: queuesData } = await api.get("/queue");
      setQueues(queuesData);

      // Carregar conexões
      const { data: whatsappsData } = await api.get("/whatsapp");
      setWhatsapps(whatsappsData);

    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSchedule = async () => {
    try {
      let scheduleData = null;
      
      if (configType === "company") {
        const { data } = await api.get("/company");
        scheduleData = data.schedules || [];
        setOutOfHoursMessage(data.outOfHoursMessage || "");
      } else if (configType === "queue" && selectedQueue) {
        const { data } = await api.get(`/queue/${selectedQueue}`);
        scheduleData = data.schedules || [];
        setOutOfHoursMessage(data.outOfHoursMessage || "");
      } else if (configType === "connection" && selectedWhatsApp) {
        const { data } = await api.get(`/whatsapp/${selectedWhatsApp}`);
        scheduleData = data.schedules || [];
        setOutOfHoursMessage(data.outOfHoursMessage || "");
      }

      setSchedules(scheduleData);
      setCurrentSchedule(scheduleData);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
    }
  };

  const handleConfigTypeChange = (newType) => {
    setConfigType(newType);
    setSelectedQueue("");
    setSelectedWhatsApp("");
    setSchedules([]);
    setCurrentSchedule(null);
  };

  const handleQueueChange = async (queueId) => {
    setSelectedQueue(queueId);
    if (queueId) {
      await loadCurrentSchedule();
    }
  };

  const handleWhatsAppChange = async (whatsappId) => {
    setSelectedWhatsApp(whatsappId);
    if (whatsappId) {
      await loadCurrentSchedule();
    }
  };

  const handleSchedulesSave = (newSchedules) => {
    setSchedules(newSchedules);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Salvar configuração de tipo
      await api.put("/companySettings", {
        companyId: user.companyId,
        column: "scheduleType",
        data: configType
      });

      // Salvar horários e mensagem de ausência
      if (configType === "company") {
        await api.put("/company", {
          schedules: schedules,
          outOfHoursMessage: outOfHoursMessage
        });
      } else if (configType === "queue" && selectedQueue) {
        await api.put(`/queue/${selectedQueue}`, {
          schedules: schedules,
          outOfHoursMessage: outOfHoursMessage
        });
      } else if (configType === "connection" && selectedWhatsApp) {
        await api.put(`/whatsapp/${selectedWhatsApp}`, {
          schedules: schedules,
          outOfHoursMessage: outOfHoursMessage
        });
      }

      if (onSave) {
        onSave();
      }
      
      onClose();
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentStatus = () => {
    if (configType === "disabled") return "disabled";
    if (!schedules || schedules.length === 0) return "warning";
    return "active";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "primary";
      case "warning": return "default";
      case "disabled": return "secondary";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active": return <CheckCircle />;
      case "warning": return <Warning />;
      case "disabled": return <Close />;
      default: return <Info />;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className={classes.root}>
      <DialogTitle className={classes.dialogTitle}>
        <div className={classes.titleContent}>
          <Schedule />
          <Typography variant="h6">
            Configuração de Horário de Funcionamento
          </Typography>
        </div>
        <IconButton onClick={onClose} className={classes.closeButton}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Tipo de Configuração */}
        <Card className={classes.sectionCard}>
          <div className={classes.sectionHeader}>
            <Typography className={classes.sectionTitle}>
              <Info /> Tipo de Configuração
            </Typography>
          </div>
          <div className={classes.sectionContent}>
            <Grid container spacing={2}>
              {configTypes.map((type) => (
                <Grid item xs={12} md={6} key={type.value}>
                  <Card
                    className={`${classes.configTypeCard} ${
                      configType === type.value ? "selected" : ""
                    }`}
                    onClick={() => handleConfigTypeChange(type.value)}
                  >
                    <div className={classes.configTypeHeader}>
                      <div className={classes.configTypeInfo}>
                        <div className={classes.configTypeIcon}>
                          {type.icon}
                        </div>
                        <div className={classes.configTypeDetails}>
                          <Typography className={classes.configTypeTitle}>
                            {type.title}
                          </Typography>
                          <Typography className={classes.configTypeDescription}>
                            {type.description}
                          </Typography>
                        </div>
                      </div>
                      {configType === type.value && (
                        <Chip
                          label="Ativo"
                          color="primary"
                          size="small"
                          icon={<CheckCircle />}
                        />
                      )}
                    </div>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        </Card>

        {/* Configuração Específica */}
        {configType !== "disabled" && (
          <Card className={classes.sectionCard}>
            <div className={classes.sectionHeader}>
              <Typography className={classes.sectionTitle}>
                <AccessTime /> Configuração de Horários
              </Typography>
              <Chip
                label={configTypes.find(t => t.value === configType)?.title}
                color={getStatusColor(getCurrentStatus())}
                icon={getStatusIcon(getCurrentStatus())}
                className={classes.statusChip}
              />
            </div>
            <div className={classes.sectionContent}>
              <Grid container spacing={2} className={classes.formGrid}>
                {/* Seleção de Fila ou Conexão */}
                {configType === "queue" && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Selecionar Fila</InputLabel>
                      <Select
                        value={selectedQueue}
                        onChange={(e) => handleQueueChange(e.target.value)}
                        label="Selecionar Fila"
                      >
                        {queues.map((queue) => (
                          <MenuItem key={queue.id} value={queue.id}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                width={16}
                                height={16}
                                borderRadius="50%"
                                bgcolor={queue.color}
                              />
                              {queue.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {configType === "connection" && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Selecionar Conexão</InputLabel>
                      <Select
                        value={selectedWhatsApp}
                        onChange={(e) => handleWhatsAppChange(e.target.value)}
                        label="Selecionar Conexão"
                      >
                        {whatsapps.map((whatsapp) => (
                          <MenuItem key={whatsapp.id} value={whatsapp.id}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <WhatsApp style={{ color: "#25d366" }} />
                              {whatsapp.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Mensagem de Ausência */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    label="Mensagem de Ausência"
                    placeholder="Digite a mensagem que será enviada quando estiver fora do horário de funcionamento..."
                    value={outOfHoursMessage}
                    onChange={(e) => setOutOfHoursMessage(e.target.value)}
                    className={classes.textField}
                    helperText="Esta mensagem será enviada automaticamente quando o cliente entrar em contato fora do horário de funcionamento"
                  />
                </Grid>

                {/* Configuração de Horários */}
                {(configType === "company" || 
                  (configType === "queue" && selectedQueue) || 
                  (configType === "connection" && selectedWhatsApp)) && (
                  <Grid item xs={12}>
                    <Divider style={{ margin: "16px 0" }} />
                    <Typography variant="h6" gutterBottom>
                      Horários de Funcionamento
                    </Typography>
                    <SchedulesForm
                      initialValues={schedules}
                      onSubmit={handleSchedulesSave}
                      loading={false}
                      labelSaveButton="Salvar Horários"
                    />
                  </Grid>
                )}
              </Grid>

              {/* Preview */}
              {schedules && schedules.length > 0 && (
                <Paper className={classes.previewCard}>
                  <Typography className={classes.previewTitle}>
                    <Info /> Preview dos Horários
                  </Typography>
                  <div className={classes.previewContent}>
                    {schedules.map((schedule, index) => (
                      <div key={index}>
                        <strong>{schedule.weekday}:</strong>{" "}
                        {schedule.startTimeA && schedule.endTimeA 
                          ? `${schedule.startTimeA} - ${schedule.endTimeA}`
                          : "Fechado"
                        }
                        {schedule.startTimeB && schedule.endTimeB && (
                          <span> | {schedule.startTimeB} - {schedule.endTimeB}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Paper>
              )}
            </div>
          </Card>
        )}

        {/* Alertas */}
        {configType !== "disabled" && (
          <Paper 
            className={classes.alert}
            style={{
              backgroundColor: "#e3f2fd",
              border: "1px solid #2196f3",
              color: "#1976d2",
              padding: "16px",
              borderRadius: "8px"
            }}
          >
            <Typography variant="body2">
              <strong>Como funciona:</strong> Quando um cliente enviar uma mensagem fora do horário configurado, 
              o sistema automaticamente enviará a mensagem de ausência e o ticket será marcado como "fora do horário".
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions className={classes.actionButtons}>
        <Button
          onClick={onClose}
          className={classes.cancelButton}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          className={classes.saveButton}
          disabled={saving || configType === "disabled"}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
        >
          {saving ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleConfigModal; 