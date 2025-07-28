import { useState, useEffect, useReducer, useContext, useRef } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";
// import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { isNill } from "lodash";

const reducer = (state, action) => {
  if (action.type === "LOAD_WHATSAPPS") {
    const whatsApps = action.payload;

    return [...whatsApps];
  }

  if (action.type === "UPDATE_WHATSAPPS") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex] = whatsApp;
      return [...state];
    } else {
      return [whatsApp, ...state];
    }
  }

  if (action.type === "UPDATE_SESSION") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex].status = whatsApp.status;
      state[whatsAppIndex].updatedAt = whatsApp.updatedAt;
      state[whatsAppIndex].qrcode = whatsApp.qrcode;
      state[whatsAppIndex].retries = whatsApp.retries;
      return [...state];
    } else {
      return [...state];
    }
  }

  if (action.type === "DELETE_WHATSAPPS") {
    const whatsAppId = action.payload;

    const whatsAppIndex = state.findIndex((s) => s.id === whatsAppId);
    if (whatsAppIndex !== -1) {
      state.splice(whatsAppIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useWhatsApps = () => {
  const [whatsApps, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
//   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);

  // Cleanup quando componente é desmontado
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/whatsapp/?session=0");
        if (isMountedRef.current) {
          dispatch({ type: "LOAD_WHATSAPPS", payload: data });
          setLoading(false);
        }
      } catch (_) {
        if (isMountedRef.current) {
          setLoading(false);
        }
        // toastError(err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (!user?.companyId || !socket || !isMountedRef.current) return;

    const companyId = user.companyId;
    
    // Verificar se o socket é válido
    if (typeof socket.on !== 'function') {
      console.error('Socket inválido no useWhatsApps');
      return;
    }
    
//    const socket = socketManager.GetSocket();

    const onCompanyWhatsapp = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "update") {
        dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
      }
    }

    const onCompanyWhatsappSession = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "update") {
        dispatch({ type: "UPDATE_SESSION", payload: data.session });
      }
    }

    socket.on(`company-${companyId}-whatsapp`, onCompanyWhatsapp);
    socket.on(`company-${companyId}-whatsappSession`, onCompanyWhatsappSession);

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off(`company-${companyId}-whatsapp`, onCompanyWhatsapp);
        socket.off(`company-${companyId}-whatsappSession`, onCompanyWhatsappSession);
      }
    };
  }, [socket, user?.companyId]);

  return { whatsApps, loading };
};

export default useWhatsApps;
