import React, { useEffect, useState, useContext } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";

import useSettings from "../../hooks/useSettings";

import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";

import { Tab, Tabs, TextField as MuiTextField } from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import useCompanySettings from "../../hooks/useSettings/companySettings";

import { Paper, Typography, Button, Box } from "@material-ui/core";
import { Settings as SettingsIcon, Headset, Message, Security, Info, Schedule } from "@material-ui/icons";
import ScheduleConfigModal from "../ScheduleConfigModal/index.js";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  sectionCard: {
    marginBottom: theme.spacing(3),
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[3],
    overflow: "hidden",
  },
  sectionHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  sectionContent: {
    padding: theme.spacing(3),
  },
  settingItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:last-child": {
      borderBottom: "none",
    },
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: theme.spacing(1),
    },
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: "1rem",
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  settingDescription: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
  settingControl: {
    minWidth: 200,
    [theme.breakpoints.down("sm")]: {
      minWidth: "100%",
    },
  },
  formControl: {
    minWidth: 200,
    [theme.breakpoints.down("sm")]: {
      minWidth: "100%",
    },
  },
  textField: {
    width: "100%",
  },
  switchControl: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  statusChip: {
    fontWeight: 500,
  },
  loadingSpinner: {
    marginLeft: theme.spacing(1),
  },
  infoBox: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  warningBox: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  gridContainer: {
    marginTop: theme.spacing(2),
  },
}));

export default function Options(props) {
  const { oldSettings, settings, scheduleTypeChanged, user } = props;

  const classes = useStyles();
  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("connection");
  const [chatBotType, setChatBotType] = useState("text");

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);

  const [userCreation, setUserCreation] = useState("disabled");
  const [loadingUserCreation, setLoadingUserCreation] = useState(false);

  const [SendGreetingAccepted, setSendGreetingAccepted] = useState("enabled");
  const [loadingSendGreetingAccepted, setLoadingSendGreetingAccepted] = useState(false);

  const [UserRandom, setUserRandom] = useState("disabled");
  const [loadingUserRandom, setLoadingUserRandom] = useState(false);

  const [SettingsTransfTicket, setSettingsTransfTicket] = useState("disabled");
  const [loadingSettingsTransfTicket, setLoadingSettingsTransfTicket] = useState(false);

  const [AcceptCallWhatsapp, setAcceptCallWhatsapp] = useState("enabled");
  const [loadingAcceptCallWhatsapp, setLoadingAcceptCallWhatsapp] = useState(false);

  const [sendSignMessage, setSendSignMessage] = useState("enabled");
  const [loadingSendSignMessage, setLoadingSendSignMessage] = useState(false);

  const [sendGreetingMessageOneQueues, setSendGreetingMessageOneQueues] = useState("enabled");
  const [loadingSendGreetingMessageOneQueues, setLoadingSendGreetingMessageOneQueues] = useState(false);

  const [sendQueuePosition, setSendQueuePosition] = useState("disabled");
  const [loadingSendQueuePosition, setLoadingSendQueuePosition] = useState(false);

  const [sendFarewellWaitingTicket, setSendFarewellWaitingTicket] = useState("disabled");
  const [loadingSendFarewellWaitingTicket, setLoadingSendFarewellWaitingTicket] = useState(false);

  const [acceptAudioMessageContact, setAcceptAudioMessageContact] = useState("enabled");
  const [loadingAcceptAudioMessageContact, setLoadingAcceptAudioMessageContact] = useState(false);

  //LGPD
  const [enableLGPD, setEnableLGPD] = useState("disabled");
  const [loadingEnableLGPD, setLoadingEnableLGPD] = useState(false);

  const [lgpdMessage, setLGPDMessage] = useState("");
  const [loadinglgpdMessage, setLoadingLGPDMessage] = useState(false);

  const [lgpdLink, setLGPDLink] = useState("");
  const [loadingLGPDLink, setLoadingLGPDLink] = useState(false);

  const [lgpdDeleteMessage, setLGPDDeleteMessage] = useState("disabled");
  const [loadingLGPDDeleteMessage, setLoadingLGPDDeleteMessage] = useState(false);

  //LIMITAR DOWNLOAD
  const [downloadLimit, setdownloadLimit] = useState("64");
  const [loadingDownloadLimit, setLoadingdownloadLimit] = useState(false);

  const [lgpdConsent, setLGPDConsent] = useState("disabled");
  const [loadingLGPDConsent, setLoadingLGPDConsent] = useState(false);

  const [lgpdHideNumber, setLGPDHideNumber] = useState("disabled");
  const [loadingLGPDHideNumber, setLoadingLGPDHideNumber] = useState(false);

  // Tag obrigatoria
  const [requiredTag, setRequiredTag] = useState("disabled")
  const [loadingRequiredTag, setLoadingRequiredTag] = useState(false)

  // Fechar ticket ao transferir para outro setor
  const [closeTicketOnTransfer, setCloseTicketOnTransfer] = useState(false)
  const [loadingCloseTicketOnTransfer, setLoadingCloseTicketOnTransfer] = useState(false)

  // Usar carteira de clientes
  const [directTicketsToWallets, setDirectTicketsToWallets] = useState(false)
  const [loadingDirectTicketsToWallets, setLoadingDirectTicketsToWallets] = useState(false)

  //MENSAGENS CUSTOMIZADAS
  const [transferMessage, setTransferMessage] = useState("Mensagem de transferência - ${queue.name} = fila destino"); // eslint-disable-line no-template-curly-in-string
  const [loadingTransferMessage, setLoadingTransferMessage] = useState(false);

  const [greetingAcceptedMessage, setGreetingAcceptedMessage] = useState("🌟 {{ms}}, *{{firstName}}*! Meu nome é *{{userName}}* e estou aqui para te ajudar. 😊"); // eslint-disable-line no-template-curly-in-string
  const [loadingGreetingAcceptedMessage, setLoadingGreetingAcceptedMessage] = useState(false);
  
  const [AcceptCallWhatsappMessage, setAcceptCallWhatsappMessage] = useState("Mensagem para informar que não aceita ligações");
  const [loadingAcceptCallWhatsappMessage, setLoadingAcceptCallWhatsappMessage] = useState(false);

  const [sendQueuePositionMessage, setSendQueuePositionMessage] = useState("Mensagem de posição na fila");
  const [loadingSendQueuePositionMessage, setLoadingSendQueuePositionMessage] = useState(false);

  const [showNotificationPending, setShowNotificationPending] = useState(true);
  const [loadingShowNotificationPending, setLoadingShowNotificationPending] = useState(false);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const { update: updateUserCreation, getAll } = useSettings();

  const { update: updatedownloadLimit } = useSettings();

  const { update } = useCompanySettings();

  const handleOpenScheduleModal = () => {
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
  };

  const isSuper = () => {
    return user.super;
  };


  useEffect(() => {

    if (Array.isArray(oldSettings) && oldSettings.length) {

      const userPar = oldSettings.find((s) => s.key === "userCreation");

      if (userPar) {
        setUserCreation(userPar.value);
      }

      const downloadLimit = oldSettings.find((s) => s.key === "downloadLimit");

      if (downloadLimit) {
       setdownloadLimit(downloadLimit.value);
      }
    }
  }, [oldSettings])


  useEffect(() => {
    for (const [key, value] of Object.entries(settings)) {
      if (key === "userRating") setUserRating(value);
      if (key === "scheduleType") setScheduleType(value);
      if (key === "chatBotType") setChatBotType(value);
      if (key === "acceptCallWhatsapp") setAcceptCallWhatsapp(value);
      if (key === "userRandom") setUserRandom(value);
      if (key === "sendGreetingMessageOneQueues") setSendGreetingMessageOneQueues(value);
      if (key === "sendSignMessage") setSendSignMessage(value);
      if (key === "sendFarewellWaitingTicket") setSendFarewellWaitingTicket(value);
      if (key === "sendGreetingAccepted") setSendGreetingAccepted(value);
      if (key === "sendQueuePosition") setSendQueuePosition(value);
      if (key === "acceptAudioMessageContact") setAcceptAudioMessageContact(value);
      if (key === "enableLGPD") setEnableLGPD(value);
      if (key === "requiredTag") setRequiredTag(value);
      if (key === "lgpdDeleteMessage") setLGPDDeleteMessage(value)
      if (key === "lgpdHideNumber") setLGPDHideNumber(value);
      if (key === "lgpdConsent") setLGPDConsent(value);
      if (key === "lgpdMessage") setLGPDMessage(value);
      if (key === "sendMsgTransfTicket") setSettingsTransfTicket(value);
      if (key === "lgpdLink") setLGPDLink(value);
      if (key === "DirectTicketsToWallets") setDirectTicketsToWallets(value);
      if (key === "closeTicketOnTransfer") setCloseTicketOnTransfer(value);
      if (key === "transferMessage") setTransferMessage(value);
      if (key === "greetingAcceptedMessage") setGreetingAcceptedMessage(value);
      if (key === "AcceptCallWhatsappMessage") setAcceptCallWhatsappMessage(value);
      if (key === "sendQueuePositionMessage") setSendQueuePositionMessage(value);
      if (key === "showNotificationPending") setShowNotificationPending(value);

    }
  }, [settings]);

  async function handleChangeUserCreation(value) {
    setUserCreation(value);
    setLoadingUserCreation(true);
    await updateUserCreation({
      key: "userCreation",
      value,
    });
    setLoadingUserCreation(false);
  }

  async function handleDownloadLimit(value) {
    setdownloadLimit(value);
    setLoadingdownloadLimit(true);
    await updatedownloadLimit({
      key: "downloadLimit",
      value,
    });
    setLoadingdownloadLimit(false);
  }

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      column: "userRating",
      data: value
    });
    setLoadingUserRating(false);
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      column: "scheduleType",
      data: value
    });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleChatBotType(value) {
    setChatBotType(value);
    await update({
      column: "chatBotType",
      data: value
    });
    if (typeof scheduleTypeChanged === "function") {
      setChatBotType(value);
    }
  }

  async function handleLGPDMessage(value) {
    setLGPDMessage(value);
    setLoadingLGPDMessage(true);
    await update({
      column: "lgpdMessage",
      data: value
    });
    setLoadingLGPDMessage(false);
  }

  async function handletransferMessage(value) {
    setTransferMessage(value);
    setLoadingTransferMessage(true);
    await update({
      column: "transferMessage",
      data: value
    });
    setLoadingTransferMessage(false);
  }

  async function handleGreetingAcceptedMessage(value) {
    setGreetingAcceptedMessage(value);
    setLoadingGreetingAcceptedMessage(true);
    await update({
      column: "greetingAcceptedMessage",
      data: value
    });
    setLoadingGreetingAcceptedMessage(false);
  }

  async function handleAcceptCallWhatsappMessage(value) {
    setAcceptCallWhatsappMessage(value);
    setLoadingAcceptCallWhatsappMessage(true);
    await update({
      column: "AcceptCallWhatsappMessage",
      data: value
    });
    setLoadingAcceptCallWhatsappMessage(false);
  }

  async function handlesendQueuePositionMessage(value) {
    setSendQueuePositionMessage(value);
    setLoadingSendQueuePositionMessage(true);
    await update({
      column: "sendQueuePositionMessage",
      data: value
    });
    setLoadingSendQueuePositionMessage(false);
  }

  async function handleShowNotificationPending(value) {
    setShowNotificationPending(value);
    setLoadingShowNotificationPending(true);
    await update({
      column: "showNotificationPending",
      data: value
    });
    setLoadingShowNotificationPending(false);
  }

  async function handleLGPDLink(value) {
    setLGPDLink(value);
    setLoadingLGPDLink(true);
    await update({
      column: "lgpdLink",
      data: value
    });
    setLoadingLGPDLink(false);
  }

  async function handleLGPDDeleteMessage(value) {
    setLGPDDeleteMessage(value);
    setLoadingLGPDDeleteMessage(true);
    await update({
      column: "lgpdDeleteMessage",
      data: value
    });
    setLoadingLGPDDeleteMessage(false);
  }

  async function handleLGPDConsent(value) {
    setLGPDConsent(value);
    setLoadingLGPDConsent(true);
    await update({
      column: "lgpdConsent",
      data: value
    });
    setLoadingLGPDConsent(false);
  }

  async function handleLGPDHideNumber(value) {
    setLGPDHideNumber(value);
    setLoadingLGPDHideNumber(true);
    await update({
      column: "lgpdHideNumber",
      data: value
    });
    setLoadingLGPDHideNumber(false);
  }

  async function handleSendGreetingAccepted(value) {
    setSendGreetingAccepted(value);
    setLoadingSendGreetingAccepted(true);
    await update({
      column: "sendGreetingAccepted",
      data: value
    });
    setLoadingSendGreetingAccepted(false);
  }

  async function handleUserRandom(value) {
    setUserRandom(value);
    setLoadingUserRandom(true);
    await update({
      column: "userRandom",
      data: value
    });
    setLoadingUserRandom(false);
  }

  async function handleSettingsTransfTicket(value) {
    setSettingsTransfTicket(value);
    setLoadingSettingsTransfTicket(true);
    await update({
      column: "sendMsgTransfTicket",
      data: value
    });
    setLoadingSettingsTransfTicket(false);
  }

  async function handleAcceptCallWhatsapp(value) {
    setAcceptCallWhatsapp(value);
    setLoadingAcceptCallWhatsapp(true);
    await update({
      column: "acceptCallWhatsapp",
      data: value
    });
    setLoadingAcceptCallWhatsapp(false);
  }

  async function handleSendSignMessage(value) {
    setSendSignMessage(value);
    setLoadingSendSignMessage(true);
    await update({
      column: "sendSignMessage",
      data: value
    });
    localStorage.setItem("sendSignMessage", value === "enabled" ? true : false); //atualiza localstorage para sessão
    setLoadingSendSignMessage(false);
  }

  async function handleSendGreetingMessageOneQueues(value) {
    setSendGreetingMessageOneQueues(value);
    setLoadingSendGreetingMessageOneQueues(true);
    await update({
      column: "sendGreetingMessageOneQueues",
      data: value
    });
    setLoadingSendGreetingMessageOneQueues(false);
  }

  async function handleSendQueuePosition(value) {
    setSendQueuePosition(value);
    setLoadingSendQueuePosition(true);
    await update({
      column: "sendQueuePosition",
      data: value
    });
    setLoadingSendQueuePosition(false);
  }

  async function handleSendFarewellWaitingTicket(value) {
    setSendFarewellWaitingTicket(value);
    setLoadingSendFarewellWaitingTicket(true);
    await update({
      column: "sendFarewellWaitingTicket",
      data: value
    });
    setLoadingSendFarewellWaitingTicket(false);
  }

  async function handleAcceptAudioMessageContact(value) {
    setAcceptAudioMessageContact(value);
    setLoadingAcceptAudioMessageContact(true);
    await update({
      column: "acceptAudioMessageContact",
      data: value
    });
    setLoadingAcceptAudioMessageContact(false);
  }

  async function handleEnableLGPD(value) {
    setEnableLGPD(value);
    setLoadingEnableLGPD(true);
    await update({
      column: "enableLGPD",
      data: value
    });
    setLoadingEnableLGPD(false);
  }

  async function handleRequiredTag(value) {
    setRequiredTag(value);
    setLoadingRequiredTag(true);
    await update({
      column: "requiredTag",
      data: value,
    });
    setLoadingRequiredTag(false);
  }

  async function handleCloseTicketOnTransfer(value) {
    setCloseTicketOnTransfer(value);
    setLoadingCloseTicketOnTransfer(true);
    await update({
      column: "closeTicketOnTransfer",
      data: value,
    });
    setLoadingCloseTicketOnTransfer(false);
  }

  async function handleDirectTicketsToWallets(value) {
    setDirectTicketsToWallets(value);
    setLoadingDirectTicketsToWallets(true);
    await update({
      column: "DirectTicketsToWallets",
      data: value,
    });
    setLoadingDirectTicketsToWallets(false);
  }

  return (
    <div className={classes.container}>
      {/* Configurações Gerais */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <SettingsIcon /> Configurações Gerais
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <div className={classes.settingItem}>
            <div className={classes.settingInfo}>
              <Typography className={classes.settingTitle}>
                Criação de Usuários
              </Typography>
              <Typography className={classes.settingDescription}>
                Permite ou bloqueia a criação de novos usuários no sistema
              </Typography>
            </div>
            <div className={classes.settingControl}>
              <FormControl className={classes.formControl} variant="outlined">
                <Select
                  value={userCreation}
                  onChange={(e) => handleChangeUserCreation(e.target.value)}
                  disabled={loadingUserCreation}
                >
                  <MenuItem value="enabled">Habilitado</MenuItem>
                  <MenuItem value="disabled">Desabilitado</MenuItem>
                </Select>
              </FormControl>
              {loadingUserCreation && <CircularProgress size={20} className={classes.loadingSpinner} />}
            </div>
          </div>

          <div className={classes.settingItem}>
            <div className={classes.settingInfo}>
              <Typography className={classes.settingTitle}>
                Limite de Download (MB)
              </Typography>
              <Typography className={classes.settingDescription}>
                Define o tamanho máximo de arquivos que podem ser baixados
              </Typography>
            </div>
            <div className={classes.settingControl}>
              <TextField
                className={classes.textField}
                variant="outlined"
                value={downloadLimit}
                onChange={(e) => handleDownloadLimit(e.target.value)}
                disabled={loadingDownloadLimit}
                type="number"
              />
              {loadingDownloadLimit && <CircularProgress size={20} className={classes.loadingSpinner} />}
            </div>
          </div>
        </div>
      </Paper>

      {/* Configurações de Atendimento */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <Headset /> Configurações de Atendimento
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <Grid container spacing={2} className={classes.gridContainer}>
            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Avaliação de Usuários
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Permite que usuários avaliem o atendimento
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={userRating}
                      onChange={(e) => handleChangeUserRating(e.target.value)}
                      disabled={loadingUserRating}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                  Horário de funcionamento
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Define horário de funcionamento
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={scheduleType}
                      onChange={(e) => handleScheduleType(e.target.value)}
                      disabled={loadingScheduleType}
                    >
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                      <MenuItem value="queue">Gerenciamento por Fila</MenuItem>
                      <MenuItem value="company">Gerenciamento por Empresa</MenuItem>
                      <MenuItem value="connection">Gerenciamento por Conexão</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    ChatBot
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Configura o tipo de chatbot disponível
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={chatBotType}
                      onChange={(e) => handleChatBotType(e.target.value)}
                    >
                      <MenuItem value="text">Texto</MenuItem>
                      <MenuItem value="button">Botões</MenuItem>
                      <MenuItem value="list">Lista</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Chamadas WhatsApp
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Permite receber chamadas via WhatsApp
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={AcceptCallWhatsapp}
                      onChange={(e) => handleAcceptCallWhatsapp(e.target.value)}
                      disabled={loadingAcceptCallWhatsapp}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* Configurações de Mensagens */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <Message /> Configurações de Mensagens
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <Grid container spacing={2} className={classes.gridContainer}>
            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem de Saudação
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Envia mensagem de boas-vindas aos clientes
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={SendGreetingAccepted}
                      onChange={(e) => handleSendGreetingAccepted(e.target.value)}
                      disabled={loadingSendGreetingAccepted}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Posição na Fila
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Informa ao cliente sua posição na fila de atendimento
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={sendQueuePosition}
                      onChange={(e) => handleSendQueuePosition(e.target.value)}
                      disabled={loadingSendQueuePosition}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Usuário Aleatório
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Distribui tickets automaticamente entre usuários
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={UserRandom}
                      onChange={(e) => handleUserRandom(e.target.value)}
                      disabled={loadingUserRandom}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem de Transferência
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Envia mensagem quando ticket é transferido
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={SettingsTransfTicket}
                      onChange={(e) => handleSettingsTransfTicket(e.target.value)}
                      disabled={loadingSettingsTransfTicket}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Assinatura do Atendente
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Permite que atendentes removam assinatura das mensagens
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={sendSignMessage}
                      onChange={(e) => handleSendSignMessage(e.target.value)}
                      disabled={loadingSendSignMessage}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Saudação Única Fila
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Envia saudação quando há apenas uma fila
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={sendGreetingMessageOneQueues}
                      onChange={(e) => handleSendGreetingMessageOneQueues(e.target.value)}
                      disabled={loadingSendGreetingMessageOneQueues}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Despedida Aguardando
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Envia mensagem de despedida em tickets aguardando
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={sendFarewellWaitingTicket}
                      onChange={(e) => handleSendFarewellWaitingTicket(e.target.value)}
                      disabled={loadingSendFarewellWaitingTicket}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagens de Áudio
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Permite receber mensagens de áudio dos contatos
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={acceptAudioMessageContact}
                      onChange={(e) => handleAcceptAudioMessageContact(e.target.value)}
                      disabled={loadingAcceptAudioMessageContact}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem de Transferência
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Mensagem enviada quando um ticket é transferido. Use $&#123;queue.name&#125; para nome da fila destino
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <TextField
                    className={classes.textField}
                    variant="outlined"
                    value={transferMessage}
                    onChange={(e) => handletransferMessage(e.target.value)}
                    disabled={loadingTransferMessage}
                    multiline
                    rows={3}
                    placeholder="Mensagem de transferência - $&#123;queue.name&#125; = fila destino"
                  />
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem de Saudação ao Aceitar Ticket
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Mensagem enviada quando o cliente aceita a saudação. Use &#123;&#123;ms&#125;&#125;, &#123;&#123;firstName&#125;&#125;, &#123;&#123;userName&#125;&#125; como variáveis
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <TextField
                    className={classes.textField}
                    variant="outlined"
                    value={greetingAcceptedMessage}
                    onChange={(e) => handleGreetingAcceptedMessage(e.target.value)}
                    disabled={loadingGreetingAcceptedMessage}
                    multiline
                    rows={4}
                    placeholder="🌟 &#123;&#123;ms&#125;&#125;, *&#123;&#123;firstName&#125;&#125;*! Meu nome é *&#123;&#123;userName&#125;&#125;* e estou aqui para te ajudar. 😊"
                  />
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem para Informar que Não Aceita Ligações
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Mensagem enviada sobre chamadas do WhatsApp
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <TextField
                    className={classes.textField}
                    variant="outlined"
                    value={AcceptCallWhatsappMessage}
                    onChange={(e) => handleAcceptCallWhatsappMessage(e.target.value)}
                    disabled={loadingAcceptCallWhatsappMessage}
                    multiline
                    rows={3}
                    placeholder="Mensagem para informar que não aceita ligações"
                  />
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem de Posição na Fila
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Mensagem enviada informando a posição na fila
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <TextField
                    className={classes.textField}
                    variant="outlined"
                    value={sendQueuePositionMessage}
                    onChange={(e) => handlesendQueuePositionMessage(e.target.value)}
                    disabled={loadingSendQueuePositionMessage}
                    multiline
                    rows={3}
                    placeholder="Mensagem de posição na fila"
                  />
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* Configurações Avançadas */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <SettingsIcon /> Configurações Avançadas
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <Grid container spacing={2} className={classes.gridContainer}>
            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Tag Obrigatória
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Exige que tickets tenham tags obrigatórias
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={requiredTag}
                      onChange={(e) => handleRequiredTag(e.target.value)}
                      disabled={loadingRequiredTag}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Fechar Ticket na Transferência
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Fecha ticket automaticamente ao transferir
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={closeTicketOnTransfer}
                      onChange={(e) => handleCloseTicketOnTransfer(e.target.value)}
                      disabled={loadingCloseTicketOnTransfer}
                    >
                      <MenuItem value={true}>Habilitado</MenuItem>
                      <MenuItem value={false}>Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Notificação Pendente
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Mostra notificação para tickets pendentes
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={showNotificationPending}
                      onChange={(e) => handleShowNotificationPending(e.target.value)}
                      disabled={loadingShowNotificationPending}
                    >
                      <MenuItem value={true}>Habilitado</MenuItem>
                      <MenuItem value={false}>Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Carteira de Clientes
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Direciona tickets para carteira de clientes
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={directTicketsToWallets}
                      onChange={(e) => handleDirectTicketsToWallets(e.target.value)}
                      disabled={loadingDirectTicketsToWallets}
                    >
                      <MenuItem value={true}>Habilitado</MenuItem>
                      <MenuItem value={false}>Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* Configuração de Horários */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <Schedule /> Configuração de Horários
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <div className={classes.infoBox}>
            <Typography variant="body2">
              <Info /> Configure os horários de funcionamento para envio de mensagens automáticas fora do expediente.
            </Typography>
          </div>

          <Grid container spacing={2} className={classes.gridContainer}>
            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Tipo de Configuração
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Escolha como os horários serão aplicados
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={scheduleType}
                      onChange={(e) => handleScheduleType(e.target.value)}
                      disabled={loadingScheduleType}
                    >
                      <MenuItem value="company">Por Empresa</MenuItem>
                      <MenuItem value="queue">Por Fila</MenuItem>
                      <MenuItem value="connection">Por Conexão</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Schedule />}
                  onClick={handleOpenScheduleModal}
                  size="large"
                  style={{
                    backgroundColor: "#25b6e8",
                    color: "white",
                    padding: "12px 24px",
                    fontSize: "1rem",
                    fontWeight: 500,
                    borderRadius: "8px",
                    textTransform: "none",
                    boxShadow: "0 4px 8px rgba(37, 182, 232, 0.3)",
                    "&:hover": {
                      backgroundColor: "#1e9ac4",
                      boxShadow: "0 6px 12px rgba(37, 182, 232, 0.4)",
                    }
                  }}
                >
                  Configurar Horários
                </Button>
              </Box>
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* Configurações LGPD */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <Security /> Configurações LGPD
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <div className={classes.infoBox}>
            <Typography variant="body2">
              <Info /> Estas configurações garantem conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </Typography>
          </div>

          <Grid container spacing={2} className={classes.gridContainer}>
            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    LGPD Ativo
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Habilita as funcionalidades de proteção de dados
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={enableLGPD}
                      onChange={(e) => handleEnableLGPD(e.target.value)}
                      disabled={loadingEnableLGPD}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Ocultar Números
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Oculta números de telefone por padrão
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={lgpdHideNumber}
                      onChange={(e) => handleLGPDHideNumber(e.target.value)}
                      disabled={loadingLGPDHideNumber}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Consentimento Obrigatório
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Sempre solicita confirmação de consentimento
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={lgpdConsent}
                      onChange={(e) => handleLGPDConsent(e.target.value)}
                      disabled={loadingLGPDConsent}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem Deletada
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Ofusca mensagens deletadas pelo contato
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <FormControl className={classes.formControl} variant="outlined">
                    <Select
                      value={lgpdDeleteMessage}
                      onChange={(e) => handleLGPDDeleteMessage(e.target.value)}
                      disabled={loadingLGPDDeleteMessage}
                    >
                      <MenuItem value="enabled">Habilitado</MenuItem>
                      <MenuItem value="disabled">Desabilitado</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Mensagem LGPD
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Mensagem de consentimento para coleta de dados
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <TextField
                    className={classes.textField}
                    variant="outlined"
                    value={lgpdMessage}
                    onChange={(e) => handleLGPDMessage(e.target.value)}
                    disabled={loadinglgpdMessage}
                    multiline
                    rows={3}
                    placeholder="Digite a mensagem de consentimento LGPD..."
                  />
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Link LGPD
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Link para política de privacidade LGPD
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <TextField
                    className={classes.textField}
                    variant="outlined"
                    value={lgpdLink}
                    onChange={(e) => handleLGPDLink(e.target.value)}
                    disabled={loadingLGPDLink}
                    placeholder="https://exemplo.com/politica-privacidade"
                  />
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* Modal de Configuração de Horários */}
      <ScheduleConfigModal
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        scheduleType={scheduleType}
      />
    </div>
  );
}
