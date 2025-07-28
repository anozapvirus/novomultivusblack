import React, { useContext, useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import IconButton from "@material-ui/core/IconButton";
import { i18n } from "../../translate/i18n";
import { head } from "lodash";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import MessageVariablesPicker from "../MessageVariablesPicker";
import ButtonWithSpinner from "../ButtonWithSpinner";

import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Tooltip
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import ConfirmationModal from "../ConfirmationModal";
import {
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  ContactPhone as ContactPhoneIcon,
  Label as LabelIcon,
  Add as AddIcon,
  CreateNewFolder as CreateNewFolderIcon
} from "@material-ui/icons";

const path = require('path');

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
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
  dialog: {
    "& .MuiDialog-paper": {
      width: "600px",
      maxHeight: "90vh",
    },
  },
  dialogContent: {
    padding: theme.spacing(2),
    "& .MuiGrid-spacing-xs-2": {
      width: "100%",
      margin: 0,
    },
  },
  dialogActions: {
    padding: theme.spacing(2),
    borderTop: "1px solid #e0e0e0",
    justifyContent: "flex-end",
  },
  folderSection: {
    marginBottom: theme.spacing(2),
  },
  contactSection: {
    marginBottom: theme.spacing(2),
  },
  tagsSection: {
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  accordion: {
    marginBottom: theme.spacing(1),
  },
  accordionSummary: {
    backgroundColor: theme.palette.grey[100],
  },
  createFolderButton: {
    marginTop: theme.spacing(1),
  },
  folderActions: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  mediaPreview: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.grey[50],
  },
}));

const QuickeMessageSchema = Yup.object().shape({
  shortcode: Yup.string().required("Obrigatório"),
  //   message: Yup.string().required("Obrigatório"),
});

const QuickMessageDialog = ({ open, onClose, quickemessageId, reload }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const messageInputRef = useRef();

  const initialState = {
    shortcode: "",
    message: "",
    geral: false,
    status: true,
    folder: "",
    subfolder: "",
    isContact: false,
    contactName: "",
    contactNumber: "",
    contactEmail: "",
    tags: "",
  };

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [quickemessage, setQuickemessage] = useState(initialState);
  const [attachment, setAttachment] = useState(null);
  const attachmentFile = useRef(null);
  const [folders, setFolders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false);

  useEffect(() => {
    try {
      (async () => {
        if (!quickemessageId) return;

        const { data } = await api.get(`/quick-messages/${quickemessageId}`);

        setQuickemessage((prevState) => {
          return { ...prevState, ...data };
        });
      })();
    } catch (err) {
      toastError(err);
    }
  }, [quickemessageId, open]);

  // Carregar pastas
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const { data } = await api.get("/quick-messages/folders");
        setFolders(data);
      } catch (err) {
        console.error("Erro ao carregar pastas:", err);
      }
    };
    
    if (open) {
      loadFolders();
    }
  }, [open]);

  // Carregar contatos
  const loadContacts = async (searchTerm) => {
    if (searchTerm.length < 3) return;
    
    setLoadingContacts(true);
    try {
      const { data } = await api.get("/quick-messages/contacts/search", {
        params: { searchParam: searchTerm }
      });
      setContacts(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleClose = () => {
    setQuickemessage(initialState);
    setAttachment(null);
    setShowCreateFolder(false);
    setShowCreateSubfolder(false);
    setNewFolderName("");
    setNewSubfolderName("");
    onClose();
  };

  const handleAttachmentFile = (e) => {
    const file = head(e.target.files);
    if (file) {
      setAttachment(file);
    }
  };

  const handleSaveQuickeMessage = async (values) => {
    const quickemessageData = { 
      ...values, 
      isMedia: true, 
      mediaPath: attachment ? String(attachment.name).replace(/ /g, "_") : values.mediaPath ? path.basename(values.mediaPath).replace(/ /g, "_") : null 
    };

    try {
      if (quickemessageId) {
        await api.put(`/quick-messages/${quickemessageId}`, quickemessageData);
        if (attachment != null) {
          const formData = new FormData();
          formData.append("typeArch", "quickMessage");
          formData.append("file", attachment);
          await api.post(
            `/quick-messages/${quickemessageId}/media-upload`,
            formData
          );
        }
      } else {
        const { data } = await api.post("/quick-messages", quickemessageData);
        if (attachment != null) {
          const formData = new FormData();
          formData.append("typeArch", "quickMessage");
          formData.append("file", attachment);
          await api.post(`/quick-messages/${data.id}/media-upload`, formData);
        }
      }
      toast.success(i18n.t("quickMessages.toasts.success"));
      if (typeof reload == "function") {
        console.log(reload);
        console.log("0");
        reload();
      }
    } catch (err) {
      toastError(err);
    }
    handleClose();
  };

  const deleteMedia = async () => {
    if (attachment) {
      setAttachment(null);
      attachmentFile.current.value = null;
    }

    if (quickemessage.mediaPath) {
      await api.delete(`/quick-messages/${quickemessage.id}/media-upload`);
      setQuickemessage((prev) => ({
        ...prev,
        mediaPath: null,
      }));
      toast.success(i18n.t("quickMessages.toasts.deleted"));
      if (typeof reload == "function") {
        console.log(reload);
        console.log("1");
        reload();
      }
    }
  };

  const handleContactSelect = (contact) => {
    if (contact) {
      setQuickemessage(prev => ({
        ...prev,
        isContact: true,
        contactName: contact.name,
        contactNumber: contact.number,
        contactEmail: contact.email || "",
        message: `Contato: ${contact.name}\nTelefone: ${contact.number}${contact.email ? `\nEmail: ${contact.email}` : ''}`
      }));
    }
  };

  const handleTagsChange = (event, newValue) => {
    setQuickemessage(prev => ({
      ...prev,
      tags: newValue.join(',')
    }));
  };

  const getTagsArray = () => {
    return quickemessage.tags ? quickemessage.tags.split(',').filter(tag => tag.trim()) : [];
  };

  // Função para criar nova pasta
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Digite um nome para a pasta");
      return;
    }

    try {
      await api.post("/quick-messages/folders", {
        folderName: newFolderName.trim()
      });
      
      // Recarregar pastas
      const { data } = await api.get("/quick-messages/folders");
      setFolders(data);
      
      // Selecionar a nova pasta
      setQuickemessage(prev => ({
        ...prev,
        folder: newFolderName.trim()
      }));
      
      setNewFolderName("");
      setShowCreateFolder(false);
      toast.success("Pasta criada com sucesso!");
    } catch (err) {
      toastError(err);
    }
  };

  // Função para criar nova subpasta
  const handleCreateSubfolder = async () => {
    if (!newSubfolderName.trim()) {
      toast.error("Digite um nome para a subpasta");
      return;
    }

    if (!quickemessage.folder) {
      toast.error("Selecione uma pasta principal primeiro");
      return;
    }

    try {
      await api.post("/quick-messages/folders", {
        folderName: quickemessage.folder,
        subfolderName: newSubfolderName.trim()
      });
      
      // Recarregar pastas
      const { data } = await api.get("/quick-messages/folders");
      setFolders(data);
      
      // Selecionar a nova subpasta
      setQuickemessage(prev => ({
        ...prev,
        subfolder: newSubfolderName.trim()
      }));
      
      setNewSubfolderName("");
      setShowCreateSubfolder(false);
      toast.success("Subpasta criada com sucesso!");
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      <ConfirmationModal
        title={i18n.t("quickMessages.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={setConfirmationOpen}
        onConfirm={deleteMedia}
      >
        {i18n.t("quickMessages.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        className={classes.dialog}
      >
        <DialogTitle id="form-dialog-title">
          {quickemessageId
            ? `${i18n.t("quickMessages.dialog.edit")}`
            : `${i18n.t("quickMessages.dialog.add")}`}
        </DialogTitle>
        <div style={{ display: "none" }}>
          <input
            type="file"
            // accept="Image/*, Video/*"
            ref={attachmentFile}
            onChange={(e) => handleAttachmentFile(e)}
          />
        </div>
        <Formik
          initialValues={quickemessage}
          enableReinitialize={true}
          validationSchema={QuickeMessageSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveQuickeMessage(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, setFieldValue, values }) => (
            <Form>
              <DialogContent dividers className={classes.dialogContent}>
                <Grid spacing={2} container>
                  {/* Informações Básicas */}
                  <Grid xs={12} item>
                    <Typography variant="h6" gutterBottom>
                      Informações Básicas
                    </Typography>
                  </Grid>
                  
                  <Grid xs={12} sm={6} item>
                    <Field
                      as={TextField}
                      autoFocus
                      label={i18n.t("quickMessages.dialog.shortcode")}
                      name="shortcode"
                      disabled={quickemessageId && values.visao && !values.geral && values.userId !== user.id}
                      error={touched.shortcode && Boolean(errors.shortcode)}
                      helperText={touched.shortcode && errors.shortcode}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>

                  <Grid xs={12} sm={6} item>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.geral}
                          onChange={(e) => setFieldValue("geral", e.target.checked)}
                          name="geral"
                          color="primary"
                        />
                      }
                      label="Mensagem Geral"
                    />
                  </Grid>

                  {/* Organização em Pastas */}
                  <Grid xs={12} item>
                    <Accordion className={classes.accordion}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        className={classes.accordionSummary}
                      >
                        <FolderIcon style={{ marginRight: 8 }} />
                        <Typography>Organização em Pastas</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid xs={12} sm={6} item>
                            <FormControl fullWidth margin="dense">
                              <InputLabel>Pasta Principal</InputLabel>
                              <Select
                                value={values.folder || ""}
                                onChange={(e) => setFieldValue("folder", e.target.value)}
                                variant="outlined"
                              >
                                <MenuItem value="">
                                  <em>Selecione uma pasta</em>
                                </MenuItem>
                                {folders.map((folder) => (
                                  <MenuItem key={folder.name} value={folder.name}>
                                    {folder.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            
                            {/* Botão para criar nova pasta */}
                            <div className={classes.folderActions}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CreateNewFolderIcon />}
                                onClick={() => setShowCreateFolder(!showCreateFolder)}
                                className={classes.createFolderButton}
                              >
                                {showCreateFolder ? "Cancelar" : "Criar Pasta"}
                              </Button>
                            </div>
                            
                            {/* Campo para criar nova pasta */}
                            {showCreateFolder && (
                              <Box mt={1}>
                                <TextField
                                  label="Nome da Nova Pasta"
                                  value={newFolderName}
                                  onChange={(e) => setNewFolderName(e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCreateFolder();
                                    }
                                  }}
                                />
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  onClick={handleCreateFolder}
                                  style={{ marginTop: 8 }}
                                >
                                  Criar
                                </Button>
                              </Box>
                            )}
                          </Grid>
                          
                          <Grid xs={12} sm={6} item>
                            <Field
                              as={TextField}
                              label="Subpasta"
                              name="subfolder"
                              variant="outlined"
                              margin="dense"
                              fullWidth
                            />
                            
                            {/* Botão para criar nova subpasta */}
                            {values.folder && (
                              <div className={classes.folderActions}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<CreateNewFolderIcon />}
                                  onClick={() => setShowCreateSubfolder(!showCreateSubfolder)}
                                  className={classes.createFolderButton}
                                >
                                  {showCreateSubfolder ? "Cancelar" : "Criar Subpasta"}
                                </Button>
                              </div>
                            )}
                            
                            {/* Campo para criar nova subpasta */}
                            {showCreateSubfolder && values.folder && (
                              <Box mt={1}>
                                <TextField
                                  label="Nome da Nova Subpasta"
                                  value={newSubfolderName}
                                  onChange={(e) => setNewSubfolderName(e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCreateSubfolder();
                                    }
                                  }}
                                />
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  onClick={handleCreateSubfolder}
                                  style={{ marginTop: 8 }}
                                >
                                  Criar
                                </Button>
                              </Box>
                            )}
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  {/* Contatos */}
                  <Grid xs={12} item>
                    <Accordion className={classes.accordion}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        className={classes.accordionSummary}
                      >
                        <ContactPhoneIcon style={{ marginRight: 8 }} />
                        <Typography>Envio de Contatos</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid xs={12} item>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={values.isContact}
                                  onChange={(e) => setFieldValue("isContact", e.target.checked)}
                                  name="isContact"
                                  color="primary"
                                />
                              }
                              label="Esta é uma mensagem de contato"
                            />
                          </Grid>
                          
                          {values.isContact && (
                            <>
                              <Grid xs={12} item>
                                <Autocomplete
                                  options={contacts}
                                  getOptionLabel={(option) => `${option.name} (${option.number})`}
                                  loading={loadingContacts}
                                  onInputChange={(event, newInputValue) => {
                                    loadContacts(newInputValue);
                                  }}
                                  onChange={(event, newValue) => handleContactSelect(newValue)}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Buscar contato"
                                      variant="outlined"
                                      margin="dense"
                                      fullWidth
                                    />
                                  )}
                                />
                              </Grid>
                              
                              <Grid xs={12} sm={6} item>
                                <Field
                                  as={TextField}
                                  label="Nome do Contato"
                                  name="contactName"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                  required
                                />
                              </Grid>
                              
                              <Grid xs={12} sm={6} item>
                                <Field
                                  as={TextField}
                                  label="Número do Contato"
                                  name="contactNumber"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                  required
                                />
                              </Grid>
                              
                              <Grid xs={12} item>
                                <Field
                                  as={TextField}
                                  label="Email do Contato"
                                  name="contactEmail"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                />
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  {/* Tags */}
                  <Grid xs={12} item>
                    <Accordion className={classes.accordion}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        className={classes.accordionSummary}
                      >
                        <LabelIcon style={{ marginRight: 8 }} />
                        <Typography>Tags e Categorização</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid xs={12} item>
                            <Autocomplete
                              multiple
                              freeSolo
                              options={[]}
                              value={getTagsArray()}
                              onChange={handleTagsChange}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    variant="outlined"
                                    label={option}
                                    {...getTagProps({ index })}
                                    className={classes.chip}
                                  />
                                ))
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="outlined"
                                  label="Tags (separadas por vírgula)"
                                  placeholder="Digite uma tag e pressione Enter"
                                  margin="dense"
                                  fullWidth
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  {/* Mensagem */}
                  <Grid xs={12} item>
                    <Typography variant="h6" gutterBottom>
                      Mensagem
                    </Typography>
                    <Field
                      as={TextField}
                      label={i18n.t("quickMessages.dialog.message")}
                      name="message"
                      inputRef={messageInputRef}
                      error={touched.message && Boolean(errors.message)}
                      helperText={touched.message && errors.message}
                      variant="outlined"
                      margin="dense"
                      disabled={quickemessageId && values.visao && !values.geral && values.userId !== user.id}
                      multiline={true}
                      rows={7}
                      fullWidth
                    />
                  </Grid>

                  {/* Anexos */}
                  <Grid xs={12} item>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" gutterBottom>
                        Anexos
                      </Typography>
                      <Box>
                        <input
                          type="file"
                          ref={attachmentFile}
                          onChange={handleAttachmentFile}
                          style={{ display: "none" }}
                        />
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<AttachFileIcon />}
                          onClick={() => attachmentFile.current.click()}
                        >
                          Anexar Arquivo
                        </Button>
                        {(attachment || quickemessage.mediaPath) && (
                          <IconButton
                            onClick={() => setConfirmationOpen(true)}
                            color="secondary"
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Preview do arquivo */}
                    {(attachment || quickemessage.mediaPath) && (
                      <Box className={classes.mediaPreview}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Arquivo:</strong> {attachment ? attachment.name : quickemessage.mediaName}
                        </Typography>
                        {attachment && (
                          <Typography variant="body2" color="textSecondary">
                            <strong>Tamanho:</strong> {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        )}
                        {values.folder && (
                          <Typography variant="body2" color="textSecondary">
                            <strong>Pasta:</strong> {values.folder}
                            {values.subfolder && ` > ${values.subfolder}`}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions className={classes.dialogActions}>
                <Button onClick={handleClose} color="secondary">
                  {i18n.t("quickMessages.buttons.cancel")}
                </Button>
                <ButtonWithSpinner
                  variant="contained"
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {i18n.t("quickMessages.buttons.ok")}
                </ButtonWithSpinner>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </>
  );
};

export default QuickMessageDialog;