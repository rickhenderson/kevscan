// KEV ingestion + matching logic.
//
// These are the two pieces a reviewer most wants to be able to follow, so they
// live here as small, pure, unit-tested functions instead of being buried in
// the Express route handlers.
//
// Important reality check about the data source: the CISA KEV catalog
// (https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json)
// is a list of *products* known to contain *actively exploited* CVEs. Each
// entry looks like:
//
//   {
//     "cveID": "CVE-2026-45659",
//     "vendorProject": "Microsoft",
//     "product": "SharePoint Server",
//     "vulnerabilityName": "...",
//     "dateAdded": "2026-07-01",
//     "shortDescription": "...",
//     "requiredAction": "Apply mitigations per vendor instructions ...",
//     "dueDate": "2026-07-22",
//     "knownRansomwareCampaignUse": "Known" | "Unknown",
//     "cwes": ["CWE-502"]
//   }
//
// Note what it does NOT contain: no per-version data and no CVSS score. Matching
// is therefore at product granularity, and priority is derived from KEV-native
// signals (ransomware use, remediation due date) rather than a CVSS number the
// feed never provides.

/**
 * Map one raw CISA KEV feed entry onto the `cisa_kev_vulnerabilities`
 * collection's actual columns. Returns null for entries missing the fields we
 * key on, so callers can skip them rather than writing junk rows.
 */
export function mapKevEntry(vuln) {
	if (!vuln || !vuln.cveID || !vuln.product) {
		return null;
	}

	return {
		// vulnerabilityId is the unique-indexed column used for upserts.
		vulnerabilityId: vuln.cveID,
		// Store the vendor-qualified product name so "SharePoint Server" from
		// Microsoft doesn't collide with an unrelated product of the same name.
		productName: vuln.vendorProject
			? `${vuln.vendorProject} ${vuln.product}`
			: vuln.product,
		// KEV has no version data; keep the column but leave it empty rather than
		// implying a precision the feed doesn't have.
		affectedVersions: [],
		// KEV carries no CVSS score. Left null (not 0, which would read as
		// "informational") so the UI shows "N/A" instead of a fake number.
		cvssScore: null,
		publicationDate: vuln.dateAdded || '',
		remediationGuidance: vuln.requiredAction || '',
		configurationNotes: vuln.shortDescription || '',
		lastUpdated: new Date().toISOString(),
	};
}

/**
 * Derive a coarse remediation priority from KEV-native signals.
 * Every KEV entry is already "actively exploited", so the floor is high:
 *  - "patch-now"   — known ransomware campaign use, or remediation past due
 *  - "patch-soon"  — has a CISA due date still in the future
 *  - "monitor"     — on KEV but no stronger signal available
 */
export function kevPriority(entry, now = new Date()) {
	if (entry?.knownRansomwareCampaignUse === 'Known') {
		return 'patch-now';
	}

	if (entry?.dueDate) {
		const due = new Date(entry.dueDate);
		if (!Number.isNaN(due.getTime())) {
			return due.getTime() < now.getTime() ? 'patch-now' : 'patch-soon';
		}
	}

	return 'monitor';
}

/**
 * Match an uploaded library list against KEV records by product name.
 *
 * Matching is case-insensitive and exact on the product name. This is coarse
 * on purpose: KEV products ("SharePoint Server") don't share a namespace with
 * SBOM component names ("react"), so we match what we honestly can and flag the
 * limitation rather than fabricating version-level precision. Callers pass KEV
 * records already loaded from the database.
 *
 * @param {Array<{name: string, version: string}>} libraries
 * @param {Array<object>} kevRecords rows from cisa_kev_vulnerabilities
 * @returns {Array<object>} one entry per (library, matching CVE) pair
 */
export function matchLibraries(libraries, kevRecords) {
	const byProduct = new Map();
	for (const rec of kevRecords) {
		const key = String(rec.productName || '').trim().toLowerCase();
		if (!key) continue;
		if (!byProduct.has(key)) byProduct.set(key, []);
		byProduct.get(key).push(rec);
	}

	const matches = [];
	for (const lib of libraries) {
		const key = String(lib.name || '').trim().toLowerCase();
		const hits = byProduct.get(key);
		if (!hits) continue;

		for (const rec of hits) {
			matches.push({
				library: lib.name,
				version: lib.version,
				cveId: rec.vulnerabilityId,
				cvssScore: rec.cvssScore ?? null,
				affectedVersions: rec.affectedVersions ?? [],
				remediationAvailable: Boolean(rec.remediationGuidance),
				remediationGuidance: rec.remediationGuidance || '',
				configurationNotes: rec.configurationNotes || '',
				publicationDate: rec.publicationDate || '',
			});
		}
	}

	return matches;
}
