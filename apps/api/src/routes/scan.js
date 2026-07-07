import express from 'express';
import rateLimit from 'express-rate-limit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { matchLibraries } from '../utils/kev.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const scanLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many scan requests, please try again later' },
	validate: { trustProxy: false },
});

router.post('/', scanLimiter, requireAuth, async (req, res) => {
	const { scanId, uploadId } = req.body;

	if (!scanId || !uploadId) {
		return res.status(400).json({ error: 'scanId and uploadId are required' });
	}

	const uploadRecord = await pb.collection('uploads').getOne(uploadId);

	if (!uploadRecord) {
		return res.status(400).json({ error: 'Upload not found' });
	}

	const scanRecord = await pb.collection('scans').getOne(scanId);

	// The API acts as a superuser, so PocketBase's own ownership rules don't
	// apply here — enforce them explicitly against the verified caller.
	if (uploadRecord.userId !== req.userId || scanRecord.userId !== req.userId) {
		return res.status(403).json({ error: 'You do not have access to this scan' });
	}

	// parsedLibraries is a json column: PocketBase returns it already parsed, but
	// tolerate a stringified value too in case an older row stored one.
	const rawLibraries = uploadRecord.parsedLibraries;
	const libraries = Array.isArray(rawLibraries)
		? rawLibraries
		: JSON.parse(rawLibraries || '[]');

	// Load the KEV catalog once and match in memory. The catalog is ~1.6k rows,
	// so this is cheaper and simpler than a per-library query, and keeps the
	// matching logic in one testable place (utils/kev.js).
	const kevRecords = await pb.collection('cisa_kev_vulnerabilities').getFullList();
	const vulnerableLibraries = matchLibraries(libraries, kevRecords);

	await pb.collection('scans').update(scanId, {
		scanStatus: 'completed',
		totalLibrariesScanned: libraries.length,
		totalVulnerabilitiesFound: vulnerableLibraries.length,
		vulnerableLibraries,
		scanEndTime: new Date().toISOString(),
	});

	logger.info(`Scan completed: ${scanId}, vulnerabilities found: ${vulnerableLibraries.length}`);

	res.json({
		scanId,
		status: 'completed',
		summary: {
			totalLibraries: libraries.length,
			totalVulnerabilitiesFound: vulnerableLibraries.length,
			vulnerableLibrariesCount: vulnerableLibraries.length,
		},
		vulnerableLibraries,
	});
});

export default router;