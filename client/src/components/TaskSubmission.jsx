import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useWebSocket } from '../hooks/useWebSocket';

const TaskSubmission = ({ projectId, taskId, task, onClose }) => {
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const ws = useWebSocket();

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleSubmit = async () => {
    try {
      if (!ws) {
        setError('WebSocket connection not available');
        return;
      }

      // Upload files first
      const uploadedFiles = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (!response.ok) {
          throw new Error(`Failed to upload file: ${file.name}`);
        }
        const result = await response.json();
        uploadedFiles.push({
          name: file.name,
          path: result.path
        });
      }

      // Submit task
      ws.send(JSON.stringify({
        type: 'SUBMIT_TASK',
        projectId,
        taskId,
        comment,
        files: uploadedFiles
      }));

      onClose();
    } catch (err) {
      console.error('Error submitting task:', err);
      setError(err.message || 'Failed to submit task. Please try again.');
    }
  };

  const handleReview = (submissionId, status, reviewComment) => {
    try {
      if (!ws) {
        setError('WebSocket connection not available');
        return;
      }
      setError('');
      ws.send(JSON.stringify({
        type: 'REVIEW_TASK',
        projectId,
        taskId,
        submissionId,
        status,
        comment: reviewComment
      }));
    } catch (err) {
      console.error('Error reviewing task:', err);
      setError('Failed to submit review. Please try again.');
    }
  }; // Added missing closing brace here

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {task.status === 'Under Review' ? 'Review Task' : 'Submit Task'}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {task.status !== 'Under Review' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Submission Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mb: 2 }}
            />
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="task-files"
            />
            <label htmlFor="task-files">
              <Button variant="outlined" component="span">
                Attach Files
              </Button>
            </label>
            {files.length > 0 && (
              <List dense>
                {files.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={file.name} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {task.submissions?.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Submission History
            </Typography>
            <List>
              {task.submissions.map((submission, index) => (
                <React.Fragment key={submission._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography>
                          Submitted by {submission.submittedBy.name} on{' '}
                          {new Date(submission.submittedAt).toLocaleString()}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography component="span" variant="body2">
                            {submission.comment}
                          </Typography>
                          {submission.files.length > 0 && (
                            <List dense>
                              {submission.files.map((file, fileIndex) => (
                                <ListItem key={fileIndex}>
                                  <ListItemText
                                    primary={file.name}
                                    secondary={
                                      <Button
                                        href={file.path}
                                        target="_blank"
                                        size="small"
                                      >
                                        Download
                                      </Button>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          )}
                          {submission.reviewStatus && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Review Status: {submission.reviewStatus}
                              </Typography>
                              {submission.reviewComment && (
                                <Typography variant="body2" color="text.secondary">
                                  {submission.reviewComment}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < task.submissions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {task.status !== 'Under Review' && (
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit
          </Button>
        )}
        {task.status === 'Under Review' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() =>
                handleReview(
                  task.submissions[task.submissions.length - 1]._id,
                  'Needs Revision',
                  'Please make the requested changes.'
                )
              }
              variant="outlined"
              color="warning"
            >
              Request Changes
            </Button>
            <Button
              onClick={() =>
                handleReview(
                  task.submissions[task.submissions.length - 1]._id,
                  'Approved',
                  'Task approved.'
                )
              }
              variant="contained"
              color="success"
            >
              Approve
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TaskSubmission;