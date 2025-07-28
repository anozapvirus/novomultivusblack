import React, { useState, useEffect, useReducer, useContext, useRef } from "react";
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
  Paper,
  InputAdornment,
  Chip,
  Typography,
} from "@material-ui/core";

import {
  Search as SearchIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  Add as AddIcon,
  MoreHoriz,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import ContactTagListModal from "../../components/ContactTagListModal";

import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: "100vh",
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  mainPaper: {
    flex: 1,
    padding: theme.spacing(0),
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
  actionButtons: {
    display: "flex",
    gap: theme.spacing(1),
    "& > *": {
      backgroundColor: "#25b6e8",
      color: "white",
      "&:hover": {
        backgroundColor: "#1e9ac4",
      },
    },
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
  tagChip: {
    borderRadius: "8px",
    textShadow: "1px 1px 1px rgba(0, 0, 0, 0.3)",
    color: "white",
    fontWeight: "500",
    fontSize: "0.875rem",
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
    "&.more": {
      color: "#666",
      backgroundColor: "#f5f5f5",
    },
  },
  contactCount: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    justifyContent: "center",
    "& .MuiTypography-root": {
      fontWeight: "500",
      color: "#666",
    },
  },
}));
const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_TAGS":
      return [...state, ...action.payload];
    case "UPDATE_TAGS":
      const tag = action.payload;
      const tagIndex = state.findIndex((s) => s.id === tag.id);

      if (tagIndex !== -1) {
        state[tagIndex] = tag;
        return [...state];
      } else {
        return [tag, ...state];
      }
    case "DELETE_TAGS":
      const tagId = action.payload;
      return state.filter((tag) => tag.id !== tagId);
    case "RESET":
      return [];
    default:
      return state;
  }
};

const Tags = () => {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);

  const [selectedTagContacts, setSelectedTagContacts] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTagName, setSelectedTagName] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [tags, dispatch] = useReducer(reducer, []);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const pageNumberRef = useRef(1);

  useEffect(() => {
    const fetchMoreTags = async () => {
      try {
        const { data } = await api.get("/tags/", {
          params: { searchParam, pageNumber, kanban: 0 },
        });
        dispatch({ type: "LOAD_TAGS", payload: data.tags });
        setHasMore(data.hasMore);
        setLoading(false);
      } catch (err) {
        toastError(err);
      }
    };

    if (pageNumber > 0) {
      setLoading(true);
      fetchMoreTags();
    }
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const onCompanyTags = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_TAGS", payload: data.tag });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_TAGS", payload: +data.tagId });
      }
    };
    socket.on(`company${user.companyId}-tag`, onCompanyTags);

    return () => {
      socket.off(`company${user.companyId}-tag`, onCompanyTags);
    };
  }, [socket, user.companyId]);
  const handleOpenTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(true);
  };

  const handleCloseTagModal = () => {
    setSelectedTag(null);
    setTagModalOpen(false);
  };

  const handleSearch = (event) => {
    const newSearchParam = event.target.value.toLowerCase();
    setSearchParam(newSearchParam);
    setPageNumber(1);
    dispatch({ type: "RESET" });
  };

  const handleEditTag = (tag) => {
    setSelectedTag(tag);
    setTagModalOpen(true);
  };

  const handleShowContacts = (contacts, tag) => {
    setSelectedTagContacts(contacts);
    setContactModalOpen(true);
    setSelectedTagName(tag);
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setSelectedTagContacts([]);
    setSelectedTagName("");
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await api.delete(`/tags/${tagId}`);
      toast.success(i18n.t("tags.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingTag(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
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
      {contactModalOpen && (
        <ContactTagListModal
          open={contactModalOpen}
          onClose={handleCloseContactModal}
          tag={selectedTagName}
        />
      )}

      <ConfirmationModal
        title={deletingTag && `${i18n.t("tags.confirmationModal.deleteTitle")}`}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteTag(deletingTag.id)}
      >
        {i18n.t("tags.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <TagModal
        open={tagModalOpen}
        onClose={handleCloseTagModal}
        aria-labelledby="form-dialog-title"
        tagId={selectedTag && selectedTag.id}
        kanban={0}
      />

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        {/* Barra de Pesquisa e Botões */}
        <div className={classes.searchContainer}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flex: 1,
            flexWrap: "wrap"
          }}>
            <TextField
              placeholder={i18n.t("contacts.searchPlaceholder")}
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

          <div className={classes.actionButtons}>
            <Button
              variant="contained"
              onClick={handleOpenTagModal}
              startIcon={<AddIcon />}
            >
              {i18n.t("tags.buttons.add")}
            </Button>
          </div>
        </div>
        {/* Container da Tabela */}
        <div className={classes.tableContainer}>
          <Table size="small" className={classes.customTable}>
            <TableHead>
              <TableRow>
                <TableCell align="center" style={{ width: '15%' }}>
                  {i18n.t("tags.table.id")}
                </TableCell>
                <TableCell align="center" style={{ width: '35%' }}>
                  {i18n.t("tags.table.name")}
                </TableCell>
                <TableCell align="center" style={{ width: '30%' }}>
                  {i18n.t("tags.table.contacts")}
                </TableCell>
                <TableCell align="center" style={{ width: '20%' }}>
                  {i18n.t("tags.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id} hover>
                  <TableCell align="center">
                    <Typography variant="body2" style={{ color: '#666', fontWeight: '500' }}>
                      {tag.id}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      variant="outlined"
                      className={classes.tagChip}
                      style={{
                        backgroundColor: tag.color,
                        border: 'none',
                      }}
                      label={tag.name}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <div className={classes.contactCount}>
                      <Typography variant="body2">
                        {tag?.contacts?.length || 0}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleShowContacts(tag?.contacts, tag)}
                        disabled={!tag?.contacts?.length}
                        className={`${classes.iconButton} more`}
                      >
                        <MoreHoriz fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'center'
                    }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTag(tag)}
                        className={`${classes.iconButton} edit`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => {
                          setConfirmModalOpen(true);
                          setDeletingTag(tag);
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

export default Tags;