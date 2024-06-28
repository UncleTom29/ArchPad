import React, { useState } from 'react';
import { Container, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import ConnectWallet from './ConnectWallet';
import TokenFactory from './TokenFactory';
import AirdropLaunchpad from './AirdropLaunchPad';
import theme from './theme';
import ArchID from './ArchID';

function App() {
    const [signer, setSigner] = useState(null);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container>
                <Typography variant="h3" gutterBottom align="center" sx={{ mt: 4 }}>
                    ArchPad
                </Typography>
                <ConnectWallet setSigner={setSigner} />
                {signer && (
                    <>
                        <TokenFactory signer={signer} />
                        <AirdropLaunchpad signer={signer} />
                        <ArchID signer={signer} />
                       
                    </>
                )}
            </Container>
        </ThemeProvider>
    );
}

export default App;
