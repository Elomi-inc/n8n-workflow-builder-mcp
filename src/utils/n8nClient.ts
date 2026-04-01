const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

function getBaseUrl(): string {
    if (!N8N_API_URL) {
        throw new Error('N8N_API_URL environment variable is not set');
    }
    return N8N_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (N8N_API_KEY) {
        headers['X-N8N-API-KEY'] = N8N_API_KEY;
    }
    return headers;
}

async function request(method: string, path: string, body?: object): Promise<any> {
    const url = `${getBaseUrl()}/api/v1${path}`;
    const response = await fetch(url, {
        method,
        headers: getHeaders(),
        ...(body && { body: JSON.stringify(body) }),
    });

    const data = await response.json();
    if (!response.ok) {
        const message = (data as any)?.message || response.statusText;
        throw new Error(`n8n API ${method} ${path} failed (${response.status}): ${message}`);
    }
    return data;
}

export async function postWorkflow(body: object): Promise<any> {
    return request('POST', '/workflows', body);
}

export async function putWorkflow(id: string, body: object): Promise<any> {
    return request('PUT', `/workflows/${id}`, body);
}

export async function deleteWorkflow(id: string): Promise<any> {
    return request('DELETE', `/workflows/${id}`);
}

export async function activateWorkflow(id: string): Promise<any> {
    return request('POST', `/workflows/${id}/activate`);
}

export async function deactivateWorkflow(id: string): Promise<any> {
    return request('POST', `/workflows/${id}/deactivate`);
}

export async function listWorkflows(limit?: number): Promise<any> {
    const query = limit ? `?limit=${limit}` : '';
    return request('GET', `/workflows${query}`);
}

export async function getWorkflow(id: string): Promise<any> {
    return request('GET', `/workflows/${id}`);
}
