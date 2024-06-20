import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import ChainInfo from './constantine.config.js';

const TokenFactory = ({ signer }) => {
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [tokenSupply, setTokenSupply] = useState('');
    const [feedback, setFeedback] = useState('');

    const createToken = async () => {
        try {
            const client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
            const accounts = await signer.getAccounts();
            const accountAddress = accounts[0].address;

            // CW20 contract code_id obtained
            const codeId = 3026; // Ensure codeId is an integer

            const initMsg = {
                name: tokenName,
                symbol: tokenSymbol,
                decimals: 18,
                initial_balances: [{
                    address: accountAddress,
                    amount: tokenSupply
                }],
                mint: null, // Set to null if no minting configuration is needed
                marketing: null // Set to null if no marketing information is provided
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
