import { z } from 'zod';
import { listCredentials as fetchCredentials } from '../../utils/n8nClient.js';

export const toolName = 'list_credentials';
export const description =
    'List credentials available on the n8n instance. Returns credential names and types only — no sensitive data is exposed. Useful for knowing which credentials exist when building workflows that require authentication.';

export const paramsSchema = z.object({
    type: z
        .string()
        .optional()
        .describe('Filter by credential type (e.g. "slackApi", "httpBasicAuth"). Omit to list all.'),
});

export type Params = z.infer<typeof paramsSchema>;

export async function handler(params: Params, _extra: any) {
    try {
        const result = await fetchCredentials();
        let credentials = result.data || result;

        if (!Array.isArray(credentials)) {
            credentials = [];
        }

        if (params.type) {
            const filterType = params.type.toLowerCase();
            credentials = credentials.filter(
                (c: any) => c.type && c.type.toLowerCase() === filterType,
            );
        }

        const summary = credentials.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: true,
                        count: summary.length,
                        credentials: summary,
                    }),
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: false,
                        error: `Failed to list credentials: ${error.message}`,
                    }),
                },
            ],
        };
    }
}
