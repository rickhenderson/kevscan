import express from 'express';
import rateLimit from 'express-rate-limit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const uploadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many upload requests, please try again later' },
	validate: { trustProxy: false },
});

const ALLOWED_MIME_TYPES = ['application/json', 'application/xml', 'text/plain'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function detectFileFormat(content, mimeType) {
	if (mimeType === 'application/json' || mimeType === 'text/plain') {
		try {
			const parsed = JSON.parse(content);
			if (parsed.bomFormat === 'CycloneDX' || parsed.specVersion) {
				return 'cyclonedx-json';
			}
			if (parsed.spdxVersion) {
				return 'spdx-json';
			}
			return 'json';
		} catch {
			// Not JSON, continue
		}
	}

	if (mimeType === 'application/xml' || mimeType === 'text/plain') {
		if (content.includes('<?xml') && content.includes('bom')) {
			return 'cyclonedx-xml';
		}
	}

	return 'unknown';
}

function parseLibraries(content, format) {
	const libraries = [];

	try {
		if (format === 'cyclonedx-json') {
			const data = JSON.parse(content);
			if (data.components && Array.isArray(data.components)) {
				data.components.forEach(comp => {
					if (comp.name && comp.version) {
						libraries.push({
							name: comp.name,
							version: comp.version,
							type: comp.type || 'library',
						});
					}
				});
			}
		} else if (format === 'spdx-json') {
			const data = JSON.parse(content);
			if (data.packages && Array.isArray(data.packages)) {
				data.packages.forEach(pkg => {
					if (pkg.name && pkg.versionInfo) {
						libraries.push({
							name: pkg.name,
							version: pkg.versionInfo,
							type: 'library',
						});
					}
				});
			}
		} else if (format === 'json') {
			const data = JSON.parse(content);
			if (Array.isArray(data)) {
				data.forEach(item => {
					if (item.name && item.version) {
						libraries.push({
							name: item.name,
							version: item.version,
							type: item.type || 'library',
						});
					}
				});
			}
		}
	} catch (error) {
		logger.error('Error parsing libraries:', error.message);
	}

	return libraries;
}

router.post('/', uploadLimiter, requireAuth, async (req, res) => {
	const { file, fileName } = req.body;

	if (!file || !fileName) {
		return res.status(400).json({ error: 'File and fileName are required' });
	}

	const fileBuffer = Buffer.from(file, 'base64');

	if (fileBuffer.length > MAX_FILE_SIZE) {
		return res.status(400).json({ error: `File size exceeds 10MB limit` });
	}

	const mimeType = req.body.mimeType || 'application/json';

	if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
		return res.status(400).json({
			error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
		});
	}

	const fileContent = fileBuffer.toString('utf-8');
	const fileFormat = detectFileFormat(fileContent, mimeType);

	if (fileFormat === 'unknown') {
		return res.status(400).json({ error: 'Unable to detect file format' });
	}

	const libraries = parseLibraries(fileContent, fileFormat);

	if (libraries.length === 0) {
		return res.status(400).json({ error: 'No libraries found in file' });
	}

	// Column names below must match the uploads/scans collections exactly.
	// parsedLibraries (json) is stored as an array — the /scan route reads it
	// back to run matching. `created` is an autodate, so we don't set it.
	// userId comes from the verified session (requireAuth), so the row is owned
	// correctly at creation time — no fragile client-side patch afterward.
	const uploadRecord = await pb.collection('uploads').create({
		userId: req.userId,
		fileName,
		fileFormat,
		fileSize: fileBuffer.length,
		libraryCount: libraries.length,
		parsedLibraries: libraries,
	});

	const scanRecord = await pb.collection('scans').create({
		userId: req.userId,
		uploadId: uploadRecord.id,
		scanStatus: 'pending',
		totalVulnerabilitiesFound: 0,
		vulnerableLibraries: [],
		scanStartTime: new Date().toISOString(),
	});

	logger.info(`Upload created: ${uploadRecord.id}, Scan created: ${scanRecord.id}`);

	res.json({
		scanId: scanRecord.id,
		uploadId: uploadRecord.id,
		librariesCount: libraries.length,
		fileFormat,
	});
});

export default router;