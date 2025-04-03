import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Code as CodeIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import useAuthStore from '../stores/authStore';
import axiosInstance from '../api/axios';  // Replace the axios import with our configured instance

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    dueDate: null,
    status: 'Pending',
    assignee: ''
  });

  useEffect(() => {
    fetchProjectDetails();
    return () => {
      setProject(null);
      setTasks([]);
      setCollaborators([]);
      setSelectedTask(null);
      setError('');
    };
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const response = await axiosInstance.get(`/projects/${projectId}`);
      const { project } = response.data.data;
      setProject(project);
      setTasks(project.tasks || []);
      setCollaborators(project.members.map(member => member.user) || []);
      setPendingInvites(project.pendingInvites || []);
      setError(''); // Clear any existing errors
    } catch (err) {
      console.error('Error fetching project details:', err);
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to fetch project details');
    }
  };

  const handleOpenTaskDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        name: task.name,
        description: task.description,
        dueDate: new Date(task.dueDate),
        status: task.status,
        assignee: task.assignee?._id || ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        name: '',
        description: '',
        dueDate: null,
        status: 'Pending',
        assignee: ''
      });
    }
    setOpenTaskDialog(true);
  };

  const handleCloseTaskDialog = () => {
    setOpenTaskDialog(false);
    setEditingTask(null);
    setTaskForm({
      name: '',
      description: '',
      dueDate: null,
      status: 'Pending',
      assignee: ''
    });
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setTaskForm(prev => ({ ...prev, dueDate: date }));
  };

  const handleTaskSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      // Validate required fields
      if (!taskForm.name || !taskForm.description || !taskForm.dueDate || !taskForm.status) {
        setError('Please fill in all required fields');
        return;
      }

      if (editingTask) {
        await axiosInstance.patch(`/projects/${projectId}/tasks/${editingTask._id}`, taskForm);
      } else {
        await axiosInstance.post(`/projects/${projectId}/tasks`, taskForm);
      }
      fetchProjectDetails();
      handleCloseTaskDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}/tasks/${taskId}`);
      fetchProjectDetails();
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axiosInstance.post(`/projects/${projectId}/invite`, { email: inviteEmail });
      setInviteEmail('');
      setOpenInviteDialog(false);
      fetchProjectDetails();
      // Show success message
      setError('Invitation sent successfully');
    } catch (err) {
      console.error('Invitation error:', err);
      setError(err.response?.data?.message || 'Failed to send invitation');
      // Keep dialog open on error
    }
  };

  if (!project) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {project.name}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => setOpenInviteDialog(true)}
            sx={{ mr: 2 }}
          >
            Invite Collaborator
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTaskDialog()}
          >
            New Task
          </Button>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        {project.description}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Collaborators
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {collaborators.map(collaborator => (
            <Chip
              key={collaborator._id}
              label={collaborator.name}
              variant="outlined"
            />
          ))}
        </Stack>

        {pendingInvites.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Pending Invites
            </Typography>
            <Stack direction="row" spacing={1}>
              {pendingInvites.map((invite, index) => (
                <Chip
                  key={index}
                  label={invite.email}
                  variant="outlined"
                  color="warning"
                  onDelete={async () => {
                    try {
                      await axiosInstance.post(`/projects/accept-invitation/${invite.token}`);
                      fetchProjectDetails();
                    } catch (err) {
                      setError(err.message || 'Failed to accept invitation');
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {tasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks created yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTaskDialog()}
            sx={{ mt: 2 }}
          >
            Create First Task
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tasks.map(task => (
          <Grid item xs={12} sm={6} md={4} key={task._id}>
            <Card 
              onClick={() => {
                if (task) {
                  setSelectedTask(task);
                  setError('');
                }
              }} 
              sx={{ cursor: 'pointer', bgcolor: selectedTask?._id === task._id ? 'action.selected' : 'inherit' }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {task.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {task.description}
                </Typography>
                <Typography variant="body2">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  Status: {task.status}
                </Typography>
                <Typography variant="body2">
                  Assignee: {task.assignee?.name || 'Unassigned'}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleOpenTaskDialog(task); }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (task._id) {
                      navigate(`/projects/${projectId}/tasks/${task._id}/workspace`);
                    } else {
                      setError('Invalid task ID');
                    }
                  }}
                >
                  <CodeIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}

      <Dialog open={openTaskDialog} onClose={handleCloseTaskDialog}>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'New Task'}
        </DialogTitle>
        <DialogContent>
          <Box 
            component="form" 
            id="task-form"
            onSubmit={handleTaskSubmit} 
            sx={{ mt: 2 }}
          >
            <TextField
              fullWidth
              label="Task Name"
              name="name"
              value={taskForm.name}
              onChange={handleTaskChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Task Description"
              name="description"
              value={taskForm.description}
              onChange={handleTaskChange}
              multiline
              rows={4}
              required
              sx={{ mb: 2 }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={taskForm.dueDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: { mb: 2 }
                  }
                }}
              />
            </LocalizationProvider>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={taskForm.status}
                onChange={handleTaskChange}
                required
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                name="assignee"
                value={taskForm.assignee}
                onChange={handleTaskChange}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {collaborators.map(collaborator => (
                  <MenuItem key={collaborator._id} value={collaborator._id}>
                    {collaborator.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button type="submit" form="task-form" variant="contained">
            {editingTask ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)}>
        <DialogTitle>Invite Collaborator</DialogTitle>
        <DialogContent>
          <Box component="form" id="invite-form" onSubmit={handleInviteSubmit} sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the email address of the person you want to invite to collaborate on this project.
              If they have a verified account, they will be added directly to the project.
              Otherwise, they will receive an invitation email with instructions to join.
            </Typography>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              helperText="Please enter a valid email address"
              error={inviteEmail !== '' && !inviteEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
          <Button
            type="submit"
            form="invite-form"
            variant="contained"
            disabled={!inviteEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)}
          >
            Add Collaborator
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Project;