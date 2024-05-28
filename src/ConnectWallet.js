import React, { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Box } from '@mui/material';

const ConnectWallet = ({ setSigner }) => {
    const [account, setAccount] = useState(null);

    const suggestChain = async () => {
        await window.keplr.experimentalSuggestChain({
            chainId: "archway-1",
            chainName: "Archway",
            rpc: "https://rpc.mainnet.archway.io",
            rest: "https://rest.mainnet.archway.io",
            bip44: {
                coinType: 118,
            },
            bech32Config: {
                bech32PrefixAccAddr: "archway",
                bech32PrefixAccPub: "archwaypub",
                bech32PrefixValAddr: "archwayvaloper",
                bech32PrefixValPub: "archwayvaloperpub",
                bech32PrefixConsAddr: "archwayvalcons",
                bech32PrefixConsPub: "archwayvalconspub",
            },
            currencies: [
                {
                    coinDenom: "ARCH",
                    coinMinimalDenom: "uarch",
                    coinDecimals: 6,
                    coinGeckoId: "archway",
                },
            ],
            feeCurrencies: [
                {
                    coinDenom: "ARCH",
                    coinMinimalDenom: "uarch",
                    coinDecimals: 6,
                    coinGeckoId: "archway",
                    gasPriceStep: {
                        low: 0.01,
                        average: 0.025,
                        high: 0.04,
                    },
                },
            ],
            stakeCurrency: {
                coinDenom: "ARCH",
                coinMinimalDenom: "uarch",
                coinDecimals: 6,
                coinGeckoId: "archway",
            },
            features: ["ibc-transfer"],
        });
    };

    const connectWallet = useCallback(async () => {
        if (window.keplr) {
            try {
                await suggestChain();
                await window.keplr.enable("archway-1");
                const offlineSigner = window.getOfflineSigner("archway-1");
                const accounts = await offlineSigner.getAccounts();
                setAccount(accounts[0].address);
                setSigner(offlineSigner);
            } catch (error) {
                console.error("Failed to connect wallet", error);
            }
        } else {
            alert("Please install Keplr extension");
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
