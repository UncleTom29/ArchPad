import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { coins } from '@cosmjs/stargate';

const AirdropLaunchpad = ({ signer }) => {
    const [recipients, setRecipients] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState('');
    const [feedback, setFeedback] = useState('');

    const executeAirdrop = async () => {
        try {
            const client = await SigningArchwayClient.connectWithSigner("https://rpc.mainnet.archway.io", signer);

            const accounts = await signer.getAccounts();
            const accountAddress = accounts[0].address;

            // Check if the account has enough funds
            const balance = await client.getBalance(accountAddress, tokenAddress);
            if (parseInt(balance.amount) < parseInt(tokenAmount) * recipients.split(',').length) {
                setFeedback('Account does not have enough funds. Please fund your account.');
                return;
            }

            const recipientList = recipients.split(',').map(addr => addr.trim());
            const messages = recipientList.map(recipient => ({
                type: "cosmos-sdk/MsgSend",
                value: {
                    from_address: accountAddress,
                    to_address: recipient,
                    amount: coins(tokenAmount, tokenAddress),
                },
            }));

            // Estimate the gas fee
            const feeEstimate = await client.simulate(accountAddress, messages, "");
            const gasLimit = feeEstimate.gas_used;
            const gasPrice = 0.025; // Assuming gas price is 0.025 uarch per gas unit
            const fee = {
                amount: coins(gasLimit * gasPrice, "uarch"),
                gas: gasLimit.toString(),
            };

            const result = await client.signAndBroadcast(accountAddress, messages, fee);
            console.log(result);
            setFeedback('Airdrop executed successfully!');
        } catch (error) {
            console.error("Failed to execute airdrop", error);
            setFeedback('Failed to execute airdrop.');
        }
    };

    return (
        <Paper sx={{ p: 4, mt: 4, mx: 'auto', maxWidth: 500 }}>
            <Typography variant="h5" gutterBottom>Launch Airdrop</Typography>
            <Box component="form" noValidate autoComplete="off">
                <TextField
                    fullWidth
                    margin="normal"
                    label="Recipient Addresses (comma separated)"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Token Amount per Recipient"
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Token Address"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={executeAirdrop}
                    sx={{ mt: 2 }}
                >
                    Execute Airdrop
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

export default AirdropLaunchpad;