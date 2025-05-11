// update-stage/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL
		}
	}
});

export async function POST({ request }) {
	const { SONumber, currentStage } = await request.json();

	try {
		// Start a transaction to ensure all database operations are consistent
		const result = await prisma.$transaction(async (tx) => {
			// Get the current SO record to determine the previous stage
			const currentSO = await tx.stage0.findUnique({
				where: { SONumber },
				select: { currentStage: true }
			});

			if (!currentSO) {
				return { success: false, error: 'Sales order not found' };
			}

			const previousStage = currentSO.currentStage;

			// Only process stage aging if we're actually changing stages
			if (previousStage !== currentStage) {
				// Find the latest stage history entry for the previous stage
				const previousStageEntry = await tx.stageHistory.findFirst({
					where: {
						SONumber: SONumber,
						stage: previousStage
					},
					orderBy: {
						timestamp: 'desc'
					}
				});

				if (previousStageEntry) {
					// Calculate the duration in hours that the order spent in the previous stage
					const startTime = new Date(previousStageEntry.timestamp);
					const endTime = new Date();
					const durationMs = endTime.getTime() - startTime.getTime();
					const durationHours = durationMs / (1000 * 60 * 60); // Convert ms to hours

					// Store the aging data for the completed stage
					await tx.stageAgingHistory.create({
						data: {
							SONumber,
							stage: previousStage,
							startTime,
							endTime,
							durationHours
						}
					});
				}

				// Update the current stage in Stage0
				const updatedStage0 = await tx.stage0.update({
					where: { SONumber },
					data: { currentStage }
				});

				// Record the stage change in StageHistory
				await tx.stageHistory.create({
					data: {
						SONumber,
						stage: currentStage
						// timestamp will be set automatically to the current time
					}
				});

				return { success: true, data: updatedStage0 };
			} else {
				// No stage change, just return the current record
				return { success: true, data: currentSO, message: 'No stage change needed' };
			}
		});

		return json(result);
	} catch (error) {
		console.error('Error updating current stage:', error);
		return json({ success: false, error: 'Error updating current stage' }, { status: 500 });
	}
}
