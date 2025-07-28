import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
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
  CircularProgress,
  Typography,
  Avatar,
  Box
} from "@material-ui/core";

import {
  Search as SearchIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  AccountCircle,
  AddCircleOutline
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import whatsappIcon from '../../assets/nopicture.png'
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import UserModal from "../../components/UserModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import UserStatusIcon from "../../components/UserModal/statusIcon";
import { getBackendUrl } from "../../config";
import ForbiddenPage from "../../components/ForbiddenPage";

const backendUrl = getBackendUrl();

const reducer = (state, action) => {
  if (action.type === "LOAD_USERS") {
    const users = action.payload;
    const newUsers = [];

    users.forEach((user) => {
      const userIndex = state.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;
    const userIndex = state.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
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
  userAvatar: {
    width: 42,
    height: 42,
    border: "2px solid #f5f5f5",
  },
  avatarCell: {
    width: 50,
  },
  actionCell: {
    width: 100,
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
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(3),
    "& > *": {
      color: "#25b6e8",
    },
  },
  loadingText: {
    marginLeft: theme.spacing(2),
    color: "#333",
  },
}));

const Users = () => {
  const classes = useStyles();
  const { user: loggedInUser, socket } = useContext(AuthContext);
  const { profileImage } = loggedInUser;

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [users, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users/", {
          params: { searchParam, pageNumber },
        });
        dispatch({ type: "LOAD_USERS", payload: data.users });
        setHasMore(data.hasMore);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchUsers();
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (loggedInUser) {
      const companyId = loggedInUser.companyId;
      const onCompanyUser = (data) => {
        if (data.action === "update" || data.action === "create") {
          dispatch({ type: "UPDATE_USERS", payload: data.user });
        }
        if (data.action === "delete") {
          dispatch({ type: "DELETE_USER", payload: +data.userId });
        }
      };
      socket.on(`company-${companyId}-user`, onCompanyUser);
      return () => {
        socket.off(`company-${companyId}-user`, onCompanyUser);
      };
    }
  }, [socket, loggedInUser]);

  const handleOpenUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setLoadingMore(true);
    setPageNumber((prevPage) => prevPage + 1);
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
      <ConfirmationModal
        title={deletingUser && `${i18n.t("users.confirmationModal.deleteTitle")} ${deletingUser.name}?`}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteUser(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <UserModal
        open={userModalOpen}
        onClose={handleCloseUserModal}
        aria-labelledby="form-dialog-title"
        userId={selectedUser && selectedUser.id}
      />

      {loggedInUser.profile === "user" ? (
        <ForbiddenPage />
      ) : (
        <>
          <div className={classes.searchContainer}>
            <div style={{
              display: "flex",
              gap: "16px",
              alignItems: "center"
            }}>
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
              <Typography variant="h6" style={{ color: '#333' }}>
                {i18n.t("users.title")} ({users.length})
              </Typography>
            </div>

            <Button
              variant="contained"
              onClick={handleOpenUserModal}
              className={classes.actionButtons}
              startIcon={<AddCircleOutline />}
            >
              {i18n.t("Adicionar usuário")}
            </Button>
          </div>

          <Paper
            className={classes.mainPaper}
            // variant="outlined"
            onScroll={handleScroll}
          >
            <div className={classes.tableContainer}>
              <Table size="small" className={classes.customTable}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">{i18n.t("users.table.ID")}</TableCell>
                    <TableCell align="center">{i18n.t("users.table.status")}</TableCell>
                    <TableCell align="center" className={classes.avatarCell}>Avatar</TableCell>
                    <TableCell>{i18n.t("users.table.name")}</TableCell>
                    <TableCell>{i18n.t("users.table.email")}</TableCell>
                    <TableCell align="center">{i18n.t("users.table.profile")}</TableCell>
                    <TableCell align="center">{i18n.t("users.table.startWork")}</TableCell>
                    <TableCell align="center">{i18n.t("users.table.endWork")}</TableCell>
                    <TableCell className={classes.actionCell}>{i18n.t("users.table.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell align="center">
                        <Typography variant="body2">{user.id}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <UserStatusIcon user={user} />
                      </TableCell>
                      <TableCell align="center">
                        <Avatar
                          src={
                            user.id === loggedInUser.id
                              ? `${backendUrl}/public/company${user.companyId}/user/${profileImage || whatsappIcon}`
                              : user.profileImage
                                ? `${backendUrl}/public/company${user.companyId}/user/${user.profileImage}`
                                : whatsappIcon
                          }
                          alt={user.name}
                          className={classes.userAvatar}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" style={{ fontWeight: 500 }}>
                          {user.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{user.profile}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{user.startWork}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{user.endWork}</Typography>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                            className={`${classes.iconButton} edit`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={() => {
                              setConfirmModalOpen(true);
                              setDeletingUser(user);
                            }}
                            className={`${classes.iconButton} delete`}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loadingMore && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <div className={classes.loadingContainer}>
                          <CircularProgress size={24} />
                          <span className={classes.loadingText}>{i18n.t("loading")}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {loading && !loadingMore && (
              <div className={classes.loadingContainer}>
                <CircularProgress />
                <span className={classes.loadingText}>{i18n.t("loading")}</span>
              </div>
            )}
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default Users;