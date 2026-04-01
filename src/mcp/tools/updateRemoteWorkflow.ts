import { z } from 'zod';
import fs from 'fs/promises';
import { resolveWorkflowPath, tryDetectWorkspaceForName } from '../../utils/workspace.js';
import { putWorkflow } from '../../utils/n8nClient.js';

export const toolName = 'update_remote_workflow';
export const description = 'Update an existing workflow on the n8n instance with the local version. Reads the JSON from workflow_data/, strips internal fields, and PUTs it to the n8n REST API.';

export const paramsSchema = z.object({
    workflow_name: z.string().describe('Name of the local workflow to push'),
    remote_workflow_id: z.string().describe('ID of the workflow on the n8n instance to update'),
    workflow_path: z.string().optional().describe('Optional direct path to the workflow JSON file'),
});

export type Params = z.infer<typeof paramsSchema>;

export async function handler(params: Params, _extra: any) {
    try {
        let filePath = resolveWorkflowPath(params.workflow_name, params.workflow_path);
        try {
            if (!params.workflow_path) {
                await fs.access(filePath).catch(async () => {
                    const detected = await tryDetectWorkspaceForName(params.workflow_name);
                    if (detected) filePath = detected;
                });
            }
        } catch { /* ignore */ }

        const raw = await fs.readFile(filePath, 'utf8');
        const workflow = JSON.parse(raw);

        const { name, nodes, connections, settings } = workflow;
        if (!name || !nodes) {
            return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: 'Workflow JSON is missing required fields (name, nodes)' }) }] };
        }

        const payload = { name, nodes, connections: connections || {}, settings: settings || {} };
        const result = await putWorkflow(params.remote_workflow_id, payload);

        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify({
                    success: true,
                    remoteWorkflowId: result.id,
                    name: result.name,
                    active: result.active,
                    localPath: filePath,
                }),
            }],
        };
    } catch (error: any) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Failed to update remote workflow: ${error.message}` }) }] };
    }
}
