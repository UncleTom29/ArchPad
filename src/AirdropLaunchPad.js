import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Switch, FormControlLabel, Container } from '@mui/material';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import BigNumber from 'bignumber.js';
import ChainInfo from './constantine.config.js';
import { coins } from '@cosmjs/stargate';
import * as XLSX from 'xlsx';
import { resolveRecord } from './archwayClient'; // Assumed you have a resolver function

const AirdropLaunchpad = ({ signer }) => {
    const [recipients, setRecipients] = useState([]);
    const [tokenAmount, setTokenAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isArchID, setIsArchID] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const recipients = parsedData.flat().map(addr => addr.trim());
            setRecipients(recipients);
        };
        
        reader.readAsBinaryString(file);
    };

    const resolveArchIDs = async (ids) => {
        const resolvedAddresses = [];
        for (const id of ids) {
            const record = await resolveRecord(id);
            resolvedAddresses.push(record.address);
        }
        return resolvedAddresses;
    };

    const executeAirdrop = async () => {
        try {
            const client = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, signer);
            const accounts = await signer.getAccounts();
            const accountAddress = accounts[0].address;

            let recipientList = isArchID ? await resolveArchIDs(recipients) : recipients;

            // Check if the account has enough funds
            const balance = await client.getBalance(accountAddress, tokenAddress);
            if (parseInt(balance.amount) < parseInt(tokenAmount) * recipientList.length) {
                setFeedback('Account does not have enough funds. Please fund your account.');
                return;
            }

            const messages = recipientList.map(recipient => ({
                type: "cosmos-sdk/MsgSend",
                value: {
                    from_address: accountAddress,
                    to_address: recipient,
                    amount: coins(new BigNumber(tokenAmount).multipliedBy(new BigNumber('1e18')).toString(), tokenAddress),
                },
            }));

            // Estimate the gas fee
            const feeEstimate = await client.simulate(accountAddress, messages, "");
            const gasLimit = feeEstimate.gas_used;
            const gasPrice = 0.025; // Assuming gas price is 0.025 aconst per gas unit
            const fee = {
                amount: coins(gasLimit * gasPrice, "aconst"),
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
        <Container maxWidth="sm">
            <Paper sx={{ p: 4, mt: 4, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom>Launch Airdrop</Typography>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
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
                    <FormControlLabel
                        control={<Switch checked={isArchID} onChange={(e) => setIsArchID(e.target.checked)} />}
                        label="Recipients are Arch IDs"
                        sx={{ mt: 2 }}
                    />
                    <Button
                        variant="contained"
                        component="label"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Upload Recipients CSV/Excel
                        <input
                            type="file"
                            hidden
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            onChange={handleFileUpload}
                        />
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
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
        </Container>
    );
};

export default AirdropLaunchpad;
