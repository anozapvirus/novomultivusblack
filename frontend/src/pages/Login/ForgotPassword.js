import * as React from 'react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import api from '../../services/api';

function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/recover-password', { email });
      setMessage(response.data.message || 'Email de recuperação enviado com sucesso!');
      setEmail('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Erro ao enviar email de recuperação. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setEmail('');
    setError('');
    setMessage('');
    setIsLoading(false);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>Recuperar Senha</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Digite o email da sua conta e enviaremos um link para redefinir sua senha.
        </DialogContentText>
        
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          label="Email"
          placeholder="seu-email@exemplo.com"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleCloseDialog} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          type="submit"
          disabled={isLoading || !email}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Enviando...' : 'Enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;