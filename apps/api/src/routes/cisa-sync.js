import express from 'express';
import rateLimit from 'express-rate-limit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { mapKevEntry } from '../utils/kev.js';

const router = express.Router();

const syncLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many sync requests, please try again later' },
	validate: { trustProxy: false },
});

const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

router.get('/', syncLimiter, async (req, res) => {
	const syncStartTime = new Date().toISOString();

	const response = await fetch(CISA_KEV_URL);

	if (!response.ok) {
		const errorMessage = `Failed to fetch CISA KEV data: ${response.status} ${response.statusText}`;
		logger.error(errorMessage);

		await pb.collection('sync_logs').create({
			status: 'failure',
			errorMessage,
			syncStartTime,
			syncEndTime: new Date().toISOString(),
		});

		throw new Error(errorMessage);
	}

	const data = await response.json();

	if (!data.vulnerabilities || !Array.isArray(data.vulnerabilities)) {
		const errorMessage = 'Invalid CISA KEV data format';
		logger.error(errorMessage);

		await pb.collection('sync_logs').create({
			status: 'failure',
			errorMessage,
			syncStartTime,
			syncEndTime: new Date().toISOString(),
		});

		throw new Error(errorMessage);
	}

	let upsertedCount = 0;

	for (const vuln of data.vulnerabilities) {
		const recordData = mapKevEntry(vuln);

		// Skip malformed entries rather than writing partial rows.
		if (!recordData) continue;

		// Upsert keyed on vulnerabilityId (the unique-indexed column). The filter
		// is parameterized so a CVE id can't be interpreted as filter syntax.
		const existingRecords = await pb.collection('cisa_kev_vulnerabilities').getFullList({
			filter: pb.filter('vulnerabilityId = {:cveId}', { cveId: recordData.vulnerabilityId }),
		});

		if (existingRecords.length > 0) {
			await pb.collection('cisa_kev_vulnerabilities').update(existingRecords[0].id, recordData);
		} else {
			await pb.collection('cisa_kev_vulnerabilities').create(recordData);
		}

		upsertedCount++;
	}

	const syncEndTime = new Date().toISOString();

	await pb.collection('sync_logs').create({
		status: 'success',
		vulnerabilitiesFetched: upsertedCount,
		syncStartTime,
		syncEndTime,
	});

	logger.info(`CISA KEV sync completed: ${upsertedCount} vulnerabilities upserted`);

	res.json({
		status: 'success',
		vulnerabilitiesFetched: upsertedCount,
		timestamp: syncEndTime,
	});
});

export default router;