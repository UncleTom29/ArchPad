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

            // Check if the account has enough funds
            const balance = await client.getBalance(accountAddress, 'aconst');
            if (balance.amount === '0') {
                setFeedback('Account does not have enough funds. Please fund your account.');
                return;
            }

            // CW20 contract code_id obtained from previous upload
            const codeId = 1; // Replace with your actual code_id

            const initMsg = {
                name: tokenName,
                symbol: tokenSymbol,
                decimals: 18,
                initial_balances: [{
                    address: accountAddress,
                    amount: tokenSupply
                }]
            };

            // Estimate the gas fee
            const feeEstimate = await client.simulate(accountAddress, [{
                typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
                value: {
                    sender: accountAddress,
                    code_id: codeId,
                    init_msg: initMsg,
                    label: `Init ${tokenName}`
                }
            }], "");
            const gasLimit = feeEstimate.gas_info.gas_used;
            const gasPrice = 0.025; // Assuming gas price is 0.025 aconst per gas unit
            const fee = {
                amount: [{ denom: "aconst", amount: (gasLimit * gasPrice).toFixed(0).toString() }],
                gas: gasLimit.toString(),
            };

            const result = await client.signAndBroadcast(accountAddress, [{
                typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
                value: {
                    sender: accountAddress,
                    code_id: codeId,
                    init_msg: initMsg,
                    label: `Init ${tokenName}`
                }
            }], fee);

            if (result.code === 0) {
                setFeedback('Token created successfully!');
            } else {
                setFeedback(`Failed to create token: ${result.log || result.rawLog}`);
            }
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
