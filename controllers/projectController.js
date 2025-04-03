const Project = require('../models/Project');
const User = require('../models/User');
const crypto = require('crypto');

// Create new project
exports.createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Project name and description are required'
      });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    res.status(201).json({
      status: 'success',
      data: { project }
    });
  } catch (err) {
    console.error('Project creation error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    next(err);
  }
};

// Get all projects for a user
exports.getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    })
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

    // Get pending invitations for the user
    const pendingInvites = await Project.find({
      'pendingInvites.email': req.user.email
    })
    .populate('pendingInvites.sender', 'name email')
    .select('name pendingInvites');

    const invitations = pendingInvites.flatMap(project => {
      return project.pendingInvites
        .filter(invite => invite.email === req.user.email)
        .map(invite => ({
          _id: invite._id,
          token: invite.token,
          project: {
            _id: project._id,
            name: project.name
          },
          sender: invite.sender
        }));
    });

    res.status(200).json({
      status: 'success',
      data: { 
        projects,
        invitations
      }
    });
  } catch (err) {
    console.error('Error fetching user projects:', err);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching projects'
    });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('tasks.assignee', 'name email')
      .populate('pendingInvites');

    if (!project) {
      throw new Error('Project not found');
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: err.message
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      throw new Error('Only project owner can update project details');
    }

    project.name = name || project.name;
    project.description = description || project.description;
    await project.save();

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      throw new Error('Only project owner can delete the project');
    }

    // Replace deprecated project.remove() with findByIdAndDelete
    await Project.findByIdAndDelete(req.params.projectId);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Invite member to project
exports.inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      throw new Error('Only project owner can invite members');
    }

    // Check if user exists and is already a member
    const invitedUser = await User.findOne({ email });
    if (invitedUser && project.members.some(member => member.user.toString() === invitedUser._id.toString())) {
      throw new Error('User is already a member of this project');
    }

    // Create invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    // Add sender information to the invitation
    const inviteData = {
      email,
      token: inviteToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      sender: req.user._id // Ensure sender is set to the current user's ID
    };

    // Validate the invite data before pushing
    if (!inviteData.sender) {
      throw new Error('Sender is required for invitation');
    }

    // Validate the invite data before pushing
    if (!inviteData.sender) {
      throw new Error('Sender is required for invitation');
    }
    // Validate the invite data before pushing
    if (!inviteData.sender) {
      throw new Error('Sender is required for invitation');
    }
    // Validate the invite data before pushing
    if (!inviteData.sender) {
      throw new Error('Sender is required for invitation');
    }


    // Check if there's an existing pending invite for this email
   

    // Validate the invite data before pushing
    if (!inviteData.sender) {
      throw new Error('Sender is required for invitation');
    }

    // Check if the sender exists in the database
    const senderExists = await User.findById(inviteData.sender);
    if (!senderExists) {
      throw new Error('Invalid sender for invitation');
    }

    // Check if there's an existing pending invite for this email
    const existingInvite = project.pendingInvites.find(invite => invite.email === email);
    if (existingInvite) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Create pending invite with validated data
    project.pendingInvites.push(inviteData);
    
    // Save the project with proper error handling
    try {
      await project.save();
    } catch (saveErr) {
      // Handle mongoose validation errors
      if (saveErr.name === 'ValidationError') {
        throw new Error('Invalid invitation data: ' + saveErr.message);
      }
      throw saveErr;
    }

    res.status(200).json({
      status: 'success',
      message: 'Invitation sent successfully'
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Accept project invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const project = await Project.findOne({
      'pendingInvites.token': token,
      'pendingInvites.expiresAt': { $gt: Date.now() }
    });

    if (!project) {
      throw new Error('Invalid or expired invitation');
    }

    const invite = project.pendingInvites.find(inv => inv.token === token);
    if (invite.email !== req.user.email) {
      throw new Error('Invitation is not for this user');
    }

    project.members.push({
      user: req.user._id,
      role: 'member'
    });

    project.pendingInvites = project.pendingInvites.filter(
      inv => inv.token !== token
    );

    await project.save();

    res.status(200).json({
      status: 'success',
      message: 'Successfully joined the project'
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const { name, description, dueDate, assignee } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const isMember = project.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      throw new Error('Only project members can create tasks');
    }

    project.tasks.push({
      name,
      description,
      dueDate,
      assignee,
      status: 'Pending'
    });

    await project.save();

    res.status(201).json({
      status: 'success',
      data: {
        task: project.tasks[project.tasks.length - 1]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { name, description, dueDate, status, assignee } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const task = project.tasks.id(req.params.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const isMember = project.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      throw new Error('Only project members can update tasks');
    }

    task.name = name || task.name;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.status = status || task.status;
    task.assignee = assignee || task.assignee;

    await project.save();

    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const task = project.tasks.id(req.params.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const isMember = project.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      throw new Error('Only project members can delete tasks');
    }

    // Replace deprecated task.remove() with proper pull method
    project.tasks.pull({ _id: req.params.taskId });
    await project.save();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};
// Add message to project chat
exports.addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const isMember = project.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      throw new Error('Only project members can send messages');
    }

    project.messages.push({
      sender: req.user._id,
      content
    });

    await project.save();

    const message = project.messages[project.messages.length - 1];
    await message.populate('sender', 'name email');

    res.status(201).json({
      status: 'success',
      data: { message }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};