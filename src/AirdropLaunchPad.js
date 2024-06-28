import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Switch, FormControlLabel, Container } from '@mui/material';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import ChainInfo from './constantine.config.js';
import * as XLSX from 'xlsx';



const AirdropLaunchpad = ({ signer }) => {
    const [recipients, setRecipients] = useState([]);
    const [tokenAmount, setTokenAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isArchID, setIsArchID] = useState(false);
    const [manualRecipients, setManualRecipients] = useState('');
    const [fileName, setFileName] = useState('');

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const recipients = parsedData.flat().map(addr => addr.toString().trim());
                setRecipients(recipients);
                setFileName(file.name);
            };
            reader.readAsBinaryString(file);
        }
    };
    const REGISTRY_CONTRACT = 'archway1lr8rstt40s697hqpedv2nvt27f4cuccqwvly9gnvuszxmcevrlns60xw4r'; // Replace with actual contract address

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

            // Add manual recipients if any
            if (manualRecipients.trim()) {
                const manualList = manualRecipients.split(',').map(addr => addr.trim());
                recipientList = [...recipientList, ...manualList];
            }

            // Check the balance of the token owner
            const balanceQuery = {
                balance: {
                    address: accountAddress
                }
            };

            const response = await client.queryContractSmart(tokenAddress, balanceQuery);
            const balance = response.balance;

                            console.log(`Token balance of the owner address (${accountAddress}): ${balance}`);

            if (parseInt(balance) < parseInt(tokenAmount) * recipientList.length) {
                setFeedback('Account does not have enough funds. Please fund your account.');
                return;
            }

            const messages = recipientList.map(recipient => ({
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: accountAddress,
                    toAddress: recipient,
                    amount: [{ denom: tokenAddress, amount: tokenAmount.toString() }],
                },
            }));

            const fee = {
                amount: [],
                gas: 'auto',
            };

            const result = await client.signAndBroadcast(accountAddress, messages, fee);
            console.log(result);
            setFeedback('Airdrop executed successfully!');
        } catch (error) {
            console.error("Failed to execute airdrop", error);
            setFeedback(`Failed to execute airdrop: ${error.message}`);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper sx={{ p: 4, mt: 4, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom>Airdrop LaunchPad</Typography>
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
                   
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Manual Recipients"
                        helperText="Enter addresses or .arch names separated by commas"
                        value={manualRecipients}
                        onChange={(e) => setManualRecipients(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label={fileName ? `Uploaded file: ${fileName}` : "(Optional) Upload Recipients CSV/Excel"}
                        InputLabelProps={{ shrink: true }}
                        type="file"
                        inputProps={{ accept: ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" }}
                        onChange={handleFileUpload}
                        sx={{ mt: 2 }}
                    />

                    <FormControlLabel
                        control={<Switch checked={isArchID} onChange={(e) => setIsArchID(e.target.checked)} />}
                        label="Toggle ON for .arch recipients"
                        sx={{ mt: 2 }}
                    />
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
