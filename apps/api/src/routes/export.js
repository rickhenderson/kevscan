import express from 'express';
import rateLimit from 'express-rate-limit';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const exportLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many export requests, please try again later' },
	validate: { trustProxy: false },
});

// CORS is handled globally in main.js via the shared allowlist. This route
// previously reflected the caller's Origin back with credentials enabled,
// which let any site make credentialed cross-origin requests to it.

router.post('/', exportLimiter, async (req, res) => {
	const { scanId, format } = req.body;

	logger.info(`Export request received: scanId=${scanId}, format=${format}`);

	// Input validation
	if (!scanId) {
		logger.warn('Export request missing scanId');
		return res.status(400).json({ error: 'scanId is required' });
	}

	if (!format || !['pdf', 'csv'].includes(format)) {
		logger.warn(`Export request invalid format: ${format}`);
		return res.status(400).json({ error: 'format must be "pdf" or "csv"' });
	}

	logger.info(`Fetching scan record: ${scanId}`);
	const scanRecord = await pb.collection('scans').getOne(scanId);

	if (!scanRecord) {
		logger.error(`Scan not found: ${scanId}`);
		return res.status(400).json({ error: 'Scan not found' });
	}

	logger.info(`Scan record found: ${scanId}, status=${scanRecord.status}`);

	let vulnerableLibraries = [];
	try {
		vulnerableLibraries = JSON.parse(scanRecord.vulnerableLibraries || '[]');
		logger.info(`Parsed ${vulnerableLibraries.length} vulnerable libraries from scan`);
	} catch (parseError) {
		logger.error(`Failed to parse vulnerableLibraries JSON: ${parseError.message}`);
		throw new Error(`Invalid scan data format: ${parseError.message}`);
	}

	if (format === 'pdf') {
		logger.info(`Generating PDF export for scan: ${scanId}`);

		try {
			const doc = new PDFDocument();

			// Set proper headers for PDF file download
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename="scan-${scanId}.pdf"`);
			res.setHeader('X-Content-Type-Options', 'nosniff');
			res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
			res.setHeader('Pragma', 'no-cache');
			res.setHeader('Expires', '0');

			logger.info(`PDF headers set, piping document to response`);

			doc.on('error', (error) => {
				logger.error(`PDF generation error: ${error.message}`);
			});

			doc.pipe(res);

			doc.fontSize(20).text('Vulnerability Scan Report', { align: 'center' });
			doc.moveDown();

			doc.fontSize(12).text(`Scan ID: ${scanId}`);
			doc.text(`Status: ${scanRecord.status}`);
			doc.text(`Total Vulnerabilities Found: ${scanRecord.totalVulnerabilitiesFound}`);
			doc.text(`Created: ${new Date(scanRecord.createdAt).toLocaleString()}`);
			doc.moveDown();

			if (vulnerableLibraries.length > 0) {
				doc.fontSize(14).text('Vulnerable Libraries', { underline: true });
				doc.moveDown();

				vulnerableLibraries.forEach((lib, index) => {
					doc.fontSize(11).text(`${index + 1}. ${lib.library} v${lib.version}`);
					doc.fontSize(10).text(`   CVE: ${lib.cveId}`);
					doc.text(`   CVSS Score: ${lib.cvssScore}`);
					doc.text(`   Remediation Available: ${lib.remediationAvailable ? 'Yes' : 'No'}`);
					if (lib.configurationNotes) {
						doc.text(`   Notes: ${lib.configurationNotes}`);
					}
					doc.moveDown(0.5);
				});
			} else {
				doc.fontSize(12).text('No vulnerabilities found.');
			}

			doc.end();
			logger.info(`PDF export completed for scan: ${scanId}`);
		} catch (pdfError) {
			logger.error(`PDF generation failed: ${pdfError.message}`);
			throw new Error(`PDF generation failed: ${pdfError.message}`);
		}
	} else if (format === 'csv') {
		logger.info(`Generating CSV export for scan: ${scanId}`);

		const csvData = [
			['Library', 'Version', 'CVE ID', 'CVSS Score', 'Affected Versions', 'Remediation Available', 'Configuration Notes'],
			...vulnerableLibraries.map(lib => [
				lib.library,
				lib.version,
				lib.cveId,
				lib.cvssScore,
				lib.affectedVersions,
				lib.remediationAvailable ? 'Yes' : 'No',
				lib.configurationNotes || '',
			]),
		];

		logger.info(`CSV data prepared: ${csvData.length} rows (including header)`);

		stringify(csvData, (err, output) => {
			if (err) {
				logger.error(`CSV generation failed: ${err.message}`);
				throw new Error(`CSV generation failed: ${err.message}`);
			}

			logger.info(`CSV generated successfully, size: ${output.length} bytes`);

			// Set proper headers for CSV file download
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', `attachment; filename="scan-${scanId}.csv"`);
			res.setHeader('X-Content-Type-Options', 'nosniff');
			res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
			res.setHeader('Pragma', 'no-cache');
			res.setHeader('Expires', '0');

			// Send raw CSV data, not JSON
			res.send(output);

			logger.info(`CSV export completed for scan: ${scanId}`);
		});
	}
});

export default router;