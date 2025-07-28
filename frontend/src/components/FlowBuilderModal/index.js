import React, { useState, useEffect, useRef } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";

import {
	Button,
	TextField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	CircularProgress,
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	dialog: {
		"& .MuiDialog-paper": {
			borderRadius: theme.spacing(1),
		},
	},
	dialogTitle: {
		background: "white",
		padding: theme.spacing(2),
		"& h2": {
			color: "#333",
			fontSize: "1.2rem",
			fontWeight: 500,
		},
	},
	dialogContent: {
		padding: theme.spacing(2),
		background: "white",
	},
	dialogActions: {
		padding: theme.spacing(1.5),
		background: "white",
	},
	textField: {
		marginTop: theme.spacing(1),
		marginBottom: theme.spacing(1),
		width: "100%",
		"& .MuiOutlinedInput-root": {
			borderRadius: 8,
			"&:hover .MuiOutlinedInput-notchedOutline": {
				borderColor: "#25b6e8",
			},
		},
		"& .Mui-focused .MuiOutlinedInput-notchedOutline": {
			borderColor: "#25b6e8",
		},
		"& .MuiFormLabel-root.Mui-focused": {
			color: "#25b6e8",
		},
	},
	btnWrapper: {
		position: "relative",
	},
	buttonProgress: {
		color: "#25b6e8",
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
	saveButton: {
		backgroundColor: "#25b6e8",
		color: "white",
		"&:hover": {
			backgroundColor: "#1e9ac4",
		},
	},
	cancelButton: {
		color: "#333",
		borderColor: "#333",
		"&:hover": {
			borderColor: "#333",
			backgroundColor: "rgba(51, 51, 51, 0.05)",
		},
	},
}));

const ContactSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Muito curto!")
		.max(50, "Muito longo!")
		.required("Digite um nome!").nullable(true)
});

const FlowBuilderModal = ({ open, onClose, flowId, nameWebhook = "", onSave }) => {
	const classes = useStyles();
	const isMounted = useRef(true);

	const [contact, setContact] = useState({
		name: nameWebhook,
	});

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	const handleClose = () => {
		onClose();
		setContact({
			name: "",
		});
	};

	const handleSaveContact = async values => {
		if (flowId) {
			try {
				await api.put("/flowbuilder", {
					name: values.name,
					flowId
				});
				onSave(values.name)
				handleClose()
				toast.success(i18n.t("webhookModal.toasts.update"));
			} catch (err) {
				toastError(err);
			}
		} else {
			try {
				await api.post("/flowbuilder", {
					name: values.name,
				});
				onSave(values.name)
				handleClose()
				toast.success(i18n.t("webhookModal.saveSuccess"));
			} catch (err) {
				toastError(err);
			}
		}
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="sm"
				fullWidth
				className={classes.dialog}
			>
				<DialogTitle className={classes.dialogTitle}>
					{flowId ? "Editar Fluxo" : "Adicionar Fluxo"}
				</DialogTitle>
				<Formik
					initialValues={contact}
					enableReinitialize={true}
					validationSchema={ContactSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveContact(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ errors, isSubmitting }) => (
						<Form>
							<DialogContent className={classes.dialogContent}>
								<Field
									as={TextField}
									label={i18n.t("contactModal.form.name")}
									name="name"
									autoFocus
									variant="outlined"
									error={Boolean(errors.name)}
									helperText={errors.name}
									className={classes.textField}
									fullWidth
								/>
							</DialogContent>
							<DialogActions className={classes.dialogActions}>
								<Button
									onClick={handleClose}
									variant="outlined"
									disabled={isSubmitting}
									className={classes.cancelButton}
								>
									{i18n.t("contactModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={isSubmitting}
									className={classes.saveButton}
								>
									{flowId
										? i18n.t("contactModal.buttons.okEdit")
										: i18n.t("contactModal.buttons.okAdd")}
									{isSubmitting && (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									)}
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div>
	);
};

export default FlowBuilderModal;