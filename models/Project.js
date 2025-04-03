const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Task name is required']
  },
  description: {
    type: String,
    required: [true, 'Task description is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Under Review', 'Needs Revision', 'Completed'],
    default: 'Pending'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  files: [{
    name: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  workspace: {
    currentFile: String,
    openFiles: [String],
    collaborators: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      cursor: {
        line: Number,
        column: Number
      },
      lastActive: Date
    }]
  },
  submissions: [{
    submittedAt: {
      type: Date,
      default: Date.now
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    files: [{
      name: String,
      path: String
    }],
    comment: String,
    reviewStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Needs Revision'],
      default: 'Pending'
    },
    reviewComment: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tasks: [taskSchema],
  pendingInvites: [{
    email: {
      type: String,
      required: [true, 'Email is required']
    },
    token: {
      type: String,
      required: [true, 'Token is required']
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    attachments: [{
      name: String,
      path: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;