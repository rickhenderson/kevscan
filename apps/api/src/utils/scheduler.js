import 'dotenv/config';
import schedule from 'node-schedule';
import logger from './logger.js';
import pb from './pocketbaseClient.js';

let currentJob = null;

async function runCisaKevSync() {
	try {
		logger.info('Running scheduled CISA KEV sync...');

		const response = await fetch('http://localhost:3001/cisa-kev-sync');

		if (!response.ok) {
			throw new Error(`Sync endpoint returned ${response.status}`);
		}

		const result = await response.json();
		logger.info(`Scheduled sync completed: ${result.vulnerabilitiesFetched} vulnerabilities fetched`);
	} catch (error) {
		logger.error('Scheduled CISA KEV sync failed:', error.message);

		try {
			await pb.collection('sync_logs').create({
				status: 'failure',
				errorMessage: `Scheduled sync failed: ${error.message}`,
				syncedAt: new Date().toISOString(),
			});
		} catch (logError) {
			logger.error('Failed to log sync error:', logError.message);
		}
	}
}

function scheduleSync(cronExpression, timezone) {
	if (currentJob) {
		currentJob.cancel();
		logger.info('Previous schedule cancelled');
	}

	try {
		currentJob = schedule.scheduleJob(
			{ rule: cronExpression, tz: timezone },
			runCisaKevSync
		);

		logger.info(`CISA KEV sync scheduled: ${cronExpression} (${timezone})`);
	} catch (error) {
		logger.error('Failed to schedule CISA KEV sync:', error.message);
	}
}

async function updateSchedule(cronExpression, timezone) {
	scheduleSync(cronExpression, timezone);
}

async function initializeScheduler() {
	try {
		const scheduleConfig = await pb.collection('schedule_config').getFullList();

		let cronExpression = process.env.CISA_KEV_SYNC_SCHEDULE || '0 1 * * *';
		let timezone = process.env.CISA_KEV_SYNC_TIMEZONE || 'America/New_York';

		if (scheduleConfig.length > 0 && scheduleConfig[0].enabled) {
			cronExpression = scheduleConfig[0].cronExpression;
			timezone = scheduleConfig[0].timezone;
		}

		scheduleSync(cronExpression, timezone);
	} catch (error) {
		logger.warn('Could not load schedule config from database, using environment variables:', error.message);

		const cronExpression = process.env.CISA_KEV_SYNC_SCHEDULE || '0 1 * * *';
		const timezone = process.env.CISA_KEV_SYNC_TIMEZONE || 'America/New_York';

		scheduleSync(cronExpression, timezone);
	}
}

initializeScheduler();

export { updateSchedule, runCisaKevSync };