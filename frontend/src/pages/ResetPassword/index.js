import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
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
import { LockReset, Lock, LockOpen } from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import api from '../../services/api';

// Estilos permanecem os mesmos...
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
  '& .MuiFormHelperText-root': {
    color: '#ef5350',
  }
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

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { colorMode } = useContext(ColorModeContext);
  const { appName } = colorMode;
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  const validatePasswords = () => {
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword
      });

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Erro ao redefinir senha. O link pode ter expirado.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <SignInContainer>
        <Card>
          <Typography variant="h4" sx={{
            color: '#ef5350',
            fontWeight: 600,
            textAlign: 'center',
            fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
            mb: 3
          }}>
            Link inválido
          </Typography>
          <Typography variant="body1" sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            mb: 3
          }}>
            Solicite uma nova recuperação de senha.
          </Typography>
          <Button
            component={Link}
            href="/recover-password"
            variant="contained"
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
          >
            Solicitar nova recuperação
          </Button>
        </Card>
      </SignInContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>Redefinir Senha - {appName || "Multivus"}</title>
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
            {!isSuccess ? (
              <>
                <Typography variant="h4" sx={{
                  color: 'white',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)'
                }}>
                  Redefinir Senha
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                  Digite sua nova senha
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
                  Senha redefinida!
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                  Você será redirecionado para a página de login em instantes...
                </Typography>
              </>
            )}
          </Box>

          {!isSuccess && (
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
                <StyledFormLabel htmlFor="password">Nova senha</StyledFormLabel>
                <StyledTextField
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  fullWidth
                  error={!!error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>

              <FormControl>
                <StyledFormLabel htmlFor="confirmPassword">Confirme a nova senha</StyledFormLabel>
                <StyledTextField
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                  fullWidth
                  error={!!error}
                  helperText={error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOpen sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
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
                endIcon={<LockReset />}
              >
                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
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

export default ResetPassword;