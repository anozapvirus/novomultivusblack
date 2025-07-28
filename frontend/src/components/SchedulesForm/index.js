import React, { useState, useEffect } from "react";
import { makeStyles, TextField, Grid, Card, CardContent, Typography, Box, Chip, Switch, FormControlLabel, Divider, IconButton, Tooltip, Paper } from "@material-ui/core";
import { Formik, Form, FastField, FieldArray } from "formik";
import { isArray } from "lodash";
import NumberFormat from "react-number-format";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { i18n } from "../../translate/i18n";
import { Schedule, AccessTime, CheckCircle, Warning, Info } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  fullWidth: {
    width: "100%",
  },
  dayCard: {
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: theme.shadows[4],
      transform: "translateY(-2px)",
    },
  },
  dayCardHeader: {
    backgroundColor: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayTitle: {
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  dayStatus: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  dayCardContent: {
    padding: theme.spacing(2),
  },
  timeGrid: {
    marginTop: theme.spacing(1),
  },
  timeField: {
    marginBottom: theme.spacing(1),
  },
  textfield: {
    width: "100%",
    fontSize: "0.875em",
    "& .MuiOutlinedInput-root": {
      borderRadius: theme.spacing(1),
    },
  },
  intervalDivider: {
    margin: theme.spacing(2, 0),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  intervalLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  closedDay: {
    backgroundColor: theme.palette.grey[100],
    opacity: 0.7,
  },
  closedDayContent: {
    padding: theme.spacing(3),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
  buttonContainer: {
    textAlign: "right",
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.grey[50],
  },
  helpText: {
    fontSize: "0.8rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    fontStyle: "italic",
  },
  previewCard: {
    backgroundColor: theme.palette.info.light + "10",
    border: `1px solid ${theme.palette.info.light}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  previewTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    color: theme.palette.info.main,
  },
  previewContent: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
}));

function SchedulesForm(props) {
  const { initialValues, onSubmit, loading, labelSaveButton } = props;
  const classes = useStyles();

  const [schedules, setSchedules] = useState([
    { weekday: i18n.t("queueModal.serviceHours.monday"), weekdayEn: "monday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", isOpen: true },
    { weekday: i18n.t("queueModal.serviceHours.tuesday"), weekdayEn: "tuesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", isOpen: true },
    { weekday: i18n.t("queueModal.serviceHours.wednesday"), weekdayEn: "wednesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", isOpen: true },
    { weekday: i18n.t("queueModal.serviceHours.thursday"), weekdayEn: "thursday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", isOpen: true },
    { weekday: i18n.t("queueModal.serviceHours.friday"), weekdayEn: "friday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", isOpen: true },
    { weekday: i18n.t("queueModal.serviceHours.saturday"), weekdayEn: "saturday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", isOpen: true },
    { weekday: i18n.t("queueModal.serviceHours.sunday"), weekdayEn: "sunday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", isOpen: true },
  ]);

  useEffect(() => {
    if (isArray(initialValues) && initialValues.length > 0) {
      const schedulesWithStatus = initialValues.map(schedule => ({
        ...schedule,
        isOpen: !!(schedule.startTimeA || schedule.startTimeB)
      }));
      setSchedules(schedulesWithStatus);
    }
  }, [initialValues]);

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  const isDayOpen = (schedule) => {
    return !!(schedule.startTimeA || schedule.startTimeB);
  };

  const getDayStatus = (schedule) => {
    if (!isDayOpen(schedule)) {
      return { status: "closed", label: "Fechado", color: "default", icon: <Warning /> };
    }
    
    const hasIntervalA = schedule.startTimeA && schedule.endTimeA;
    const hasIntervalB = schedule.startTimeB && schedule.endTimeB;
    
    if (hasIntervalA && hasIntervalB) {
      return { status: "double", label: "Dois Períodos", color: "primary", icon: <CheckCircle /> };
    } else if (hasIntervalA || hasIntervalB) {
      return { status: "single", label: "Um Período", color: "secondary", icon: <CheckCircle /> };
    }
    
    return { status: "incomplete", label: "Incompleto", color: "default", icon: <Warning /> };
  };

  const getDayIcon = (weekdayEn) => {
    const icons = {
      monday: "1️⃣",
      tuesday: "2️⃣", 
      wednesday: "3️⃣",
      thursday: "4️⃣",
      friday: "5️⃣",
      saturday: "6️⃣",
      sunday: "7️⃣"
    };
    return icons[weekdayEn] || "📅";
  };

  return (
    <Formik
      enableReinitialize
      className={classes.fullWidth}
      initialValues={{ schedules }}
      onSubmit={({ schedules }) =>
        setTimeout(() => {
          handleSubmit(schedules);
        }, 500)
      }
    >
      {({ values, setFieldValue }) => (
        <Form className={classes.fullWidth}>
          <FieldArray
            name="schedules"
            render={(arrayHelpers) => (
              <Grid container spacing={2}>
                {values.schedules.map((item, index) => {
                  const dayStatus = getDayStatus(item);
                  const isOpen = isDayOpen(item);
                  
                  return (
                    <Grid key={index} xs={12} md={6} lg={4} item>
                      <Card className={`${classes.dayCard} ${!isOpen ? classes.closedDay : ""}`}>
                        <div className={classes.dayCardHeader}>
                          <Typography className={classes.dayTitle}>
                            <span style={{ fontSize: "1.2rem" }}>
                              {getDayIcon(item.weekdayEn)}
                            </span>
                            {item.weekday}
                          </Typography>
                          <div className={classes.dayStatus}>
                            <Chip
                              label={dayStatus.label}
                              color={dayStatus.color}
                              size="small"
                              icon={dayStatus.icon}
                            />
                          </div>
                        </div>
                        
                        <div className={classes.dayCardContent}>
                          {isOpen ? (
                            <>
                              {/* Primeiro Período */}
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                <AccessTime /> Primeiro Período
                              </Typography>
                              <Grid container spacing={1} className={classes.timeGrid}>
                                <Grid item xs={6}>
                          <FastField
                                    label="Início"
                            name={`schedules[${index}].startTimeA`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                        size="small"
                                customInput={TextField}
                                format="##:##"
                                        className={`${classes.fullWidth} ${classes.timeField}`}
                                        label="Início"
                                        placeholder="08:00"
                              />
                            )}
                          </FastField>
                        </Grid>
                                <Grid item xs={6}>
                          <FastField
                                    label="Fim"
                            name={`schedules[${index}].endTimeA`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                        size="small"
                                customInput={TextField}
                                format="##:##"
                                        className={`${classes.fullWidth} ${classes.timeField}`}
                                        label="Fim"
                                        placeholder="12:00"
                              />
                            )}
                          </FastField>
                        </Grid>
                              </Grid>

                              {/* Segundo Período */}
                              <div className={classes.intervalDivider}>
                                <Divider style={{ flex: 1 }} />
                                <Typography className={classes.intervalLabel}>
                                  Segundo Período (Opcional)
                                </Typography>
                                <Divider style={{ flex: 1 }} />
                              </div>
                              
                              <Grid container spacing={1} className={classes.timeGrid}>
                                <Grid item xs={6}>
                          <FastField
                                    label="Início"
                            name={`schedules[${index}].startTimeB`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                        size="small"
                                customInput={TextField}
                                format="##:##"
                                        className={`${classes.fullWidth} ${classes.timeField}`}
                                        label="Início"
                                        placeholder="13:00"
                              />
                            )}
                          </FastField>
                        </Grid>
                                <Grid item xs={6}>
                          <FastField
                                    label="Fim"
                            name={`schedules[${index}].endTimeB`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                        size="small"
                                customInput={TextField}
                                format="##:##"
                                        className={`${classes.fullWidth} ${classes.timeField}`}
                                        label="Fim"
                                        placeholder="18:00"
                              />
                            )}
                          </FastField>
                        </Grid>
                      </Grid>
                            </>
                          ) : (
                            <div className={classes.closedDayContent}>
                              <Typography variant="body2">
                                <Warning /> Dia fechado
                              </Typography>
                              <Typography variant="caption">
                                Preencha os horários para abrir este dia
                              </Typography>
                            </div>
                          )}
                        </div>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          />
          
          {/* Preview dos Horários */}
          <Paper className={classes.previewCard}>
            <Typography className={classes.previewTitle}>
              <Info /> Resumo dos Horários
            </Typography>
            <div className={classes.previewContent}>
              {values.schedules.map((schedule, index) => {
                const isOpen = isDayOpen(schedule);
                return (
                  <div key={index} style={{ marginBottom: "4px" }}>
                    <strong>{schedule.weekday}:</strong>{" "}
                    {isOpen ? (
                      <>
                        {schedule.startTimeA && schedule.endTimeA && (
                          <span>{schedule.startTimeA} - {schedule.endTimeA}</span>
                        )}
                        {schedule.startTimeB && schedule.endTimeB && (
                          <span>
                            {schedule.startTimeA && schedule.endTimeA && " | "}
                            {schedule.startTimeB} - {schedule.endTimeB}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "red" }}>Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Paper>

          <div className={classes.buttonContainer}>
            <Typography className={classes.helpText}>
              💡 Dica: Deixe os campos vazios para marcar o dia como fechado. 
              Você pode configurar até dois períodos por dia (ex: manhã e tarde).
            </Typography>
            <ButtonWithSpinner
              loading={loading}
              type="submit"
              color="primary"
              variant="contained"
            >
              {labelSaveButton ?? i18n.t("whatsappModal.buttons.okEdit")}
            </ButtonWithSpinner>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default SchedulesForm;
