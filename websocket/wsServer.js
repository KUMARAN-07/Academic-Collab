const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const User = require('../models/User');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.taskWorkspaces = new Map(); // Map to store task workspace connections
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from query string
        const token = new URL(req.url, 'ws://localhost').searchParams.get('token');
        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }

        // Verify token and get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
          ws.close(1008, 'User not found');
          return;
        }

        ws.userId = user._id;
        ws.userName = user.name;

        // Handle incoming messages
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            await this.handleMessage(ws, data);
          } catch (error) {
            console.error('Error handling message:', error);
          }
        });

        // Handle client disconnect
        ws.on('close', () => {
          this.handleDisconnect(ws);
        });
      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close(1008, 'Authentication failed');
      }
    });
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'JOIN_TASK_WORKSPACE':
        await this.handleJoinTaskWorkspace(ws, data);
        break;
      case 'OPEN_FILE':
        await this.handleOpenFile(ws, data);
        break;
      case 'FILE_CHANGE':
        await this.handleFileChange(ws, data);
        break;
      case 'SEND_MESSAGE':
        await this.handleChatMessage(ws, data);
        break;
      case 'SUBMIT_TASK':
        await this.handleTaskSubmission(ws, data);
        break;
      case 'REVIEW_TASK':
        await this.handleTaskReview(ws, data);
        break;
    }
  }

  async handleJoinTaskWorkspace(ws, data) {
    const { projectId, taskId } = data;
    const workspaceKey = `${projectId}-${taskId}`;

    // Add connection to workspace
    if (!this.taskWorkspaces.has(workspaceKey)) {
      this.taskWorkspaces.set(workspaceKey, new Set());
    }
    this.taskWorkspaces.get(workspaceKey).add(ws);

    // Get project and task details
    const project = await Project.findById(projectId);
    const task = project.tasks.id(taskId);

    // Update task workspace with new collaborator
    task.workspace.collaborators.push({
      user: ws.userId,
      lastActive: new Date()
    });
    await project.save();

    // Notify other collaborators
    this.broadcastToWorkspace(workspaceKey, {
      type: 'COLLABORATOR_UPDATE',
      collaborators: task.workspace.collaborators
    }, ws);
  }

  async handleOpenFile(ws, data) {
    const { projectId, taskId, filePath } = data;
    const workspaceKey = `${projectId}-${taskId}`;

    const project = await Project.findById(projectId);
    const task = project.tasks.id(taskId);

    // Update current file in workspace
    task.workspace.currentFile = filePath;
    if (!task.workspace.openFiles.includes(filePath)) {
      task.workspace.openFiles.push(filePath);
    }
    await project.save();

    // Broadcast file update to all collaborators
    this.broadcastToWorkspace(workspaceKey, {
      type: 'FILE_UPDATE',
      currentFile: filePath,
      openFiles: task.workspace.openFiles
    });
  }

  async handleFileChange(ws, data) {
    const { projectId, taskId, filePath, changes } = data;
    const workspaceKey = `${projectId}-${taskId}`;

    // Broadcast file changes to all collaborators except sender
    this.broadcastToWorkspace(workspaceKey, {
      type: 'FILE_CHANGE',
      filePath,
      changes
    }, ws);
  }

  async handleChatMessage(ws, data) {
    const { projectId, taskId, content } = data;
    const workspaceKey = `${projectId}-${taskId}`;

    const project = await Project.findById(projectId);
    const message = {
      sender: ws.userId,
      content,
      timestamp: new Date()
    };

    // Add message to project
    project.messages.push(message);
    await project.save();

    // Broadcast message to all collaborators
    this.broadcastToWorkspace(workspaceKey, {
      type: 'NEW_MESSAGE',
      message: {
        ...message,
        sender: { name: ws.userName }
      }
    });
  }

  async handleTaskSubmission(ws, data) {
    const { projectId, taskId, comment, files } = data;
    const project = await Project.findById(projectId);
    const task = project.tasks.id(taskId);

    // Add submission
    task.submissions.push({
      submittedBy: ws.userId,
      comment,
      files,
      submittedAt: new Date()
    });

    // Update task status
    task.status = 'Under Review';
    await project.save();

    // Notify collaborators
    this.broadcastToWorkspace(`${projectId}-${taskId}`, {
      type: 'TASK_SUBMITTED',
      status: task.status,
      submission: task.submissions[task.submissions.length - 1]
    });
  }

  async handleTaskReview(ws, data) {
    const { projectId, taskId, submissionId, status, comment } = data;
    const project = await Project.findById(projectId);
    const task = project.tasks.id(taskId);
    const submission = task.submissions.id(submissionId);

    // Update submission review
    submission.reviewStatus = status;
    submission.reviewComment = comment;
    submission.reviewedBy = ws.userId;
    submission.reviewedAt = new Date();

    // Update task status based on review
    task.status = status === 'Approved' ? 'Completed' : 'Needs Revision';
    await project.save();

    // Notify collaborators
    this.broadcastToWorkspace(`${projectId}-${taskId}`, {
      type: 'TASK_REVIEWED',
      status: task.status,
      submission: submission
    });
  }

  handleDisconnect(ws) {
    // Remove connection from all workspaces
    for (const [key, connections] of this.taskWorkspaces.entries()) {
      if (connections.has(ws)) {
        connections.delete(ws);
        if (connections.size === 0) {
          this.taskWorkspaces.delete(key);
        }
      }
    }
  }

  broadcastToWorkspace(workspaceKey, data, excludeWs = null) {
    const connections = this.taskWorkspaces.get(workspaceKey);
    if (connections) {
      const message = JSON.stringify(data);
      for (const client of connections) {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }
  }
}

module.exports = WebSocketServer;