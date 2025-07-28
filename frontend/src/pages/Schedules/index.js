import React, { useState, useEffect, useReducer, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  Button,
  TextField,
  InputAdornment,
  Typography,
  Tooltip,
  IconButton,
} from "@material-ui/core";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from "@material-ui/icons";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import ScheduleModal from "../../components/ScheduleModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";

const useStyles = makeStyles(theme => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: "calc(100vh - 48px)",
    padding: theme.spacing(0),
    backgroundColor: "#f5f5f5",
  },
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#fff",
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
    flex: 1,
    maxWidth: "400px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(1),
  },
  addButton: {
    backgroundColor: "#25b6e8",
    color: "#fff",
    borderRadius: "8px",
    padding: "8px 24px",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  calendar: {
    height: "100%",
    fontFamily: theme.typography.fontFamily,
    "& .rbc-header": {
      padding: theme.spacing(1),
      backgroundColor: "#f8f9fa",
      color: "#666",
      fontWeight: 500,
    },
    "& .rbc-today": {
      backgroundColor: "rgba(37, 182, 232, 0.05)",
    },
    "& .rbc-event": {
      backgroundColor: "#25b6e8",
      borderRadius: "8px",
      border: "none",
      padding: "4px 8px",
    },
    "& .rbc-toolbar": {
      marginBottom: theme.spacing(2),
      "& button": {
        color: "#666",
        borderRadius: "8px",
        transition: "all 0.2s",
        "&.rbc-active": {
          backgroundColor: "#25b6e8",
          color: "#fff",
        },
      },
    },
  },
  eventCard: {
    padding: theme.spacing(1),
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  },
  eventHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  eventTitle: {
    fontWeight: 500,
    fontSize: "0.875rem",
    color: "#333",
  },
  eventInfo: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    color: "#666",
    fontSize: "0.75rem",
  },
  eventActions: {
    display: "flex",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  iconButton: {
    padding: theme.spacing(0.5),
    "&.edit": {
      color: "#25b6e8",
      backgroundColor: "#f5f5f5",
    },
    "&.delete": {
      color: "#E57373",
      backgroundColor: "#f5f5f5",
    },
  },
}));
function getUrlParam(paramName) {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(paramName);
}

const localizer = momentLocalizer(moment);

const defaultMessages = {
  date: "Data",
  time: "Hora",
  event: "Evento",
  allDay: "Dia Todo",
  week: "Semana",
  work_week: "Agendamentos",
  day: "Dia",
  month: "Mês",
  previous: "Anterior",
  next: "Próximo",
  yesterday: "Ontem",
  tomorrow: "Amanhã",
  today: "Hoje",
  agenda: "Agenda",
  noEventsInRange: "Não há agendamentos no período.",
  showMore: (total) => `+${total} mais`,
};

const customEventStyles = {
  pending: {
    backgroundColor: "#f8c957",
    color: "#333",
  },
  confirmed: {
    backgroundColor: "#25b6e8",
    color: "#fff",
  },
  completed: {
    backgroundColor: "#4CAF50",
    color: "#fff",
  },
  canceled: {
    backgroundColor: "#E57373",
    color: "#fff",
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_SCHEDULES":
      const newSchedules = action.payload.filter(
        schedule => !state.some(s => s.id === schedule.id)
      );
      return [...state, ...newSchedules];
    case "UPDATE_SCHEDULES":
      return state.map(s =>
        s.id === action.payload.id ? action.payload : s
      );
    case "DELETE_SCHEDULE":
      return state.filter(s => s.id !== action.payload);
    case "RESET":
      return [];
    default:
      return state;
  }
};

const EventComponent = ({ event, handleEditSchedule, handleDeleteSchedule }) => {
  const classes = useStyles();
  const schedule = event.schedule;

  return (
    <div className={classes.eventCard}>
      <div className={classes.eventHeader}>
        <PersonIcon fontSize="small" />
        <Typography className={classes.eventTitle}>
          {schedule?.contact?.name}
        </Typography>
      </div>

      <div className={classes.eventInfo}>
        <TimeIcon fontSize="small" />
        <span>{moment(schedule.sendAt).format('HH:mm')}</span>
      </div>

      {schedule.location && (
        <div className={classes.eventInfo}>
          <RoomIcon fontSize="small" />
          <span>{schedule.location}</span>
        </div>
      )}

      <div className={classes.eventActions}>
        <Tooltip title="Editar">
          <IconButton
            size="small"
            className={`${classes.iconButton} edit`}
            onClick={(e) => {
              e.stopPropagation();
              handleEditSchedule(schedule);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Excluir">
          <IconButton
            size="small"
            className={`${classes.iconButton} delete`}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSchedule(schedule.id);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};
const Schedules = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();

  // Estados
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [schedules, dispatch] = useReducer(reducer, []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactId, setContactId] = useState(+getUrlParam("contactId"));
  const [calendarView, setCalendarView] = useState("month");

  // Verificação do Plano
  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useSchedules) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`);
        }, 1000);
      }
    }
    fetchData();
  }, [user, history, getPlanCompany]);

  // Busca de Agendamentos
  const fetchSchedules = useCallback(async () => {
    try {
      const { data } = await api.get("/schedules", {
        params: { searchParam, pageNumber },
      });

      dispatch({ type: "LOAD_SCHEDULES", payload: data.schedules });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  }, [searchParam, pageNumber]);

  // Efeito para Abrir Modal ao ter ContactId
  const handleOpenScheduleModalFromContactId = useCallback(() => {
    if (contactId) {
      handleOpenScheduleModal();
    }
  }, [contactId]);

  // Reset ao Pesquisar
  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  // Carregamento com Debounce
  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchSchedules();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [
    searchParam,
    pageNumber,
    contactId,
    fetchSchedules,
    handleOpenScheduleModalFromContactId,
  ]);

  // Socket para Atualizações em Tempo Real
  useEffect(() => {
    const onCompanySchedule = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_SCHEDULES", payload: data.schedule });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_SCHEDULE", payload: +data.scheduleId });
      }
    }

    socket.on(`company${user.companyId}-schedule`, onCompanySchedule);

    return () => {
      socket.off(`company${user.companyId}-schedule`, onCompanySchedule);
    };
  }, [socket, user.companyId]);

  // Handlers
  const cleanContact = () => {
    setContactId("");
  };

  const handleOpenScheduleModal = () => {
    setSelectedSchedule(null);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setSelectedSchedule(null);
    setScheduleModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleModalOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success(i18n.t("schedules.toasts.deleted"));
      dispatch({ type: "DELETE_SCHEDULE", payload: scheduleId });
    } catch (err) {
      toastError(err);
    }
    setDeletingSchedule(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleViewChange = (view) => {
    setCalendarView(view);
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
      {/* Modais */}
      <ConfirmationModal
        title={deletingSchedule && i18n.t("schedules.confirmationModal.deleteTitle")}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteSchedule(deletingSchedule.id)}
      >
        {i18n.t("schedules.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      {scheduleModalOpen && (
        <ScheduleModal
          open={scheduleModalOpen}
          onClose={handleCloseScheduleModal}
          reload={fetchSchedules}
          scheduleId={selectedSchedule?.id}
          contactId={contactId}
          cleanContact={cleanContact}
        />
      )}

      {/* Container Principal */}
      <Paper className={classes.mainContainer}>
        {/* Barra de Pesquisa e Ações */}
        <div className={classes.searchContainer}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flex: 1,
            flexWrap: "wrap"
          }}>
            <TextField
              placeholder={i18n.t("Pesquisar...")}
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
              className={classes.addButton}
              onClick={handleOpenScheduleModal}
              startIcon={<AddIcon />}
            >
              {i18n.t("schedules.buttons.add")}
            </Button>
          </div>
        </div>

        {/* Calendário */}
        <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
          <Calendar
            messages={defaultMessages}
            localizer={localizer}
            events={schedules.map((schedule) => ({
              id: schedule.id,
              title: schedule?.contact?.name,
              start: new Date(schedule.sendAt),
              end: new Date(schedule.sendAt),
              schedule: schedule,
              status: schedule.status || 'pending',
            }))}
            defaultView={calendarView}
            onView={handleViewChange}
            views={['month', 'week', 'day', 'agenda']}
            step={30}
            className={classes.calendar}
            components={{
              event: (props) => (
                <EventComponent
                  {...props}
                  handleEditSchedule={handleEditSchedule}
                  handleDeleteSchedule={(id) => {
                    setDeletingSchedule({ id });
                    setConfirmModalOpen(true);
                  }}
                />
              ),
            }}
            eventPropGetter={(event) => ({
              className: classes.calendarEvent,
              style: {
                ...customEventStyles[event.status],
                border: 'none',
                borderRadius: '8px',
                padding: '4px 8px',
              },
            })}
            formats={{
              agendaDateFormat: "DD/MM ddd",
              weekdayFormat: "dddd",
              dayRangeHeaderFormat: ({ start, end }) => {
                const startStr = moment(start).format('DD/MM');
                const endStr = moment(end).format('DD/MM');
                return `${startStr} - ${endStr}`;
              },
            }}
            dayPropGetter={(date) => ({
              className: classes.calendarDay,
              style: {
                backgroundColor: moment(date).isSame(moment(), 'day')
                  ? 'rgba(37, 182, 232, 0.05)'
                  : undefined,
              },
            })}
            toolbar={true}
          />
        </Paper>
      </Paper>
    </MainContainer>
  );
};

export default Schedules;