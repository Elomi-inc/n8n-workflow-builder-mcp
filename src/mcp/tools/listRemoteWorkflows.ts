import { z } from 'zod';
import { listWorkflows } from '../../utils/n8nClient.js';

export const toolName = 'list_remote_workflows';
export const description = 'List workflows deployed on the n8n instance.';

export const paramsSchema = z.object({
    limit: z.number().optional().default(100).describe('Maximum number of workflows to return'),
    active_only: z.boolean().optional().default(false).describe('Only return active workflows'),
});

export type Params = z.infer<typeof paramsSchema>;

export async function handler(params: Params, _extra: any) {
    try {
        const result = await listWorkflows(params.limit);
        let workflows = result.data || result;

        if (params.active_only && Array.isArray(workflows)) {
            workflows = workflows.filter((w: any) => w.active === true);
        }

        const summary = Array.isArray(workflows)
            ? workflows.map((w: any) => ({
                id: w.id,
                name: w.name,
                active: w.active,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt,
            }))
            : workflows;

        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify({
                    success: true,
                    count: Array.isArray(summary) ? summary.length : 0,
                    workflows: summary,
                }),
            }],
        };
    } catch (error: any) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Failed to list remote workflows: ${error.message}` }) }] };
    }
}
