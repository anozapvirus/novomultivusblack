import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button
} from "@material-ui/core";
import {
  Schedule,
  Business,
  Queue,
  WhatsApp,
  Info,
  CheckCircle,
  Warning,
  Close
} from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import moment from "moment";
import "moment/locale/pt-br";
import api from "../../services/api";
import { toast } from "react-toastify";

moment.locale("pt-br");

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  statusCard: {
    marginBottom: theme.spacing(2),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
  statusActive: {
    borderLeftColor: theme.palette.success.main,
  },
  statusInactive: {
    borderLeftColor: theme.palette.error.main,
  },
  statusWarning: {
    borderLeftColor: theme.palette.warning.main,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  refreshButton: {
    marginBottom: theme.spacing(2),
  },
}));

const DebugSchedule = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [currentTime] = useState(moment());

  const loadDebugData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/debug/schedule");
      setDebugData(data);
    } catch (error) {
      toast.error("Erro ao carregar dados de debug");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "primary";
      case "inactive":
        return "secondary";
      case "warning":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle />;
      case "inactive":
        return <Close />;
      case "warning":
        return <Warning />;
      default:
        return <Info />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Debug - Sistema de Horário de Funcionamento
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={loadDebugData}
        className={classes.refreshButton}
        disabled={loading}
      >
        Atualizar Dados
      </Button>

      {debugData && (
        <Grid container spacing={3}>
          {/* Informações Gerais */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Info /> Informações Gerais
                </Typography>
                <Divider style={{ marginBottom: 16 }} />
                
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Horário Atual:
                  </Typography>
                  <Typography variant="h6">
                    {currentTime.format("DD/MM/YYYY HH:mm:ss")}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Dia da Semana:
                  </Typography>
                  <Typography variant="h6">
                    {currentTime.format("dddd")} ({currentTime.format("dddd").toLowerCase()})
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Fuso Horário:
                  </Typography>
                  <Typography variant="h6">
                    {currentTime.format("Z")} ({currentTime.format("z")})
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuração da Empresa */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Business /> Configuração da Empresa
                </Typography>
                <Divider style={{ marginBottom: 16 }} />
                
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Nome:
                  </Typography>
                  <Typography variant="h6">
                    {debugData.company.name}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Tipo de Configuração:
                  </Typography>
                  <Chip
                    icon={<Schedule />}
                    label={debugData.company.scheduleType}
                    color={debugData.company.scheduleType === "disabled" ? "secondary" : "primary"}
                    className={classes.chip}
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Mensagem de Ausência:
                  </Typography>
                  <Typography variant="body1">
                    {debugData.company.outOfHoursMessage || "Não configurada"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Status dos Horários */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Schedule /> Status dos Horários
                </Typography>
                <Divider style={{ marginBottom: 16 }} />

                {/* Status da Empresa */}
                {debugData.testResults.company && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      <Business /> Empresa
                    </Typography>
                    <Card className={`${classes.statusCard} ${classes[`status${debugData.testResults.company.currentStatus === "active" ? "Active" : "Inactive"}`]}`}>
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="h6">
                              {debugData.testResults.company.currentStatus === "active" ? "Dentro do Horário" : "Fora do Horário"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {debugData.testResults.company.currentSchedule ? 
                                `Horário: ${debugData.testResults.company.currentSchedule.startTimeA} - ${debugData.testResults.company.currentSchedule.endTimeA}` :
                                "Horário não configurado"
                              }
                            </Typography>
                          </Box>
                          <Chip
                            icon={getStatusIcon(debugData.testResults.company.currentStatus)}
                            label={debugData.testResults.company.currentStatus}
                            color={getStatusColor(debugData.testResults.company.currentStatus)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Status das Filas */}
                {debugData.testResults.queues && debugData.testResults.queues.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      <Queue /> Filas
                    </Typography>
                    {debugData.testResults.queues.map((queue) => (
                      <Card key={queue.id} className={`${classes.statusCard} ${classes[`status${queue.currentStatus === "active" ? "Active" : "Inactive"}`]}`}>
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <Typography variant="h6">
                                {queue.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {queue.currentStatus === "active" ? "Dentro do Horário" : "Fora do Horário"}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {queue.outOfHoursMessage || "Mensagem padrão"}
                              </Typography>
                            </Box>
                            <Chip
                              icon={getStatusIcon(queue.currentStatus)}
                              label={queue.currentStatus}
                              color={getStatusColor(queue.currentStatus)}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* Status das Conexões */}
                {debugData.testResults.whatsapps && debugData.testResults.whatsapps.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      <WhatsApp /> Conexões
                    </Typography>
                    {debugData.testResults.whatsapps.map((whatsapp) => (
                      <Card key={whatsapp.id} className={`${classes.statusCard} ${classes[`status${whatsapp.currentStatus === "active" ? "Active" : "Inactive"}`]}`}>
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <Typography variant="h6">
                                {whatsapp.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {whatsapp.currentStatus === "active" ? "Dentro do Horário" : "Fora do Horário"}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {whatsapp.outOfHoursMessage || "Mensagem padrão"}
                              </Typography>
                            </Box>
                            <Chip
                              icon={getStatusIcon(whatsapp.currentStatus)}
                              label={whatsapp.currentStatus}
                              color={getStatusColor(whatsapp.currentStatus)}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Alertas */}
          <Grid item xs={12}>
            {debugData.company.scheduleType === "disabled" && (
              <Alert severity="warning">
                Sistema de horário de funcionamento está desabilitado. 
                Para ativar, configure o tipo de horário nas configurações da empresa.
              </Alert>
            )}
            
            {debugData.company.scheduleType !== "disabled" && 
             (!debugData.company.outOfHoursMessage || debugData.company.outOfHoursMessage.trim() === "") && (
              <Alert severity="info">
                Mensagem de ausência não configurada. 
                Configure uma mensagem personalizada para quando estiver fora do horário.
              </Alert>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DebugSchedule; 