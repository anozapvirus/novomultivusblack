import React, { useState, useContext, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  makeStyles,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper
} from "@material-ui/core";
import {
  CloudDownload,
  Schedule,
  Group,
  Close,
  Info,
  Warning,
  CheckCircle,
  Error,
  AccessTime,
  Storage,
  Speed,
  Timeline
} from "@material-ui/icons";
import { i18n } from "../../translate/i18n";
import moment from "moment";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiDialog-paper": {
      minWidth: 600,
      maxWidth: 800,
      width: "100%"
    }
  },
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  },
  titleText: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  content: {
    padding: theme.spacing(3)
  },
  section: {
    marginBottom: theme.spacing(3)
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    fontWeight: 600
  },
  dateField: {
    marginBottom: theme.spacing(2)
  },
  optionsCard: {
    marginBottom: theme.spacing(2)
  },
  optionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1, 0)
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  statusCard: {
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.grey[50]
  },
  progressContainer: {
    marginTop: theme.spacing(2)
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1)
  },
  statsGrid: {
    marginTop: theme.spacing(2)
  },
  statItem: {
    textAlign: "center",
    padding: theme.spacing(1)
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: theme.palette.primary.main
  },
  statLabel: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary
  },
  alert: {
    marginBottom: theme.spacing(2)
  },
  actions: {
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  importButton: {
    minWidth: 120
  },
  tipsContainer: {
    backgroundColor: theme.palette.info.light,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2)
  },
  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  tipIcon: {
    marginTop: 2,
    fontSize: "1rem"
  }
}));

const ImportMessagesModal = ({ open, onClose, whatsApp, onImportComplete }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [queues, setQueues] = useState([]);
  
  const [importConfig, setImportConfig] = useState({
    importOldMessages: moment().subtract(30, "days").format("YYYY-MM-DDTHH:mm"),
    importRecentMessages: moment().format("YYYY-MM-DDTHH:mm"),
    importOldMessagesGroups: false,
    closedTicketsPostImported: true,
    queueIdImportMessages: 0
  });
  
  const [importStatus, setImportStatus] = useState({
    isImporting: false,
    progress: 0,
    current: 0,
    total: 0,
    currentDate: null,
    phase: "idle" // idle, preparing, importing, completed, error
  });

  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/queue");
        setQueues(data);
      } catch (err) {
        toastError(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (whatsApp) {
      setImportConfig({
        importOldMessages: whatsApp.importOldMessages || moment().subtract(30, "days").format("YYYY-MM-DDTHH:mm"),
        importRecentMessages: whatsApp.importRecentMessages || moment().format("YYYY-MM-DDTHH:mm"),
        importOldMessagesGroups: whatsApp.importOldMessagesGroups || false,
        closedTicketsPostImported: whatsApp.closedTicketsPostImported !== false,
        queueIdImportMessages: whatsApp.queueIdImportMessages || 0
      });
    }
  }, [whatsApp]);

  const handleConfigChange = (field, value) => {
    setImportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartImport = async () => {
    try {
      setImportStatus(prev => ({ ...prev, isImporting: true, phase: "preparing" }));
      
      const response = await api.put(`/whatsapp/${whatsApp.id}`, {
        ...importConfig,
        importOldMessagesEnable: true
      });

      if (response.status === 200) {
        setImportStatus(prev => ({ ...prev, phase: "importing" }));
        onImportComplete && onImportComplete();
      }
    } catch (error) {
      toastError(error);
      setImportStatus(prev => ({ ...prev, isImporting: false, phase: "error" }));
    }
  };

  const handleClose = () => {
    if (!importStatus.isImporting) {
      onClose();
    }
  };

  const getPhaseIcon = () => {
    switch (importStatus.phase) {
      case "preparing":
        return <AccessTime color="primary" />;
      case "importing":
        return <Speed color="primary" />;
      case "completed":
        return <CheckCircle color="primary" />;
      case "error":
        return <Error color="error" />;
      default:
        return <Storage />;
    }
  };

  const getPhaseText = () => {
    switch (importStatus.phase) {
      case "preparing":
        return "Preparando mensagens para importação...";
      case "importing":
        return "Importando mensagens...";
      case "completed":
        return "Importação concluída!";
      case "error":
        return "Erro na importação";
      default:
        return "Aguardando início da importação";
    }
  };

  const calculateEstimatedTime = () => {
    if (importStatus.current === 0 || importStatus.total === 0) return "Calculando...";
    
    const progress = importStatus.current / importStatus.total;
    if (progress === 0) return "Calculando...";
    
    const elapsed = Date.now() - importStatus.startTime;
    const estimated = elapsed / progress;
    const remaining = estimated - elapsed;
    
    return moment.duration(remaining).humanize();
  };

  return (
    <Dialog open={open} onClose={handleClose} className={classes.root} maxWidth="md" fullWidth>
      <div className={classes.title}>
        <div className={classes.titleText}>
          <CloudDownload />
          <Typography variant="h6">
            Importar Mensagens do WhatsApp
          </Typography>
        </div>
        <IconButton onClick={handleClose} color="inherit" size="small">
          <Close />
        </IconButton>
      </div>

      <DialogContent className={classes.content}>
        {/* Configurações de Importação */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            <Schedule />
            Período de Importação
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Início"
                type="datetime-local"
                value={importConfig.importOldMessages}
                onChange={(e) => handleConfigChange("importOldMessages", e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                className={classes.dateField}
                inputProps={{
                  max: moment().format("YYYY-MM-DDTHH:mm"),
                  min: moment().subtract(2, "years").format("YYYY-MM-DDTHH:mm")
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Fim"
                type="datetime-local"
                value={importConfig.importRecentMessages}
                onChange={(e) => handleConfigChange("importRecentMessages", e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                className={classes.dateField}
                inputProps={{
                  max: moment().format("YYYY-MM-DDTHH:mm"),
                  min: importConfig.importOldMessages
                }}
              />
            </Grid>
          </Grid>
        </div>

        {/* Opções de Importação */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            <Info />
            Opções de Importação
          </Typography>
          
          <Card className={classes.optionsCard}>
            <CardContent>
              <div className={classes.optionItem}>
                <div className={classes.optionLabel}>
                  <Group />
                  <Typography>Importar mensagens de grupos</Typography>
                </div>
                <Switch
                  checked={importConfig.importOldMessagesGroups}
                  onChange={(e) => handleConfigChange("importOldMessagesGroups", e.target.checked)}
                  color="primary"
                />
              </div>
              
              <Divider style={{ margin: "16px 0" }} />
              
              <div className={classes.optionItem}>
                <div className={classes.optionLabel}>
                  <CheckCircle />
                  <Typography>Encerrar tickets após importação</Typography>
                </div>
                <Switch
                  checked={importConfig.closedTicketsPostImported}
                  onChange={(e) => handleConfigChange("closedTicketsPostImported", e.target.checked)}
                  color="primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fila de Destino */}
        <div className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            <Timeline />
            Fila de Destino
          </Typography>
          
          <FormControl fullWidth variant="outlined">
            <InputLabel>Selecionar Fila</InputLabel>
            <Select
              value={importConfig.queueIdImportMessages}
              onChange={(e) => handleConfigChange("queueIdImportMessages", e.target.value)}
              label="Selecionar Fila"
            >
              <MenuItem value={0}>Sem fila específica</MenuItem>
              {queues.map(queue => (
                <MenuItem key={queue.id} value={queue.id}>
                  {queue.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Status da Importação */}
        {importStatus.isImporting && (
          <div className={classes.section}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {getPhaseIcon()}
              Status da Importação
            </Typography>
            
            <Card className={classes.statusCard}>
              <CardContent>
                <Typography variant="h6" align="center" gutterBottom>
                  {getPhaseText()}
                </Typography>
                
                {importStatus.phase === "importing" && (
                  <div className={classes.progressContainer}>
                    <div className={classes.progressInfo}>
                      <Typography variant="body2">
                        {importStatus.current} de {importStatus.total} mensagens
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(importStatus.progress)}%
                      </Typography>
                    </div>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={importStatus.progress} 
                      style={{ height: 8, borderRadius: 4 }}
                    />
                    
                    {importStatus.currentDate && (
                      <Typography variant="body2" align="center" style={{ marginTop: 8 }}>
                        Processando mensagem de: {moment(importStatus.currentDate).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    )}
                  </div>
                )}
                
                <Grid container spacing={2} className={classes.statsGrid}>
                  <Grid item xs={4}>
                    <div className={classes.statItem}>
                      <div className={classes.statValue}>{importStatus.current}</div>
                      <div className={classes.statLabel}>Processadas</div>
                    </div>
                  </Grid>
                  <Grid item xs={4}>
                    <div className={classes.statItem}>
                      <div className={classes.statValue}>{importStatus.total}</div>
                      <div className={classes.statLabel}>Total</div>
                    </div>
                  </Grid>
                  <Grid item xs={4}>
                    <div className={classes.statItem}>
                      <div className={classes.statValue}>
                        {importStatus.phase === "importing" ? calculateEstimatedTime() : "-"}
                      </div>
                      <div className={classes.statLabel}>Tempo Restante</div>
                    </div>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertas e Dicas */}
        <Paper 
          elevation={1} 
          className={classes.alert}
          style={{ 
            backgroundColor: '#fff3e0',
            border: '1px solid #ff9800',
            padding: 16
          }}
        >
          <Typography variant="body2" style={{ color: '#e65100' }}>
            <strong>Atenção:</strong> Ao iniciar a importação, sua conexão será encerrada e será necessário 
            ler novamente o QR Code para continuar usando o WhatsApp.
          </Typography>
        </Paper>

        {showTips && (
          <div className={classes.tipsContainer}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Dicas para uma importação eficiente:
            </Typography>
            <div className={classes.tipItem}>
              <Info className={classes.tipIcon} />
              <Typography variant="body2">
                Importe períodos menores para melhor performance
              </Typography>
            </div>
            <div className={classes.tipItem}>
              <Info className={classes.tipIcon} />
              <Typography variant="body2">
                Evite importar durante horários de pico de uso
              </Typography>
            </div>
            <div className={classes.tipItem}>
              <Info className={classes.tipIcon} />
              <Typography variant="body2">
                Mantenha a conexão estável durante todo o processo
              </Typography>
            </div>
          </div>
        )}
      </DialogContent>

      <div className={classes.actions}>
        <Button onClick={() => setShowTips(!showTips)} color="primary">
          {showTips ? "Ocultar Dicas" : "Mostrar Dicas"}
        </Button>
        
        <div>
          <Button onClick={handleClose} disabled={importStatus.isImporting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartImport}
            disabled={importStatus.isImporting}
            className={classes.importButton}
            startIcon={importStatus.isImporting ? <CircularProgress size={16} /> : <CloudDownload />}
          >
            {importStatus.isImporting ? "Importando..." : "Iniciar Importação"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ImportMessagesModal; 