import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import QRCode from 'react-qr-code';
import { SuccessContent, Total } from './style';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheckCircle } from 'react-icons/fa';
import { useDate } from "../../../hooks/useDate";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { CircularProgress } from '@material-ui/core';

function CheckoutSuccess(props) {
  const { pix } = props;
  const [pixString,] = useState(pix.qrcode.qrcode);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const history = useHistory();
  const { dateToClient } = useDate();

  useEffect(() => {
    let intervalId;
    let attempts = 0;
    const maxAttempts = 120; // 5 minutos (10 * 30 segundos)

    const checkPayment = async () => {
      try {
        const { data } = await api.get(`/subscription/check/${pix.id}`);
        
        if (data.success) {
          setIsChecking(false);
          clearInterval(intervalId);
          toast.success(`Sua licença foi renovada até ${dateToClient(data.company.dueDate)}!`);
          setTimeout(() => {
            history.push("/");
          }, 4000);
        } else if (attempts >= maxAttempts) {
          setIsChecking(false);
          clearInterval(intervalId);
          toast.info("Tempo de verificação expirado. Se você já pagou, a confirmação ocorrerá em breve.");
        }
        
        attempts++;
      } catch (error) {
        console.error(error);
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          toast.error("Sua sessão expirou. Por favor, faça login novamente.");
          setTimeout(() => {
            history.push("/login");
          }, 3000);
        }
      }
    };

    // Inicia a verificação imediatamente
    checkPayment();
    
    // Configura o intervalo para verificar a cada 30 segundos
    intervalId = setInterval(checkPayment, 5000);

    // Limpa o intervalo quando o componente for desmontado
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pix.id, history, dateToClient]);

  const handleCopyQR = () => {
    setTimeout(() => {
      setCopied(false);
    }, 1000);
    setCopied(true);
  };

  return (
    <React.Fragment>
      <Total>
        <span>TOTAL</span>
        <strong>R${pix.valor.original.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</strong>
      </Total>
      <SuccessContent>
        <QRCode value={pixString} />
        <CopyToClipboard text={pixString} onCopy={handleCopyQR}>
          <button className="copy-button" type="button">
            {copied ? (
              <>
                <span>Copiado</span>
                <FaCheckCircle size={18} />
              </>
            ) : (
              <>
                <span>Copiar código QR</span>
                <FaCopy size={18} />
              </>
            )}
          </button>
        </CopyToClipboard>
        <span>
          Para finalizar, basta realizar o pagamento escaneando ou colando o
          código Pix acima :)
        </span>
        {isChecking && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircularProgress size={20} />
            <span>Aguardando confirmação do pagamento...</span>
          </div>
        )}
      </SuccessContent>
    </React.Fragment>
  );
}

export default CheckoutSuccess;
