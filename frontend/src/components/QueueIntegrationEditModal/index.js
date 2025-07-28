import React, { useState, useEffect, useRef } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { Box } from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
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

// Schema de validação específico para edição
const GeminiIntegrationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Nome muito curto")
    .required("Nome é obrigatório"),
  geminiApiKey: Yup.string()
    .required("Chave da API é obrigatória")
});

const QueueIntegrationEditModal = ({ open, onClose, queueIntegrationId }) => {
  const classes = useStyles();
  const isMounted = useRef(true);
  const formikRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [queueIntegration, setQueueIntegration] = useState({
    name: "",
    type: "gemini",
    geminiApiKey: "",
    geminiPrompt: "",
    geminiMaxTokens: 1024,
    geminiTemperature: 0.7,
    geminiMaxMessages: 20,
    geminiTestPhone: ""
  });
  
  // Efeito para limpeza
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Efeito para carregar dados quando o modal abre
  useEffect(() => {
    if (!open || !queueIntegrationId) return;
    
    const fetchIntegrationData = async () => {
      setLoading(true);
      try {
        console.log(`EDIT MODAL - Carregando integração ID: ${queueIntegrationId}`);
        const { data } = await api.get(`/queueIntegration/${queueIntegrationId}`);
        
        if (!data) {
          throw new Error("Não foi possível carregar os dados da integração");
        }
        
        console.log("EDIT MODAL - Dados recebidos:", data);
        
        // Verificar se é uma integração do Gemini
        if (data.type !== "gemini") {
          toast.error("Esta integração não é do tipo Gemini");
          onClose();
          return;
        }
        
        // Garantir que todos os campos existam
        const completeData = {
          id: data.id,
          name: data.name || "",
          type: "gemini",
          geminiApiKey: data.geminiApiKey || "",
          geminiPrompt: data.geminiPrompt || "",
          geminiMaxTokens: data.geminiMaxTokens || 1024,
          geminiTemperature: data.geminiTemperature || 0.7,
          geminiMaxMessages: data.geminiMaxMessages || 20,
          geminiTestPhone: data.geminiTestPhone || ""
        };
        
        setQueueIntegration(completeData);
        
        // Se já tiver referência ao Formik, atualize diretamente
        if (formikRef.current) {
          formikRef.current.resetForm({ values: completeData });
        }
      } catch (err) {
        console.error("EDIT MODAL - Erro ao carregar:", err);
        toast.error("Erro ao carregar dados da integração Gemini");
        onClose();
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchIntegrationData();
  }, [queueIntegrationId, open, onClose]);
  
  const handleSaveIntegration = async values => {
    setLoading(true);
    try {
      console.log("EDIT MODAL - Enviando dados para atualização:", values);
      await api.put(`/queueIntegration/${queueIntegrationId}`, values);
      toast.success("Integração Gemini atualizada com sucesso!");
      onClose();
    } catch (err) {
      console.error("EDIT MODAL - Erro ao salvar:", err);
      if (err.response && err.response.status === 403) {
        toast.error("Você não tem permissão para editar integrações. Apenas administradores podem realizar esta ação.");
      } else {
        toastError(err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          Editar Integração Gemini
        </DialogTitle>
        
        <Formik
          initialValues={queueIntegration}
          enableReinitialize={true}
          validationSchema={GeminiIntegrationSchema}
          onSubmit={handleSaveIntegration}
          innerRef={formikRef}
        >
          {({ values, errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Field
                  as={TextField}
                  label="Nome da Integração"
                  name="name"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                />
                
                <Box mt={1} mb={2} p={1} style={{ backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  {i18n.t(`queueIntegrationModal.form.typeDescription.gemini`)}
                </Box>
                
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
              </DialogContent>
              
              <DialogActions>
                <Button
                  onClick={onClose}
                  color="secondary"
                  disabled={isSubmitting || loading}
                  variant="outlined"
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting || loading}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  Salvar
                  {(loading || isSubmitting) && (
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

export default QueueIntegrationEditModal; 