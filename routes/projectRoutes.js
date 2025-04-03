const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authController = require('../controllers/authController');

// Protect all routes after this middleware
router.use(authController.protect);

// Project routes
router.post('/', projectController.createProject);
router.get('/', projectController.getUserProjects);
router.get('/:projectId', projectController.getProject);
router.patch('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

// Project member management
router.post('/:projectId/invite', projectController.inviteMember);
router.post('/accept-invitation/:token', projectController.acceptInvitation);

// Task management
router.post('/:projectId/tasks', projectController.createTask);
router.patch('/:projectId/tasks/:taskId', projectController.updateTask);
router.delete('/:projectId/tasks/:taskId', projectController.deleteTask);

// Project chat
router.post('/:projectId/messages', projectController.addMessage);

module.exports = router;