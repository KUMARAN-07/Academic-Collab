import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  Button,
  IconButton,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';
import axiosInstance from '../api/axios';

const TaskWorkspace = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const response = await axiosInstance.get(`/projects/${projectId}/tasks/${taskId}`);
        setTask(response.data);
      } catch (err) {
        console.error('Error fetching task:', err);
        setError(err.message || 'Failed to load task');
        if (err.response?.status === 404) {
          navigate(`/projects/${projectId}`);
        }
      }
    };

    fetchTaskDetails();
  }, [projectId, taskId, navigate]);

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ mt: 2 }}>
          Back to Project
        </Button>
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {task.name}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Task Details
        </Typography>
        <Typography variant="body1" paragraph>
          {task.description}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={`Status: ${task.status}`} color="primary" variant="outlined" />
          <Chip label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`} variant="outlined" />
          <Chip label={`Assignee: ${task.assignee?.name || 'Unassigned'}`} variant="outlined" />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Workspace
            </Typography>
            {/* Add code editor, file viewer, or other workspace components here */}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Activity
            </Typography>
            {/* Add activity feed, comments, or other collaboration features here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskWorkspace;