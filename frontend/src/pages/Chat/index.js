
import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
} from "@material-ui/core";
import { has, isObject } from "lodash";
import ChatList from "./ChatList";
import ChatMessages from "./ChatMessages";
import { UsersFilter } from "../../components/UsersFilter";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: "calc(100vh - 78px)",
    padding: theme.spacing(2),
    overflowY: "hidden",
  },
  chatContainer: {
    flex: 1,
    height: "100%",
    background: "#fff",
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  gridContainer: {
    flex: 1,
    height: "100%",
    display: "flex",
    background: "#fff",
  },
  sidebarContainer: {
    width: "300px",
    borderRight: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
  },
  chatContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  newChatButton: {
    margin: theme.spacing(2),
    backgroundColor: "#25b6e8",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
  },
  tabs: {
    borderBottom: "1px solid #eee",
    "& .MuiTab-root": {
      minWidth: "120px",
      fontSize: "0.875rem",
    },
    "& .Mui-selected": {
      color: "#25b6e8",
    },
    "& .MuiTabs-indicator": {
      backgroundColor: "#25b6e8",
    },
  },
  // Estilos do Modal
  dialogContent: {
    padding: theme.spacing(2),
  },
  dialogActions: {
    padding: theme.spacing(2),
    gap: theme.spacing(1),
  },
  titleField: {
    marginBottom: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  saveButton: {
    backgroundColor: "#25b6e8",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#1e9ac4",
    },
    "&.Mui-disabled": {
      backgroundColor: "rgba(0, 0, 0, 0.12)",
    },
  },
  // Estilos Mobile
  mobileContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  mobileHeader: {
    padding: theme.spacing(2),
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  mobileContent: {
    flex: 1,
    overflowY: "auto",
  },
  // Estilos Comuns
  scrollbar: {
    ...theme.scrollbarStyles,
  },
}));
export function ChatModal({
  open,
  chat,
  type,
  handleClose,
  handleLoadNewChat,
}) {
  const classes = useStyles();
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle("");
    setUsers([]);
    if (type === "edit") {
      const userList = chat.users.map((u) => ({
        id: u.user.id,
        name: u.user.name,
      }));
      setUsers(userList);
      setTitle(chat.title);
    }
  }, [chat, open, type]);

  const handleSave = async () => {
    try {
      if (type === "edit") {
        await api.put(`/chats/${chat.id}`, {
          users,
          title,
        });
      } else {
        const { data } = await api.post("/chats", {
          users,
          title,
        });
        handleLoadNewChat(data);
      }
      handleClose();
    } catch (err) { }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: 8,
        },
      }}
    >
      <DialogTitle style={{
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
      }}>
        {type === "edit"
          ? i18n.t("Chat interno")
          : i18n.t("Chat interno")
        }
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Título"
              placeholder={i18n.t("Escreva...")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              className={classes.titleField}
            />
          </Grid>
          <Grid item xs={12}>
            <UsersFilter
              onFiltered={(users) => setUsers(users)}
              initialUsers={users}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          onClick={handleClose}
          variant="outlined"
          style={{
            borderRadius: 8,
            color: '#333',
            borderColor: '#333'
          }}
        >
          {i18n.t("Cancelar")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          className={classes.saveButton}
          disabled={users.length === 0 || !title?.trim()}
        >
          {i18n.t("Salvar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
function Chat(props) {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);
  const history = useHistory();
  const { id } = useParams();
  const isMounted = useRef(true);
  const scrollToBottomRef = useRef();

  // Estados
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState("new");
  const [currentChat, setCurrentChat] = useState({});
  const [chats, setChats] = useState([]);
  const [chatsPageInfo, setChatsPageInfo] = useState({ hasMore: false });
  const [messages, setMessages] = useState([]);
  const [messagesPageInfo, setMessagesPageInfo] = useState({ hasMore: false });
  const [messagesPage, setMessagesPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      findChats().then((data) => {
        const { records } = data;
        if (records.length > 0) {
          setChats(records);
          setChatsPageInfo(data);

          if (id && records.length) {
            const chat = records.find((r) => r.uuid === id);
            selectChat(chat);
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    if (isObject(currentChat) && has(currentChat, "id")) {
      findMessages(currentChat.id).then(() => {
        if (typeof scrollToBottomRef.current === "function") {
          setTimeout(() => {
            scrollToBottomRef.current();
          }, 300);
        }
      });
    }
  }, [currentChat]);

  useEffect(() => {
    const companyId = user.companyId;

    const onChatUser = (data) => {
      if (data.action === "create") {
        setChats((prev) => [data.record, ...prev]);
      }
      if (data.action === "update") {
        const changedChats = chats.map((chat) => {
          if (chat.id === data.record.id) {
            setCurrentChat(data.record);
            return {
              ...data.record,
            };
          }
          return chat;
        });
        setChats(changedChats);
      }
    }

    const onChat = (data) => {
      if (data.action === "delete") {
        const filteredChats = chats.filter((c) => c.id !== +data.id);
        setChats(filteredChats);
        setMessages([]);
        setMessagesPage(1);
        setMessagesPageInfo({ hasMore: false });
        setCurrentChat({});
        history.push("/chats");
      }
    }

    const onCurrentChat = (data) => {
      if (data.action === "new-message") {
        setMessages((prev) => [...prev, data.newMessage]);
        const changedChats = chats.map((chat) => {
          if (chat.id === data.newMessage.chatId) {
            return {
              ...data.chat,
            };
          }
          return chat;
        });
        setChats(changedChats);
        scrollToBottomRef.current();
      }

      if (data.action === "update") {
        const changedChats = chats.map((chat) => {
          if (chat.id === data.chat.id) {
            return {
              ...data.chat,
            };
          }
          return chat;
        });
        setChats(changedChats);
        scrollToBottomRef.current();
      }
    }

    socket.on(`company-${companyId}-chat-user-${user.id}`, onChatUser);
    socket.on(`company-${companyId}-chat`, onChat);
    if (isObject(currentChat) && has(currentChat, "id")) {
      socket.on(`company-${companyId}-chat-${currentChat.id}`, onCurrentChat);
    }

    return () => {
      socket.off(`company-${companyId}-chat-user-${user.id}`, onChatUser);
      socket.off(`company-${companyId}-chat`, onChat);
      if (isObject(currentChat) && has(currentChat, "id")) {
        socket.off(`company-${companyId}-chat-${currentChat.id}`, onCurrentChat);
      }
    };
  }, [currentChat, chats, socket, user, history]);
  const selectChat = (chat) => {
    try {
      setMessages([]);
      setMessagesPage(1);
      setCurrentChat(chat);
      setTab(1);
    } catch (err) { }
  };

  const sendMessage = async (contentMessage) => {
    setLoading(true);
    try {
      await api.post(`/chats/${currentChat.id}/messages`, {
        message: contentMessage,
      });
    } catch (err) { }
    setLoading(false);
  };

  const deleteChat = async (chat) => {
    try {
      await api.delete(`/chats/${chat.id}`);
    } catch (err) { }
  };

  const findMessages = async (chatId) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/chats/${chatId}/messages?pageNumber=${messagesPage}`
      );
      setMessagesPage((prev) => prev + 1);
      setMessagesPageInfo(data);
      setMessages((prev) => [...data.records, ...prev]);
    } catch (err) { }
    setLoading(false);
  };

  const loadMoreMessages = async () => {
    if (!loading) {
      findMessages(currentChat.id);
    }
  };

  const findChats = async () => {
    try {
      const { data } = await api.get("/chats");
      return data;
    } catch (err) {
      console.log(err);
    }
  };

  const renderGrid = () => {
    return (
      <div className={classes.gridContainer}>
        <div className={classes.sidebarContainer}>
          <Button
            variant="contained"
            className={classes.newChatButton}
            onClick={() => {
              setDialogType("new");
              setShowDialog(true);
            }}
          >
            {i18n.t("Novo chat")}
          </Button>
          <ChatList
            chats={chats}
            pageInfo={chatsPageInfo}
            loading={loading}
            handleSelectChat={(chat) => selectChat(chat)}
            handleDeleteChat={(chat) => deleteChat(chat)}
            handleEditChat={() => {
              setDialogType("edit");
              setShowDialog(true);
            }}
          />
        </div>
        <div className={classes.chatContent}>
          {isObject(currentChat) && has(currentChat, "id") && (
            <ChatMessages
              chat={currentChat}
              scrollToBottomRef={scrollToBottomRef}
              pageInfo={messagesPageInfo}
              messages={messages}
              loading={loading}
              handleSendMessage={sendMessage}
              handleLoadMore={loadMoreMessages}
            />
          )}
        </div>
      </div>
    );
  };

  const renderTab = () => {
    return (
      <div className={classes.mobileContainer}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="fullWidth"
          className={classes.tabs}
        >
          <Tab label={i18n.t("Chats")} />
          <Tab label={i18n.t("Menssagens")} />
        </Tabs>

        <div className={classes.mobileContent}>
          {tab === 0 && (
            <>
              <div className={classes.mobileHeader}>
                <Button
                  variant="contained"
                  className={classes.newChatButton}
                  fullWidth
                  onClick={() => {
                    setDialogType("new");
                    setShowDialog(true);
                  }}
                >
                  {i18n.t("Novo chat")}
                </Button>
              </div>
              <ChatList
                chats={chats}
                pageInfo={chatsPageInfo}
                loading={loading}
                handleSelectChat={(chat) => selectChat(chat)}
                handleDeleteChat={(chat) => deleteChat(chat)}
                handleEditChat={() => {
                  setDialogType("edit");
                  setShowDialog(true);
                }}
              />
            </>
          )}
          {tab === 1 && (
            <>
              {isObject(currentChat) && has(currentChat, "id") && (
                <ChatMessages
                  chat={currentChat}
                  scrollToBottomRef={scrollToBottomRef}
                  pageInfo={messagesPageInfo}
                  messages={messages}
                  loading={loading}
                  handleSendMessage={sendMessage}
                  handleLoadMore={loadMoreMessages}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  return (
    <>
      <ChatModal
        type={dialogType}
        open={showDialog}
        chat={currentChat}
        handleLoadNewChat={(data) => {
          setMessages([]);
          setMessagesPage(1);
          setCurrentChat(data);
          setTab(1);
          history.push(`/chats/${data.uuid}`);
        }}
        handleClose={() => setShowDialog(false)}
      />

      <Paper className={classes.mainContainer}>
        <div className={classes.chatContainer}>
          {isWidthUp("md", props.width) ? renderGrid() : renderTab()}
        </div>
      </Paper>
    </>
  );
}

export default withWidth()(Chat);