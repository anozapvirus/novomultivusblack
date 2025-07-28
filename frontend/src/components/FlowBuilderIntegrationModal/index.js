import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from "@material-ui/core";
import { ArrowForward, Close } from '@mui/icons-material';
import WebhookIcon from '@mui/icons-material/Webhook';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MemoryIcon from '@mui/icons-material/Memory';
import api from "../../services/api";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  root: {
    "& .MuiTextField-root": {
      margin: theme.spacing(1)
    }
  },
  btnWrapper: {
    position: "relative"
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: "100%"
  },
  integrationCard: {
    border: "1px solid #ddd",
    borderRadius: 4,
    marginBottom: 10,
    padding: 10,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#f5f5f5"
    }
  },
  integrationIcon: {
    marginRight: 10,
    color: "#1976d2"
  },
  selectedIntegration: {
    backgroundColor: "#e3f2fd",
    border: "1px solid #2196f3"
  },
  searchField: {
    marginBottom: 16
  }
}));

const FlowBuilderIntegrationModal = ({ open, onClose, data, onSave }) => {
  const classes = useStyles();
  
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  useEffect(() => {
    const fetchIntegrations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/queueIntegration");
        const webhookIntegrations = (data.queueIntegrations || []).filter(
          integration => integration.type === "webhook"
        );
        setIntegrations(webhookIntegrations);
        setFilteredIntegrations(webhookIntegrations);
        if (open && data && data?.data?.integrationId) {
           const initialIntegration = webhookIntegrations.find(int => int.id === data.data.integrationId);
           if (initialIntegration) {
             setSelectedIntegration(initialIntegration);
             console.log("Integração inicial selecionada para edição:", initialIntegration);
           }
        }
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      if (!data?.id) {
          console.log("Abrindo para criar, resetando estado do modal.");
          setName("Integração");
          setDescription("");
          setSelectedIntegration(null);
          setSearchTerm("");
      }
      fetchIntegrations();
    } else {
        // Optional: Reset when closing, though handleClose does most of this
        // setName("Integração");
        // setDescription("");
        // setSelectedIntegration(null);
        // setSearchTerm("");
    }
  }, [open]);
  
  useEffect(() => {
    if (open && data && data.id) {
      console.log("Abrindo para editar, preenchendo dados do nó:", data);
      setName(data.data?.name || "Integração");
      setDescription(data.data?.description || "");
      const initialIntegration = integrations.find(int => int.id === data.data?.integrationId);
      if (initialIntegration) {
          setSelectedIntegration(initialIntegration);
          console.log("Integração selecionada para edição (no segundo useEffect):", initialIntegration);
      } else if (integrations.length > 0){
          console.warn("Não foi possível encontrar a integração inicial para edição, ID:", data.data?.integrationId);
      }
    } 
  }, [data, open, integrations]);
  
  useEffect(() => {
    // Filtrar integrações baseado no termo de busca
    if (searchTerm) {
      const filtered = integrations.filter(integration =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIntegrations(filtered);
    } else {
      setFilteredIntegrations(integrations);
    }
  }, [searchTerm, integrations]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSelectIntegration = (integration) => {
    setSelectedIntegration(integration);
  };
  
  const getIntegrationIcon = (type) => {
    switch (type) {
      case "webhook":
        return <WebhookIcon className={classes.integrationIcon} />;
      case "gemini":
        return <AutoFixHighIcon className={classes.integrationIcon} />;
      case "dialogflow":
      case "typebot":
        return <SmartToyIcon className={classes.integrationIcon} />;
      case "flowbuilder":
        return <MemoryIcon className={classes.integrationIcon} />;
      default:
        return <WebhookIcon className={classes.integrationIcon} />;
    }
  };
  
  const handleClose = () => {
    setSelectedIntegration(null);
    setSearchTerm("");
    onClose();
  };
  
  const handleSave = () => {
    if (!selectedIntegration) {
      toast.error("Selecione uma integração");
      return;
    }
    
    let integrationData = {
      name,
      description,
      integrationId: selectedIntegration.id,
      type: selectedIntegration.type
    };
    
    if (selectedIntegration.type === 'webhook' || selectedIntegration.type === 'n8n') {
      integrationData.webhookUrl = selectedIntegration.urlN8N;
    } else if (selectedIntegration.type === 'flowbuilder') {
      integrationData.projectName = selectedIntegration.projectName;
    }
    
    console.log("Salvando dados da integração:", integrationData);
    onSave(integrationData);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        Adicionar Webhook ao Fluxo
      </DialogTitle>
      
      <DialogContent dividers>
        <TextField
          label="Nome do Webhook no Fluxo"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        
        <TextField
          label="Descrição (opcional)"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          variant="outlined"
          multiline
          rows={2}
        />
        
        <Box mt={2}>
          <Typography variant="subtitle1">
            Selecione um webhook para integração:
          </Typography>
          
          <TextField
            label="Buscar webhook"
            fullWidth
            value={searchTerm}
            onChange={handleSearch}
            margin="normal"
            variant="outlined"
            className={classes.searchField}
          />
          
          {loading ? (
            <Box display="flex" justifyContent="center" mt={3} mb={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {filteredIntegrations.length === 0 ? (
                <Box mt={2} mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Nenhum webhook encontrado. Crie um na área de Integrações.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredIntegrations.map((integration) => (
                    <ListItem
                      key={integration.id}
                      button
                      onClick={() => handleSelectIntegration(integration)}
                      className={`${classes.integrationCard} ${
                        selectedIntegration?.id === integration.id ? classes.selectedIntegration : ""
                      }`}
                    >
                      <Box display="flex" alignItems="center" width="100%">
                        {getIntegrationIcon(integration.type)}
                        <Box flex={1}>
                          <Typography variant="subtitle1">
                            {integration.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Tipo: {integration.type.toUpperCase()}
                          </Typography>
                          {integration.urlN8N && (
                            <Typography variant="body2" color="textSecondary" noWrap>
                              URL: {integration.urlN8N}
                            </Typography>
                          )}
                        </Box>
                        {selectedIntegration?.id === integration.id && (
                          <ArrowForward color="primary" />
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={handleClose}
          color="secondary"
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={!selectedIntegration || loading}
          className={classes.btnWrapper}
        >
          Adicionar Webhook
          {loading && (
            <CircularProgress size={24} className={classes.buttonProgress} />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowBuilderIntegrationModal;
