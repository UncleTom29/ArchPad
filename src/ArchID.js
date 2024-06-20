import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Container, Grid, TextField, Typography, Paper, InputAdornment 
} from '@mui/material';
import {
  getClient, getAccounts, config, registrationCost, registerDomain, resolveRecord, tokenMetadata, updateUserDomainData, updateResolver
} from './archwayClient';

const ArchID = () => {
  const [domain, setDomain] = useState('');
  const [resolutionAddress, setResolutionAddress] = useState('');
  const [metadataUpdate, setMetadataUpdate] = useState('');
  const [nameResolutionResult, setNameResolutionResult] = useState({});
  const [domainData, setDomainData] = useState({});
  const [years, setYears] = useState(1);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [extendYears, setExtendYears] = useState(1);

  useEffect(() => {
    const fetchConfig = async () => {
      const cost = await registrationCost(years);
      setRegistrationFee(cost);
    };
    fetchConfig();
  }, [years]);

  const handleRegisterDomain = async () => {
    try {
      const tx = await registerDomain(domain, years);
      alert(`Domain registered successfully: ${tx}`);
    } catch (e) {
      alert(`Failed to register domain: ${e.message}`);
    }
  };

  const handleResolveDomain = async () => {
    try {
      const result = await resolveRecord(domain);
      setNameResolutionResult(result);
    } catch (e) {
      alert(`Failed to resolve domain: ${e.message}`);
    }
  };

  const handleFetchDomainData = async () => {
    try {
      const result = await tokenMetadata(domain);
      setDomainData(result);
    } catch (e) {
      alert(`Failed to fetch domain data: ${e.message}`);
    }
  };

  const handleUpdateDomainData = async () => {
    try {
      const tx = await updateUserDomainData(domain, JSON.parse(metadataUpdate));
      alert(`Domain data updated successfully: ${tx}`);
    } catch (e) {
      alert(`Failed to update domain data: ${e.message}`);
    }
  };

  const handleUpdateResolver = async () => {
    try {
      const tx = await updateResolver(domain, resolutionAddress);
      alert(`Resolver updated successfully: ${tx}`);
    } catch (e) {
      alert(`Failed to update resolver: ${e.message}`);
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          ArchID Management
        </Typography>
        
        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Register Domain
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Domain"
                fullWidth
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Years"
                type="number"
                fullWidth
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleRegisterDomain}>
                Register Domain
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography>Registration Fee: {registrationFee} aarch</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Resolve Domain
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Domain"
                fullWidth
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleResolveDomain}>
                Resolve
              </Button>
            </Grid>
            {nameResolutionResult.address && (
              <Grid item xs={12}>
                <Typography>Resolved Address: {nameResolutionResult.address}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Fetch Domain Data
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Domain"
                fullWidth
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleFetchDomainData}>
                Fetch Data
              </Button>
            </Grid>
            {domainData.metadata && (
              <Grid item xs={12}>
                <Typography>Domain Metadata: {domainData.metadata}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Update Domain Data
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Domain"
                fullWidth
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Metadata JSON"
                multiline
                rows={4}
                fullWidth
                value={metadataUpdate}
                onChange={(e) => setMetadataUpdate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleUpdateDomainData}>
                Update Data
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Update Resolver
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Domain"
                fullWidth
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="New Resolver Address"
                fullWidth
                value={resolutionAddress}
                onChange={(e) => setResolutionAddress(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleUpdateResolver}>
                Update Resolver
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default ArchID;
