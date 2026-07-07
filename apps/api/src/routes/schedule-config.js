import express from 'express';
import rateLimit from 'express-rate-limit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { updateSchedule } from '../utils/scheduler.js';

const router = express.Router();

const scheduleLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many schedule requests, please try again later' },
	validate: { trustProxy: false },
});

router.get('/current', scheduleLimiter, async (req, res) => {
	const scheduleConfig = await pb.collection('schedule_config').getFullList();

	if (scheduleConfig.length === 0) {
		return res.json({
			schedule: process.env.CISA_KEV_SYNC_SCHEDULE || '0 1 * * *',
			timezone: process.env.CISA_KEV_SYNC_TIMEZONE || 'America/New_York',
			source: 'environment',
		});
	}

	const config = scheduleConfig[0];
	res.json({
		id: config.id,
		schedule: config.cronExpression,
		timezone: config.timezone,
		enabled: config.enabled,
		source: 'database',
	});
});

router.post('/update', scheduleLimiter, async (req, res) => {
	const { cronExpression, timezone } = req.body;

	if (!cronExpression || !timezone) {
		return res.status(400).json({ error: 'cronExpression and timezone are required' });
	}

	const scheduleConfig = await pb.collection('schedule_config').getFullList();

	let config;
	if (scheduleConfig.length > 0) {
		config = await pb.collection('schedule_config').update(scheduleConfig[0].id, {
			cronExpression,
			timezone,
			updatedAt: new Date().toISOString(),
		});
	} else {
		config = await pb.collection('schedule_config').create({
			cronExpression,
			timezone,
			enabled: true,
			createdAt: new Date().toISOString(),
		});
	}

	await updateSchedule(cronExpression, timezone);

	logger.info(`Schedule updated: ${cronExpression} (${timezone})`);

	res.json({
		id: config.id,
		schedule: config.cronExpression,
		timezone: config.timezone,
		enabled: config.enabled,
		message: 'Schedule updated successfully',
	});
});

export default router;