import React, { useState, useContext } from "react";

import MenuItem from "@material-ui/core/MenuItem";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import { Menu, Grid, Popover, IconButton } from "@material-ui/core";
import makeStyles from '@mui/styles/makeStyles';
import AddCircleOutlineIcon from '@mui/icons-material/Add';
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import InformationModal from "../InformationModal";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";

import { TicketsContext } from "../../context/Tickets/TicketsContext";
// import { v4 as uuidv4 } from "uuid";

import toastError from "../../errors/toastError";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import ForwardModal from "../ForwardMessageModal";
import ShowTicketOpen from "../ShowTicketOpenModal";
import AcceptTicketWithoutQueue from "../AcceptTicketWithoutQueueModal";
import {toast} from "react-toastify";

const useStyles = makeStyles((theme) => ({
	iconButton: {
	  padding: '4px', // Ajuste o valor conforme necessário
	},
	gridContainer: {
	  padding: '10px',
	  justifyContent: 'center',
	},
	// addCircleButton: {
	//   padding: '8px',
	//   fontSize: '2rem', // Aumentar o tamanho do ícone
	//   backgroundColor: 'rgb(242 242 247);',
	// },
	popoverContent: {
	  maxHeight: '300px', // Ajuste conforme necessário
	  overflowY: 'auto',
	  '&::-webkit-scrollbar': {
		width: '0.4em',
		height: '0.4em',
	  },
	  '&::-webkit-scrollbar-thumb': {
		backgroundColor: 'rgba(0,0,0,.1)',
		borderRadius: '50px',
	  },
	  '&::-webkit-scrollbar-track': {
		boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
		webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
	  },
	},
	hideScrollbar: {
	  maxHeight: '300px', // retirei porque estava quebrando a pagina
	  overflow: 'hidden',
	},
  }));

const MessageOptionsMenu = ({
  message,
  menuOpen,
  handleClose,
  anchorEl,
  isGroup,
  queueId,
  whatsappId
}) => {
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const editingContext = useContext(EditMessageContext);
  const setEditingMessage = editingContext ? editingContext.setEditingMessage : null;
  const { setTabOpen } = useContext(TicketsContext);
  const history = useHistory();

  const [openAlert, setOpenAlert] = useState(false);
  const [userTicketOpen, setUserTicketOpen] = useState("");
  const [queueTicketOpen, setQueueTicketOpen] = useState("");
  const [acceptTicketWithouSelectQueueOpen, setAcceptTicketWithouSelectQueueOpen] = useState(false);

  const [ticketOpen, setTicketOpen] = useState(null);

  // Transcrição de áudio
  const [showTranscribedText, setShowTranscribedText] = useState(false);
	const [audioMessageTranscribeToText, setAudioMessageTranscribeToText] = useState("");

  // Reagir mensagens
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);

  const { showSelectMessageCheckbox,
    setShowSelectMessageCheckbox,
    selectedMessages,
    forwardMessageModalOpen,
    setForwardMessageModalOpen } = useContext(ForwardMessageContext);

    const classes = useStyles();

    const openReactionsMenu = (event) => {
      setReactionAnchorEl(event.currentTarget);
      handleClose();
    };
    
    const closeReactionsMenu = () => {
      setReactionAnchorEl(null);
      handleClose();
    };
  
    const openMoreReactionsMenu = (event) => {
      setMoreAnchorEl(event.currentTarget);
      closeReactionsMenu();  // Fechar o primeiro popover
    };
  
    const closeMoreReactionsMenu = () => {
      setMoreAnchorEl(null);
    };

  const handleSaveTicket = async (contactId) => {
    if (!contactId) return;

    try {
      const { data: ticket } = await api.post("/tickets", {
        contactId: contactId,
        userId: user?.id,
        status: "open",
        queueId: queueId,
        whatsappId: whatsappId
      });

      setTicketOpen(ticket);
      if (ticket.queueId === null) {
        setAcceptTicketWithouSelectQueueOpen(true);
      } else {
        setTabOpen("open");
        history.push(`/tickets/${ticket.uuid}`);
      }
    } catch (err) {
      const ticket = JSON.parse(err.response.data.error);

      if (ticket.userId !== user?.id) {
        setOpenAlert(true);
        setUserTicketOpen(ticket.user.name);
        setQueueTicketOpen(ticket.queue.name);
      } else {
        setOpenAlert(false);
        setUserTicketOpen("");
        setQueueTicketOpen("");

        // handleSelectTicket(ticket);
        setTabOpen(ticket.status);
        history.push(`/tickets/${ticket.uuid}`);
      }
    }
    //setLoading(false);
    handleClose();
  };

  const handleCloseAlert = () => {
    setOpenAlert(false);
    setOpenAlert(false);
    setUserTicketOpen("");
    setQueueTicketOpen("");
  };

  const handleSetShowSelectCheckbox = () => {
    setShowSelectMessageCheckbox(!showSelectMessageCheckbox);
    handleClose();
  };

  const handleDeleteMessage = async () => {
    try {
      await api.delete(`/messages/${message.id}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleEditMessage = async () => {
    setEditingMessage(message);
    handleClose();
  }
  // const handleForwardMessage = (msg) => {
  //   setForwardModalOpen(true);
  //   setForwardMessage(msg);
  //   handleClose();
  // };
  // const handleCloseForwardModal = () => {

  //   //setSelectedSchedule(null);
  //   setForwardModalOpen(false);
  //   handleClose();
  // };

  // Reagir Mensagens
  const handleReactToMessage = async (reactionType) => {
		try {
			await api.post(`/messages/${message.id}/reactions`, { type: reactionType });
			toast.success(i18n.t("messageOptionsMenu.reactionSuccess"));
		} catch (err) {
			toastError(err);
		}
		closeReactionsMenu(); // Fechar o menu de reações ao reagir
	};

	// Array de emojis
    const availableReactions = [
		'😀', '😂', '❤️', '👍', '🎉', '😢', '😮', '😡', '👏', '🔥',
        '🥳', '😎', '🤩', '😜', '🤔', '🙄', '😴', '😇', '🤯', '💩',
        '🤗', '🤫', '🤭', '🤓', '🤪', '🤥', '🤡', '🤠', '🤢', '🤧',
        '😷', '🤕', '🤒', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃',
        '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈',
        '🙉', '🙊', '🐵', '🐒', '🦍', '🐶', '🐕', '🐩', '🐺', '🦊',
        '🦝', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄'
	];

  const handleTranscriptionAudioToText = async () => {
		try {
			const audioUrl = String(message.mediaUrl);

			const match = audioUrl.match(/\/([^\/]+\.ogg)$/);
			const extractedPart = match ? match[1] : null;

			if (!extractedPart) {
				throw new Error('Formato de URL de áudio inesperado');
			}

			const response = await api.get(`/messages/transcribeAudio/${extractedPart}`);
			const { data } = response;

			if (data && typeof data.transcribedText === 'string') {
				setAudioMessageTranscribeToText(data.transcribedText);
				setShowTranscribedText(true);
				handleClose();
			} else if (data && data.error) {
				throw new Error(data.error);
			} else {
				throw new Error('Dados de transcrição inválidos');
			}
		} catch (err) {
			toastError(err.message || 'Erro desconhecido');
		}
	};

  const hanldeReplyMessage = () => {
    setReplyingMessage(message);
    handleClose();
  };

  const isWithinFifteenMinutes = () => {
    const fifteenMinutesInMilliseconds = 15 * 60 * 1000; // 15 minutos em milissegundos
    const currentTime = new Date();
    const messageTime = new Date(message.createdAt);

    // Verifica se a diferença entre o tempo atual e o tempo da mensagem é menor que 15 minutos
    return currentTime - messageTime <= fifteenMinutesInMilliseconds;
  };

  const handleOpenConfirmationModal = (e) => {
    setConfirmationOpen(true);
    handleClose();
  };

  return (
    <>
      <AcceptTicketWithoutQueue
        modalOpen={acceptTicketWithouSelectQueueOpen}
        onClose={(e) => setAcceptTicketWithouSelectQueueOpen(false)}
        ticket={ticketOpen}
        ticketId={ticketOpen?.id}
      />
      <ShowTicketOpen
        isOpen={openAlert}
        handleClose={handleCloseAlert}
        user={userTicketOpen}
        queue={queueTicketOpen}
      />
      <ConfirmationModal
        title={i18n.t("messageOptionsMenu.confirmationModal.title")}
        open={confirmationOpen}
        onClose={setConfirmationOpen}
        onConfirm={handleDeleteMessage}
      >
        {i18n.t("messageOptionsMenu.confirmationModal.message")}
      </ConfirmationModal>

      <InformationModal
				title={i18n.t("Transcrição de áudio")}
				open={showTranscribedText}
				onClose={setShowTranscribedText}
			>
				{audioMessageTranscribeToText}
			</InformationModal>

      <ForwardModal
        modalOpen={forwardMessageModalOpen}
        messages={selectedMessages}
        onClose={(e) => {
          setForwardMessageModalOpen(false);
          setShowSelectMessageCheckbox(false);
        }}
      />
      <Menu
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={menuOpen}
        onClose={handleClose}
      >
        {message.fromMe && (
          <MenuItem key="delete" onClick={handleOpenConfirmationModal}>
            {i18n.t("messageOptionsMenu.delete")}
          </MenuItem>
        )}
        {message.fromMe && isWithinFifteenMinutes() && (
          <MenuItem key="edit" onClick={handleEditMessage}>
            {i18n.t("messageOptionsMenu.edit")}
          </MenuItem>
        )}
        {(message.mediaType === "audio" && !message.fromMe) && (
					<MenuItem onClick={handleTranscriptionAudioToText}>
						{i18n.t("Transcrever áudio")}
					</MenuItem>
				)}
        <MenuItem onClick={hanldeReplyMessage}>
          {i18n.t("messageOptionsMenu.reply")}
        </MenuItem>
        <MenuItem onClick={handleSetShowSelectCheckbox}>
          {i18n.t("messageOptionsMenu.forward")}
        </MenuItem>
        <MenuItem onClick={openReactionsMenu}>
            {i18n.t("messageOptionsMenu.react")}
            </MenuItem>
        {!message.fromMe && isGroup && (
          <MenuItem onClick={() => handleSaveTicket(message?.contact?.id)}>
            {i18n.t("messageOptionsMenu.talkTo")}
          </MenuItem>
        )}
      </Menu>
            <Popover
                open={Boolean(reactionAnchorEl)}
                anchorEl={reactionAnchorEl}
                onClose={closeReactionsMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    style: { width: 'auto', maxWidth: '380px', borderRadius: '50px'  }
                }}
            >
                <div className={classes.hideScrollbar}>
                <Grid container spacing={1} className={classes.gridContainer}>
                    {availableReactions.slice(0, 6).map(reaction => (
                        <Grid item key={reaction}>
                            <IconButton
                                className={classes.iconButton}
                                onClick={() => handleReactToMessage(reaction)}
                                size="large">
                                {reaction}
                            </IconButton>
                        </Grid>
                    ))}
                    <Grid item>
                    <IconButton
                        // className={classes.addCircleButton}
                        onClick={openMoreReactionsMenu}
                        size="large">
                            <AddCircleOutlineIcon fontSize="normal" />
                        </IconButton>
                    </Grid>
                </Grid>
                </div>
            </Popover>
            <Popover
                open={Boolean(moreAnchorEl)}
                anchorEl={moreAnchorEl}
                onClose={closeMoreReactionsMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    style: { width: 'auto', maxWidth: '400px', borderRadius: '6px' }
                }}
            >
                <div className={classes.popoverContent}>
                <Grid container spacing={1} className={classes.gridContainer}>
                    {availableReactions.map(reaction => (
                        <Grid item key={reaction}>
                            <IconButton
                                className={classes.iconButton}
                                onClick={() => handleReactToMessage(reaction)}
                                size="large">
                                {reaction}
                            </IconButton>
                        </Grid>
                    ))}
                </Grid>
                </div>
            </Popover>
    </>
  );
};

export default MessageOptionsMenu;