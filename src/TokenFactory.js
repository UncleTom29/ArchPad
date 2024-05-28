import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { coins } from '@cosmjs/stargate';
const TokenFactory = ({ signer }) => {
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [tokenSupply, setTokenSupply] = useState('');
    const [feedback, setFeedback] = useState('');

    const createToken = async () => {
        try {
            const client = await SigningArchwayClient.connectWithSigner("https://rpc.mainnet.archway.io", signer);

            const accounts = await signer.getAccounts();
            const accountAddress = accounts[0].address;

            // Check if the account has enough funds
            const account = await client.getAccount(accountAddress);
            if (!account) {
                setFeedback('Account does not exist on chain. Send some tokens there before trying to create a token.');
                return;
            }

            const balance = await client.getBalance(accountAddress, 'uarch');
            if (balance.amount === '0') {
                setFeedback('Account does not have enough funds. Please fund your account.');
                return;
            }

            const msg = {
                type: "cosmos-sdk/MsgCreateToken",
                value: {
                    name: tokenName,
                    symbol: tokenSymbol,
                    totalSupply: tokenSupply,
                    owner: accountAddress,
                },
            };

            // Estimate the gas fee
            const feeEstimate = await client.simulate(accountAddress, [msg], "");
            const gasLimit = feeEstimate.gas_used;
            const gasPrice = 0.025; // Assuming gas price is 0.025 uarch per gas unit
            const fee = {
                amount: coins(gasLimit * gasPrice, "uarch"),
                gas: gasLimit.toString(),
            };

            const result = await client.signAndBroadcast(accountAddress, [msg], fee);
            console.log(result);
            setFeedback('Token created successfully!');
        } catch (error) {
            console.error("Failed to create token", error);
            setFeedback('Failed to create token.');
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