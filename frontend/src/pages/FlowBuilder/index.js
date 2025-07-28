import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";

import {
  Paper,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
  Menu,
  MenuItem,
  CircularProgress,
  Grid
} from "@material-ui/core";

import {
  Search as SearchIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  AddCircleOutline,
  ContentCopy,
  Build,
  DevicesFold,
  MoreVert,
  Memory
} from "@material-ui/icons";

import { Stack } from "@mui/material";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import FlowBuilderModal from "../../components/FlowBuilderModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
    ...theme.scrollbarStyles,
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
  contentContainer: {
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  searchInput: {
    width: "300px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  actionButtons: {
    backgroundColor: "#25b6e8",
    color: "white",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  flowItem: {
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    backgroundColor: "#fff",
    marginBottom: theme.spacing(1),
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#f9f9f9",
    },
  },
  flowName: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    "& .MuiSvgIcon-root": {
      color: "#25b6e8",
    }
  },
  flowStatus: {
    textAlign: "center",
    color: "#333",
  },
  moreButton: {
    minWidth: "auto",
    padding: theme.spacing(1),
    borderRadius: "50%",
    "& .MuiSvgIcon-root": {
      color: "#333",
    }
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50vh",
    "& .MuiCircularProgress-root": {
      color: "#25b6e8",
    }
  },
  menuItem: {
    padding: theme.spacing(1, 2),
    "&:hover": {
      backgroundColor: "#f5f5f5",
    }
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach(contact => {
      const contactIndex = state.findIndex(c => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex(c => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;
    const contactIndex = state.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};
const FlowBuilder = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWebhookName, setSelectedWebhookName] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [reloadData, setReloadData] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/flowbuilder");
          setWebhooks(data.flows);
          dispatch({ type: "LOAD_CONTACTS", payload: data.flows });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, reloadData]);

  useEffect(() => {
    const companyId = user.companyId;
    const onContact = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
      }
    };
    socket.on(`company-${companyId}-contact`, onContact);
    return () => {
      socket.disconnect();
    };
  }, [user, socket]);

  const handleSearch = event => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleDeleteWebhook = async webhookId => {
    try {
      await api.delete(`/flowbuilder/${webhookId}`);
      setDeletingContact(null);
      setReloadData(old => !old);
      toast.success("Fluxo excluído com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDuplicateFlow = async flowId => {
    try {
      await api.post(`/flowbuilder/duplicate`, { flowId });
      setDeletingContact(null);
      setReloadData(old => !old);
      toast.success("Fluxo duplicado com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      setPageNumber(prevState => prevState + 1);
    }
  };

  return (
    <MainContainer>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={(ticket) => {
          setNewTicketModalOpen(false);
          if (ticket?.uuid) {
            history.push(`/tickets/${ticket.uuid}`);
          }
        }}
      />

      <FlowBuilderModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        flowId={selectedContactId}
        nameWebhook={selectedWebhookName}
        onSave={() => setReloadData(old => !old)}
      />

      <ConfirmationModal
        title={deletingContact ? `Excluir o fluxo ${deletingContact.name}?` : ""}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => handleDeleteWebhook(deletingContact.id)}
      >
        Tem certeza que deseja deletar este fluxo? Todas as integrações relacionadas serão perdidas.
      </ConfirmationModal>

      <ConfirmationModal
        title={deletingContact ? `Duplicar o fluxo ${deletingContact.name}?` : ""}
        open={confirmDuplicateOpen}
        onClose={() => setConfirmDuplicateOpen(false)}
        onConfirm={() => handleDuplicateFlow(deletingContact.id)}
      >
        Tem certeza que deseja duplicar este fluxo?
      </ConfirmationModal>

      <div className={classes.searchContainer}>
        <div style={{
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}>
          <Typography variant="h6" style={{ color: '#333' }}>
            Fluxos de conversa
          </Typography>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <TextField
            className={classes.searchInput}
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "#25b6e8" }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            className={classes.actionButtons}
            startIcon={<AddCircleOutline />}
            onClick={handleOpenContactModal}
          >
            Adicionar Fluxo
          </Button>
        </div>
      </div>

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        <div className={classes.contentContainer}>
          {loading ? (
            <div className={classes.loadingContainer}>
              <CircularProgress />
            </div>
          ) : (
            webhooks.map(flow => (
              <div key={flow.id} className={classes.flowItem}>
                <Grid container alignItems="center">
                  <Grid item xs={4} onClick={() => history.push(`/flowbuilder/${flow.id}`)}>
                    <div className={classes.flowName}>
                      <Memory />
                      <Typography>{flow.name}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={4} onClick={() => history.push(`/flowbuilder/${flow.id}`)}>
                    <Typography className={classes.flowStatus}>
                      {flow.active ? "Ativo" : "Desativado"}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} container justifyContent="flex-end">
                    <IconButton
                      className={classes.moreButton}
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setDeletingContact(flow);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Grid>
                </Grid>
              </div>
            ))
          )}

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              style: {
                borderRadius: 8,
                marginTop: 4,
              }
            }}
          >
            <MenuItem
              className={classes.menuItem}
              onClick={() => {
                setAnchorEl(null);
                history.push(`/flowbuilder/${deletingContact.id}`);
              }}
            >
              Editar fluxo
            </MenuItem>
            <MenuItem
              className={classes.menuItem}
              onClick={() => {
                setAnchorEl(null);
                setConfirmDuplicateOpen(true);
              }}
            >
              Duplicar
            </MenuItem>
            <MenuItem
              className={classes.menuItem}
              onClick={() => {
                setAnchorEl(null);
                setConfirmOpen(true);
              }}
            >
              Excluir
            </MenuItem>
          </Menu>
        </div>
      </Paper>
    </MainContainer>
  );
};

export default FlowBuilder;