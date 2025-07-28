import React, { useState, useEffect, useRef, useContext } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { head } from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";

import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Typography
} from "@material-ui/core";

import { Autocomplete, Checkbox, Chip, Stack } from "@mui/material";

import { i18n } from "../../translate/i18n";
import moment from "moment";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import ConfirmationModal from "../ConfirmationModal";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  dialog: {
    "& .MuiDialog-paper": {
      borderRadius: 8,
    },
  },
  dialogContent: {
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1),
  },
  dialogActions: {
    padding: theme.spacing(2),
  },
  dialogTitle: {
    background: "white",
    padding: "36px 50px 0",
    "& h2": {
      color: "#333",
      fontSize: "1.2rem",
      fontWeight: 500,
    },
  },
  textField: {
    flex: 1,
    width: "100%",
    margin: 0,
    marginBottom: 10,
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#25b6e8",
      },
    },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#25b6e8",
    },
    "& .MuiFormLabel-root.Mui-focused": {
      color: "#25b6e8",
    },
  },
  contentStack: {
    gap: "14px",
    "& .MuiTypography-root": {
      color: "#333",
      fontWeight: 500,
      marginBottom: 4,
    },
  },
  buttonStack: {
    marginTop: "16px",
  },
  actionButton: {
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#25b6e8",
    color: "white",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  cancelButton: {
    color: "#333",
    borderColor: "#333",
    "&:hover": {
      borderColor: "#333",
      backgroundColor: "rgba(51, 51, 51, 0.05)",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "10vh",
    "& .MuiCircularProgress-root": {
      color: "#25b6e8",
    },
  },
  autoComplete: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#25b6e8",
    },
  },
  select: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#25b6e8",
    },
  },
  checkbox: {
    color: "#25b6e8 !important",
    "&.Mui-checked": {
      color: "#25b6e8 !important",
    },
  },
  online: {
    color: "#4caf50",
    margin: 0,
  },
  offline: {
    color: "#f44336",
    margin: 0,
  },
}));
const CampaignModalPhrase = ({ open, onClose, FlowCampaignId, onSave }) => {
  const classes = useStyles();
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);
  const { companyId } = user;

  const [campaignEditable, setCampaignEditable] = useState(true);
  const attachmentFile = useRef(null);

  const [dataItem, setDataItem] = useState({
    name: "",
    phrase: ""
  });

  const [dataItemError, setDataItemError] = useState({
    name: false,
    flowId: false,
    phrase: false
  });

  const [flowSelected, setFlowSelected] = useState();
  const [flowsData, setFlowsData] = useState([]);
  const [flowsDataComplete, setFlowsDataComplete] = useState([]);

  const [selectedWhatsapp, setSelectedWhatsapp] = useState("")
  const [whatsAppNames, setWhatsAppNames] = useState([])
  const [whatsApps, setWhatsApps] = useState([])
  const [whatsAppSelected, setWhatsAppSelected] = useState({})

  const [active, setActive] = useState(true)

  const [loading, setLoading] = useState(true);

  const getFlows = async () => {
    const flows = await api.get("/flowbuilder");
    setFlowsDataComplete(flows.data.flows);
    setFlowsData(flows.data.flows.map(flow => flow.name));
    return flows.data.flows;
  };

  const detailsPhrase = async flows => {
    setLoading(true);
    await api.get(`/flowcampaign/${FlowCampaignId}`).then(res => {
      console.log("dete", res.data);
      setDataItem({
        name: res.data.details.name,
        phrase: res.data.details.phrase
      });
      setActive(res.data.details.status)
      const nameFlow = flows.filter(
        itemFlows => itemFlows.id === res.data.details.flowId
      );
      if (nameFlow.length > 0) {
        setFlowSelected(nameFlow[0].name);
      }
      setLoading(false);
    });
  };

  const handleClose = () => {
    onClose();
  };

  const openModal = async () => {
    const flows = await getFlows();
    if (FlowCampaignId) {
      await detailsPhrase(flows);
    } else {
      clearData();
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true)
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        api
          .get(`/whatsapp`, { params: { companyId, session: 0 } })
          .then(({ data }) => {
            setWhatsApps(data)
          })
      }
      fetchContacts();
      setLoading(false)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [])


  useEffect(() => {
    setLoading(true)
    if (open === true) {
      openModal();
    }
  }, [open]);

  const clearErrors = () => {
    setDataItemError({
      name: false,
      flowId: false,
      whatsappId: false,
      phrase: false
    });
  };

  const clearData = () => {
    setFlowSelected();
    setDataItem({
      name: "",
      phrase: ""
    });
  };

  const applicationSaveAndEdit = () => {
    let error = 0;
    if (dataItem.name === "" || dataItem.name.length === 0) {
      setDataItemError(old => ({ ...old, name: true }));
      error++;
    }
    if (!flowSelected) {
      setDataItemError(old => ({ ...old, flowId: true }));
      error++;
    }
    if (dataItem.phrase === "" || dataItem.phrase.length === 0) {
      setDataItemError(old => ({ ...old, phrase: true }));
      error++;
    }
    if (!selectedWhatsapp) {
      setDataItemError(old => ({ ...old, whatsappId: true }))
    }

    if (error !== 0) {
      return;
    }

    const idFlow = flowsDataComplete.filter(
      item => item.name === flowSelected
    )[0].id;

    const whatsappId = selectedWhatsapp !== "" ? selectedWhatsapp : null

    if (FlowCampaignId) {
      api.put("/flowcampaign", {
        id: FlowCampaignId,
        name: dataItem.name,
        flowId: idFlow,
        whatsappId: whatsappId,
        phrase: dataItem.phrase,
        status: active
      })
      onClose();
      onSave('ok');
      toast.success("Frase alterada com sucesso!");
      clearData();
    } else {
      api.post("/flowcampaign", {
        name: dataItem.name,
        flowId: idFlow,
        whatsappId: whatsappId,
        phrase: dataItem.phrase
      });
      onClose();
      onSave('ok');
      toast.success("Frase criada com sucesso!");
      clearData();
    }
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        className={classes.dialog}
      >
        <DialogTitle className={classes.dialogTitle}>
          {campaignEditable ? (
            <>
              {FlowCampaignId
                ? `Editar campanha com fluxo por frase`
                : `Nova campanha com fluxo por frase`}
            </>
          ) : (
            <>{`${i18n.t("campaigns.dialog.readonly")}`}</>
          )}
        </DialogTitle>
        <div style={{ display: "none" }}>
          <input type="file" ref={attachmentFile} />
        </div>
        {!loading && (
          <Stack sx={{ padding: "52px" }}>
            <Stack className={classes.contentStack}>
              <Stack gap={1}>
                <Typography>Nome do disparo por frase</Typography>
                <TextField
                  label={""}
                  name="text"
                  variant="outlined"
                  error={dataItemError.name}
                  defaultValue={dataItem.name}
                  margin="dense"
                  onChange={e => {
                    setDataItem(old => {
                      let newValue = old;
                      newValue.name = e.target.value;
                      return newValue;
                    });
                  }}
                  className={classes.textField}
                />
              </Stack>
              <Stack gap={1}>
                <Typography>Escolha um fluxo</Typography>
                <Autocomplete
                  disablePortal
                  id="combo-box-demo"
                  value={flowSelected}
                  error={dataItemError.flowId}
                  defaultValue={flowSelected}
                  options={flowsData}
                  onChange={(event, newValue) => {
                    setFlowSelected(newValue);
                  }}
                  className={classes.autoComplete}
                  sx={{ width: "100%" }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      error={dataItemError.flowId}
                      variant="outlined"
                      style={{ width: "100%" }}
                      placeholder="Escolha um fluxo"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        style={{ borderRadius: "8px" }}
                      />
                    ))
                  }
                />
              </Stack>
              <Stack gap={1}>
                <Select
                  required
                  fullWidth
                  displayEmpty
                  variant="outlined"
                  value={selectedWhatsapp}
                  className={classes.select}
                  onChange={(e) => {
                    setSelectedWhatsapp(e.target.value)
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left"
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left"
                    },
                    getContentAnchorEl: null,
                  }}
                  renderValue={() => {
                    if (selectedWhatsapp === "") {
                      return "Selecione uma Conexão"
                    }
                    const whatsapp = whatsApps.find(w => w.id === selectedWhatsapp)
                    return whatsapp.name
                  }}
                >
                  {whatsApps?.length > 0 &&
                    whatsApps.map((whatsapp, key) => (
                      <MenuItem dense key={key} value={whatsapp.id}>
                        <ListItemText
                          primary={
                            <>
                              <Typography component="span" style={{ fontSize: 14, marginLeft: "10px", display: "inline-flex", alignItems: "center", lineHeight: "2" }}>
                                {whatsapp.name} &nbsp; <p className={(whatsapp.status) === 'CONNECTED' ? classes.online : classes.offline} >({whatsapp.status})</p>
                              </Typography>
                            </>
                          }
                        />
                      </MenuItem>
                    ))
                  }
                </Select>
              </Stack>
              <Stack gap={1}>
                <Typography>Qual frase dispara o fluxo?</Typography>
                <TextField
                  label={""}
                  name="text"
                  variant="outlined"
                  error={dataItemError.phrase}
                  defaultValue={dataItem.phrase}
                  margin="dense"
                  onChange={e => {
                    setDataItem(old => {
                      let newValue = old;
                      newValue.phrase = e.target.value;
                      return newValue;
                    });
                  }}
                  className={classes.textField}
                />
              </Stack>
              <Stack direction={'row'} gap={2}>
                <Stack justifyContent={'center'}>
                  <Typography>Status</Typography>
                </Stack>
                <Checkbox
                  checked={active}
                  onChange={() => setActive(old => !old)}
                  className={classes.checkbox}
                />
              </Stack>
            </Stack>
            <Stack
              direction={"row"}
              spacing={2}
              alignSelf={"end"}
              className={classes.buttonStack}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  onClose();
                  clearErrors();
                }}
                className={`${classes.actionButton} ${classes.cancelButton}`}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => applicationSaveAndEdit()}
                className={`${classes.actionButton} ${classes.saveButton}`}
              >
                {FlowCampaignId ? "Salvar campanha" : "Criar campanha"}
              </Button>
            </Stack>
          </Stack>
        )}
        {loading && (
          <Stack
            justifyContent={"center"}
            alignItems={"center"}
            minHeight={"10vh"}
            sx={{ padding: "52px" }}
            className={classes.loadingContainer}
          >
            <CircularProgress />
          </Stack>
        )}
      </Dialog>
    </div>
  );
};

export default CampaignModalPhrase;