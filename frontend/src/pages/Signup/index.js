import React, { useState, useEffect, useContext } from "react";
import qs from 'query-string';
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";

// MUI Components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';

// Icons
import { Person, Mail, Lock, Business, Phone } from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send';

import usePlans from '../../hooks/usePlans';
import { i18n } from "../../translate/i18n";
import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import ColorModeContext from "../../layout/themeContext";
import { Helmet } from "react-helmet";


// utils
import { validateCpfCnpj} from "../../utils/validateCpfCnpj";
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
        maxWidth: '600px',
    },
    [theme.breakpoints.up('md')]: {
        maxWidth: '800px',
    },
    boxShadow: '0 8px 32px 0 #090b11',
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
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
    '&:hover': {
        color: 'rgba(255, 255, 255, 0.9)',
    },
});

const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '& .MuiSelect-select': {
        color: 'rgba(255, 255, 255, 0.9)',
        padding: '14px',
    },
    '& .MuiSvgIcon-root': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
    '&.MuiMenuItem-root': {
        padding: '16px',
        borderRadius: '8px',
        margin: '4px',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
        },
    },
}));

const PlanCard = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    '& .plan-name': {
        fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    '& .plan-details': {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
    },
    '& .plan-price': {
        color: '#4CAF50',
        fontWeight: 600,
    },
}));

const UserSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
    companyName: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
    password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
    document: Yup.string()
    .test('is-cpf-cnpj', 'CPF/CNPJ inválido', validateCpfCnpj).required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    phone: Yup.string().required("Required"),
    planId: Yup.string().required("Required"),
});

const SignUp = () => {
    const history = useHistory();
    const { getPlanList } = usePlans();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const { colorMode } = useContext(ColorModeContext);
    const { appName } = colorMode;

    let companyId = null;
    const params = qs.parse(window.location.search);
    if (params.companyId !== undefined) {
        companyId = params.companyId;
    }

    const initialState = {
        name: "",
        email: "",
        password: "",
        phone: "",
        companyId,
        document: "",
        companyName: "",
        planId: ""
    };

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            const planList = await getPlanList({ listPublic: "false" });
            setPlans(planList);
            setLoading(false);
        };
        fetchData();
    }, [getPlanList]);

    const handleSignUp = async values => {
        try {
            await openApi.post("/auth/signup", values);
            toast.success(i18n.t("signup.toasts.success"));
            history.push("/login");
        } catch (err) {
            toastError(err);
        }
    };

    return (
        <>
            <Helmet>
                <title>{appName || "Multivus"}</title>
                <link rel="icon" href="/favicon.png" />
            </Helmet>
            <CssBaseline enableColorScheme />
            <SignUpContainer>
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
                        <Typography variant="h4" sx={{
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'center',
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)'
                        }}>
                            {i18n.t("signup.title")}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                            Crie sua conta para começar
                        </Typography>
                    </Box>

                    <Formik
                        initialValues={initialState}
                        validationSchema={UserSchema}
                        onSubmit={(values, actions) => {
                            handleSignUp(values);
                            actions.setSubmitting(false);
                        }}
                    >
                        {({ touched, errors, isSubmitting }) => (
                            <Form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <FormControl>
                                    <StyledFormLabel>Nome da Empresa</StyledFormLabel>
                                    <Field
                                        as={StyledTextField}
                                        name="companyName"
                                        placeholder="Sua empresa"
                                        error={touched.companyName && Boolean(errors.companyName)}
                                        helperText={touched.companyName && errors.companyName}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Business sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormControl>
                                <FormControl>
                                    <StyledFormLabel>Seu CPF ou CNPJ</StyledFormLabel>
                                    <Field
                                        as={StyledTextField}
                                        name="document"
                                        placeholder="Seu CPF ou CNPJ"
                                        error={touched.document && Boolean(errors.document)}
                                        helperText={touched.document && errors.document}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Business sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormControl>
                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                                    gap: 2 
                                }}>
                                    <FormControl>
                                        <StyledFormLabel>Seu Nome</StyledFormLabel>
                                        <Field
                                            as={StyledTextField}
                                            name="name"
                                            placeholder="Seu nome completo"
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={touched.name && errors.name}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Person sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <StyledFormLabel>Telefone</StyledFormLabel>
                                        <Field
                                            as={StyledTextField}
                                            name="phone"
                                            placeholder="(00) 00000-0000"
                                            error={touched.phone && Boolean(errors.phone)}
                                            helperText={touched.phone && errors.phone}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Phone sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </FormControl>
                                </Box>

                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                                    gap: 2 
                                }}>
                                    <FormControl>
                                        <StyledFormLabel>E-mail</StyledFormLabel>
                                        <Field
                                            as={StyledTextField}
                                            name="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            error={touched.email && Boolean(errors.email)}
                                            helperText={touched.email && errors.email}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Mail sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    </InputAdornment>
                                                ),
                                                style: { textTransform: 'lowercase' }
                                            }}
                                        />
                                    </FormControl>

                                    <FormControl>
                                        <StyledFormLabel>Senha</StyledFormLabel>
                                        <Field
                                            as={StyledTextField}
                                            type="password"
                                            name="password"
                                            placeholder="••••••"
                                            error={touched.password && Boolean(errors.password)}
                                            helperText={touched.password && errors.password}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </FormControl>
                                </Box>

                                <FormControl>
                                    <StyledFormLabel>Plano</StyledFormLabel>
                                    <Field
                                        as={StyledSelect}
                                        name="planId"
                                        error={touched.planId && Boolean(errors.planId)}
                                        fullWidth
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    bgcolor: 'rgba(25, 25, 25, 0.95)',
                                                    backdropFilter: 'blur(10px)',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    maxHeight: '400px',
                                                }
                                            }
                                        }}
                                    >
                                        {plans.map((plan) => (
                                            <StyledMenuItem key={plan.id} value={plan.id}>
                                                <PlanCard>
                                                    <Typography className="plan-name">
                                                        {plan.name}
                                                    </Typography>
                                                    <Typography className="plan-details">
                                                        {plan.users} atendentes • {plan.connections} WhatsApp • {plan.queues} filas
                                                    </Typography>
                                                    <Typography className="plan-price">
                                                        R$ {plan.amount}
                                                    </Typography>
                                                </PlanCard>
                                            </StyledMenuItem>
                                        ))}
                                    </Field>
                                </FormControl>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={isSubmitting}
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
                                    {i18n.t("signup.buttons.submit")}
                                </Button>

                                <Typography sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Já tem uma conta?{' '}
                                    <StyledLink component={RouterLink} to="/login">
                                        {i18n.t("signup.buttons.login")}
                                    </StyledLink>
                                </Typography>
                            </Form>
                        )}
                    </Formik>
                </Card>
            </SignUpContainer>
        </>
    );
};

export default SignUp;
