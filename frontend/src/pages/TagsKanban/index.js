import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useContext,
} from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";

import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
  Chip
} from "@material-ui/core";

import {
  Search as SearchIcon,
  Delete as DeleteOutlineIcon,
  Edit as EditIcon,
  AddCircleOutline,
  ArrowBack
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

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
  tableContainer: {
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
  actionButtons: {
    backgroundColor: "#25b6e8",
    color: "white",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  backButton: {
    backgroundColor: "#25b6e8",
    color: "white",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  iconButton: {
    padding: theme.spacing(1),
    backgroundColor: "#f5f5f5",
    marginLeft: theme.spacing(1),
    "&.edit": {
      color: "#25b6e8",
    },
    "&.delete": {
      color: "#E57373",
    },
  },
  tagChip: {
    textShadow: "1px 1px 1px rgba(0, 0, 0, 0.5)",
    fontWeight: "bold",
    padding: "5px 10px",
    borderRadius: "4px",
  },
  countBadge: {
    backgroundColor: "#f5f5f5",
    color: "#333",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "bold",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_TAGS") {
    const tags = action.payload;
    const newTags = [];

    tags.forEach((tag) => {
      const tagIndex = state.findIndex((s) => s.id === tag.id);
      if (tagIndex !== -1) {
        state[tagIndex] = tag;
      } else {
        newTags.push(tag);
      }
    });

    return [...state, ...newTags];
  }

  if (action.type === "UPDATE_TAGS") {
    const tag = action.payload;
    const tagIndex = state.findIndex((s) => s.id === tag.id);

    if (tagIndex !== -1) {
      state[tagIndex] = tag;
      return [...state];
    } else {
      return [tag, ...state];
    }
  }

  if (action.type === "DELETE_TAGS") {
    const tagId = action.payload;
    const tagIndex = state.findIndex((s) => s.id === tagId);
    if (tagIndex !== -1) {
      state.splice(tagIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};
const Tags = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [tags, dispatch] = useReducer(reducer, []);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTags = async () => {
        try {
          const { data } = await api.get("/tags/", {
            params: { searchParam, pageNumber, kanban: 1 },
          });
          dispatch({ type: "LOAD_TAGS", payload: data.tags });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchTags();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    const onTagsEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_TAGS", payload: data.tag });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_TAGS", payload: +data.tagId });
      }
    };
    socket.on(`company${user.companyId}-tag`, onTagsEvent);

    return () => {
      socket.off(`company${user.companyId}-tag`, onTagsEvent);
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
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditTag = (tag) => {
    setSelectedTag(tag);
    setTagModalOpen(true);
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
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const handleReturnToKanban = () => {
    history.push("/kanban");
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={deletingTag && `${i18n.t("tagsKanban.confirmationModal.deleteTitle")}`}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteTag(deletingTag.id)}
      >
        {i18n.t("tagsKanban.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      {tagModalOpen && (
        <TagModal
          open={tagModalOpen}
          onClose={handleCloseTagModal}
          aria-labelledby="form-dialog-title"
          tagId={selectedTag && selectedTag.id}
          kanban={1}
        />
      )}

      <div className={classes.searchContainer}>
        <div style={{
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}>
          <Typography variant="h6" style={{ color: '#333' }}>
            {i18n.t("tagsKanban.title")} ({tags.length})
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
            onClick={handleOpenTagModal}
            startIcon={<AddCircleOutline />}
          >
            {i18n.t("tagsKanban.buttons.add")}
          </Button>

          <Button
            variant="contained"
            className={classes.backButton}
            onClick={handleReturnToKanban}
            startIcon={<ArrowBack />}
          >
            {'Voltar para o Kanban'}
          </Button>
        </div>
      </div>

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        <div className={classes.tableContainer}>
          <Table size="small" className={classes.customTable}>
            <TableHead>
              <TableRow>
                <TableCell align="center">{i18n.t("tagsKanban.table.name")}</TableCell>
                <TableCell align="center">{i18n.t("tagsKanban.table.tickets")}</TableCell>
                <TableCell align="center">{i18n.t("tagsKanban.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell align="center">
                    <Chip
                      label={tag.name}
                      style={{
                        backgroundColor: tag.color,
                        color: "white",
                      }}
                      className={classes.tagChip}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <span className={classes.countBadge}>
                      {tag?.ticketTags ? tag?.ticketTags?.length : 0}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
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
              {loading && <TableRowSkeleton columns={3} />}
            </TableBody>
          </Table>
        </div>
      </Paper>
    </MainContainer>
  );
};

export default Tags;