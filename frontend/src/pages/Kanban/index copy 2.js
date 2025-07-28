import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { Facebook, Instagram, WhatsApp, Add } from "@material-ui/icons";
import { Tooltip, Typography, Button, TextField } from "@material-ui/core";
import { format, isSameDay, parseISO } from "date-fns";
import { Can } from "../../components/Can";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    width: "100%",
    padding: theme.spacing(2),
    boxSizing: "border-box",
    backgroundColor: "#eaeaea",
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
  },
  kanbanContainer: {
    width: "100%",
    height: "calc(100vh - 80px)",
    overflowX: "auto",
    overflowY: "hidden",
    padding: theme.spacing(1),
    boxSizing: "border-box",
    WebkitOverflowScrolling: "touch",
    '&::-webkit-scrollbar': {
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555',
    },
  },
  controlsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: theme.spacing(1, 2),
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    marginBottom: theme.spacing(2),
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    flexWrap: "wrap",
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      flexDirection: "column",
      padding: theme.spacing(1),
    },
  },
  dateContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    flexWrap: "wrap",
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      gap: theme.spacing(1),
    },
  },
  dateInput: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "#ffffff",
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  searchButton: {
    backgroundColor: "#25b6e8",
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: theme.spacing(1, 3),
    "&:hover": {
      backgroundColor: "#1a9bcf",
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  addButton: {
    backgroundColor: "#25b6e8",
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: theme.spacing(1, 3),
    "&:hover": {
      backgroundColor: "#1a9bcf",
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    border: "1px solid rgba(0, 0, 0, 0.1)",
    "&:hover": {
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  },
  contactInfo: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    justifyContent: "flex-start",
    minWidth: 0,
  },
  contactName: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  ticketInfo: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  },
  ticketInfoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: theme.spacing(1),
  },
  ticketNumber: {
    fontSize: "0.75rem",
    color: "#666",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  contactNumber: {
    fontSize: "0.75rem",
    color: "#666",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  timeInfo: {
    fontSize: "0.85rem",
    color: "#666",
    whiteSpace: "nowrap",
  },
  messageContent: {
    fontSize: "0.9rem",
    color: "#444",
    margin: theme.spacing(1, 0),
    wordBreak: "break-word",
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    marginTop: theme.spacing(0.5),
  },
  viewButton: {
    backgroundColor: "#25b6e8",
    color: "#FFFFFF",
    borderRadius: "4px !important",
    border: "none",
    padding: "4px 14px",
    textTransform: "none",
    fontWeight: "500",
    fontSize: "0.875rem",
    "&:hover": {
      backgroundColor: "#1a9bcf",
    },
  },
  connectionTag: {
    backgroundColor: "#343a40",
    color: "#FFFFFF",
    padding: theme.spacing(0.5, 1),
    borderRadius: "4px",
    fontSize: "0.5rem",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  iconChannel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "24px",
  },
}));

const IconChannel = (channel) => {
  switch (channel) {
    case "facebook":
      return <Facebook style={{ color: "#3b5998", fontSize: "24px" }} />;
    case "instagram":
      return <Instagram style={{ color: "#e1306c", fontSize: "24px" }} />;
    case "whatsapp":
      return <WhatsApp style={{ color: "#25d366", fontSize: "24px" }} />;
    default:
      return null;
  }
};

const Kanban = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [file, setFile] = useState({ lanes: [] });
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [moreMessage, setMoreMessage] = useState(null);
  const jsonString = user?.queues?.map(queue => queue.UserQueue.queueId) || [];

  useEffect(() => {
    if (user) {
      fetchTags();
    }
  }, [user]);

  const fetchTags = async () => {
    try {
      const response = await api.get("/tag/kanban/");
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
      fetchTickets();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/ticket/kanban", {
        params: {
          queueIds: JSON.stringify(jsonString),
          startDate,
          endDate,
        }
      });
      setTickets(data.tickets);
    } catch (err) {
      console.log(err);
      setTickets([]);
    }
  };

  useEffect(() => {
    if (user?.companyId && socket) {
      const companyId = user.companyId;
      const onAppMessage = (data) => {
        if (data.action === "create" || data.action === "update" || data.action === "delete") {
          fetchTickets();
        }
      };

      socket.on(`company-${companyId}-ticket`, onAppMessage);
      socket.on(`company-${companyId}-appMessage`, onAppMessage);

      return () => {
        socket.off(`company-${companyId}-ticket`, onAppMessage);
        socket.off(`company-${companyId}-appMessage`, onAppMessage);
      };
    }
  }, [socket, user, startDate, endDate]);

  const handleSearchClick = () => {
    fetchTickets();
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handleCardClick = (uuid) => {
    history.push('/tickets/' + uuid);
  };

  const handleAddConnectionClick = () => {
    history.push('/tagsKanban');
  };

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      await api.delete(`/ticket-tags/${targetLaneId}`);
      toast.success('Removido com sucesso');
      await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
      toast.success('Adicionado com sucesso');
      await fetchTickets();
      popularCards();
    } catch (err) {
      console.log(err);
    }
  };

  const popularCards = () => {
    const filteredTickets = tickets.filter(ticket => ticket.tags.length === 0);

    const createCardContent = (ticket) => ({
      id: ticket.id.toString(),
      title: ' ',
      description: (
        <div className={classes.card}>
          <div className={classes.cardHeader}>
            <div className={classes.contactInfo}>
              <div className={classes.iconChannel}>
                <Tooltip title={ticket.whatsapp?.name || ''}>
                  {IconChannel(ticket.channel)}
                </Tooltip>
              </div>
              <Typography className={classes.contactName}>
                {ticket.contact.name}
              </Typography>
            </div>
            <Typography className={classes.timeInfo}>
              {isSameDay(parseISO(ticket.updatedAt), new Date())
                ? format(parseISO(ticket.updatedAt), "HH:mm")
                : format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}
            </Typography>
          </div>

          <div className={classes.ticketInfo}>
            <div className={classes.ticketInfoContainer}>
              <Typography className={classes.ticketNumber}>
                Ticket nº {ticket.id}
              </Typography>
              <Typography className={classes.contactNumber}>
                {ticket.contact.number}
              </Typography>
            </div>
          </div>
          <div className={classes.messageContent}>
            {moreMessage === ticket.id ? (
              <Typography variant="body2">
                {ticket.lastMessage}
              </Typography>
            ) : (
              <Typography variant="body2">
                {ticket.lastMessage?.length > 70
                  ? `${ticket.lastMessage.substring(0, 70)}...`
                  : ticket.lastMessage}
              </Typography>
            )}
          </div>

          <div className={classes.cardActions} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              className={classes.viewButton}
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick(ticket.uuid);
              }}
              size="small"
              style={{ fontWeight: 'bold' }}
            >
              Ver ticket
            </Button>
            {ticket?.user && (
              <div className={classes.connectionTag} style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                {ticket.user.name.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      ),
      draggable: true,
      href: "/tickets/" + ticket.uuid,
    });

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredTickets.length.toString(),
        cards: filteredTickets.map(ticket => createCardContent(ticket)),
        style: {
          backgroundColor: "#ffffff",
          color: "#444",
        }
      },
      ...tags.map(tag => {
        const tagTickets = tickets.filter(ticket =>
          ticket.tags.some(ticketTag => ticketTag.id === tag.id)
        );

        return {
          id: tag.id.toString(),
          title: tag.name,
          label: tagTickets.length.toString(),
          style: {
            backgroundColor: "#ffffff",
            color: "#444",
            borderTop: `3px solid ${tag.color}`
          },
          cards: tagTickets.map(ticket => createCardContent(ticket)),
        };
      }),
    ];

    setFile({ lanes });
  };

  useEffect(() => {
    if (tickets.length > 0 || tags.length > 0) {
      popularCards();
    }
  }, [tickets, tags]);

  return (
    <div className={classes.root}>
      <div className={classes.controlsContainer}>
        <div className={classes.dateContainer}>
          <TextField
            label="Data de início"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            className={classes.dateInput}
            size="small"
          />
          <TextField
            label="Data de fim"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            className={classes.dateInput}
            size="small"
          />
          <Button
            variant="contained"
            className={classes.searchButton}
            onClick={handleSearchClick}
            size="medium"
          >
            Buscar
          </Button>
        </div>
        <Can role={user?.profile} perform="dashboard:view" yes={() => (
          <Button
            variant="contained"
            className={classes.addButton}
            onClick={handleAddConnectionClick}
            startIcon={<Add />}
            size="medium"
          >
            Adicionar colunas
          </Button>
        )} />
      </div>
      <div className={classes.kanbanContainer}>
        <Board
          data={file}
          onCardMoveAcrossLanes={handleCardMove}
          style={{
            backgroundColor: 'transparent',
            height: '100%',
            borderBottom: 'none !important'
          }}
          laneStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '12px',
            marginRight: '12px',
            minWidth: window.innerWidth <= 600 ? '260px' : '260px',
            maxWidth: window.innerWidth <= 600 ? '280px' : '280px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            borderBottom: 'none !important',
          }}
          cardStyle={{
            padding: 0,
            marginBottom: '6px',
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            borderTop: 'none',
            '& > div': {
              borderBottom: 'none !important'
            }
          }}
          hideCardDeleteIcon
          tagStyle={{ display: 'none' }}
          cardDraggable={true}
          laneDraggable={false}
          handleDragStart={null}
          handleDragEnd={null}
          components={{
            LaneHeader: ({ title, label }) => (
              <div style={{
                padding: '0',
                marginBottom: '0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: 'none !important'
              }}>
                <Typography style={{
                  fontWeight: 600,
                  color: '#444',
                  fontSize: window.innerWidth <= 600 ? '1rem' : '1.1rem'
                }}>{title}</Typography>
                <Typography style={{
                  backgroundColor: '#f5f5f5',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: window.innerWidth <= 600 ? '0.75rem' : '0.875rem',
                  color: '#666'
                }}>{label}</Typography>
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

export default Kanban;