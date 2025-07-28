

import React, { useState, useContext, useEffect } from "react"
import { Link as RouterLink } from "react-router-dom"
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  Link,
  TextField,
  Typography,
  Stack,
  Card,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
  alpha,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Slide,
  Zoom,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import {
  Mail,
  Lock,
  Visibility,
  VisibilityOff,
  Send,
  Support,
  Close,
  Phone,
  Chat,
  Email,
  Help,
  Rocket,
} from "@mui/icons-material"
import { Helmet } from "react-helmet"
import { AuthContext } from "../../context/Auth/AuthContext"
import useSettings from "../../hooks/useSettings"
import ColorModeContext from "../../layout/themeContext"

// Styled components for the new design
const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f5f5f5",
  padding: theme.spacing(2),
}))

const LoginCard = styled(Card)(({ theme }) => ({
  display: "flex",
  width: "100%",
  maxWidth: 1000,
  minHeight: 600,
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    maxWidth: 400,
    minHeight: "auto",
  },
}))

const BrandSection = styled(Box)(({ theme }) => ({
  flex: 1,
  background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
  padding: theme.spacing(6),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  color: "white",
  textAlign: "center",
  overflow: "hidden",
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4),
    minHeight: 200,
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    right: -50,
    width: 100,
    height: "100%",
    background: "white",
    borderRadius: "50px 0 0 50px",
    clipPath: "polygon(0 0, 100% 20%, 100% 80%, 0 100%)",
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
}))

const WaveDecoration = styled(Box)(({ theme }) => ({
  position: "absolute",
  right: -20,
  top: 0,
  bottom: 0,
  width: 60,
  background: "white",
  clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const FormSection = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(6),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  backgroundColor: "white",
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4),
  },
}))

const BrandLogo = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: "50%",
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(3),
  border: "3px solid rgba(255, 255, 255, 0.3)",
  backdropFilter: "blur(10px)",
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    transition: "all 0.3s ease",
    "&:hover": {
      borderColor: "#1976d2",
      backgroundColor: "#f0f7ff",
    },
    "&.Mui-focused": {
      borderColor: "#1976d2",
      backgroundColor: "#f0f7ff",
      boxShadow: `0 0 0 3px ${alpha("#1976d2", 0.1)}`,
    },
    "& fieldset": {
      border: "none",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#6c757d",
    fontSize: "0.9rem",
    "&.Mui-focused": {
      color: "#1976d2",
    },
  },
  "& .MuiInputBase-input": {
    padding: "14px 16px",
    fontSize: "0.95rem",
  },
}))

const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: "14px 32px",
  fontSize: "1rem",
  fontWeight: 600,
  textTransform: "none",
  background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
  boxShadow: "0 4px 15px rgba(25, 118, 210, 0.3)",
  "&:hover": {
    background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
    boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
    transform: "translateY(-2px)",
  },
  transition: "all 0.3s ease",
}))

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: "14px 32px",
  fontSize: "1rem",
  fontWeight: 600,
  textTransform: "none",
  border: "2px solid #1976d2",
  color: "#1976d2",
  "&:hover": {
    backgroundColor: alpha("#1976d2", 0.05),
    borderColor: "#1565c0",
  },
  transition: "all 0.3s ease",
}))

const CallCenterFab = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: 24,
  right: 24,
  background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
  color: "white",
  boxShadow: "0 8px 25px rgba(25, 118, 210, 0.4)",
  "&:hover": {
    transform: "scale(1.1)",
    boxShadow: "0 12px 35px rgba(25, 118, 210, 0.6)",
  },
  transition: "all 0.3s ease",
  zIndex: 1000,
}))

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />
})

const Login = () => {
  const [user, setUser] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [emailErrorMessage, setEmailErrorMessage] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("")
  const [allowSignup, setAllowSignup] = useState(false)
  const [callCenterOpen, setCallCenterOpen] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const { colorMode } = useContext(ColorModeContext)
  const { appName } = colorMode
  const { handleLogin } = useContext(AuthContext)
  const { getPublicSetting } = useSettings()

  useEffect(() => {
    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setUser((prev) => ({ ...prev, email: rememberedEmail }))
      setRememberMe(true)
    }

    getPublicSetting("allowSignup")
      .then((data) => {
        setAllowSignup(data === "enabled")
      })
      .catch((error) => {
        console.log("Erro ao ler configuração", error)
      })
  }, [getPublicSetting])

  const handleChangeInput = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value })

    // Clear errors when typing
    if (e.target.name === "email") {
      setEmailError(false)
      setEmailErrorMessage("")
    } else if (e.target.name === "password") {
      setPasswordError(false)
      setPasswordErrorMessage("")
    }
  }

  const validateInputs = () => {
    let isValid = true

    if (!user.email || !/\S+@\S+\.\S+/.test(user.email)) {
      setEmailError(true)
      setEmailErrorMessage("Por favor, insira um email válido.")
      isValid = false
    }

    if (!user.password || user.password.length < 6) {
      setPasswordError(true)
      setPasswordErrorMessage("A senha deve ter pelo menos 6 caracteres.")
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateInputs()) {
      setLoading(true)
      try {
        await handleLogin(user)
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", user.email)
        } else {
          localStorage.removeItem("rememberedEmail")
        }
      } catch (error) {
        console.error(error)
        setPasswordError(true)
        setPasswordErrorMessage("Credenciais inválidas. Por favor, tente novamente.")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleTogglePassword = () => {
    setShowPassword(!showPassword)
  }

  const handleCallCenterOpen = () => {
    setCallCenterOpen(true)
  }

  const handleCallCenterClose = () => {
    setCallCenterOpen(false)
  }

  const callCenterOptions = [
    {
      icon: <Phone />,
      title: "Ligar para Suporte",
      description: "Fale diretamente com nossa equipe",
      action: () => window.open("https://wa.me/5534933005932"),
      color: "#4CAF50",
    },
    {
      icon: <Chat />,
      title: "Chat Online",
      description: "Converse conosco em tempo real",
      action: () => window.open("https://wa.me/5534933005932"),
      color: "#2196F3",
    },
    {
      icon: <Email />,
      title: "Enviar Email",
      description: "Descreva seu problema detalhadamente",
      action: () => window.open("mailto:yran.augusto.contato@gmail.com"),
      color: "#FF9800",
    },
    {
      icon: <Help />,
      title: "Central de Ajuda",
      description: "Acesse nossa base de conhecimento",
      action: () => window.open("/help"),
      color: "#9C27B0",
    },
  ]

  return (
    <>
      <Helmet>
        <title>{appName || "Multivus"}</title>
        <link rel="icon" href="/favicon.png" />
      </Helmet>
      <CssBaseline enableColorScheme />

      <LoginContainer>
        <Zoom in timeout={800}>
          <LoginCard>
            {/* Brand Section */}
            <BrandSection>
              <WaveDecoration />
              <Zoom in timeout={1000} style={{ transitionDelay: "200ms" }}>
                <BrandLogo>
                  <Rocket sx={{ fontSize: 40, color: "white" }} />
                </BrandLogo>
              </Zoom>

              <Slide in timeout={800} direction="right">
                <Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, fontWeight: 400 }}>
                    Seja Bem Vindo
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                    {appName || "Multivus"}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.6, maxWidth: 280 }}>
                    Atenda mais, melhor e mais rápido no WhatsApp — com a Multivus!
                  </Typography>
                </Box>
              </Slide>
            </BrandSection>

            {/* Form Section */}
            <FormSection>
              <Slide in timeout={1000} direction="left">
                <Box>
                  <Box mb={4}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#212529", mb: 1 }}>
                      Entrar
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Acesse sua conta para continuar
                    </Typography>
                  </Box>

                  <Box component="form" onSubmit={handleSubmit}>
                    <StyledTextField
                      fullWidth
                      label="E-mail"
                      name="email"
                      type="email"
                      value={user.email}
                      onChange={handleChangeInput}
                      error={emailError}
                      helperText={emailErrorMessage}
                      placeholder="Digite seu e-mail"
                      autoComplete="email"
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail sx={{ color: "#6c757d", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <StyledTextField
                      fullWidth
                      label="Senha"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={user.password}
                      onChange={handleChangeInput}
                      error={passwordError}
                      helperText={passwordErrorMessage}
                      placeholder="Digite sua senha"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: "#6c757d", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleTogglePassword} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            sx={{
                              color: "#1976d2",
                              "&.Mui-checked": {
                                color: "#1976d2",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" color="text.secondary">
                            Lembre de mim
                          </Typography>
                        }
                      />
                      <Link
                        component={RouterLink}
                        to="/recover-password"
                        variant="body2"
                        color="primary"
                        sx={{ textDecoration: "none", fontWeight: 500 }}
                      >
                        Esqueceu sua senha?
                      </Link>
                    </Box>

                    <Stack spacing={2}>
                      <PrimaryButton
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        endIcon={!loading && <Send />}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
                      </PrimaryButton>

                    {allowSignup && (
							<SecondaryButton 
								component={RouterLink}
								to="/signup"  // Esta é a propriedade correta para o RouterLink
								fullWidth 
								variant="outlined"
							>
								Criar uma conta
							</SecondaryButton>
							)}
							</Stack>

                    
                    <Stack direction="row" spacing={2}>
                     
                     
                    </Stack>
                  </Box>
                </Box>
              </Slide>
            </FormSection>
          </LoginCard>
        </Zoom>

        {/* Call Center FAB */}
        <Zoom in timeout={1500}>
          <CallCenterFab onClick={handleCallCenterOpen}>
            <Support />
          </CallCenterFab>
        </Zoom>

        {/* Call Center Dialog */}
        <Dialog
          open={callCenterOpen}
          onClose={handleCallCenterClose}
          TransitionComponent={Transition}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: "white",
            },
          }}
        >
          <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" fontWeight={700} color="primary">
                Central de Atendimento
              </Typography>
              <IconButton onClick={handleCallCenterClose} size="small">
                <Close />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Como podemos ajudá-lo hoje?
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              {callCenterOptions.map((option, index) => (
                <Card
                  key={index}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: option.color,
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 25px ${alpha(option.color, 0.2)}`,
                    },
                  }}
                  onClick={option.action}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: option.color, width: 48, height: 48 }}>{option.icon}</Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {option.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Typography variant="caption" color="text.secondary" textAlign="center" width="100%">
              Nosso horário de atendimento: Segunda a Sexta, 8h às 18h
            </Typography>
          </DialogActions>
        </Dialog>
      </LoginContainer>
    </>
  )
}

export default Login
