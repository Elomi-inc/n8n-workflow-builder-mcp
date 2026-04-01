import { z } from 'zod';
import fs from 'fs/promises';
import { resolveWorkflowPath, tryDetectWorkspaceForName } from '../../utils/workspace.js';
import { postWorkflow } from '../../utils/n8nClient.js';

export const toolName = 'deploy_workflow';
export const description = 'Deploy a locally-built workflow to the n8n instance. Reads the JSON from workflow_data/, strips internal fields, and POSTs it to the n8n REST API.';

export const paramsSchema = z.object({
    workflow_name: z.string().describe('Name of the local workflow to deploy'),
    workflow_path: z.string().optional().describe('Optional direct path to the workflow JSON file'),
    activate: z.boolean().optional().default(false).describe('Activate the workflow immediately after deployment'),
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

        const payload: any = { name, nodes, connections: connections || {}, settings: settings || {} };
        if (params.activate) {
            payload.active = true;
        }

        const result = await postWorkflow(payload);

        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify({
                    success: true,
                    remoteWorkflowId: result.id,
                    name: result.name,
                    active: result.active,
                    localPath: filePath,
                    recommended_next_step: result.active
                        ? 'Workflow is deployed and active.'
                        : "Call 'activate_workflow' with the remoteWorkflowId to activate it.",
                }),
            }],
        };
    } catch (error: any) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Failed to deploy workflow: ${error.message}` }) }] };
    }
}
