import { useState, useEffect, useContext, useRef } from "react";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import { isArray, has } from "lodash";
import moment from "moment";
import "moment/locale/pt-br";

import api from "../../services/api";
import { socketConnection } from "../../services/socket";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useAuth = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const isMountedRef = useRef(true);
  const history = useHistory();

  // Cleanup quando componente é desmontado
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${JSON.parse(token)}`;
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if (error?.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;

        const { data } = await api.post("/auth/refresh_token");
        if (data) {
          localStorage.setItem("token", JSON.stringify(data.token));
          api.defaults.headers.Authorization = `Bearer ${data.token}`;
        }
        return api(originalRequest);
      }
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        api.defaults.headers.Authorization = undefined;
        if (isMountedRef.current) {
          setIsAuth(false);
        }
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      if (token) {
        try {
          const { data } = await api.post("/auth/refresh_token");
          if (isMountedRef.current) {
            api.defaults.headers.Authorization = `Bearer ${data.token}`;
            setIsAuth(true);
            setUser(data.user);
          }
        } catch (err) {
          if (isMountedRef.current) {
            toastError(err);
          }
        }
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user?.id || !isMountedRef.current) return;
    
    // console.log("Entrou useWhatsapp com user", Object.keys(user).length, Object.keys(socket).length ,user, socket)
    let io;
    
    // Verificar se o socket já existe e é válido
    if (!socket || typeof socket.on !== 'function') {
      io = socketConnection({ user });
      if (isMountedRef.current) {
        setSocket(io)
      }
    } else {
      io = socket
    }
    
    // Verificar se o socket foi criado corretamente
    if (!io || typeof io.on !== 'function') {
      console.error('Socket não foi inicializado corretamente');
      return;
    }
    
    const onCompanyUser = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "update" && data.user.id === user.id) {
        setUser(data.user);
      }
    };

    io.on(`company-${user.companyId}-user`, onCompanyUser);

    return () => {
      // console.log("desconectou o company user ", user.id)
      if (io && typeof io.off === 'function') {
        io.off(`company-${user.companyId}-user`, onCompanyUser);
      }
      // io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleLogin = async (userData) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", userData);
      const {
        user: { company },
      } = data;

      if (has(company, "companieSettings") && isArray(company.companieSettings[0])) {
        const setting = company.companieSettings[0].find(
          (s) => s.key === "campaignsEnabled"
        );
        if (setting && setting.value === "true") {
          localStorage.setItem("cshow", null); //regra pra exibir campanhas
        }
      }

      if (has(company, "companieSettings") && isArray(company.companieSettings[0])) {
        const setting = company.companieSettings[0].find(
          (s) => s.key === "sendSignMessage"
        );

        const signEnable = setting.value === "enable";

        if (setting && setting.value === "enabled") {
          localStorage.setItem("sendSignMessage", signEnable); //regra pra exibir campanhas
        }
      }
      localStorage.setItem("profileImage", data.user.profileImage); //regra pra exibir imagem contato

      moment.locale('pt-br');
      let dueDate;
      if (data.user.company.id === 1) {
        dueDate = '2999-12-31T00:00:00.000Z'
      } else {
        dueDate = data.user.company.dueDate;
      }
      const hoje = moment(moment()).format("DD/MM/yyyy");
      const vencimento = moment(dueDate).format("DD/MM/yyyy");

      var diff = moment(dueDate).diff(moment(moment()).format());

      var before = moment(moment().format()).isBefore(dueDate);
      var dias = moment.duration(diff).asDays();

      if (before === true) {
        localStorage.setItem("token", JSON.stringify(data.token));
        // localStorage.setItem("public-token", JSON.stringify(data.user.token));
        // localStorage.setItem("companyId", companyId);
        // localStorage.setItem("userId", id);
        localStorage.setItem("companyDueDate", vencimento);
        api.defaults.headers.Authorization = `Bearer ${data.token}`;
        if (isMountedRef.current) {
          setUser(data.user);
          setIsAuth(true);
        }
        toast.success(i18n.t("auth.toasts.success"));
        if (Math.round(dias) < 5) {
          toast.warn(`Sua assinatura vence em ${Math.round(dias)} ${Math.round(dias) === 1 ? 'dia' : 'dias'} `);
        }

        // // Atraso para garantir que o cache foi limpo
        // setTimeout(() => {
        //   window.location.reload(true); // Recarregar a página
        // }, 1000);

        history.push("/tickets");
        if (isMountedRef.current) {
          setLoading(false);
        }
      } else {
        // localStorage.setItem("companyId", companyId);
        api.defaults.headers.Authorization = `Bearer ${data.token}`;
        if (isMountedRef.current) {
          setIsAuth(true);
        }
        toastError(`Opss! Sua assinatura venceu ${vencimento}.
Entre em contato com o Suporte para mais informações! `);
        history.push("/financeiro-aberto");
        if (isMountedRef.current) {
          setLoading(false);
        }
      }

    } catch (err) {
      if (isMountedRef.current) {
        toastError(err);
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);

    try {
      // socket.disconnect();
      await api.delete("/auth/logout");
      if (isMountedRef.current) {
        setIsAuth(false);
        setUser({});
      }
      localStorage.removeItem("token");
      localStorage.removeItem("cshow");
      // localStorage.removeItem("public-token");
      api.defaults.headers.Authorization = undefined;
      if (isMountedRef.current) {
        setLoading(false);
      }
      history.push("/login");
    } catch (err) {
      if (isMountedRef.current) {
        toastError(err);
        setLoading(false);
      }
    }
  };

  const getCurrentUserInfo = async () => {
    try {
      const { data } = await api.get("/auth/me");
      console.log(data)
      return data;
    } catch (_) {
      return null;
    }
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleLogout,
    getCurrentUserInfo,
    socket
  };
};

export default useAuth;
