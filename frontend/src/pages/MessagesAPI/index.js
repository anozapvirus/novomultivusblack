import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";
import { Button, CircularProgress, Grid, TextField, Typography } from "@material-ui/core";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

import axios from "axios";
import usePlans from "../../hooks/usePlans";
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
  contentContainer: {
    backgroundColor: "white",
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    margin: theme.spacing(2),
  },
  formContainer: {
    maxWidth: 500,
  },
  sectionTitle: {
    color: "#25b6e8",
    marginBottom: theme.spacing(2),
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  btnWrapper: {
    backgroundColor: "#25b6e8",
    color: "white",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  buttonProgress: {
    color: "white",
  },
  elementMargin: {
    margin: theme.spacing(2, 0),
  },
  textRight: {
    textAlign: "right",
  },
  fileInput: {
    padding: theme.spacing(1),
    borderRadius: 8,
    border: "1px solid #ddd",
    width: "100%",
  },
  instructionBlock: {
    backgroundColor: "white",
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    marginBottom: theme.spacing(2),
  },
  codeBlock: {
    backgroundColor: "#f8f9fa",
    padding: theme.spacing(2),
    borderRadius: 8,
    fontFamily: "monospace",
  }
}));

const MessagesAPI = () => {
  const classes = useStyles();
  const history = useHistory();

  const [formMessageTextData,] = useState({ token: '', number: '', body: '', userId: '', queueId: '' })
  const [formMessageMediaData,] = useState({ token: '', number: '', medias: '', body: '', userId: '', queueId: '' })
  const [file, setFile] = useState({})
  const { user, socket } = useContext(AuthContext);

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useExternalApi) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEndpoint = () => {
    return process.env.REACT_APP_BACKEND_URL + '/api/messages/send'
  }

  const handleSendTextMessage = async (values) => {
    const { number, body, userId, queueId } = values;
    const data = { number, body, userId, queueId };
    try {
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'application/json',
          'Authorization': `Bearer ${values.token}`
        }
      })
      toast.success('Mensagem enviada com sucesso');
    } catch (err) {
      toastError(err);
    }
  }

  const handleSendMediaMessage = async (values) => {
    try {
      const firstFile = file[0];
      const data = new FormData();
      data.append('number', values.number);
      data.append('body', values.body ? values.body : firstFile.name);
      data.append('userId', values.userId);
      data.append('queueId', values.queueId);
      data.append('medias', firstFile);
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'multipart/form-data',
          'Authorization': `Bearer ${values.token}`
        }
      })
      toast.success('Mensagem enviada com sucesso');
    } catch (err) {
      toastError(err);
    }
  }

  const renderFormMessageText = () => {
    return (
      <Formik
        initialValues={formMessageTextData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendTextMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
          }, 400);
        }}
        className={classes.elementMargin}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.number")}
                  name="number"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.body")}
                  name="body"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.userId")}
                  name="userId"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.queueId")}
                  name="queueId"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                />
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {isSubmitting ? (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  ) : 'Enviar'}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  const renderFormMessageMedia = () => {
    return (
      <Formik
        initialValues={formMessageMediaData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendMediaMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
            document.getElementById('medias').files = null
            document.getElementById('medias').value = null
          }, 400);
        }}
        className={classes.elementMargin}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.number")}
                  name="number"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.body")}
                  name="body"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.userId")}
                  name="userId"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.queueId")}
                  name="queueId"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  type="file"
                  name="medias"
                  id="medias"
                  required
                  onChange={(e) => setFile(e.target.files)}
                  className={classes.fileInput}
                />
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {isSubmitting ? (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  ) : 'Enviar'}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  return (
    <Paper className={classes.mainPaper} variant="outlined">
      <div className={classes.contentContainer}>
        <Typography variant="h5" className={classes.sectionTitle}>
          {i18n.t("messagesAPI.API.title")}
        </Typography>

        <div className={classes.instructionBlock}>
          <Typography variant="h6" color="primary" gutterBottom>
            {i18n.t("messagesAPI.API.methods.title")}
          </Typography>
          <Typography component="div">
            <ol>
              <li>{i18n.t("messagesAPI.API.methods.messagesText")}</li>
              <li>{i18n.t("messagesAPI.API.methods.messagesMidia")}</li>
            </ol>
          </Typography>
        </div>

        <div className={classes.instructionBlock}>
          <Typography variant="h6" color="primary" gutterBottom>
            {i18n.t("messagesAPI.API.instructions.title")}
          </Typography>
          <Typography component="div">
            <b>{i18n.t("messagesAPI.API.instructions.comments")}</b><br />
            <ul>
              <li>{i18n.t("messagesAPI.API.instructions.comments1")}</li>
              <li>
                {i18n.t("messagesAPI.API.instructions.comments2")}
                <ul>
                  <li>{i18n.t("messagesAPI.API.instructions.codeCountry")}</li>
                  <li>{i18n.t("messagesAPI.API.instructions.code")}</li>
                  <li>{i18n.t("messagesAPI.API.instructions.number")}</li>
                </ul>
              </li>
            </ul>
          </Typography>
        </div>

        <div className={classes.instructionBlock}>
          <Typography variant="h6" color="primary" gutterBottom>
            {i18n.t("messagesAPI.API.text.title")}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography component="div">
                <p>{i18n.t("messagesAPI.API.text.instructions")}</p>
                <div className={classes.codeBlock}>
                  <b>Endpoint: </b> {getEndpoint()} <br />
                  <b>Método: </b> POST <br />
                  <b>Headers: </b> Authorization Bearer (token registrado) e Content-Type (application/json) <br />
                  <b>Body: </b> {"{"} <br />
                  "number": "558599999999" <br />
                  "body": "Message" <br />
                  "userId": ID usuário ou "" <br />
                  "queueId": ID Fila ou "" <br />
                  "sendSignature": Assinar mensagem - true/false <br />
                  "closeTicket": Encerrar o ticket - true/false <br />
                  {"}"}
                </div>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>
                <b>Teste de Envio</b>
              </Typography>
              {renderFormMessageText()}
            </Grid>
          </Grid>
        </div>

        <div className={classes.instructionBlock}>
          <Typography variant="h6" color="primary" gutterBottom>
            {i18n.t("messagesAPI.API.media.title")}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography component="div">
                <p>{i18n.t("messagesAPI.API.media.instructions")}</p>
                <div className={classes.codeBlock}>
                  <b>Endpoint: </b> {getEndpoint()} <br />
                  <b>Método: </b> POST<b>Headers: </b> Authorization Bearer (token cadastrado) e Content-Type (multipart/form-data) <br />
                  <b>FormData: </b> <br />
                  <ul>
                    <li>
                      <b>number: </b> 558599999999
                    </li>
                    <li>
                      <b>body:</b> Message
                    </li>
                    <li>
                      <b>userId:</b> ID usuário ou ""
                    </li>
                    <li>
                      <b>queueId:</b> ID da fila ou ""
                    </li>
                    <li>
                      <b>medias: </b> arquivo
                    </li>
                    <li>
                      <b>sendSignature:</b> Assinar mensagem true/false
                    </li>
                    <li>
                      <b>closeTicket:</b> Encerrar ticket true/false
                    </li>
                  </ul>
                </div>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>
                <b>Teste de Envio</b>
              </Typography>
              {renderFormMessageMedia()}
            </Grid>
          </Grid>
        </div>
      </div>
    </Paper>
  );
};

export default MessagesAPI;