import { z } from 'zod';
import { deactivateWorkflow as deactivate } from '../../utils/n8nClient.js';

export const toolName = 'deactivate_workflow';
export const description = 'Deactivate a workflow on the n8n instance so it stops responding to triggers.';

export const paramsSchema = z.object({
    remote_workflow_id: z.string().describe('ID of the workflow on the n8n instance to deactivate'),
});

export type Params = z.infer<typeof paramsSchema>;

export async function handler(params: Params, _extra: any) {
    try {
        const result = await deactivate(params.remote_workflow_id);
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
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Failed to deactivate workflow: ${error.message}` }) }] };
    }
}
