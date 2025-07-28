import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Typography,
  InputAdornment,
} from '@material-ui/core';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flex: 1,
    height: 'calc(100vh - 78px)',
    padding: theme.spacing(2),
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    maxWidth: '400px',
    '& .MuiOutlinedInput-root': {
      borderRadius: 8,
    },
  },
  addButton: {
    backgroundColor: '#25b6e8',
    color: '#FFFFFF',
    borderRadius: '8px',
    padding: '8px 24px',
    '&:hover': {
      backgroundColor: '#1e9ac4',
    },
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(0),
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    overflowY: 'auto',
    flex: 1,
  },
  listItem: {
    borderRadius: 8,
    marginBottom: theme.spacing(1),
    '&:hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  taskText: {
    '& .MuiTypography-root': {
      fontWeight: 500,
      color: '#333',
    },
    '& .MuiTypography-body2': {
      color: '#666',
      fontSize: '0.75rem',
    },
  },
  iconButton: {
    padding: theme.spacing(1),
    marginLeft: theme.spacing(1),
    '&.edit': {
      color: '#25b6e8',
      backgroundColor: '#f5f5f5',
    },
    '&.delete': {
      color: '#E57373',
      backgroundColor: '#f5f5f5',
    },
  },
}));

const ToDoList = () => {
  const classes = useStyles();
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleTaskChange = (event) => {
    setTask(event.target.value);
  };

  const handleAddTask = () => {
    if (!task.trim()) return;

    const now = new Date();
    if (editIndex >= 0) {
      const newTasks = [...tasks];
      newTasks[editIndex] = {
        text: task,
        updatedAt: now,
        createdAt: newTasks[editIndex].createdAt
      };
      setTasks(newTasks);
      setTask('');
      setEditIndex(-1);
    } else {
      setTasks([...tasks, { text: task, createdAt: now, updatedAt: now }]);
      setTask('');
    }
  };

  const handleEditTask = (index) => {
    setTask(tasks[index].text);
    setEditIndex(index);
  };

  const handleDeleteTask = (index) => {
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  };

  return (
    <Paper className={classes.mainContainer}>
      <div className={classes.header}>
        <TextField
          className={classes.input}
          placeholder="Nova tarefa"
          value={task}
          onChange={handleTaskChange}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          className={classes.addButton}
          onClick={handleAddTask}
          startIcon={editIndex >= 0 ? <EditIcon /> : <AddIcon />}
        >
          {editIndex >= 0 ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>

      <div className={classes.listContainer}>
        <List>
          {tasks.map((task, index) => (
            <ListItem key={index} className={classes.listItem}>
              <ListItemText
                className={classes.taskText}
                primary={task.text}
                secondary={task.updatedAt.toLocaleString()}
              />
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => handleEditTask(index)}
                  className={`${classes.iconButton} edit`}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteTask(index)}
                  className={`${classes.iconButton} delete`}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </div>
    </Paper>
  );
};

export default ToDoList;