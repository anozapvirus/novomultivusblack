import React, { useEffect, useState, useContext, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import useSettings from "../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js/index.js";

import {
  IconButton,
  InputAdornment,
  Paper,
  Typography,
  Button,
} from "@material-ui/core";

import { Colorize, AttachFile, Delete, Palette, Business, Image, Info } from "@material-ui/icons";
import ColorPicker from "../ColorPicker";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";
import { getBackendUrl } from "../../config";

import defaultLogoLight from "../../assets/logo.png";
import defaultLogoDark from "../../assets/logo-black.png";
import defaultLogoFavicon from "../../assets/favicon.ico";
import ColorBoxModal from "../ColorBoxModal/index.js";

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
  colorPicker: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    border: `2px solid ${theme.palette.divider}`,
    cursor: "pointer",
  },
  logoPreview: {
    maxWidth: 200,
    maxHeight: 100,
    objectFit: "contain",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: "white",
  },
  uploadButton: {
    marginTop: theme.spacing(1),
  },
  gridContainer: {
    marginTop: theme.spacing(2),
  },
  infoBox: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
}));

export default function Whitelabel(props) {
  const { settings } = props;
  const classes = useStyles();
  const [settingsLoaded, setSettingsLoaded] = useState({});

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const { colorMode } = useContext(ColorModeContext);
  const [primaryColorLightModalOpen, setPrimaryColorLightModalOpen] = useState(false);
  const [primaryColorDarkModalOpen, setPrimaryColorDarkModalOpen] = useState(false);

  const logoLightInput = useRef(null);
  const logoDarkInput = useRef(null);
  const logoFaviconInput = useRef(null);
  const appNameInput = useRef(null);
  const [appName, setAppName] = useState(settingsLoaded.appName || "");

  const { update } = useSettings();

  function updateSettingsLoaded(key, value) {
    console.log("|=========== updateSettingsLoaded ==========|")
    console.log(key, value)
    console.log("|===========================================|")
    if (key === 'primaryColorLight' || key === 'primaryColorDark' || key === 'appName') {
      localStorage.setItem(key, value);
    };
    const newSettings = { ...settingsLoaded };
    newSettings[key] = value;
    setSettingsLoaded(newSettings);
  }

  useEffect(() => {
    getCurrentUserInfo().then(
      (u) => {
        setCurrentUser(u);
      }
    );

    if (Array.isArray(settings) && settings.length) {
      const primaryColorLight = settings.find((s) => s.key === "primaryColorLight")?.value;
      const primaryColorDark = settings.find((s) => s.key === "primaryColorDark")?.value;
      const appLogoLight = settings.find((s) => s.key === "appLogoLight")?.value;
      const appLogoDark = settings.find((s) => s.key === "appLogoDark")?.value;
      const appLogoFavicon = settings.find((s) => s.key === "appLogoFavicon")?.value;
      const appName = settings.find((s) => s.key === "appName")?.value;

      setAppName(appName || "");
      setSettingsLoaded({ ...settingsLoaded, primaryColorLight, primaryColorDark, appLogoLight, appLogoDark, appLogoFavicon, appName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleSaveSetting(key, value) {

    await update({
      key,
      value,
    });
    updateSettingsLoaded(key, value);
    toast.success("Operação atualizada com sucesso.");
  }

  const uploadLogo = async (e, mode) => {
    if (!e.target.files) {
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();

    formData.append("typeArch", "logo");
    formData.append("mode", mode);
    formData.append("file", file);

    await api.post("/settings-whitelabel/logo", formData, {
      onUploadProgress: (event) => {
        let progress = Math.round(
          (event.loaded * 100) / event.total
        );
        console.log(
          `A imagem  está ${progress}% carregada... `
        );
      },
    }).then((response) => {
      updateSettingsLoaded(`appLogo${mode}`, response.data);
      colorMode[`setAppLogo${mode}`](getBackendUrl() + "/public/" + response.data);
    }).catch((err) => {
      console.error(
        `Houve um problema ao realizar o upload da imagem.`
      );
      console.log(err);
    });
  };

  return (
    <div className={classes.container}>
      {/* Cores do Sistema */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <Palette /> Cores do Sistema
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <Grid container spacing={3} className={classes.gridContainer}>
            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Cor Primária (Tema Claro)
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Cor principal utilizada no tema claro do sistema
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <div className={classes.colorPicker}>
                    <div
                      className={classes.colorPreview}
                      style={{ backgroundColor: settingsLoaded.primaryColorLight || "#1976d2" }}
                      onClick={() => setPrimaryColorLightModalOpen(true)}
                    />
                    <IconButton
                    onClick={() => setPrimaryColorLightModalOpen(true)}
                      size="small"
                    >
                      <Colorize />
                    </IconButton>
                  </div>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={6}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Cor Primária (Tema Escuro)
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Cor principal utilizada no tema escuro do sistema
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <div className={classes.colorPicker}>
                          <div
                      className={classes.colorPreview}
                      style={{ backgroundColor: settingsLoaded.primaryColorDark || "#90caf9" }}
                      onClick={() => setPrimaryColorDarkModalOpen(true)}
                    />
                        <IconButton
                      onClick={() => setPrimaryColorDarkModalOpen(true)}
                          size="small"
                        >
                          <Colorize />
                        </IconButton>
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* Nome da Aplicação */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <Business /> Identidade da Aplicação
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <div className={classes.settingItem}>
            <div className={classes.settingInfo}>
              <Typography className={classes.settingTitle}>
                Nome da Aplicação
              </Typography>
              <Typography className={classes.settingDescription}>
                Nome que será exibido no cabeçalho e título da aplicação
              </Typography>
            </div>
            <div className={classes.settingControl}>
              <TextField
                className={classes.textField}
                variant="outlined"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                onBlur={() => handleSaveSetting("appName", appName)}
                placeholder="Digite o nome da aplicação..."
              />
            </div>
          </div>
        </div>
      </Paper>

      {/* Logos */}
      <Paper className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            <Image /> Logos e Imagens
          </Typography>
        </div>
        <div className={classes.sectionContent}>
          <div className={classes.infoBox}>
            <Typography variant="body2">
              <Info /> Faça upload de logos personalizados para sua marca. Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB.
            </Typography>
          </div>

          <Grid container spacing={3} className={classes.gridContainer}>
            <Grid item xs={12} md={4}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Logo (Tema Claro)
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Logo exibido no tema claro da aplicação
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <img
                    src={settingsLoaded.appLogoLight || defaultLogoLight}
                    alt="Logo Tema Claro"
                    className={classes.logoPreview}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    className={classes.uploadButton}
                    startIcon={<AttachFile />}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => uploadLogo(e, "light")}
                    />
                  </Button>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={4}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Logo (Tema Escuro)
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Logo exibido no tema escuro da aplicação
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <img
                    src={settingsLoaded.appLogoDark || defaultLogoDark}
                    alt="Logo Tema Escuro"
                    className={classes.logoPreview}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    className={classes.uploadButton}
                    startIcon={<AttachFile />}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => uploadLogo(e, "dark")}
                    />
                  </Button>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={4}>
              <div className={classes.settingItem}>
                <div className={classes.settingInfo}>
                  <Typography className={classes.settingTitle}>
                    Favicon
                  </Typography>
                  <Typography className={classes.settingDescription}>
                    Ícone exibido na aba do navegador
                  </Typography>
                </div>
                <div className={classes.settingControl}>
                  <img
                    src={settingsLoaded.appLogoFavicon || defaultLogoFavicon}
                    alt="Favicon"
                    className={classes.logoPreview}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    className={classes.uploadButton}
                    startIcon={<AttachFile />}
                  >
                    Upload Favicon
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => uploadLogo(e, "favicon")}
                    />
                  </Button>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Paper>

      {/* Modais de Seleção de Cor */}
                <ColorBoxModal
                  open={primaryColorLightModalOpen}
                  handleClose={() => setPrimaryColorLightModalOpen(false)}
                  onChange={(color) => {
                    handleSaveSetting("primaryColorLight", `#${color.hex}`);
                    colorMode.setPrimaryColorLight(`#${color.hex}`);
                  }}
                  currentColor={settingsLoaded.primaryColorLight}
                />

                <ColorBoxModal
                  open={primaryColorDarkModalOpen}
                  handleClose={() => setPrimaryColorDarkModalOpen(false)}
                  onChange={(color) => {
                    handleSaveSetting("primaryColorDark", `#${color.hex}`);
                    colorMode.setPrimaryColorDark(`#${color.hex}`);
                  }}
                  currentColor={settingsLoaded.primaryColorDark}
                />
                </div>
  );
}
