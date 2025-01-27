import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ params }) => {
    try {
        const soNumber = params.id.split('/').join('/');
        const updatedStage0 = await db.stage0.update({
            where: { SONumber: soNumber },
            data: { isDropped: true },
        });

        return json({ success: true, data: updatedStage0 });
    } catch (error) {
        console.error('Error updating Stage0:', error);
        return json({ success: false, error: 'Failed to update Stage0' }, { status: 500 });
    }
};