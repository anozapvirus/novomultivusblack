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
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Chip,
  Typography,
} from "@material-ui/core";
import {
  Search as SearchIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  Add,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

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

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    padding: "20px",
    backgroundColor: "#f5f5f5",
  },
  mainPaper: {
    width: "100%",
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  controlsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  tableContainer: {
    overflowX: "auto",
    width: "100%",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#ffffff",
  },
  addButton: {
    backgroundColor: "#25b6e8",
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: "8px 24px",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  editButton: {
    color: "#4CAF50",
  },
  chip: {
    borderRadius: "8px",
    textShadow: "1px 1px 1px #000",
    color: "white",
  },
}));

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
  }, [socket]);

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
    <MainContainer style={{ backgroundColor: "#f5f5f5" }}>
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
      <div className={classes.root}>
        {/* Controls Container */}
        <div className={classes.controlsContainer}>
          <Title>{i18n.t("tagsKanban.title")} ({tags.length})</Title>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <TextField
              placeholder={i18n.t("contacts.searchPlaceholder")}
              type="search"
              value={searchParam}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon style={{ color: "gray" }} />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
              style={{ borderRadius: "8px" }}
            />
            <Button
              variant="contained"
              className={classes.addButton}
              onClick={handleOpenTagModal}
              startIcon={<Add />}
              size="medium"
            >
              {i18n.t("tagsKanban.buttons.add")}
            </Button>
            <Button
              variant="contained"
              className={classes.addButton}
              onClick={handleReturnToKanban}
              size="medium"
            >
              Voltar para o Kanban
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className={classes.tableContainer}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ width: "50%" }} align="left">{i18n.t("tagsKanban.table.name")}</TableCell>
                <TableCell style={{ width: "30%" }} align="center">{i18n.t("tagsKanban.table.tickets")}</TableCell>
                <TableCell style={{ width: "20%" }} align="right">{i18n.t("tagsKanban.table.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell align="left">
                    <Chip
                      variant="outlined"
                      className={classes.chip}
                      style={{ backgroundColor: tag.color }}
                      label={tag.name}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {tag?.ticketTags ? (
                      <span>{tag?.ticketTags?.length}</span>
                    ) : (
                      <span>0</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEditTag(tag)}>
                      <EditIcon className={classes.editButton} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingTag(tag);
                      }}
                    >
                      <DeleteOutlineIcon color="secondary" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainContainer>
  );
};

export default Tags;