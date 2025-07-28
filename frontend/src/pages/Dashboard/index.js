import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  Box,
  LinearProgress,
  Avatar,
  SvgIcon,
  useTheme
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Groups, SaveAlt } from "@mui/icons-material";
import CallIcon from "@material-ui/icons/Call";
import RecordVoiceOverIcon from "@material-ui/icons/RecordVoiceOver";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import MessageIcon from '@material-ui/icons/Message';
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import * as XLSX from 'xlsx';
import moment from "moment";
import { isEmpty, isArray } from "lodash";
import { AuthContext } from "../../context/Auth/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import ForbiddenPage from "../../components/ForbiddenPage";

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { find } = useDashboard();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateStartTicket, setDateStartTicket] = useState(
    moment().startOf('month').format('YYYY-MM-DD')
  );
  const [dateEndTicket, setDateEndTicket] = useState(
    moment().format('YYYY-MM-DD')
  );

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
    }
    setTimeout(() => {
      firstLoad();
    }, 1000);
  }, []);

  // Função auxiliar para gerar dados do gráfico
  const generateChartData = (baseValue, variation = 0.1, points = 12) => {
    const result = [];
    let lastValue = baseValue;

    for (let i = 0; i < points; i++) {
      const change = (Math.random() * 2 - 1) * variation * baseValue;
      lastValue = Math.max(0, lastValue + change);
      result.push({ value: lastValue });
    }

    return result;
  };

  // Função para obter número de usuários ativos
  const GetUsers = () => {
    let count = 0;
    attendants.forEach(user => {
      if (user.online === true) {
        count++;
      }
    });
    return count;
  };

  // Função para formatar tempo
  const formatTime = (minutes) => {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  };

  // Função para exportar para Excel
  const exportarGridParaExcel = () => {
    const ws = XLSX.utils.table_to_sheet(document.getElementById('grid-attendants'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendentes');
    XLSX.writeFile(wb, 'relatorio-de-atendentes.xlsx');
  };

  // Função para obter mensagens
  const GetMessages = (all, fromMe) => {
    let props = {};
    if (all) {
      props = { fromMe };
    } else {
      props = {
        fromMe,
        dateStart: dateStartTicket,
        dateEnd: dateEndTicket,
      };
    }
    return { count: 100 }; // Simulando retorno para este exemplo
  };

  async function fetchData() {
    setLoading(true);

    let params = {};

    if (!isEmpty(dateStartTicket) && moment(dateStartTicket).isValid()) {
      params = {
        ...params,
        date_from: moment(dateStartTicket).format("YYYY-MM-DD"),
      };
    }

    if (!isEmpty(dateEndTicket) && moment(dateEndTicket).isValid()) {
      params = {
        ...params,
        date_to: moment(dateEndTicket).format("YYYY-MM-DD"),
      };
    }

    const data = await find(params);
    setCounters(data.counters);
    if (isArray(data.attendants)) {
      setAttendants(data.attendants);
    } else {
      setAttendants([]);
    }

    setLoading(false);
  }

  const MetricCard = ({ title, value, trend, icon, chartData, color }) => {
    const trendIsPositive = parseFloat(trend) >= 0;

    return (
      <Card
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)',
          borderRadius: '16px',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px 0 rgba(31,38,135,0.25)'
          }
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  mb: 1
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${color} 30%, ${color}99 90%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {value}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: trendIsPositive ? 'success.main' : 'error.main',
                    fontWeight: 500
                  }}
                >
                  {trendIsPositive ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            </Box>
            <Avatar
              sx={{
                bgcolor: `${color}15`,
                width: 56,
                height: 56,
                borderRadius: 2,
                '& .MuiSvgIcon-root': {
                  color: color,
                  fontSize: 28
                }
              }}
            >
              {icon}
            </Avatar>
          </Stack>
          <Box sx={{ mt: 3, height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={`url(#gradient-${title})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const PerformanceCard = ({ title, value, max, color }) => {
    const percentage = (value / max) * 100;

    return (
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.primary" fontWeight="500">
            {percentage.toFixed(1)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: `${color}15`,
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`
            }
          }}
        />
      </Box>
    );
  };

  return (
    <>
      {user.profile === "user" && user.showDashboard === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <Box
          sx={{
            minHeight: '100vh',
            // background: 'linear-gradient(135deg, #f5f7fa 0%, #f6f9fc 100%)',
            background: '#f5f5f5',
            py: 4
          }}
        >
          <Container maxWidth="xl">
            <Grid2 container spacing={3}>
              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Em Atendimento"
                  value={counters.supportHappening || 0}
                  trend={counters.supportHappening > 0 ? ((counters.supportHappening - counters.supportHappening) / counters.supportHappening * 100).toFixed(1) : '0.0'}
                  color={theme.palette.primary.main}
                  icon={<CallIcon />}
                  chartData={generateChartData(counters.supportHappening || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Aguardando"
                  value={counters.supportPending || 0}
                  trend={counters.supportPending > 0 ? ((counters.supportPending - (counters.supportPending || 0)) / (counters.supportPending || 1) * 100).toFixed(1) : '0.0'}
                  color={theme.palette.warning.main}
                  icon={<HourglassEmptyIcon />}
                  chartData={generateChartData(counters.supportPending || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Finalizados"
                  value={counters.supportFinished || 0}
                  trend={counters.supportFinished > 0 ? ((counters.supportFinished - counters.supportFinished) / counters.supportFinished * 100).toFixed(1) : '0.0'}
                  color={theme.palette.success.main}
                  icon={<CheckCircleIcon />}
                  chartData={generateChartData(counters.supportFinished || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total de Mensagens"
                  value={`${GetMessages(false, true).count}/${GetMessages(true, true).count}`}
                  trend={GetMessages(false, true).count > 0 ? ((GetMessages(true, true).count - GetMessages(false, true).count) / GetMessages(false, true).count * 100).toFixed(1) : '0.0'}
                  color={theme.palette.secondary.main}
                  icon={<MessageIcon />}
                  chartData={generateChartData(GetMessages(true, true).count)}
                />
              </Grid2>
            </Grid2>

            {/* Cards de Novos Contatos, Tickets Ativos e Passivos */}
            <Grid2 container spacing={3} sx={{ mt: 3 }}>
              <Grid2 xs={12} sm={6} lg={4}>
                <Card sx={{
                  height: "100%",
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
                }}>
                  <CardContent>
                    <Stack
                      alignItems="flex-start"
                      direction="row"
                      justifyContent="space-between"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          Novos Contatos
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {counters.leads || 0}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: '#8c6b19',
                          height: 45,
                          width: 45
                        }}
                      >
                        <GroupAddIcon />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 xs={12} sm={6} lg={4}>
                <Card sx={{
                  height: "100%",
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
                }}>
                  <CardContent>
                    <Stack
                      alignItems="flex-start"
                      direction="row"
                      justifyContent="space-between"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          Tickets Ativos
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {counters.activeTickets || 0}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: '#EE4512',
                          height: 45,
                          width: 45
                        }}
                      >
                        <ArrowUpward />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>

              <Grid2 xs={12} sm={6} lg={4}>
                <Card sx={{
                  height: "100%",
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
                }}>
                  <CardContent>
                    <Stack
                      alignItems="flex-start"
                      direction="row"
                      justifyContent="space-between"
                      spacing={3}
                    >
                      <Stack spacing={1}>
                        <Typography
                          color="primary"
                          variant="overline"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          Tickets Passivos
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {counters.passiveTickets || 0}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: '#28C037',
                          height: 45,
                          width: 45
                        }}
                      >
                        <ArrowDownward />
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Card de Performance */}
            <Card
              sx={{
                mt: 4,
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Desempenho
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {GetUsers()}/{attendants.length} atendentes ativos
                  </Typography>
                </Stack>

                <Grid2 container spacing={3}>
                  <Grid2 xs={12} md={6}>
                    <PerformanceCard
                      title="Taxa de Resolução"
                      value={counters.supportFinished || 0}
                      max={counters.supportFinished + counters.supportPending || 1}
                      color={theme.palette.primary.main}
                    />
                  </Grid2>
                  <Grid2 xs={12} md={6}>
                    <PerformanceCard
                      title="Tempo Médio de Resposta"
                      value={counters.avgResponseTime || 0} // Use dynamic data for average response time
                      max={counters.maxResponseTime || 60} // Use dynamic data for max response time
                      color={theme.palette.warning.main}
                    />
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <Grid2 container spacing={3} sx={{ mt: 2 }}>
              <Grid2 xs={12} lg={8}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
                  }}
                >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Visão Geral de Atendimentos
                      </Typography>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart
                          data={[
                            {
                              date: new Date(),
                              atendimento: counters.supportHappening || 0,
                              aguardando: counters.supportPending || 0,
                              finalizados: counters.supportFinished || 0,
                              hora: moment(new Date()).format('HH:mm')
                            }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="colorAtendimento" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#2196F3" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorAguardando" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#FF9800" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorFinalizados" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(date) => moment(date).format('DD/MM HH:mm')}
                            stroke="#666"
                          />
                          <YAxis stroke="#666" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                              padding: '12px'
                            }}
                            formatter={(value) => [value, "atendimentos"]}
                            labelFormatter={(date) => moment(date).format('DD/MM/YYYY HH:mm')}
                          />
                          <Legend iconType="circle" />
                          <Line
                            type="monotone"
                            dataKey="atendimento"
                            name="Em Atendimento"
                            stroke="#2196F3"
                            strokeWidth={3}
                            dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                            fill="url(#colorAtendimento)"
                          />
                          <Line
                            type="monotone"
                            dataKey="aguardando"
                            name="Aguardando"
                            stroke="#FF9800"
                            strokeWidth={3}
                            dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                            fill="url(#colorAguardando)"
                          />
                          <Line
                            type="monotone"
                            dataKey="finalizados"
                            name="Finalizados"
                            stroke="#4CAF50"
                            strokeWidth={3}
                            dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                            fill="url(#colorFinalizados)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                </Card>
              </Grid2>

              <Grid2 xs={12} lg={4}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Distribuição de Status
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Em Atendimento', value: counters.supportHappening || 0 },
                            { name: 'Aguardando', value: counters.supportPending || 0 },
                            { name: 'Finalizados', value: counters.supportFinished || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          <Cell fill={theme.palette.primary.main} />
                          <Cell fill={theme.palette.warning.main} />
                          <Cell fill={theme.palette.success.main} />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(31,38,135,0.15)',
                            padding: '12px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Tabela de Atendentes */}
            <Card
              sx={{
                mt: 4,
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Atendentes
                  </Typography>
                  <IconButton
                    onClick={exportarGridParaExcel}
                    sx={{
                      backgroundColor: `${theme.palette.primary.main}15`,
                      '&:hover': {
                        backgroundColor: `${theme.palette.primary.main}25`,
                      }
                    }}
                  >
                    <SaveAlt style={{ color: theme.palette.primary.main }} />
                  </IconButton>
                </Stack>
                <Box
                  id="grid-attendants"
                  sx={{
                    '& .MuiTableRow-root': {
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }
                  }}
                >
                  <TableAttendantsStatus
                    attendants={attendants}
                    loading={loading}
                  />
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
      )}
    </>
  );
};

export default Dashboard;