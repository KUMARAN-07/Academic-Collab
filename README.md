# Academic Collaboration Platform

A real-time collaborative learning platform that enables users to create, manage, and collaborate on academic projects. The platform supports user authentication, project management, live collaboration, and real-time chat functionality.

## Features

### User Authentication
- User registration with email verification
- Secure login system
- Password reset functionality

### Project Management
- Create, edit, and delete projects
- Project dashboard with overview
- Task management system
- Real-time project updates

### Collaboration
- Invite team members via email
- Real-time collaboration on tasks
- Live coding environment
- File management system

### Real-time Communication
- Project-specific chat rooms
- File sharing in chat
- Real-time notifications

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- Socket.IO for real-time features
- JWT for authentication
- Nodemailer for email services

### Frontend (Coming Soon)
- React.js
- Socket.IO Client
- Material-UI
- React Router

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd academic-collab
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/verify-email/:token` - Verify email
- POST `/api/auth/forgot-password` - Request password reset
- PATCH `/api/auth/reset-password/:token` - Reset password

### Projects
- POST `/api/projects` - Create new project
- GET `/api/projects` - Get user's projects
- GET `/api/projects/:projectId` - Get project details
- PATCH `/api/projects/:projectId` - Update project
- DELETE `/api/projects/:projectId` - Delete project

### Project Collaboration
- POST `/api/projects/:projectId/invite` - Invite member
- POST `/api/projects/accept-invitation/:token` - Accept invitation
- POST `/api/projects/:projectId/tasks` - Create task
- PATCH `/api/projects/:projectId/tasks/:taskId` - Update task
- DELETE `/api/projects/:projectId/tasks/:taskId` - Delete task
- POST `/api/projects/:projectId/messages` - Send message

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.