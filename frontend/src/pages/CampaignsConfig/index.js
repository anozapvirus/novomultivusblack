import React, { useEffect, useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import usePlans from "../../hooks/usePlans";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import ConfirmationModal from "../../components/ConfirmationModal";
import ForbiddenPage from "../../components/ForbiddenPage";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
    ...theme.scrollbarStyles,
  },
  contentWrapper: {
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    marginBottom: theme.spacing(2),
  },
  tabPanelsContainer: {
    padding: theme.spacing(2),
  },
  formControl: {
    margin: theme.spacing(1),
    "& .MuiOutlinedInput-root": {
      margin: 0,
      backgroundColor: "white",
    },
    "& .MuiFormLabel-root": {
      margin: 0,
    },
  },
  actionButtons: {
    backgroundColor: "#25b6e8",
    color: "white",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  selectControl: {
    width: "100%",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.12)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#25b6e8",
    },
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    color: "#333",
    fontWeight: "bold",
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
}));

const initialSettings = {
  messageInterval: 20,
  longerIntervalAfter: 20,
  greaterInterval: 60,
  variables: [],
  sabado: "false",
  domingo: "false",
  startHour: "09:00",
  endHour: "18:00"
};
const CampaignsConfig = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();

  const [settings, setSettings] = useState(initialSettings);
  const [showVariablesForm, setShowVariablesForm] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [variable, setVariable] = useState({ key: "", value: "" });
  const [sabado, setSabado] = useState(false);
  const [domingo, setDomingo] = useState(false);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("19:00");

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useCampaigns) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
  }, [user.companyId, history, getPlanCompany]);

  useEffect(() => {
    api.get("/campaign-settings").then(({ data }) => {
      const settingsList = [];
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          settingsList.push([item.key, item.value]);
          if (item.key === "sabado") setSabado(item?.value === "true");
          if (item.key === "domingo") setDomingo(item?.value === "true");
          if (item.key === "startHour") setStartHour(item?.value);
          if (item.key === "endHour") setEndHour(item?.value);
        });
        setSettings(Object.fromEntries(settingsList));
      }
    });
  }, []);

  const handleOnChangeSettings = (e) => {
    const changedProp = {};
    changedProp[e.target.name] = e.target.value;
    setSettings((prev) => ({ ...prev, ...changedProp }));
  };

  const saveSettings = async () => {
    await api.post("/campaign-settings", { settings });
    toast.success("Configurações salvas");
  };

  return (
    <MainContainer>
      <div className={classes.searchContainer}>
        <div style={{
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}>
          <Typography variant="h6" style={{ color: '#333' }}>
            {i18n.t("campaignsConfig.title")}
          </Typography>
        </div>
      </div>

      <Paper className={classes.mainPaper}>
        <div className={classes.contentWrapper}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" className={classes.sectionTitle}>
                Intervalos
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" className={classes.selectControl} fullWidth>
                <InputLabel>{i18n.t("campaigns.settings.randomInterval")}</InputLabel>
                <Select
                  name="messageInterval"
                  value={settings.messageInterval}
                  onChange={handleOnChangeSettings}
                  label={i18n.t("campaigns.settings.randomInterval")}
                >
                  <MenuItem value={0}>{i18n.t("campaigns.settings.noBreak")}</MenuItem>
                  <MenuItem value={5}>5 segundos</MenuItem>
                  <MenuItem value={10}>10 segundos</MenuItem>
                  <MenuItem value={15}>15 segundos</MenuItem>
                  <MenuItem value={20}>20 segundos</MenuItem>
                  <MenuItem value={30}>30 segundos</MenuItem>
                  <MenuItem value={60}>40 segundos</MenuItem>
                  <MenuItem value={70}>60 segundos</MenuItem>
                  <MenuItem value={80}>80 segundos</MenuItem>
                  <MenuItem value={100}>100 segundos</MenuItem>
                  <MenuItem value={120}>120 segundos</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" className={classes.selectControl} fullWidth>
                <InputLabel>{i18n.t("campaigns.settings.intervalGapAfter")}</InputLabel>
                <Select
                  name="longerIntervalAfter"
                  value={settings.longerIntervalAfter}
                  onChange={handleOnChangeSettings}
                  label={i18n.t("campaigns.settings.intervalGapAfter")}
                >
                  <MenuItem value={0}>{i18n.t("campaigns.settings.undefined")}</MenuItem>
                  <MenuItem value={5}>5 {i18n.t("campaigns.settings.messages")}</MenuItem>
                  <MenuItem value={10}>10 {i18n.t("campaigns.settings.messages")}</MenuItem>
                  <MenuItem value={15}>15 {i18n.t("campaigns.settings.messages")}</MenuItem>
                  <MenuItem value={20}>20 {i18n.t("campaigns.settings.messages")}</MenuItem>
                  <MenuItem value={30}>30 {i18n.t("campaigns.settings.messages")}</MenuItem>
                  <MenuItem value={40}>40 {i18n.t("campaigns.settings.messages")}</MenuItem>
                  <MenuItem value={50}>50 {i18n.t("campaigns.settings.messages")}</MenuItem>
                  <MenuItem value={60}>60 {i18n.t("campaigns.settings.messages")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" className={classes.selectControl} fullWidth>
                <InputLabel>{i18n.t("campaigns.settings.laggerTriggerRange")}</InputLabel>
                <Select
                  name="greaterInterval"
                  value={settings.greaterInterval}
                  onChange={handleOnChangeSettings}
                  label={i18n.t("campaigns.settings.laggerTriggerRange")}
                >
                  <MenuItem value={0}>{i18n.t("campaigns.settings.noBreak")}</MenuItem>
                  {[...Array(17)].map((_, i) => (
                    <MenuItem key={i} value={(i + 1) * 10 + 10}>
                      {(i + 1) * 10 + 10} segundos
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} container justifyContent="flex-end">
              <Button
                variant="contained"
                className={classes.actionButtons}
                onClick={saveSettings}
              >
                {i18n.t("campaigns.settings.save")}
              </Button>
            </Grid>
          </Grid>
        </div>
      </Paper>
    </MainContainer>
  );
};

export default CampaignsConfig;