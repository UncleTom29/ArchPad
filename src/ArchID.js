import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Grid, TextField, Typography, Paper, InputAdornment } from '@mui/material';
import {
  getClient, getAccounts, config, registrationCost, registerDomain, resolveRecord, tokenMetadata, updateUserDomainData, updateResolver
} from './archwayClient';

const ArchID = () => {
  const [registerDomainName, setRegisterDomainName] = useState('');
  const [resolveDomainName, setResolveDomainName] = useState('');
  const [fetchDomainDataName, setFetchDomainDataName] = useState('');
  const [updateDomainName, setUpdateDomainName] = useState('');
  const [updateResolverDomainName, setUpdateResolverDomainName] = useState('');

  const [resolutionAddress, setResolutionAddress] = useState('');
  const [metadataUpdate, setMetadataUpdate] = useState('');
  const [nameResolutionResult, setNameResolutionResult] = useState({});
  const [domainData, setDomainData] = useState({});
  const [years, setYears] = useState(1);
  const [registrationFee, setRegistrationFee] = useState(0);

  useEffect(() => {
    const fetchConfig = async () => {
      const cost = await registrationCost(years);
      setRegistrationFee(cost);
    };
    fetchConfig();
  }, [years]);

  const handleRegisterDomain = async () => {
    try {
      const domainName = `${registerDomainName}`;
      const tx = await registerDomain(domainName, years);
      alert(`Domain registered successfully: ${tx}`);
    } catch (e) {
      alert(`Failed to register domain: ${e.message}`);
    }
  };

  const handleResolveDomain = async () => {
    try {
      const domainWithSuffix = `${resolveDomainName}.arch`;
      const result = await resolveRecord(domainWithSuffix);
      setNameResolutionResult(result);
    } catch (e) {
      alert(`Failed to resolve domain: ${e.message}`);
    }
  };

  const handleFetchDomainData = async () => {
    try {
      const domainWithSuffix = `${fetchDomainDataName}.arch`;
      const result = await tokenMetadata(domainWithSuffix);
      setDomainData(result);
    } catch (e) {
      alert(`Failed to fetch domain data: ${e.message}`);
    }
  };

  const handleUpdateDomainData = async () => {
    try {
      const domainWithSuffix = `${updateDomainName}.arch`;
      const tx = await updateUserDomainData(domainWithSuffix, JSON.parse(metadataUpdate));
      alert(`Domain data updated successfully: ${tx}`);
    } catch (e) {
      alert(`Failed to update domain data: ${e.message}`);
    }
  };

  const handleUpdateResolver = async () => {
    try {
      const domainWithSuffix = `${updateResolverDomainName}.arch`;
      const tx = await updateResolver(domainWithSuffix, resolutionAddress);
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
            <Grid item xs={12}>
              <TextField
                label="Domain"
                fullWidth
                placeholder="don't include .arch"
                value={registerDomainName}
                onChange={(e) => setRegisterDomainName(e.target.value)}
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
                placeholder="don't include .arch"
                value={resolveDomainName}
                onChange={(e) => setResolveDomainName(e.target.value)}
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
                placeholder="example.arch"
                value={fetchDomainDataName}
                onChange={(e) => setFetchDomainDataName(e.target.value)}
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
                placeholder="don't include .arch"
                value={updateDomainName}
                onChange={(e) => setUpdateDomainName(e.target.value)}
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
                placeholder="don't include .arch"
                value={updateResolverDomainName}
                onChange={(e) => setUpdateResolverDomainName(e.target.value)}
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
