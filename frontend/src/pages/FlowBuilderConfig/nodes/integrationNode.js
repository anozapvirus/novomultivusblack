import React, { memo } from "react";
import { Handle } from "react-flow-renderer";
import { Typography, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ArrowForwardIos, Api } from "@mui/icons-material";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WebhookIcon from '@mui/icons-material/Webhook';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MemoryIcon from '@mui/icons-material/Memory';

const useStyles = makeStyles(theme => ({
  nodeContainer: {
    background: "white",
    border: "1px solid #1e88e5",
    borderRadius: 10,
    padding: "10px 10px",
    width: 300,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    position: "relative"
  },
  nodeHeader: {
    background: "#1e88e5",
    color: "white",
    padding: "8px 10px",
    borderRadius: "8px 8px 0 0",
    marginBottom: 5,
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  nodeName: {
    fontSize: 14,
    fontWeight: "bold"
  },
  nodeInfo: {
    fontSize: 12,
    marginTop: 5
  },
  integrationType: {
    fontSize: 12,
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
    color: "#555"
  },
  node: {
    padding: "10px 20px",
    borderRadius: "15px",
    border: "1px solid #eee",
    fontSize: "12px",
    color: "#222",
    backgroundColor: "#fff",
    width: 180,
    boxShadow: "5px 5px 10px 2px rgba(0,0,0,.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  icon: {
    color: "#1E88E5",
    fontSize: "22px"
  },
  content: {
    wordBreak: "break-word",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#000"
  }
}));

const getIntegrationIcon = (type) => {
  switch (type) {
    case "webhook":
      return <WebhookIcon fontSize="small" />;
    case "gemini":
      return <AutoFixHighIcon fontSize="small" />;
    case "dialogflow":
    case "typebot":
      return <SmartToyIcon fontSize="small" />;
    case "flowbuilder":
      return <MemoryIcon fontSize="small" />;
    default:
      return <WebhookIcon fontSize="small" />;
  }
};

export default memo(({ data, isConnectable, id }) => {
  const classes = useStyles();
  
  const integrationName = data.name || "Integração";
  const integrationType = data.type || "webhook";
  const description = data.description || "Enviar mensagens para sistema externo";

  return (
    <div className={classes.nodeContainer}>
      <Handle
        type="target"
        position="left"
        id="a"
        style={{
          background: "#111416",
          width: "18px",
          height: "18px",
          left: "-11px",
          top: 40,
          cursor: 'pointer'
        }}
        isConnectable={isConnectable}
      />
      
      <div className={classes.nodeHeader}>
        {getIntegrationIcon(integrationType)}
        <Typography className={classes.nodeName}>Integração: {integrationName}</Typography>
      </div>
      
      <Box>
        <div className={classes.integrationType}>
          {getIntegrationIcon(integrationType)} {integrationType.toUpperCase()}
        </div>
        <Typography className={classes.nodeInfo}>
          {description}
        </Typography>
        {data.webhookUrl && (
          <Typography className={classes.nodeInfo} style={{ wordBreak: "break-all" }}>
            URL: {data.webhookUrl}
          </Typography>
        )}
      </Box>
      
      <Handle
        type="source"
        position="right"
        id="b"
        style={{
          background: "#111416",
          width: "18px",
          height: "18px",
          right: "-11px",
          top: 40,
          cursor: 'pointer'
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "10px",
            height: "10px",
            marginLeft: "2.9px",
            marginBottom: "1px",
            pointerEvents: "none"
          }}
        />
      </Handle>
    </div>
  );
});
