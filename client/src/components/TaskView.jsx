import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import TaskSubmission from './TaskSubmission';

const TaskView = ({ task, onEdit, onDelete, onClose }) => {
  const [openSubmission, setOpenSubmission] = React.useState(false);

  const handleSubmissionOpen = () => {
    setOpenSubmission(true);
  };

  const handleSubmissionClose = () => {
    setOpenSubmission(false);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{task.name}</Typography>
        <Box>
          <IconButton onClick={() => onEdit(task)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDelete(task._id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Description</Typography>
            <Typography variant="body1" paragraph>
              {task.description}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>Due Date</Typography>
            <Typography variant="body1">
              {new Date(task.dueDate).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>Status</Typography>
            <Chip
              label={task.status}
              color={
                task.status === 'Completed' ? 'success' :
                task.status === 'Under Review' ? 'warning' :
                task.status === 'Needs Revision' ? 'error' : 'default'
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Assignee</Typography>
            <Typography variant="body1">
              {task.assignee?.name || 'Unassigned'}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmissionOpen}
          disabled={task.status === 'Completed'}
        >
          {task.status === 'Under Review' ? 'Review Submission' : 'Submit Task'}
        </Button>
      </DialogActions>

      {openSubmission && (
        <TaskSubmission
          projectId={task.project}
          taskId={task._id}
          task={task}
          onClose={handleSubmissionClose}
        />
      )}
    </Dialog>
  );
};

export default TaskView;