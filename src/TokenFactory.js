import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, FormControlLabel, Switch } from '@mui/material';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import ChainInfo from './constantine.config.js';
import BigNumber from 'bignumber.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TokenFactory = ({ signer }) => {
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [tokenSupply, setTokenSupply] = useState('');
    const [tokenDecimals, setTokenDecimals] = useState(18);
    const [isFixedSupply, setIsFixedSupply] = useState(true);
    const [marketingProject, setMarketingProject] = useState('');
    const [marketingDescription, setMarketingDescription] = useState('');
    const [marketingWebsite, setMarketingWebsite] = useState('');
    const [marketingLogo, setMarketingLogo] = useState(null);
    const [feedback, setFeedback] = useState('');

    const handleLogoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setMarketingLogo(file);
        }
    };

    const addTokenToKeplr = async (contractAddress) => {
        if (!window.keplr) {
            alert('Keplr wallet not found');
            return;
        }

        try {
            await window.keplr.suggestToken(ChainInfo.chainId, contractAddress);
            alert('Token added to Keplr wallet successfully!');
            toast.info('Token Added To Keplr Successfully')
        } catch (error) {
            console.error('Failed to add token to Keplr wallet', error);
            alert('Failed to add token to Keplr wallet');
        }
    };

   

    const createToken = async () => {
        setFeedback('Creating Token...');
        toast.info('Generating Custom CW20 Token...')
        try {
            const client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
            const accounts = await signer.getAccounts();
            const accountAddress = accounts[0].address;

            // Ensure the account address is valid
            if (!accountAddress || accountAddress.indexOf('archway1') !== 0) {
                setFeedback('Invalid account address format.');
                return;
            }

            // CW20 contract code_id obtained
            const codeId = 3026; // Ensure codeId is an integer

            // Ensure tokenSupply is correctly formatted (e.g., in terms of decimals)
            const supplyWithDecimals = new BigNumber(tokenSupply).multipliedBy(new BigNumber(`1e${tokenDecimals}`)).toFixed(0);

            const marketingInfo = (marketingProject || marketingDescription || marketingWebsite || marketingLogo) ? {
                project: marketingProject || null,
                description: marketingDescription || null,
                marketing: null,
                logo: marketingLogo ? { url: URL.createObjectURL(marketingLogo) } : null
            } : null;

            

            const initMsg = {
                name: tokenName,
                symbol: tokenSymbol,
                decimals: tokenDecimals,
                initial_balances: [{
                    address: accountAddress,
                    amount: supplyWithDecimals
                }],
                mint: isFixedSupply ? null : { minter: accountAddress, cap: null },
                marketing: marketingInfo
            };

            const instantiateContractMsg = {
                typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
                value: {
                    sender: accountAddress,
                    codeId: codeId,
                    label: `Init ${tokenName}`,
                    msg: new TextEncoder().encode(JSON.stringify(initMsg)), // Proper encoding
                    funds: []
                }
            };

            // Let the wallet set the fee automatically
            const result = await client.signAndBroadcast(accountAddress, [instantiateContractMsg], 'auto');

            if (result.code === 0) {
                const logs = JSON.parse(result.rawLog);
                const contractAddress = logs[0].events.find(e => e.type === 'instantiate').attributes.find(a => a.key === '_contract_address').value;
                setFeedback(`Token created successfully! Contract address: ${contractAddress}`);
                toast.info('Token created successfully')
               

                // Check the balance of the token owner
                const balanceQuery = {
                    balance: {
                        address: accountAddress
                    }
                };

                const response = await client.queryContractSmart(contractAddress, balanceQuery);
                const balance = response.balance;
                console.log(`Token balance of the owner address (${accountAddress}): ${balance}`);

                // Prompt user to check the token in the block explorer
                if (window.confirm('Token created successfully! Do you want to add the token to your Keplr wallet?')) {
                    addTokenToKeplr(contractAddress);
                }
            } else {
                setFeedback(`Failed to create token: ${result.rawLog}`);
            }
        } catch (error) {
            console.error("Failed to create token", error);
            setFeedback(`Failed to create token: ${error.message}`);
        }
    };

    return (
        <Paper sx={{ p: 4, mt: 4, mx: 'auto', maxWidth: 500 }}>
             <ToastContainer />
            <Typography variant="h5" gutterBottom>Create Your Token</Typography>
            <Box component="form" noValidate autoComplete="off">
                <TextField
                    fullWidth
                    margin="normal"
                    label="Token Name"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Token Symbol"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Total Supply"
                    type="number"
                    value={tokenSupply}
                    onChange={(e) => setTokenSupply(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Token Decimals (Max 18)"
                    type="number"
                    value={tokenDecimals}
                    onChange={(e) => setTokenDecimals(Math.min(18, Math.max(0, Number(e.target.value))))}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={isFixedSupply}
                            onChange={(e) => setIsFixedSupply(e.target.checked)}
                        />
                    }
                    label="Fixed Supply"
                />
                <Typography variant="h6" gutterBottom>Marketing Info (Optional)</Typography>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Project"
                    value={marketingProject}
                    onChange={(e) => setMarketingProject(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Description"
                    value={marketingDescription}
                    onChange={(e) => setMarketingDescription(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Website"
                    value={marketingWebsite}
                    onChange={(e) => setMarketingWebsite(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label={marketingLogo ? marketingLogo.name : "Click to upload logo"}
                    type="file"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleLogoUpload}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={createToken}
                    sx={{ mt: 2 }}
                >
                    Create Token
                </Button>
                {feedback && (
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        {feedback}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default TokenFactory;



  
