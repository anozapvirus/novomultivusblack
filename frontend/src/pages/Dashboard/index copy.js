import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  Tab,
  Tabs,
  Button,
  Box,
  LinearProgress,
  Avatar,
  SvgIcon
} from "@mui/material";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "@material-ui/core/styles";
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
import FilterListIcon from "@material-ui/icons/FilterList";
import ClearIcon from "@material-ui/icons/Clear";
import SendIcon from '@material-ui/icons/Send';
import MessageIcon from '@material-ui/icons/Message';
import AccessAlarmIcon from '@material-ui/icons/AccessAlarm';
import TimerIcon from '@material-ui/icons/Timer';
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import * as XLSX from 'xlsx';
import { grey } from "@material-ui/core/colors";
import { toast } from "react-toastify";
import moment from "moment";
import { isEmpty, isArray } from "lodash";

// Importações locais
import { AuthContext } from "../../context/Auth/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import useContacts from "../../hooks/useContacts";
import useMessages from "../../hooks/useMessages";
import TabPanel from "../../components/TabPanel";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import ForbiddenPage from "../../components/ForbiddenPage";
import Filters from "./Filters";
import { ChatsUser } from "./ChartsUser";
import ChartDonut from "./ChartDonut";
import { ChartsDate } from "./ChartsDate";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    background: '#F8FAFB',
    minHeight: '100vh',
    padding: theme.spacing(3)
  },
  metricsCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: theme.spacing(2),
    height: '100%',
    border: '1px solid #E5E9EB',
    boxShadow: 'none',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }
  },
  miniChart: {
    width: '100%',
    height: '40px',
    marginTop: theme.spacing(1)
  },
  metricTitle: {
    fontSize: '14px',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1)
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 600,
    color: theme.palette.text.primary
  },
  metricTrend: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  trendUp: {
    color: '#4CAF50'
  },
  trendDown: {
    color: '#F44336'
  },
  progressContainer: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #E5E9EB'
  },
  progressTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1)
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: theme.spacing(1)
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& svg': {
      fontSize: 24,
    }
  },
  callIcon: {
    backgroundColor: '#E3F2FD',
    color: '#2196F3',
    '& svg': {
      transform: 'rotate(15deg)'
    }
  },
  waitingIcon: {
    backgroundColor: '#FFF3E0',
    color: '#FF9800'
  },
  finishedIcon: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50'
  },
  messagesIcon: {
    backgroundColor: '#F3E5F5',
    color: '#9C27B0'
  },
  usersIcon: {
    backgroundColor: '#E1F5FE',
    color: '#03A9F4'
  },
  timerIcon: {
    backgroundColor: '#FAFAFA',
    color: '#757575'
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  h4: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.25
  }
}));

const Dashboard = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { find } = useDashboard();

  // Estados
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [tab, setTab] = useState("Indicadores");
  const [showFilter, setShowFilter] = useState(false);
  const [period, setPeriod] = useState(0);
  const [loading, setLoading] = useState(false);

  let newDate = new Date();
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  let nowIni = `${year}-${month < 10 ? `0${month}` : `${month}`}-01`;
  let now = `${year}-${month < 10 ? `0${month}` : `${month}`}-${date < 10 ? `0${date}` : `${date}`}`;

  const [dateStartTicket, setDateStartTicket] = useState(nowIni);
  const [dateEndTicket, setDateEndTicket] = useState(now);
  const [queueTicket, setQueueTicket] = useState(false);
  const [fetchDataFilter, setFetchDataFilter] = useState(false);

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
    }
    setTimeout(() => {
      firstLoad();
    }, 1000);
  }, [fetchDataFilter]);

  const exportarGridParaExcel = () => {
    const ws = XLSX.utils.table_to_sheet(document.getElementById('grid-attendants'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendentes');
    XLSX.writeFile(wb, 'relatorio-de-atendentes.xlsx');
  };

  async function fetchData() {
    setLoading(true);

    let params = {};

    if (period > 0) {
      params = { days: period };
    }

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

    if (Object.keys(params).length === 0) {
      toast.error("Parametrize o filtro");
      setLoading(false);
      return;
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

  const GetUsers = () => {
    let count = 0;
    attendants.forEach(user => {
      if (user.online === true) {
        count++;
      }
    });
    return count;
  };

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
    const { count } = useMessages(props);
    return count;
  };

  function formatTime(minutes) {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  }

  const MiniChart = ({ data, color, type = "line" }) => {
    return (
      <ResponsiveContainer width="100%" height={40}>
        {type === "line" ? (
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    );
  };

  const MetricCard = ({ title, value, trend, color, icon, chartData }) => {
    const trendIsPositive = parseFloat(trend) >= 0;

    return (
      <Card className={classes.metricsCard}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <div>
              <Typography className={classes.metricTitle}>
                {title}
              </Typography>
              <Typography className={classes.metricValue}>
                {value}
              </Typography>
              <Box mt={1}>
                <Typography
                  className={`${classes.metricTrend} ${trendIsPositive ? classes.trendUp : classes.trendDown}`}
                >
                  {trendIsPositive ? '↑' : '↓'} {Math.abs(trend)}%
                </Typography>
              </Box>
            </div>
            {icon}
          </Stack>
          <div className={classes.miniChart}>
            <MiniChart data={chartData} color={color} />
          </div>
        </CardContent>
      </Card>
    );
  };

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

  return (
    <>
      {user.profile === "user" && user.showDashboard === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <div className={classes.mainContainer}>
          <Container maxWidth="xl">
            <Stack direction="row" justifyContent="space-between" mb={3}>
            </Stack>

            {showFilter && (
              <Filters
                dateStartTicket={dateStartTicket}
                dateEndTicket={dateEndTicket}
                queueTicket={queueTicket}
                setDateStartTicket={setDateStartTicket}
                setDateEndTicket={setDateEndTicket}
                setQueueTicket={setQueueTicket}
                fetchData={setFetchDataFilter}
              />
            )}

            <Grid2 container spacing={3}>
              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Em Atendimento"
                  value={counters.supportHappening || 0}
                  trend={((counters.supportHappening - counters.supportHappening) / counters.supportHappening * 100).toFixed(1)}
                  color="#2196F3"
                  icon={
                    <Box className={`${classes.iconWrapper} ${classes.callIcon}`}>
                      <CallIcon />
                    </Box>
                  }
                  chartData={generateChartData(counters.supportHappening || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Aguardando"
                  value={counters.supportPending || 0}
                  trend={((counters.supportPending - (counters.supportPending || 0)) / (counters.supportPending || 1) * 100).toFixed(1)}
                  color="#FF9800"
                  icon={
                    <Box className={`${classes.iconWrapper} ${classes.waitingIcon}`}>
                      <HourglassEmptyIcon />
                    </Box>
                  }
                  chartData={generateChartData(counters.supportPending || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Finalizados"
                  value={counters.supportFinished || 0}
                  trend={((counters.supportFinished - counters.supportFinished) / counters.supportFinished * 100).toFixed(1)}
                  color="#4CAF50"
                  icon={
                    <Box className={`${classes.iconWrapper} ${classes.finishedIcon}`}>
                      <CheckCircleIcon />
                    </Box>
                  }
                  chartData={generateChartData(counters.supportFinished || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total de Mensagens"
                  value={`${GetMessages(false, true)}/${GetMessages(true, true)}`}
                  trend={((GetMessages(true, true) - GetMessages(false, true)) / GetMessages(false, true) * 100).toFixed(1)}
                  color="#9C27B0"
                  icon={
                    <Box className={`${classes.iconWrapper} ${classes.messagesIcon}`}>
                      <MessageIcon />
                    </Box>
                  }
                  chartData={generateChartData(GetMessages(true, true))}
                />
              </Grid2>
            </Grid2>

            {/* Nova linha com os novos cards */}
            <Grid2 container spacing={3} sx={{ mt: 3 }}>
              {/* NOVOS CONTATOS */}
              <Grid2 xs={12} sm={6} lg={4}>
                <Card sx={{
                  height: "100%",
                  backgroundColor: theme.mode === "light" ? "transparent" : "rgba(170, 170, 170, 0.2)",
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
                          className={classes.overline}
                        >
                          {i18n.t("dashboard.cards.newContacts")}
                        </Typography>
                        <Typography variant="h4" className={classes.h4}>
                          {counters.leads}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: '#8c6b19',
                          height: 45,
                          width: 45
                        }}
                      >
                        <SvgIcon>
                          <GroupAddIcon />
                        </SvgIcon>
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>

              {/* TICKETS ATIVOS */}
              <Grid2 xs={12} sm={6} lg={4}>
                <Card sx={{
                  height: "100%",
                  backgroundColor: theme.mode === "light" ? "transparent" : "rgba(170, 170, 170, 0.2)",
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
                          className={classes.overline}
                        >
                          {i18n.t("dashboard.cards.activeTickets")}
                        </Typography>
                        <Typography variant="h4" className={classes.h4}>
                          {counters.activeTickets}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: '#EE4512',
                          height: 45,
                          width: 45
                        }}
                      >
                        <SvgIcon>
                          <ArrowUpward />
                        </SvgIcon>
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>

              {/* TICKETS PASSIVOS */}
              <Grid2 xs={12} sm={6} lg={4}>
                <Card sx={{
                  height: "100%",
                  backgroundColor: theme.mode === "light" ? "transparent" : "rgba(170, 170, 170, 0.2)",
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
                          className={classes.overline}
                        >
                          {i18n.t("dashboard.cards.passiveTickets")}
                        </Typography>
                        <Typography variant="h4" className={classes.h4}>
                          {counters.passiveTickets}
                        </Typography>
                      </Stack>
                      <Avatar
                        sx={{
                          backgroundColor: '#28C037',
                          height: 45,
                          width: 45
                        }}
                      >
                        <SvgIcon>
                          <ArrowDownward />
                        </SvgIcon>
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Seção de Progresso */}
            <Card className={classes.metricsCard} sx={{ mt: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Desempenho</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {GetUsers()}/{attendants.length} atendentes ativos
                  </Typography>
                </Stack>

                <Grid2 container spacing={3}>
                  <Grid2 xs={12} md={6}>
                    <Box mb={2}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Taxa de Resolução</Typography>
                        <Typography variant="body2" color="primary">
                          {((counters.supportFinished || 0) /
                            (counters.supportFinished + counters.supportPending || 1) * 100).toFixed(1)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={((counters.supportFinished || 0) /
                          (counters.supportFinished + counters.supportPending || 1) * 100)}
                        className={classes.progressBar}
                        sx={{ backgroundColor: '#E3F2FD' }}
                      />
                    </Box>
                  </Grid2>

                  <Grid2 xs={12} md={6}>
                    <Box mb={2}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Tempo Médio de Resposta</Typography>
                        <Typography variant="body2" color="primary">
                          {formatTime(counters.avgSupportTime || 0)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(counters.avgSupportTime || 0) / 60 * 100}
                        className={classes.progressBar}
                        sx={{ backgroundColor: '#FFF3E0' }}
                      />
                    </Box>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>

            {/* Gráficos Principais */}
            <Grid2 container spacing={3} sx={{ mt: 2 }}>
              {/* Gráfico de Linha - Atendimentos */}
              <Grid2 xs={12} lg={8}>
                <Card className={classes.metricsCard} sx={{
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
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

              {/* Gráfico de Pizza - Status */}
              <Grid2 xs={12} lg={4}>
                <Card className={classes.metricsCard} sx={{
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
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
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          <Cell fill="#2196F3" strokeWidth={2} stroke="#fff" />
                          <Cell fill="#FF9800" strokeWidth={2} stroke="#fff" />
                          <Cell fill="#4CAF50" strokeWidth={2} stroke="#fff" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                            padding: '12px'
                          }}
                        />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

            {/* Tabela de Atendentes */}
            <Card className={classes.metricsCard} sx={{ mt: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Atendentes</Typography>
                  <IconButton
                    onClick={exportarGridParaExcel}
                    sx={{
                      backgroundColor: theme.palette.primary.main + '15',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main + '25',
                      }
                    }}
                  >
                    <SaveAlt style={{ color: theme.palette.primary.main }} />
                  </IconButton>
                </Stack>
                <Box id="grid-attendants">
                  <TableAttendantsStatus
                    attendants={attendants}
                    loading={loading}
                  />
                </Box>
              </CardContent>
            </Card>
          </Container>
        </div>
      )}
    </>
  );
};

export default Dashboard;