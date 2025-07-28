import React, { useState, useEffect, useRef } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { head } from "lodash";
import { Box } from "@material-ui/core";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1)
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
    minWidth: 120
  }
}));

const QueueIntegrationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .required("Required"),
  type: Yup.string()
    .required("Required")
});

const QueueIntegrationModal = ({ open, onClose, queueIntegrationId }) => {
  const classes = useStyles();
  const isMounted = useRef(true);
  const formikRef = useRef(null);
  
  const initialState = {
    name: "",
    projectName: "",
    type: "dialogflow",
    jsonContent: "",
    language: "",
    urlN8N: "",
    typebotSlug: "",
    typebotExpires: 0,
    typebotKeywordFinish: "",
    typebotKeywordRestart: "",
    typebotRestartMessage: "",
    typebotUnknownMessage: "",
    typebotDelayMessage: 1000,
    geminiApiKey: "",
    geminiPrompt: "",
    geminiMaxTokens: 1024,
    geminiTemperature: 0.7,
    geminiMaxMessages: 20,
    geminiTestPhone: ""
  };
  
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState(initialState);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Carregar dados ao editar
  useEffect(() => {
    const fetchData = async () => {
      // Somente executar se modal estiver aberto e houver um ID
      if (!open || !queueIntegrationId) return;
      
      console.log(`MODAL - Tentando carregar dados da integração ID: ${queueIntegrationId}`);
      setLoading(true);
      try {
        // Fazer requisição à API de forma detalhada
        console.log(`MODAL - Chamando API: /queueIntegration/${queueIntegrationId}`);
        const response = await api.get(`/queueIntegration/${queueIntegrationId}`);
        const { data } = response;
        
        if (!data) {
          throw new Error("Dados não encontrados");
        }
        
        // Logs detalhados
        console.log("MODAL - Dados recebidos da API:", JSON.stringify(data));
        console.log("MODAL - Tipo da integração:", data.type);
        
        // Aguardar um momento para certificar que o formulário está pronto
        setTimeout(() => {
          // Criar objeto completo com dados recebidos (sem usar spread do initialState)
          const completeData = {
            name: data.name || "",
            projectName: data.projectName || "",
            type: data.type || "dialogflow", // Garantir que o tipo seja preservado
            jsonContent: data.jsonContent || "",
            language: data.language || "",
            urlN8N: data.urlN8N || "",
            typebotSlug: data.typebotSlug || "",
            typebotExpires: data.typebotExpires || 0,
            typebotKeywordFinish: data.typebotKeywordFinish || "",
            typebotKeywordRestart: data.typebotKeywordRestart || "",
            typebotRestartMessage: data.typebotRestartMessage || "",
            typebotUnknownMessage: data.typebotUnknownMessage || "",
            typebotDelayMessage: data.typebotDelayMessage || 1000,
            geminiApiKey: data.geminiApiKey || "",
            geminiPrompt: data.geminiPrompt || "",
            geminiMaxTokens: data.geminiMaxTokens || 1024,
            geminiTemperature: data.geminiTemperature || 0.7,
            geminiMaxMessages: data.geminiMaxMessages || 20,
            geminiTestPhone: data.geminiTestPhone || ""
          };
          
          console.log("MODAL - Dados processados para aplicar ao formulário:", completeData);
          
          // Atualizar o estado local para renderizar corretamente os campos
          setFormValues(completeData);
          
          // Se formikRef existir, definir valores diretamente nele também
          if (formikRef.current) {
            console.log("MODAL - Aplicando valores diretamente ao Formik");
            formikRef.current.resetForm({ values: completeData });
          }
        }, 100);
      } catch (err) {
        console.error("MODAL - Erro ao carregar dados:", err);
        console.error("MODAL - Detalhes do erro:", err.response?.data || err.message);
        toast.error("Erro ao carregar os dados da integração.");
      } finally {
        setLoading(false);
      }
    };
    
    // Executar imediatamente quando o componente montar ou houver mudança no ID
    fetchData();
  }, [queueIntegrationId, open]);
  
  // Reset ao abrir para nova integração
  useEffect(() => {
    if (open && !queueIntegrationId) {
      console.log("MODAL - Abrindo para nova integração, resetando");
      setFormValues(initialState);
      if (formikRef.current) {
        formikRef.current.resetForm({ values: initialState });
      }
    }
  }, [open, queueIntegrationId]);
  
  const handleClose = () => {
    onClose();
    // Aguardar o fechamento do modal antes de resetar os valores
    setTimeout(() => {
      setFormValues(initialState);
    }, 300);
  };

  const handleSaveQueueIntegration = async values => {
    console.log("MODAL - Salvando valores:", values);
    try {
      setLoading(true);
      if (queueIntegrationId) {
        await api.put(`/queueIntegration/${queueIntegrationId}`, values);
        toast.success(i18n.t("queueIntegrationModal.messages.editSuccess"));
      } else {
        await api.post("/queueIntegration", values);
        toast.success(i18n.t("queueIntegrationModal.messages.addSuccess"));
      }
      handleClose();
    } catch (err) {
      console.error("Erro ao salvar integração:", err);
      if (err.response && err.response.status === 403) {
        toast.error("Você não tem permissão para criar ou editar integrações. Apenas administradores podem realizar esta ação.");
      } else {
        toastError(err);
      }
    }
    setLoading(false);
  };

  const handleTest = async values => {
    try {
      await api.post(`/queueIntegration/test`, values);
      toast.success(i18n.t("queueIntegrationModal.messages.testSuccess"));
    } catch (err) {
      toastError(err);
    }
  };
  
  console.log("MODAL - Estado atual dos valores do formulário:", formValues);
  console.log("MODAL - Tipo atual:", formValues.type);

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {queueIntegrationId
            ? `${i18n.t("queueIntegrationModal.title.edit")} (${formValues.type})`
            : i18n.t("queueIntegrationModal.title.add")}
        </DialogTitle>
        
        <Formik
          initialValues={formValues}
          enableReinitialize={true}
          validationSchema={QueueIntegrationSchema}
          onSubmit={handleSaveQueueIntegration}
          innerRef={formikRef}
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <Field
                  as={TextField}
                  label={i18n.t("queueIntegrationModal.form.name")}
                  autoFocus
                  name="name"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                />
                
                <FormControl
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.formControl}
                >
                  <InputLabel id="type-selection-label">
                    {i18n.t("queueIntegrationModal.form.type")}
                  </InputLabel>
                  <Field
                    as={Select}
                    label={i18n.t("queueIntegrationModal.form.type")}
                    name="type"
                    id="type"
                    labelId="type-selection-label"
                    fullWidth
                    error={touched.type && Boolean(errors.type)}
                    onChange={(e) => {
                      console.log("MODAL - Tipo alterado para:", e.target.value);
                      setFieldValue("type", e.target.value);
                    }}
                  >
                    <MenuItem value="dialogflow">Dialogflow</MenuItem>
                    <MenuItem value="n8n">N8N</MenuItem>
                    <MenuItem value="typebot">Typebot</MenuItem>
                    <MenuItem value="webhook">Webhook</MenuItem>
                    <MenuItem value="gemini">Gemini AI</MenuItem>
                    <MenuItem value="flowbuilder">FlowBuilder</MenuItem>
                  </Field>
                </FormControl>

                {values.type && (
                  <Box mt={1} mb={2} p={1} style={{ backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    {i18n.t(`queueIntegrationModal.form.typeDescription.${values.type}`)}
                  </Box>
                )}

                {/* CAMPOS ESPECÍFICOS DO DIALOGFLOW */}
                {values.type === "dialogflow" && (
                  <>
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.projectName")}
                      name="projectName"
                      error={touched.projectName && Boolean(errors.projectName)}
                      helperText={touched.projectName && errors.projectName}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.jsonContent")}
                      name="jsonContent"
                      error={touched.jsonContent && Boolean(errors.jsonContent)}
                      helperText={touched.jsonContent && errors.jsonContent}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      multiline
                      rows={5}
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.language")}
                      name="language"
                      error={touched.language && Boolean(errors.language)}
                      helperText={touched.language && errors.language}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </>
                )}

                {/* CAMPOS ESPECÍFICOS DO N8N */}
                {values.type === "n8n" && (
                  <Field
                    as={TextField}
                    label={i18n.t("queueIntegrationModal.form.urlN8N")}
                    name="urlN8N"
                    error={touched.urlN8N && Boolean(errors.urlN8N)}
                    helperText={touched.urlN8N && errors.urlN8N}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  />
                )}
                
                {/* CAMPOS ESPECÍFICOS DO WEBHOOK */}
                {values.type === "webhook" && (
                  <>
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.projectName")}
                      name="projectName"
                      error={touched.projectName && Boolean(errors.projectName)}
                      helperText={touched.projectName && errors.projectName}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label="URL do Webhook"
                      name="urlN8N"
                      error={touched.urlN8N && Boolean(errors.urlN8N)}
                      helperText={touched.urlN8N && errors.urlN8N}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      placeholder="https://seu-webhook.exemplo.com/endpoint"
                    />
                    <Box mt={1} p={2} style={{ backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '14px' }}>
                      <strong>Informações enviadas pelo webhook:</strong>
                      <ul>
                        <li><code>message</code>: Texto da mensagem</li>
                        <li><code>contact</code>: Dados do contato (nome, número)</li>
                        <li><code>ticket</code>: Informações do ticket</li>
                        <li><code>webhook_type</code>: Tipo de evento</li>
                      </ul>
                    </Box>
                  </>
                )}

                {/* CAMPOS ESPECÍFICOS DO FLOWBUILDER */}
                {values.type === "flowbuilder" && (
                  <>
                    <Field
                      as={TextField}
                      label="ID do FlowBuilder"
                      name="projectName"
                      error={touched.projectName && Boolean(errors.projectName)}
                      helperText={touched.projectName && errors.projectName}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Box mt={1} p={2} style={{ backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '14px' }}>
                      <strong>Configura uma integração com o FlowBuilder</strong>
                      <p>Configure o fluxo desejado para integrar com as conversas do WhatsApp.</p>
                    </Box>
                  </>
                )}

                {/* CAMPOS ESPECÍFICOS DO TYPEBOT */}
                {["typebot"].includes(values.type) && (
                  <>
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.typebotSlug")}
                      name="typebotSlug"
                      error={touched.typebotSlug && Boolean(errors.typebotSlug)}
                      helperText={touched.typebotSlug && errors.typebotSlug}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t(
                        "queueIntegrationModal.form.typebotExpires"
                      )}
                      name="typebotExpires"
                      type="number"
                      error={
                        touched.typebotExpires && Boolean(errors.typebotExpires)
                      }
                      helperText={
                        touched.typebotExpires && errors.typebotExpires
                      }
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t(
                        "queueIntegrationModal.form.typebotDelayMessage"
                      )}
                      name="typebotDelayMessage"
                      type="number"
                      error={
                        touched.typebotDelayMessage &&
                        Boolean(errors.typebotDelayMessage)
                      }
                      helperText={
                        touched.typebotDelayMessage &&
                        errors.typebotDelayMessage
                      }
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t(
                        "queueIntegrationModal.form.typebotKeywordFinish"
                      )}
                      name="typebotKeywordFinish"
                      error={
                        touched.typebotKeywordFinish &&
                        Boolean(errors.typebotKeywordFinish)
                      }
                      helperText={
                        touched.typebotKeywordFinish &&
                        errors.typebotKeywordFinish
                      }
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t(
                        "queueIntegrationModal.form.typebotKeywordRestart"
                      )}
                      name="typebotKeywordRestart"
                      error={
                        touched.typebotKeywordRestart &&
                        Boolean(errors.typebotKeywordRestart)
                      }
                      helperText={
                        touched.typebotKeywordRestart &&
                        errors.typebotKeywordRestart
                      }
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t(
                        "queueIntegrationModal.form.typebotRestartMessage"
                      )}
                      name="typebotRestartMessage"
                      error={
                        touched.typebotRestartMessage &&
                        Boolean(errors.typebotRestartMessage)
                      }
                      helperText={
                        touched.typebotRestartMessage &&
                        errors.typebotRestartMessage
                      }
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t(
                        "queueIntegrationModal.form.typebotUnknownMessage"
                      )}
                      name="typebotUnknownMessage"
                      error={
                        touched.typebotUnknownMessage &&
                        Boolean(errors.typebotUnknownMessage)
                      }
                      helperText={
                        touched.typebotUnknownMessage &&
                        errors.typebotUnknownMessage
                      }
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </>
                )}

                {/* CAMPOS ESPECÍFICOS DO GEMINI */}
                {["gemini"].includes(values.type) && (
                  <>
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.geminiApiKey")}
                      name="geminiApiKey"
                      error={touched.geminiApiKey && Boolean(errors.geminiApiKey)}
                      helperText={touched.geminiApiKey && errors.geminiApiKey}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.geminiTestPhone")}
                      name="geminiTestPhone"
                      error={touched.geminiTestPhone && Boolean(errors.geminiTestPhone)}
                      helperText={touched.geminiTestPhone && errors.geminiTestPhone}
                      variant="outlined"
                      margin="dense"
                      placeholder="55119XXXXXXXX"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.geminiPrompt")}
                      name="geminiPrompt"
                      error={touched.geminiPrompt && Boolean(errors.geminiPrompt)}
                      helperText={touched.geminiPrompt && errors.geminiPrompt}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      multiline
                      rows={5}
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.geminiMaxTokens")}
                      name="geminiMaxTokens"
                      type="number"
                      error={touched.geminiMaxTokens && Boolean(errors.geminiMaxTokens)}
                      helperText={touched.geminiMaxTokens && errors.geminiMaxTokens}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.geminiTemperature")}
                      name="geminiTemperature"
                      type="number"
                      error={touched.geminiTemperature && Boolean(errors.geminiTemperature)}
                      helperText={touched.geminiTemperature && errors.geminiTemperature}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegrationModal.form.geminiMaxMessages")}
                      name="geminiMaxMessages"
                      type="number"
                      error={touched.geminiMaxMessages && Boolean(errors.geminiMaxMessages)}
                      helperText={touched.geminiMaxMessages && errors.geminiMaxMessages}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("queueIntegrationModal.buttons.cancel")}
                </Button>
                {values.type === "dialogflow" && (
                  <Button
                    color="primary"
                    onClick={() => handleTest(values)}
                    variant="outlined"
                    className={classes.btnWrapper}
                  >
                    {i18n.t("queueIntegrationModal.buttons.test")}
                  </Button>
                )}
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {queueIntegrationId
                    ? i18n.t("queueIntegrationModal.buttons.okEdit")
                    : i18n.t("queueIntegrationModal.buttons.okAdd")}
                  {loading && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default QueueIntegrationModal;