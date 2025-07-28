import React, {
    useState,
    useEffect,
    useReducer,
    useCallback,
    useContext,
} from "react";
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
    Typography
} from "@material-ui/core";

import {
    Search as SearchIcon,
    Delete as DeleteOutlineIcon,
    Edit as EditIcon,
    AddCircleOutline
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import FileModal from "../../components/FileModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import ForbiddenPage from "../../components/ForbiddenPage";

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
}));

const reducer = (state, action) => {
    if (action.type === "LOAD_FILES") {
        const files = action.payload;
        const newFiles = [];

        files.forEach((fileList) => {
            const fileListIndex = state.findIndex((s) => s.id === fileList.id);
            if (fileListIndex !== -1) {
                state[fileListIndex] = fileList;
            } else {
                newFiles.push(fileList);
            }
        });

        return [...state, ...newFiles];
    }

    if (action.type === "UPDATE_FILES") {
        const fileList = action.payload;
        const fileListIndex = state.findIndex((s) => s.id === fileList.id);

        if (fileListIndex !== -1) {
            state[fileListIndex] = fileList;
            return [...state];
        } else {
            return [fileList, ...state];
        }
    }

    if (action.type === "DELETE_FILE") {
        const fileListId = action.payload;

        const fileListIndex = state.findIndex((s) => s.id === fileListId);
        if (fileListIndex !== -1) {
            state.splice(fileListIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};
const FileLists = () => {
    const classes = useStyles();
    const { user, socket } = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedFileList, setSelectedFileList] = useState(null);
    const [deletingFileList, setDeletingFileList] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [searchParam, setSearchParam] = useState("");
    const [files, dispatch] = useReducer(reducer, []);
    const [fileListModalOpen, setFileListModalOpen] = useState(false);

    const fetchFileLists = useCallback(async () => {
        try {
            const { data } = await api.get("/files/", {
                params: { searchParam, pageNumber },
            });
            dispatch({ type: "LOAD_FILES", payload: data.files });
            setHasMore(data.hasMore);
            setLoading(false);
        } catch (err) {
            toastError(err);
        }
    }, [searchParam, pageNumber]);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [searchParam]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            fetchFileLists();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber, fetchFileLists]);

    useEffect(() => {
        const onFileEvent = (data) => {
            if (data.action === "update" || data.action === "create") {
                dispatch({ type: "UPDATE_FILES", payload: data.files });
            }

            if (data.action === "delete") {
                dispatch({ type: "DELETE_FILE", payload: +data.fileId });
            }
        };

        socket.on(`company-${user.companyId}-file`, onFileEvent);
        return () => {
            socket.off(`company-${user.companyId}-file`, onFileEvent);
        };
    }, [socket, user.companyId]);

    const handleOpenFileListModal = () => {
        setSelectedFileList(null);
        setFileListModalOpen(true);
    };

    const handleCloseFileListModal = () => {
        setSelectedFileList(null);
        setFileListModalOpen(false);
    };

    const handleSearch = (event) => {
        setSearchParam(event.target.value.toLowerCase());
    };

    const handleEditFileList = (fileList) => {
        setSelectedFileList(fileList);
        setFileListModalOpen(true);
    };

    const handleDeleteFileList = async (fileListId) => {
        try {
            await api.delete(`/files/${fileListId}`);
            toast.success(i18n.t("files.toasts.deleted"));
        } catch (err) {
            toastError(err);
        }
        setDeletingFileList(null);
        setSearchParam("");
        setPageNumber(1);

        dispatch({ type: "RESET" });
        setPageNumber(1);
        await fetchFileLists();
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
            <ConfirmationModal
                title={deletingFileList && `${i18n.t("files.confirmationModal.deleteTitle")}`}
                open={confirmModalOpen}
                onClose={setConfirmModalOpen}
                onConfirm={() => handleDeleteFileList(deletingFileList.id)}
            >
                {i18n.t("files.confirmationModal.deleteMessage")}
            </ConfirmationModal>

            <FileModal
                open={fileListModalOpen}
                onClose={handleCloseFileListModal}
                reload={fetchFileLists}
                aria-labelledby="form-dialog-title"
                fileListId={selectedFileList && selectedFileList.id}
            />

            {user.profile === "user" ? (
                <ForbiddenPage />
            ) : (
                <>
                    <div className={classes.searchContainer}>
                        <div style={{
                            display: "flex",
                            gap: "16px",
                            alignItems: "center"
                        }}>
                            <Typography variant="h6" style={{ color: '#333' }}>
                                {i18n.t("files.title")} ({files.length})
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
                                onClick={handleOpenFileListModal}
                            >
                                {i18n.t("files.buttons.add")}
                            </Button>
                        </div>
                    </div>

                    <Paper className={classes.mainPaper} onScroll={handleScroll}>
                        <div className={classes.tableContainer}>
                            <Table size="small" className={classes.customTable}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">{i18n.t("files.table.name")}</TableCell>
                                        <TableCell align="center">
                                            {i18n.t("files.table.actions")}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {files.map((fileList) => (
                                        <TableRow key={fileList.id}>
                                            <TableCell align="center">
                                                {fileList.name}
                                            </TableCell>
                                            <TableCell align="center">
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        className={`${classes.iconButton} edit`}
                                                        onClick={() => handleEditFileList(fileList)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        className={`${classes.iconButton} delete`}
                                                        onClick={() => {
                                                            setConfirmModalOpen(true);
                                                            setDeletingFileList(fileList);
                                                        }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && <TableRowSkeleton columns={2} />}
                                </TableBody>
                            </Table>
                        </div>
                    </Paper>
                </>
            )}
        </MainContainer>
    );
};

export default FileLists;