import { z } from 'zod';
import { deleteWorkflow } from '../../utils/n8nClient.js';

export const toolName = 'delete_remote_workflow';
export const description = 'Permanently delete a workflow from the n8n instance.';

export const paramsSchema = z.object({
    remote_workflow_id: z.string().describe('ID of the workflow on the n8n instance to delete'),
});

export type Params = z.infer<typeof paramsSchema>;

export async function handler(params: Params, _extra: any) {
    try {
        await deleteWorkflow(params.remote_workflow_id);
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify({
                    success: true,
                    remoteWorkflowId: params.remote_workflow_id,
                    deleted: true,
                }),
            }],
        };
    } catch (error: any) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Failed to delete remote workflow: ${error.message}` }) }] };
    }
}
