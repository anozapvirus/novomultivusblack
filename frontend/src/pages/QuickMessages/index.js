import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Typography,
  Paper,
} from "@material-ui/core";
import {
  Search as SearchIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  Add,
  CheckCircle as CheckCircleIcon,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import QuickMessageDialog from "../../components/QuickMessageDialog";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { isArray } from "lodash";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: "100vh",
    overflow: "hidden",
    borderRadius: 0,
    backgroundColor: "#f5f5f5",
  },
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "auto",
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
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    maxWidth: "400px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    maxHeight: "calc(100vh - 220px)",
    overflow: "auto",
    ...theme.scrollbarStyles,
  },
  customTable: {
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: "#333",
      borderBottom: "2px solid #f5f5f5",
    },
    "& .MuiTableCell-body": {
      borderBottom: "1px solid #f5f5f5",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#f9f9f9",
    },
  },
  actionButton: {
    backgroundColor: "#25b6e8",
    color: "#FFFFFF",
    borderRadius: "8px",
    padding: "8px 24px",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  iconButton: {
    padding: theme.spacing(1),
    "&.edit": {
      color: "#25b6e8",
      backgroundColor: "#f5f5f5",
    },
    "&.delete": {
      color: "#E57373",
      backgroundColor: "#f5f5f5",
    },
  },
  statusIcon: {
    color: "#4CAF50",
    fontSize: 20,
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_QUICKMESSAGES") {
    const quickmessages = action.payload;
    const newQuickmessages = [];

    if (isArray(quickmessages)) {
      quickmessages.forEach((quickemessage) => {
        const quickemessageIndex = state.findIndex(
          (u) => u.id === quickemessage.id
        );
        if (quickemessageIndex !== -1) {
          state[quickemessageIndex] = quickemessage;
        } else {
          newQuickmessages.push(quickemessage);
        }
      });
    }

    return [...state, ...newQuickmessages];
  }

  if (action.type === "UPDATE_QUICKMESSAGES") {
    const quickemessage = action.payload;
    const quickemessageIndex = state.findIndex((u) => u.id === quickemessage.id);

    if (quickemessageIndex !== -1) {
      state[quickemessageIndex] = quickemessage;
      return [...state];
    } else {
      return [quickemessage, ...state];
    }
  }

  if (action.type === "DELETE_QUICKMESSAGE") {
    const quickemessageId = action.payload;
    const quickemessageIndex = state.findIndex((u) => u.id === quickemessageId);
    if (quickemessageIndex !== -1) {
      state.splice(quickemessageIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Quickemessages = () => {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedQuickemessage, setSelectedQuickemessage] = useState(null);
  const [deletingQuickemessage, setDeletingQuickemessage] = useState(null);
  const [quickemessageModalOpen, setQuickMessageDialogOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [quickemessages, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchQuickemessages();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = user.companyId;

    const onQuickMessageEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUICKMESSAGES", payload: data.record });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUICKMESSAGE", payload: +data.id });
      }
    };
    socket.on(`company-${companyId}-quickmessage`, onQuickMessageEvent);

    return () => {
      socket.off(`company-${companyId}-quickmessage`, onQuickMessageEvent);
    };
  }, [socket, user]);

  const fetchQuickemessages = async () => {
    try {
      const { data } = await api.get("/quick-messages", {
        params: { searchParam, pageNumber },
      });

      dispatch({ type: "LOAD_QUICKMESSAGES", payload: data.records });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenQuickMessageDialog = () => {
    setSelectedQuickemessage(null);
    setQuickMessageDialogOpen(true);
  };

  const handleCloseQuickMessageDialog = () => {
    setSelectedQuickemessage(null);
    setQuickMessageDialogOpen(false);
    fetchQuickemessages();
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditQuickemessage = (quickemessage) => {
    setSelectedQuickemessage(quickemessage);
    setQuickMessageDialogOpen(true);
  };

  const handleDeleteQuickemessage = async (quickemessageId) => {
    try {
      await api.delete(`/quick-messages/${quickemessageId}`);
      toast.success(i18n.t("quickemessages.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingQuickemessage(null);
    setSearchParam("");
    setPageNumber(1);
    fetchQuickemessages();
    dispatch({ type: "RESET" });
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <MainContainer>
      <QuickMessageDialog
        open={quickemessageModalOpen}
        onClose={handleCloseQuickMessageDialog}
        aria-labelledby="form-dialog-title"
        quickemessageId={selectedQuickemessage && selectedQuickemessage.id}
        resetPagination={() => {
          setPageNumber(1);
          fetchQuickemessages();
        }}
      />

      <ConfirmationModal
        title={deletingQuickemessage && `${ i18n.t("quickMessages.confirmationModal.deleteTitle") } ${ deletingQuickemessage.shortcode }?`}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteQuickemessage(deletingQuickemessage.id)}
      >
        {i18n.t("quickMessages.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        {/* Barra de Pesquisa e Botão Adicionar */}
        <div className={classes.searchContainer}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            flex: 1,
            flexWrap: "wrap" 
          }}>
            <TextField
              placeholder={i18n.t("quickMessages.searchPlaceholder")}
              type="search"
              value={searchParam}
              onChange={handleSearch}
              variant="outlined"
              size="small"
              className={classes.searchInput}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon style={{ color: "#25b6e8" }} />
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <Button
            variant="contained"
            className={classes.actionButton}
            onClick={handleOpenQuickMessageDialog}
            startIcon={<Add />}
          >
            {i18n.t("quickMessages.buttons.add")}
          </Button>
        </div>

        {/* Container da Tabela */}
        <div className={classes.tableContainer}>
          <Table size="small" className={classes.customTable}>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: "30%" }}>
                  {i18n.t("quickMessages.table.shortcode")}
                </TableCell>
                <TableCell style={{ width: "30%" }}>
                  {i18n.t("quickMessages.table.mediaName")}
                </TableCell>
                <TableCell style={{ width: "20%" }} align="center">
                  {i18n.t("quickMessages.table.status")}
                </TableCell>
                <TableCell style={{ width: "20%" }} align="right">
                  {i18n.t("quickMessages.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quickemessages.map((quickemessage) => (
                <TableRow key={quickemessage.id} hover>
                  <TableCell>
                    <Typography variant="body2" style={{ fontWeight: 500, color: '#333' }}>
                      {quickemessage.shortcode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {quickemessage.mediaName ?? i18n.t("quickMessages.noAttachment")}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {quickemessage.geral === true && (
                      <CheckCircleIcon className={classes.statusIcon} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end'
                    }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditQuickemessage(quickemessage)}
                        className={`${classes.iconButton} edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => {
                          setConfirmModalOpen(true);
                          setDeletingQuickemessage(quickemessage);
                        }}
                        className={`${classes.iconButton} delete`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
            </TableBody>
          </Table>
        </div>
      </Paper>
    </MainContainer>
  );
};

export default Quickemessages;
