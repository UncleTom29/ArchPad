const Arch3 = require('@archwayhq/arch3.js');
const Stargate = require('@cosmjs/stargate');
const coin = Stargate.coin;

const REGISTRY_CONTRACT = "constantine1xyz...";  // Replace with actual Constantine testnet contract address
const CW721_CONTRACT = "constantine1abc...";    // Replace with actual Constantine testnet contract address

const Blockchain = {
    chainId: "constantine-1",
    chainName: "Constantine Testnet",
    rpc: "https://rpc.constantine.archway.io",
    stakeCurrency: {
        coinDenom: "CONST",
        coinMinimalDenom: "aconst",
        coinDecimals: 6,
    },
    bech32Config: {
        bech32PrefixAccAddr: "constantine",
        bech32PrefixAccPub: "constantinepub",
        bech32PrefixValAddr: "constantinevaloper",
        bech32PrefixValPub: "constantinevaloperpub",
        bech32PrefixConsAddr: "constantinevalcons",
        bech32PrefixConsPub: "constantinevalconspub"
    },
    currencies: [
        {
            coinDenom: "CONST",
            coinMinimalDenom: "aconst",
            coinDecimals: 18,
        }
    ],
    feeCurrencies: [
        {
            coinDenom: "CONST",
            coinMinimalDenom: "aconst",
            coinDecimals: 18,
            gasPriceStep: {
                low: 0,
                average: 0.1,
                high: 0.2
            }
        }
    ],
    features: ['cosmwasm']
};

async function getClient() {
    await window.keplr.experimentalSuggestChain(Blockchain);
    await window.keplr.enable(Blockchain.chainId);
    window.keplr.defaultOptions = { sign: { preferNoSetFee: true } };
    const signer = await window.getOfflineSignerAuto(Blockchain.chainId);
    const client = await Arch3.SigningArchwayClient.connectWithSigner(Blockchain.rpc, signer);
    return client;
}

async function getAccounts() {
    const signer = await window.getOfflineSignerAuto(Blockchain.chainId);
    const accounts = signer.getAccounts();
    return accounts;
}

async function config() {
    let client = await getClient();
    try {
        let entrypoint = { config: {} };
        let query = await client.queryClient.wasm.queryContractSmart(REGISTRY_CONTRACT, entrypoint);
        return query;
    } catch (e) {
        return { error: e };
    }
}

async function registrationCost(years = 1) {
    if (typeof years !== 'number') years = 1;
    if (years < 1) years = 1;
    if (years > 3) years = 3;
    const configData = await config();
    let base_cost = Number(configData.base_cost);
    let registration_cost = base_cost * years;
    return parseInt(registration_cost);
}

async function registerDomain(name, years) {
    let client = await getClient();
    let accounts = await getAccounts();
    let cost = await registrationCost(years);
    let funds = [coin(String(cost), "aconst")];
    try {
        let entrypoint = { register: { name: name } };
        let tx = await client.execute(accounts[0].address, REGISTRY_CONTRACT, entrypoint, "auto", "Registering domain", funds);
        return tx;
    } catch (e) {
        return { error: String(e) };
    }
}

async function registerSubdomain(domain, subdomain, newResolver, newOwner, mint, expiration) {
    let client = await getClient();
    let accounts = await getAccounts();
    try {
        let entrypoint = {
            register_subdomain: { domain, subdomain, new_resolver: newResolver, new_owner: newOwner, mint, expiration }
        };
        let tx = await client.execute(accounts[0].address, REGISTRY_CONTRACT, entrypoint, "auto", "Registering subdomain");
        return tx;
    } catch (e) {
        return { error: String(e) };
    }
}

async function resolveRecord(name) {
    if (!name) return;
    let client = await getClient();
    try {
        let entrypoint = { resolve_record: { name: name } };
        let query = await client.queryClient.wasm.queryContractSmart(REGISTRY_CONTRACT, entrypoint);
        return query;
    } catch (e) {
        return { error: e };
    }
}

async function tokenMetadata(tokenId) {
    if (!tokenId) return;
    let client = await getClient();
    try {
        let entrypoint = { nft_info: { token_id: tokenId } };
        let query = await client.queryClient.wasm.queryContractSmart(CW721_CONTRACT, entrypoint);
        return query;
    } catch (e) {
        return { error: e };
    }
}

async function resolveAddress(address) {
    if (!address) return;
    let client = await getClient();
    try {
        let entrypoint = { resolve_address: { address: address } };
        let query = await client.queryClient.wasm.queryContractSmart(REGISTRY_CONTRACT, entrypoint);
        return query;
    } catch (e) {
        return { error: e };
    }
}

async function updateResolver(name, newResolver) {
    if (!name || !newResolver) return;
    let client = await getClient();
    let accounts = await getAccounts();
    try {
        let entrypoint = { update_resolver: { name: name, new_resolver: newResolver } };
        let tx = await client.execute(accounts[0].address, REGISTRY_CONTRACT, entrypoint, "auto", "Updating resolver");
        return tx;
    } catch (e) {
        return { error: String(e) };
    }
}

async function updateUserDomainData(name, metadataUpdate) {
    if (!name || !metadataUpdate) return;
    let client = await getClient();
    let accounts = await getAccounts();
    try {
        let entrypoint = { update_user_domain_data: { name: name, metadata_update: metadataUpdate } };
        let tx = await client.execute(accounts[0].address, REGISTRY_CONTRACT, entrypoint, "auto", "Updating user domain data");
        return tx;
    } catch (e) {
        return { error: String(e) };
    }
}

async function renewRegistration(name, years) {
    if (!name || !years) return;
    let client = await getClient();
    let accounts = await getAccounts();
    let cost = await registrationCost(years);
    let funds = [coin(String(cost), "aconst")];
    try {
        let entrypoint = { renew_registration: { name: name } };
        let tx = await client.execute(accounts[0].address, REGISTRY_CONTRACT, entrypoint, "auto", "Renewing domain registration", funds);
        return tx;
    } catch (e) {
        console.error(e);
        return { error: String(e) };
    }
}

module.exports = {
    getClient,
    getAccounts,
    config,
    registrationCost,
    registerDomain,
    registerSubdomain,
    resolveRecord,
    tokenMetadata,
    resolveAddress,
    updateResolver,
    updateUserDomainData,
    renewRegistration
};
