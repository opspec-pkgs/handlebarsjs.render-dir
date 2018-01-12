const msRestAzure = require('ms-rest-azure');
const AzureArmSb = require('azure-arm-sb');
const process = require('process');
const path = require('path');
const fs = require('fs');

const login = async () => {
    console.log('logging in');

    const loginType = process.env.loginType;
    const loginId = process.env.loginId;
    const loginSecret = process.env.loginSecret;

    let response;
    if (loginType === 'sp') {
        // https://github.com/Azure/azure-sdk-for-node/blob/66a255dd882762e93e5b9b92ba63ebb222962d59/runtime/ms-rest-azure/lib/login.js#L414
        response = await msRestAzure.loginWithServicePrincipalSecret(loginId, loginSecret, process.env.loginTenantId);
    } else {
        // https://github.com/Azure/azure-sdk-for-node/blob/66a255dd882762e93e5b9b92ba63ebb222962d59/runtime/ms-rest-azure/index.d.ts#L376
        response = await msRestAzure.loginWithUsernamePassword(loginId, loginSecret, {domain: process.env.loginTenantId});
    }

    console.log('login successful');

    return response;
};

const getConnString = async (credentials) => {
    console.log('getting connection string');

    const azureArmSb = new AzureArmSb(credentials, process.env.subscriptionId);

    // see https://github.com/Azure/azure-sdk-for-node/blob/master/lib/services/serviceBusManagement2/lib/operations/namespaces.js#L2771
    const result = await azureArmSb.namespaces.listKeys(
        process.env.resourceGroup,
        process.env.namespace,
        process.env.authRule
    );

    const value = result[`${process.env.authRuleKey}ConnectionString`];

    fs.writeFileSync(path.join(__dirname, 'value'), value);
};

login().then(getConnString).catch(error => {
    console.log(error);
    process.exit(1)
});
