import express from 'express';
import rateLimit from 'express-rate-limit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const scanLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many scan requests, please try again later' },
	validate: { trustProxy: false },
});

function versionInRange(version, rangeStr) {
	if (!rangeStr) return false;

	const ranges = rangeStr.split(',').map(r => r.trim());

	for (const range of ranges) {
		if (range === version) return true;
		if (range.includes('*')) {
			const pattern = range.replace(/\*/g, '.*');
			if (new RegExp(`^${pattern}$`).test(version)) return true;
		}
	}

	return false;
}

router.post('/', scanLimiter, async (req, res) => {
	const { scanId, uploadId } = req.body;

	if (!scanId || !uploadId) {
		return res.status(400).json({ error: 'scanId and uploadId are required' });
	}

	const uploadRecord = await pb.collection('uploads').getOne(uploadId);

	if (!uploadRecord) {
		return res.status(400).json({ error: 'Upload not found' });
	}

	const libraries = JSON.parse(uploadRecord.parsedLibraries || '[]');

	const vulnerableLibraries = [];
	let totalVulnerabilitiesFound = 0;

	for (const lib of libraries) {
		const vulnerabilities = await pb.collection('cisa_kev_vulnerabilities').getFullList({
			filter: `productName = "${lib.name}"`,
		});

		for (const vuln of vulnerabilities) {
			if (versionInRange(lib.version, vuln.affectedVersions)) {
				vulnerableLibraries.push({
					library: lib.name,
					version: lib.version,
					cveId: vuln.cveId,
					cvssScore: vuln.cvssScore,
					affectedVersions: vuln.affectedVersions,
					remediationAvailable: vuln.remediationAvailable,
					configurationNotes: vuln.configurationNotes,
					dateAdded: vuln.dateAdded,
				});
				totalVulnerabilitiesFound++;
			}
		}
	}

	await pb.collection('scans').update(scanId, {
		status: 'completed',
		totalVulnerabilitiesFound,
		vulnerableLibraries: JSON.stringify(vulnerableLibraries),
		completedAt: new Date().toISOString(),
	});

	logger.info(`Scan completed: ${scanId}, Vulnerabilities found: ${totalVulnerabilitiesFound}`);

	res.json({
		scanId,
		status: 'completed',
		summary: {
			totalLibraries: libraries.length,
			totalVulnerabilitiesFound,
			vulnerableLibrariesCount: vulnerableLibraries.length,
		},
		vulnerableLibraries,
	});
});

export default router;