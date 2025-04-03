import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import useAuthStore from '../stores/authStore';
import axios from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data?.data?.projects || []);
      setPendingInvites(response.data?.data?.invitations || []);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to fetch projects');
    }
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description
      });
    } else {
      setEditingProject(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        const response = await axios.patch(`/projects/${editingProject._id}`, formData);
        const updatedProject = response.data?.data?.project;
        if (updatedProject) {
          setProjects(projects => projects.map(p => p._id === updatedProject._id ? updatedProject : p));
        }
      } else {
        const response = await axios.post('/projects', formData);
        const newProject = response.data?.data?.project;
        if (newProject) {
          setProjects(projects => [...projects, newProject]);
        }
      }
      fetchProjects();
      handleCloseDialog();
    } catch (err) {
      setError(err?.message || 'Failed to save project');
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await axios.delete(`/projects/${projectToDelete._id}`);
      await fetchProjects();
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete project');
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Welcome, {user?.name}!
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {pendingInvites.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Pending Invitations
          </Typography>
          <Grid container spacing={2}>
            {pendingInvites.map((invite) => (
              <Grid item xs={12} sm={6} md={4} key={invite._id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Project: {invite.project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From: {invite.sender.name}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={async () => {
                        try {
                          await axios.post(`/projects/accept-invitation/${invite.token}`);
                          setSuccessMessage('Invitation accepted successfully');
                          fetchProjects();
                        } catch (err) {
                          setError(err?.response?.data?.message || 'Failed to accept invitation');
                        }
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={async () => {
                        try {
                          await axios.post(`/projects/decline-invitation/${invite.token}`);
                          setSuccessMessage('Invitation declined');
                          fetchProjects();
                        } catch (err) {
                          setError(err?.response?.data?.message || 'Failed to decline invitation');
                        }
                      }}
                    >
                      Decline
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Grid container spacing={3}>
        {projects.map(project => (
          <Grid item xs={12} sm={6} md={4} key={project._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {project.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/projects/${project._id}`)}>
                  View Tasks
                </Button>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(project)}
                  aria-label="edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(project)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'New Project'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Project Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProject ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete project "{projectToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;