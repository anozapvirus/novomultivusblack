import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import moment from "moment";

import {
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import CompanyModal from "../../components/CompaniesModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";

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
    warningRow: {
        backgroundColor: "#fffead !important",
    },
    dangerRow: {
        backgroundColor: "#fa8c8c !important",
    },
    idCell: {
        fontWeight: "bold",
        color: "#333",
    },
    nameCell: {
        fontWeight: 500,
        color: "#333",
    },
    statusCell: {
        fontWeight: 500,
        "&.active": {
            color: "#4caf50",
        },
        "&.inactive": {
            color: "#f44336",
        },
    },
    dateCell: {
        color: "#666",
    },
    valueCell: {
        fontWeight: 500,
        color: "#333",
    },
    recurrenceLabel: {
        fontSize: "0.75rem",
        color: "#666",
        marginTop: 4,
    },
    folderCell: {
        color: "#666",
    },
}));

const reducer = (state, action) => {
    if (action.type === "LOAD_COMPANIES") {
        const companies = action.payload;
        const newCompanies = [];

        companies.forEach((company) => {
            const companyIndex = state.findIndex((u) => u.id === company.id);
            if (companyIndex !== -1) {
                state[companyIndex] = company;
            } else {
                newCompanies.push(company);
            }
        });

        return [...state, ...newCompanies];
    }

    if (action.type === "UPDATE_COMPANIES") {
        const company = action.payload;
        const companyIndex = state.findIndex((u) => u.id === company.id);

        if (companyIndex !== -1) {
            state[companyIndex] = company;
            return [...state];
        } else {
            return [company, ...state];
        }
    }

    if (action.type === "DELETE_COMPANIES") {
        const companyId = action.payload;
        const companyIndex = state.findIndex((u) => u.id === companyId);
        if (companyIndex !== -1) {
            state.splice(companyIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};
const Companies = () => {
    const classes = useStyles();
    const history = useHistory();
    const { user, socket } = useContext(AuthContext);
    const { dateToClient, datetimeToClient } = useDate();

    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [deletingCompany, setDeletingCompany] = useState(null);
    const [companyModalOpen, setCompanyModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [searchParam, setSearchParam] = useState("");
    const [companies, dispatch] = useReducer(reducer, []);

    useEffect(() => {
        async function fetchData() {
            if (!user.super) {
                toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
                setTimeout(() => {
                    history.push(`/`)
                }, 1000);
            }
        }
        fetchData();
    }, [user.super, history]);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [searchParam]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchCompanies = async () => {
                try {
                    const { data } = await api.get("/companiesPlan/", {
                        params: { searchParam, pageNumber },
                    });
                    dispatch({ type: "LOAD_COMPANIES", payload: data.companies });
                    setHasMore(data.hasMore);
                    setLoading(false);
                } catch (err) {
                    toastError(err);
                }
            };
            fetchCompanies();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber]);

    const handleOpenCompanyModal = () => {
        setSelectedCompany(null);
        setCompanyModalOpen(true);
    };

    const handleCloseCompanyModal = () => {
        setSelectedCompany(null);
        setCompanyModalOpen(false);
    };

    const handleSearch = (event) => {
        setSearchParam(event.target.value.toLowerCase());
    };

    const handleEditCompany = (company) => {
        setSelectedCompany(company);
        setCompanyModalOpen(true);
    };

    const handleDeleteCompany = async (companyId) => {
        try {
            await api.delete(`/companies/${companyId}`);
            toast.success(i18n.t("compaies.toasts.deleted"));
        } catch (err) {
            toastError(err);
        }
        setDeletingCompany(null);
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

    const renderStatus = (status) => {
        return status === false ? (
            <span className={`${classes.statusCell} inactive`}>Não</span>
        ) : (
            <span className={`${classes.statusCell} active`}>Sim</span>
        );
    };

    const renderPlanValue = (row) => {
        const value = row.planId !== null
            ? row.plan?.amount
                ? row.plan.amount.toLocaleString('pt-br', { minimumFractionDigits: 2 })
                : '00.00'
            : "-";
        return <span className={classes.valueCell}>R$ {value}</span>;
    };

    const rowStyle = (record) => {
        if (moment(record.dueDate).isValid()) {
            const now = moment();
            const dueDate = moment(record.dueDate);
            const diff = dueDate.diff(now, "days");
            if (diff >= 1 && diff <= 5) {
                return { className: classes.warningRow };
            }
            if (diff <= 0) {
                return { className: classes.dangerRow };
            }
        }
        return {};
    };

    return (
        <MainContainer>
            <ConfirmationModal
                title={deletingCompany && `${i18n.t("compaies.confirmationModal.deleteTitle")} ${deletingCompany.name}?`}
                open={confirmModalOpen}
                onClose={setConfirmModalOpen}
                onConfirm={() => handleDeleteCompany(deletingCompany.id)}
            >
                {i18n.t("compaies.confirmationModal.deleteMessage")}
            </ConfirmationModal>

            <CompanyModal
                open={companyModalOpen}
                onClose={handleCloseCompanyModal}
                aria-labelledby="form-dialog-title"
                companyId={selectedCompany && selectedCompany.id}
            />

            <div className={classes.searchContainer}>
                <div style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center"
                }}>
                    <Typography variant="h6" style={{ color: '#333' }}>
                        {i18n.t("compaies.title")} ({companies.length})
                    </Typography>
                </div>
            </div>

            <Paper className={classes.mainPaper} onScroll={handleScroll}>
                <div className={classes.tableContainer}>
                    <Table size="small" className={classes.customTable}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">{i18n.t("compaies.table.ID")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.status")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.name")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.email")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.namePlan")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.value")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.createdAt")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.dueDate")}</TableCell>
                                <TableCell align="center">{i18n.t("compaies.table.lastLogin")}</TableCell>
                                <TableCell align="center">Tamanho da pasta</TableCell>
                                <TableCell align="center">Total de arquivos</TableCell>
                                <TableCell align="center">Ultimo update</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {companies.map((company) => (
                                <TableRow key={company.id} {...rowStyle(company)}>
                                    <TableCell align="center" className={classes.idCell}>
                                        {company.id}
                                    </TableCell>
                                    <TableCell align="center">
                                        {renderStatus(company.status)}
                                    </TableCell>
                                    <TableCell align="center" className={classes.nameCell}>
                                        {company.name}
                                    </TableCell>
                                    <TableCell align="center">
                                        {company.email}
                                    </TableCell>
                                    <TableCell align="center">
                                        {company?.plan?.name}
                                    </TableCell>
                                    <TableCell align="center">
                                        {renderPlanValue(company)}
                                    </TableCell>
                                    <TableCell align="center" className={classes.dateCell}>
                                        {dateToClient(company.createdAt)}
                                    </TableCell>
                                    <TableCell align="center" className={classes.dateCell}>
                                        {dateToClient(company.dueDate)}
                                        <div className={classes.recurrenceLabel}>
                                            {company.recurrence}
                                        </div>
                                    </TableCell>
                                    <TableCell align="center" className={classes.dateCell}>
                                        {datetimeToClient(company.lastLogin)}
                                    </TableCell>
                                    <TableCell align="center" className={classes.folderCell}>
                                        {company.folderSize}
                                    </TableCell>
                                    <TableCell align="center" className={classes.folderCell}>
                                        {company.numberFileFolder}
                                    </TableCell>
                                    <TableCell align="center" className={classes.dateCell}>
                                        {datetimeToClient(company.updatedAtFolder)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loading && <TableRowSkeleton columns={12} />}
                        </TableBody>
                    </Table>
                </div>
            </Paper>
        </MainContainer>
    );
};

export default Companies;