import React, { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { Helmet } from "react-helmet";
import ColorModeContext from "../../layout/themeContext";
import SendIcon from '@mui/icons-material/Send';
import { Mail } from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import api from '../../services/api';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  borderRadius: '16px',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow: '0 8px 32px 0 #090b11',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, #474c4f 0%, #090b11 100%)',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
  '& .MuiInputBase-input': {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
}));

const StyledFormLabel = styled(FormLabel)({
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '8px',
});

const StyledLink = styled(Link)({
  color: 'rgba(255, 255, 255, 0.7)',
  textDecoration: 'none',
  '&:hover': {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

const RecoverPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { colorMode } = useContext(ColorModeContext);
  const { appName } = colorMode;

  const validateEmail = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Por favor, insira um email válido.');
      return false;
    }
    setEmailError(false);
    setEmailErrorMessage('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/recover-password', { email });

      if (response.data) {
        setIsSubmitted(true);
        setEmailError(false);
        setEmailErrorMessage('');
      }
    } catch (error) {
      setEmailError(true);
      setEmailErrorMessage(
        error.response?.data?.message ||
        'Erro ao enviar email de recuperação. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Senha - {appName || "Multivus"}</title>
      </Helmet>
      <CssBaseline enableColorScheme />
      <SignInContainer>
        <Card>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Box>
              <img src="/logo.svg" alt="Logo" style={{ width: '150px' }} />
            </Box>
            {!isSubmitted ? (
              <>
                <Typography variant="h4" sx={{
                  color: 'white',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)'
                }}>
                  Recuperar Senha
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                  Digite seu e-mail para receber as instruções de recuperação de senha
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h4" sx={{
                  color: '#4caf50',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)'
                }}>
                  Email enviado!
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                  Verifique sua caixa de entrada e a pasta de spam para as instruções de recuperação de senha.
                </Typography>
              </>
            )}
          </Box>

          {!isSubmitted && (
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: 3,
              }}
            >
              <FormControl>
                <StyledFormLabel htmlFor="email">Seu e-mail</StyledFormLabel>
                <StyledTextField
                  error={emailError}
                  helperText={emailErrorMessage}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exe@email.com"
                  autoComplete="email"
                  autoFocus
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  borderRadius: '12px',
                  padding: '12px',
                  background: '#090b11',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  boxShadow: '0 4px 15px #090b11',
                  '&:hover': {
                    background: '#282929',
                    transition: '0.5s'
                  }
                }}
                endIcon={<SendIcon />}
              >
                {isLoading ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </Box>
          )}

          <Typography sx={{ textAlign: 'center', mt: 2 }}>
            <StyledLink href="/login">
              Voltar para o login
            </StyledLink>
          </Typography>
        </Card>
      </SignInContainer>
    </>
  );
};

export default RecoverPassword;