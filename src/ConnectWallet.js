import React, { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Box } from '@mui/material';
import ChainInfo from './constantine.config.js';

const ConnectWallet = ({ setSigner }) => {
    const [account, setAccount] = useState(null);

    const connectWallet = useCallback(async () => {
        if (!window.getOfflineSignerAuto || !window.keplr) {
            alert("Please install Keplr extension");
            return;
        }

        if (window.keplr.experimentalSuggestChain) {
            try {
                await window.keplr.experimentalSuggestChain(ChainInfo);
                window.keplr.defaultOptions = {
                    sign: {
                        preferNoSetFee: true,
                    },
                };
            } catch (error) {
                alert("Failed to suggest the chain");
                return;
            }
        } else {
            alert("Please use the recent version of Keplr extension");
            return;
        }

        try {
            const chainId = ChainInfo.chainId;
            await window.keplr.enable(chainId);
            const offlineSigner = window.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            setAccount(accounts[0].address);
            setSigner(offlineSigner);
        } catch (error) {
            console.error("Failed to connect wallet", error);
        }
    }, [setSigner]);

    useEffect(() => {
        if (window.keplr) {
            window.addEventListener("keplr_keystorechange", connectWallet);
            return () => {
                window.removeEventListener("keplr_keystorechange", connectWallet);
            };
        }
    }, [connectWallet]);

    return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
            {account ? (
                <Typography variant="h6">Connected: {account}</Typography>
            ) : (
                <Button variant="contained" color="primary" onClick={connectWallet}>
                    Connect Wallet
                </Button>
            )}
        </Box>
    );
};

export default ConnectWallet;
