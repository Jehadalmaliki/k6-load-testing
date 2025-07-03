import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    insecureSkipTLSVerify: true,
    scenarios: {
        contacts: {
            executor: 'per-vu-iterations',
            vus: 20,
            iterations: 1,
            maxDuration: '1h',
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

function createWorkspace(authToken, workspaceName) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': 'a51cac39-9893-493a-a492-1df612522bf0',
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `mutation CreateProject($input: CreateProjectInput!) {\n  createProject(input: $input) {\n    id\n    name\n    __typename\n  }\n}`,
        variables: {
            input: {
                name: workspaceName,
                slug: workspaceName,
                type: "organization"
            }
        }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to create workspace: ' + res.body);
    }
    return res.json('data.createProject.id');
}

function updateWorkspaceToEnterprise(authToken, workspaceId) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `mutation UpdateProjectConfiguration($input: UpdateProjectConfigurationInput!) {\n  updateProjectConfiguration(input: $input) {\n    projectId\n    features\n    __typename\n  }\n}`,
        variables: {
            input: {
                projectId: workspaceId,
                type: "enterprise"
            }
        }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to update workspace to enterprise: ' + res.body);
    }
}

function createTable(authToken, workspaceId, tableName) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `mutation CreateTable($input: CreateTableInput!) {\n  createTable(input: $input) {\n    id\n    name\n    __typename\n  }\n}`,
        variables: {
            input: {
                clientId: workspaceId,
                name: tableName,
                schema: {
                    fields: [{
                        name: "title",
                        type: "string"
                    }]
                }
            }
        }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to create table: ' + res.body);
    }
}

function addRecords(authToken, workspaceId, tableName, records) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `mutation AddRecords($input: AddRecordsInput!) {\n  addRecords(input: $input) {\n    id\n    __typename\n  }\n}`,
        variables: {
            input: {
                clientId: workspaceId,
                tableId: tableName,
                records: records
            }
        }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to add records: ' + res.body);
    }
}

function getRecords(authToken, workspaceId, tableName) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `query GetRecords($input: GetRecordsInput!) {\n  getRecords(input: $input) {\n    records\n    __typename\n  }\n}`,
        variables: {
            input: {
                clientId: workspaceId,
                tableId: tableName
            }
        }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to get records: ' + res.body);
    }
}

function removeTable(authToken, workspaceId, tableName) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `mutation RemoveTable($input: GetEntityInput!) {\n  removeTable(input: $input)\n}`,
        variables: {
            input: {
                clientId: workspaceId,
                id: tableName
            }
        }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to remove table: ' + res.body);
    }
}

function deleteWorkspace(authToken, workspaceId) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `mutation DeleteProject($id: String!) {\n  deleteOrganization(id: $id) {\n    id\n    __typename\n  }\n}`,
        variables: { id: workspaceId }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to delete workspace: ' + res.body);
    }
}

function enableWorkspaceDeletion(authToken, workspaceId) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-tenant': 'organization',
        'x-fastn-space-id': workspaceId,
        'realm': 'fastn',
        'accept': '*/*'
    };
    const payload = JSON.stringify({
        query: `mutation UpdateProjectConfiguration($input: UpdateProjectConfigurationInput!) {\n  updateProjectConfiguration(input: $input) {\n    projectId\n    features\n    __typename\n  }\n}`,
        variables: {
            input: {
                projectId: workspaceId,
                features: {
                    useTrashFeature: true
                }
            }
        }
    });
    const res = http.post(
        'https://qa.fastn.ai/api/graphql',
        payload,
        { headers }
    );
    if (res.status !== 200) {
        throw new Error('Failed to enable workspace deletion: ' + res.body);
    }
}

export default function () {
    const authToken = getAuthToken();
    const workspaceName = `k6-test-workspace-${__VU}-${__ITER}`;
    const tableName = `k6-test-table-${__VU}-${__ITER}`;

    // 1. Create Workspace
    const workspaceId = createWorkspace(authToken, workspaceName);
    sleep(1);

    // 2. Update Workspace/Project Type to Enterprise
    updateWorkspaceToEnterprise(authToken, workspaceId);
    sleep(1);

    // 3. Create Table
    createTable(authToken, workspaceId, tableName);
    sleep(1);

    // 4. Add Records
    const recordData = [[{ key: "title", value: "Test Record 1" }]];
    addRecords(authToken, workspaceId, tableName, recordData);
    sleep(1);

    // 5. Get Records
    getRecords(authToken, workspaceId, tableName);
    sleep(1);

    // 6. Remove Table
    removeTable(authToken, workspaceId, tableName);
    sleep(2);

    // 7. Enable Workspace Deletion
    enableWorkspaceDeletion(authToken, workspaceId);
    sleep(1);

    // 8. Delete Workspace
    deleteWorkspace(authToken, workspaceId);
    sleep(1);
}


