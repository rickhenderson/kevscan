import express from 'express';
import rateLimit from 'express-rate-limit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

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
	const startTime = Date.now();

	const response = await fetch(CISA_KEV_URL);

	if (!response.ok) {
		const errorMessage = `Failed to fetch CISA KEV data: ${response.status} ${response.statusText}`;
		logger.error(errorMessage);

		await pb.collection('sync_logs').create({
			status: 'failure',
			errorMessage,
			syncedAt: new Date().toISOString(),
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
			syncedAt: new Date().toISOString(),
		});

		throw new Error(errorMessage);
	}

	let upsertedCount = 0;

	for (const vuln of data.vulnerabilities) {
		const recordData = {
			cveId: vuln.cveID,
			productName: vuln.productName,
			affectedVersions: vuln.affectedVersions ? vuln.affectedVersions.join(',') : '',
			cvssScore: vuln.cvssScore || 0,
			dateAdded: vuln.dateAdded,
			remediationAvailable: vuln.remediationAvailable === 'Yes',
			configurationNotes: vuln.configurationNotes || '',
		};

		const existingRecords = await pb.collection('cisa_kev_vulnerabilities').getFullList({
			filter: `cveId = "${vuln.cveID}"`,
		});

		if (existingRecords.length > 0) {
			await pb.collection('cisa_kev_vulnerabilities').update(existingRecords[0].id, recordData);
		} else {
			await pb.collection('cisa_kev_vulnerabilities').create(recordData);
		}

		upsertedCount++;
	}

	const syncDuration = Date.now() - startTime;

	await pb.collection('sync_logs').create({
		status: 'success',
		vulnerabilitiesFetched: upsertedCount,
		syncDurationMs: syncDuration,
		syncedAt: new Date().toISOString(),
	});

	logger.info(`CISA KEV sync completed: ${upsertedCount} vulnerabilities upserted in ${syncDuration}ms`);

	res.json({
		status: 'success',
		vulnerabilitiesFetched: upsertedCount,
		timestamp: new Date().toISOString(),
		syncDurationMs: syncDuration,
	});
});

export default router;