import { z } from 'zod';
import { activateWorkflow as activate } from '../../utils/n8nClient.js';

export const toolName = 'activate_workflow';
export const description = 'Activate a workflow on the n8n instance so it runs in production (responds to triggers).';

export const paramsSchema = z.object({
    remote_workflow_id: z.string().describe('ID of the workflow on the n8n instance to activate'),
});

export type Params = z.infer<typeof paramsSchema>;

export async function handler(params: Params, _extra: any) {
    try {
        const result = await activate(params.remote_workflow_id);
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify({
                    success: true,
                    remoteWorkflowId: result.id,
                    name: result.name,
                    active: result.active,
                }),
            }],
        };
    } catch (error: any) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Failed to activate workflow: ${error.message}` }) }] };
    }
}
