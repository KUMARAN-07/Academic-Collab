import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import axios from '../api/axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`/auth/verify-email/${token}`);
        setStatus('success');
      } catch (err) {
        setError(err.response?.data?.message || 'Verification failed');
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token]);

  const handleNavigate = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      {status === 'verifying' && (
        <>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying your email...
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            Email verified successfully!
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You can now log in to your account.
          </Typography>
          <Button variant="contained" onClick={handleNavigate}>
            Go to Login
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={handleNavigate}>
            Go to Login
          </Button>
        </>
      )}
    </Box>
  );
};

export default VerifyEmail;