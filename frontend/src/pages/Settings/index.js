import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Fab,
  Zoom,
  Fade
} from "@material-ui/core";
import {
  Business,
  Payment,
  Help,
  Palette,
  Settings as SettingsIcon,
  ChevronRight,
  Star,
  Security,
  Speed,
  Support,
  TrendingUp,
  CheckCircle,
  Warning,
  Info
} from "@material-ui/icons";
import { toast } from "react-toastify";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import Options from "../../components/Settings/Options";
import Whitelabel from "../../components/Settings/Whitelabel";

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
  tabsContainer: {
    backgroundColor: "white",
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[3],
    marginBottom: theme.spacing(3),
    overflow: "hidden",
  },
  tab: {
    minHeight: 64,
    fontSize: "1rem",
    fontWeight: 500,
    textTransform: "none",
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
  },
  tabPanel: {
    padding: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(2),
    },
  },
  sectionCard: {
    height: "100%",
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[4],
    transition: "all 0.3s ease",
    cursor: "pointer",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[8],
    },
  },
  sectionCardContent: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
  sectionIcon: {
    fontSize: "3rem",
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  sectionDescription: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    lineHeight: 1.6,
  },
  statusChip: {
    fontWeight: 500,
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 1000,
  },
  quickAccessGrid: {
    marginBottom: theme.spacing(4),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  infoBox: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, socket } = useContext(AuthContext);

  const [settings, setSettings] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/settings");
        setSettings(data);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const companyId = user.companyId;

    const onSettingsEvent = (data) => {
      if (data.action === "update") {
        setSettings((prevState) => {
          const aux = [...prevState];
          const settingIndex = aux.findIndex((s) => s.key === data.setting.key);
          aux[settingIndex].value = data.setting.value;
          return aux;
        });
      }
    };
    socket.on(`company-${companyId}-settings`, onSettingsEvent);

    return () => {
      socket.off(`company-${companyId}-settings`, onSettingsEvent);
    };
  }, [socket, user.companyId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleQuickAccess = (section) => {
    const sectionIndex = {
      companies: 1,
      plans: 2,
      help: 3,
      whitelabel: 4,
    };
    setTabValue(sectionIndex[section] || 0);
  };

  const getSettingValue = (key) => {
    const setting = settings.find((s) => s.key === key);
    return setting ? setting.value : null;
  };

  const renderQuickAccess = () => (
    <Grid container spacing={3} className={classes.quickAccessGrid}>
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.sectionCard} onClick={() => handleQuickAccess("companies")}>
          <CardContent className={classes.sectionCardContent}>
            <Business className={classes.sectionIcon} />
            <Typography className={classes.sectionTitle}>Empresas</Typography>
            <Typography className={classes.sectionDescription}>
              Gerencie empresas, usuários e permissões do sistema
            </Typography>
            <Chip
              label="Ativo"
              color="primary"
              size="small"
              className={classes.statusChip}
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.sectionCard} onClick={() => handleQuickAccess("plans")}>
          <CardContent className={classes.sectionCardContent}>
            <Payment className={classes.sectionIcon} />
            <Typography className={classes.sectionTitle}>Planos</Typography>
            <Typography className={classes.sectionDescription}>
              Visualize e gerencie assinaturas e planos de pagamento
            </Typography>
            <Chip
              label={getSettingValue("subscriptionStatus") || "Ativo"}
              color="secondary"
              size="small"
              className={classes.statusChip}
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.sectionCard} onClick={() => handleQuickAccess("help")}>
          <CardContent className={classes.sectionCardContent}>
            <Help className={classes.sectionIcon} />
            <Typography className={classes.sectionTitle}>Ajuda</Typography>
            <Typography className={classes.sectionDescription}>
              Tutoriais, documentação e suporte ao usuário
            </Typography>
            <Chip
              label="Disponível"
              color="default"
              size="small"
              className={classes.statusChip}
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card className={classes.sectionCard} onClick={() => handleQuickAccess("whitelabel")}>
          <CardContent className={classes.sectionCardContent}>
            <Palette className={classes.sectionIcon} />
            <Typography className={classes.sectionTitle}>Whitelabel</Typography>
            <Typography className={classes.sectionDescription}>
              Personalize cores, logos e identidade visual
            </Typography>
            <Chip
              label="Configurado"
              color="primary"
              size="small"
              className={classes.statusChip}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (user.profile === "user") {
    return (
      <div className={classes.root}>
        <Container className={classes.container}>
          <div className={classes.infoBox}>
            <Typography variant="h6" gutterBottom>
              <Info /> Acesso Restrito
            </Typography>
            <Typography>
              Você não possui permissão para acessar as configurações do sistema.
            </Typography>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Container className={classes.container}>
        {/* Header */}
        <div className={classes.header}>
          <Typography className={classes.headerTitle}>
            Configurações do Sistema
          </Typography>
          <Typography className={classes.headerSubtitle}>
            Gerencie empresas, planos, personalização e obtenha ajuda para configurar seu sistema
          </Typography>
        </div>

        {/* Quick Access Cards */}
        {renderQuickAccess()}

        <Divider className={classes.divider} />

        {/* Tabs Navigation */}
        <Paper className={classes.tabsContainer}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : "off"}
            indicatorColor="primary"
            textColor="primary"
            aria-label="settings tabs"
          >
            <Tab
              label="Geral"
              icon={<SettingsIcon />}
              className={classes.tab}
            />
            <Tab
              label="Empresas"
              icon={<Business />}
              className={classes.tab}
            />
            <Tab
              label="Planos"
              icon={<Payment />}
              className={classes.tab}
            />
            <Tab
              label="Ajuda"
              icon={<Help />}
              className={classes.tab}
            />
            <Tab
              label="Whitelabel"
              icon={<Palette />}
              className={classes.tab}
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Options
            oldSettings={settings}
            settings={settings}
            user={user}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <Typography variant="h5" gutterBottom>
            Gerenciamento de Empresas
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Configure e gerencie empresas, usuários e permissões do sistema.
          </Typography>
          {/* Aqui você pode integrar o componente de empresas existente */}
        </TabPanel>

        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <Typography variant="h5" gutterBottom>
            Planos e Assinaturas
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Visualize e gerencie planos de pagamento e assinaturas.
          </Typography>
          {/* Aqui você pode integrar o componente de planos existente */}
        </TabPanel>

        <TabPanel value={tabValue} index={3} className={classes.tabPanel}>
          <Typography variant="h5" gutterBottom>
            Central de Ajuda
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Acesse tutoriais, documentação e suporte ao usuário.
          </Typography>
          {/* Aqui você pode integrar o componente de ajuda existente */}
        </TabPanel>

        <TabPanel value={tabValue} index={4} className={classes.tabPanel}>
          <Whitelabel settings={settings} />
        </TabPanel>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Zoom in={true}>
            <Fab
              color="primary"
              className={classes.fab}
              onClick={() => setTabValue((prev) => (prev + 1) % 5)}
            >
              <ChevronRight />
            </Fab>
          </Zoom>
        )}
      </Container>
    </div>
  );
};

export default Settings;
