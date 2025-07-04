import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,

    scenarios: {
        contacts: {
            executor: 'ramping-vus',
            stages: [
                { duration: '10s', target: 25 },   // ramp-up to 25 VUs
                { duration: '10s', target: 50 },   // ramp-up to 50 VUs
                { duration: '10s', target: 75 },   // ramp-up to 75 VUs
                { duration: '20s', target: 100 },  // ramp-up to 100 VUs
                { duration: '30s', target: 100 },  // hold at 100 VUs
                { duration: '10s', target: 0 },    // ramp-down to 0
              ],
            gracefulRampDown: '30s',
            gracefulStop: '30s',
        },
    },
};


export function getAuthToken() {
    const authToken = __ENV.K6_AUTH_TOKEN;
    if (!authToken) {
        throw new Error('K6_AUTH_TOKEN environment variable is not set.');
    }
    return authToken;
}

function retryPost(url, payload, headers, retries = 5) {
    let attempt = 0;
    let res;
    while (attempt < retries) {
        try {
            res = http.post(url, payload, {
                headers,
                timeout: '60s',
            });
            if (res.status === 200) return res;
            console.warn(`⚠️ Attempt ${attempt + 1} failed with status ${res.status}`);
        } catch (err) {
            console.warn(`⚠️ Attempt ${attempt + 1} failed with error: ${err.message}`);
        }
        sleep(Math.pow(2, attempt) + Math.random()); // exponential backoff + jitter
        attempt++;
    }
    throw new Error(`❌ All retry attempts failed for POST ${url}`);
}

function commonHeaders(authToken, workspaceId) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
}

function createWorkspace(authToken, workspaceName) {
    console.info(`🛠️ Creating workspace: ${workspaceName}`);
    const headers = commonHeaders(authToken, 'a51cac39-9893-493a-a492-1df612522bf0');
    const payload = JSON.stringify({
        query: `mutation CreateProject($input: CreateProjectInput!) {
            createProject(input: $input) { id name __typename }
        }`,
        variables: {
            input: { name: workspaceName, slug: workspaceName, type: "organization" }
        }
    });
    const res = retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
    return res.json('data.createProject.id');
}

function updateWorkspaceToEnterprise(authToken, workspaceId, workspaceName) {
    const headers = commonHeaders(authToken, workspaceId);
    const payload = JSON.stringify({
        query: `mutation UpdateProjectConfiguration($input: UpdateProjectConfigurationInput!) {
            updateProjectConfiguration(input: $input) { projectId features __typename }
        }`,
        variables: {
            input: { projectId: workspaceId, type: "enterprise" }
        }
    });
    try {
        retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
    } catch (err) {
        console.warn(`❌ Failed to update workspace ${workspaceName} to enterprise: ${err.message}`);
    }
}

function createTable(authToken, workspaceId, tableName, workspaceName) {
    const headers = commonHeaders(authToken, workspaceId);
    const payload = JSON.stringify({
        query: `mutation CreateTable($input: CreateTableInput!) {
            createTable(input: $input) { id name __typename }
        }`,
        variables: {
            input: {
                clientId: workspaceId,
                name: tableName,
                schema: { fields: [{ name: "title", type: "string" }] }
            }
        }
    });
    retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
}

function addRecords(authToken, workspaceId, tableName, records, workspaceName) {
    const headers = commonHeaders(authToken, workspaceId);
    const payload = JSON.stringify({
        query: `mutation AddRecords($input: AddRecordsInput!) {
            addRecords(input: $input) { id __typename }
        }`,
        variables: {
            input: {
                clientId: workspaceId,
                tableId: tableName,
                records: records
            }
        }
    });
    retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
}

function getRecords(authToken, workspaceId, tableName) {
    const headers = commonHeaders(authToken, workspaceId);
    const payload = JSON.stringify({
        query: `query GetRecords($input: GetRecordsInput!) {
            getRecords(input: $input) { records __typename }
        }`,
        variables: {
            input: {
                clientId: workspaceId,
                tableId: tableName
            }
        }
    });

    const res = retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
    if (res.status !== 200) {
        console.warn(`❌ Failed to get records for workspace ${workspaceId}: ${res.status}`);
        throw new Error('Failed to get records: ' + res.body);
    }
}


function removeTable(authToken, workspaceId, tableName, workspaceName) {
    const headers = commonHeaders(authToken, workspaceId);
    const payload = JSON.stringify({
        query: `mutation RemoveTable($input: GetEntityInput!) {
            removeTable(input: $input)
        }`,
        variables: {
            input: {
                clientId: workspaceId,
                id: tableName
            }
        }
    });
    retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
}

function enableWorkspaceDeletion(authToken, workspaceId, workspaceName) {
    const headers = commonHeaders(authToken, workspaceId);
    const payload = JSON.stringify({
        query: `mutation UpdateProjectConfiguration($input: UpdateProjectConfigurationInput!) {
            updateProjectConfiguration(input: $input) { projectId features __typename }
        }`,
        variables: {
            input: {
                projectId: workspaceId,
                features: { useTrashFeature: true }
            }
        }
    });
    retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
}

function deleteWorkspace(authToken, workspaceId, workspaceName) {
    const headers = commonHeaders(authToken, workspaceId);
    const payload = JSON.stringify({
        query: `mutation DeleteProject($id: String!) {
            deleteOrganization(id: $id) { id __typename }
        }`,
        variables: { id: workspaceId }
    });
    retryPost('https://qa.fastn.ai/api/graphql', payload, headers);
}

export default function () {
    sleep(Math.random());
    const authToken = getAuthToken();
    const workspaceName = `k6-test-workspace-${__VU}-${__ITER}`;
    const tableName = `k6-test-table-${__VU}-${__ITER}`;

    try {
        const workspaceId = createWorkspace(authToken, workspaceName);
        sleep(1);
        updateWorkspaceToEnterprise(authToken, workspaceId, workspaceName);
        sleep(1);
        createTable(authToken, workspaceId, tableName, workspaceName);
        sleep(1);
        const recordData = [[{ key: "title", value: "Test Record 1" }]];
        addRecords(authToken, workspaceId, tableName, recordData, workspaceName);
        sleep(1);
        getRecords(authToken, workspaceId, tableName, workspaceName);
        sleep(1);
        removeTable(authToken, workspaceId, tableName, workspaceName);
        sleep(2);
        enableWorkspaceDeletion(authToken, workspaceId, workspaceName);
        sleep(1);
        deleteWorkspace(authToken, workspaceId, workspaceName);
        sleep(1);
    } catch (e) {
        console.error(`❌ Error in test for workspace ${workspaceName}: ${e.message}`);
    }
}
