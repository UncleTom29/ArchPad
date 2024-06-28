import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Grid, TextField, Typography, Paper, InputAdornment } from '@mui/material';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import ChainInfo from './constantine.config.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ArchID = ({ signer }) => {
  const [registerDomainName, setRegisterDomainName] = useState('');
  const [resolveDomainName, setResolveDomainName] = useState('');
  const [resolveAddressName, setResolveAddress] = useState('');
  const [nameResolutionResult, setNameResolutionResult] = useState({});
  const [addressResolutionResult, setAddressResolutionResult] = useState({});
  const [renewDomainName, setRenewDomainName] = useState('');
  const [renewYears, setRenewYears] = useState(1);
  const [years, setYears] = useState(1);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [renewalFee, setRenewalFee] = useState(0);

  useEffect(() => {
    calculateRegistrationFee(years);
  }, [years]);

  useEffect(() => {
    calculateRenewalFee(renewYears);
  }, [renewYears]);

  const REGISTRY_CONTRACT = 'archway1lr8rstt40s697hqpedv2nvt27f4cuccqwvly9gnvuszxmcevrlns60xw4r'; // Replace with actual contract address

  const config = async () => {
    let client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
    try {
      let entrypoint = {
        config: {}
      };
      let query = await client.queryClient.wasm.queryContractSmart(
        REGISTRY_CONTRACT,
        entrypoint
      );
      return query;
    } catch (e) {
      console.error('Error fetching config:', e);
      return { error: e };
    }
  };

  const registrationCost = async (years = 1) => {
    if (typeof years !== 'number') years = 1;
    if (years < 1) years = 1;
    if (years > 3) years = 3;
    const configData = await config();
    let base_cost = Number(configData.base_cost);
    let registration_cost = base_cost * years;
    return parseInt(registration_cost);
  };

  const calculateRegistrationFee = async (years) => {
    const fee = await registrationCost(years);
    setRegistrationFee(fee);
  };

  const calculateRenewalFee = async (years) => {
    const fee = await registrationCost(years);
    setRenewalFee(fee);
  };

  const resolveRecord = async (name = null) => {
    if (!name) return;
    let client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
    try {
      let entrypoint = {
        resolve_record: {
          name: name
        }
      };
      let query = await client.queryClient.wasm.queryContractSmart(
        REGISTRY_CONTRACT,
        entrypoint
      );
      return query;
    } catch (e) {
      return { error: e };
    }
  };

  const resolveAddress = async (address = null) => {
    if (!address) return;
    let client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
    try {
      let entrypoint = {
        resolve_address: {
          address: address
        }
      };
      let query = await client.queryClient.wasm.queryContractSmart(
        REGISTRY_CONTRACT,
        entrypoint
      );
      return query;
    } catch(e) {
      return {error: e};
    }
  };

  const handleResolveDomain = async () => {
    const domainName = `${resolveDomainName}.arch`;

    const result = await resolveRecord(domainName);
    if (result && !result.error) {
      setNameResolutionResult(result);
      toast.info('Active Domain');
    } else {
      toast.error('Domain not found or not active.');
    }
  };

  const handleResolveAddress = async () => {
    const domainAddress = resolveAddressName;

    const result = await resolveAddress(domainAddress);
    if (result && !result.error) {
      setAddressResolutionResult(result);
      toast.info('Address has an active domain name');
      
    } else {
      toast.error('Address not found.');
    }
  };

  const coin = (amount, denom) => {
    return {
      amount: amount,
      denom: denom
    };
  };

  const handleRegisterDomain = async () => {
    const domainName = `${registerDomainName}.arch`;

    toast.info('Checking if domain is already taken and still active...');

    const resolveResult = await resolveRecord(domainName);
    if (resolveResult && !resolveResult.error) {
      toast.error('Domain already taken or not available. Please choose another name.');
      return;
    }

    toast.info('Domain is still available...');
    let client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
    let accounts = await signer.getAccounts();

    toast.info('Calculating registration cost...');
    let cost = await registrationCost(years);
    let funds = [coin(String(cost), "aconst")];
    toast.info('Registration cost calculated successfully, registering domain...');
    try {
      let entrypoint = {
        register: {
          name: registerDomainName
        }
      };

      let tx = await client.execute(
        accounts[0].address,
        REGISTRY_CONTRACT,
        entrypoint,
        "auto",
        "Registering domain",
        funds
      );

      toast.success('Domain registered successfully!');
      console.log('Transaction result:', tx);

      // Clear form values after successful registration
      setRegisterDomainName('');
      setYears(1);
    } catch (e) {
      toast.error('Error registering domain. Please try again.');
      console.error('Error registering domain:', e);
    }
  };

  const renewRegistration = async (name = null, years = null) => {

    toast.info('Renewing Domain...')
    if (!name || !years) return;
    

    let client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
    let accounts = await signer.getAccounts();
    let cost = await registrationCost(years);
    let funds = [coin(String(cost), "aconst")];

    try {
      let entrypoint = {
        renew_registration: {
          name: name
        }
      };
      let tx = await client.execute(
        accounts[0].address,
        REGISTRY_CONTRACT,
        entrypoint,
        "auto",
        "Renewing domain registration",
        funds
      );
      toast.success('Domain renewed successfully!');
      console.log('Transaction result:', tx);

      // Clear form values after successful renewal
      setRenewDomainName('');
      setRenewYears(1);
    } catch (e) {
      toast.error('Error renewing domain. Please try again.');
      console.error('Error renewing domain:', e);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const formatFee = (fee) => {
    return (fee / 1e18).toFixed(2); // Convert from wei to aconst and format
  };

  return (
    <Container maxWidth="md">
      <ToastContainer />
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
              <Typography>Registration Fee: {formatFee(registrationFee)} aconst</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Renew Domain Registration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Domain"
                fullWidth
                placeholder="don't include .arch"
                value={renewDomainName}
                onChange={(e) => setRenewDomainName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Years"
                type="number"
                fullWidth
                value={renewYears}
                onChange={(e) => setRenewYears(Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={() => renewRegistration(renewDomainName, renewYears)}>
                Renew Registration
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography>Renewal Fee: {formatFee(renewalFee)} aconst</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Domain Resolver
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
                Check
              </Button>
            </Grid>
            {nameResolutionResult.address && (
              <Grid item xs={12}>
                <Typography>Domain Owner Address: {nameResolutionResult.address}</Typography>
                <Typography>Expiry Date: {formatDate(nameResolutionResult.expiration)}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Address Resolver
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                placeholder="Arch Address"
                value={resolveAddressName}
                onChange={(e) => setResolveAddress(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleResolveAddress}>
                Check
              </Button>
            </Grid>
            {addressResolutionResult.names && (
              <Grid item xs={12}>
                <Typography>Domain Names: {addressResolutionResult.names.join(', ')}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default ArchID;
