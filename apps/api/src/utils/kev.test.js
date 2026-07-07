import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapKevEntry, kevPriority, matchLibraries } from './kev.js';

// A representative entry shaped exactly like the real CISA KEV feed.
const sampleFeedEntry = {
	cveID: 'CVE-2026-45659',
	vendorProject: 'Microsoft',
	product: 'SharePoint Server',
	vulnerabilityName: 'Microsoft SharePoint Server Deserialization Vulnerability',
	dateAdded: '2026-07-01',
	shortDescription: 'Contains a deserialization of untrusted data vulnerability.',
	requiredAction: 'Apply mitigations per vendor instructions.',
	dueDate: '2026-07-22',
	knownRansomwareCampaignUse: 'Unknown',
	cwes: ['CWE-502'],
};

test('mapKevEntry maps real feed fields onto the collection columns', () => {
	const mapped = mapKevEntry(sampleFeedEntry);
	assert.equal(mapped.vulnerabilityId, 'CVE-2026-45659');
	assert.equal(mapped.productName, 'Microsoft SharePoint Server');
	assert.equal(mapped.publicationDate, '2026-07-01');
	assert.equal(mapped.remediationGuidance, 'Apply mitigations per vendor instructions.');
	assert.equal(mapped.configurationNotes, 'Contains a deserialization of untrusted data vulnerability.');
	// KEV supplies neither versions nor CVSS — assert we don't fabricate them.
	assert.deepEqual(mapped.affectedVersions, []);
	assert.equal(mapped.cvssScore, null);
});

test('mapKevEntry returns null for entries missing cveID or product', () => {
	assert.equal(mapKevEntry({ product: 'Thing' }), null);
	assert.equal(mapKevEntry({ cveID: 'CVE-1' }), null);
	assert.equal(mapKevEntry(null), null);
});

test('mapKevEntry falls back to product name when vendorProject is absent', () => {
	const mapped = mapKevEntry({ cveID: 'CVE-1', product: 'Struts' });
	assert.equal(mapped.productName, 'Struts');
});

test('kevPriority flags known ransomware use as patch-now', () => {
	const entry = { knownRansomwareCampaignUse: 'Known', dueDate: '2099-01-01' };
	assert.equal(kevPriority(entry), 'patch-now');
});

test('kevPriority treats a past due date as patch-now and a future one as patch-soon', () => {
	const now = new Date('2026-07-10T00:00:00Z');
	assert.equal(kevPriority({ dueDate: '2026-07-01' }, now), 'patch-now');
	assert.equal(kevPriority({ dueDate: '2026-07-22' }, now), 'patch-soon');
});

test('kevPriority defaults to monitor with no stronger signal', () => {
	assert.equal(kevPriority({ knownRansomwareCampaignUse: 'Unknown' }), 'monitor');
});

test('matchLibraries matches on product name case-insensitively', () => {
	const kevRecords = [mapKevEntry(sampleFeedEntry)];
	const libraries = [
		{ name: 'microsoft sharepoint server', version: '2019' }, // different case
		{ name: 'react', version: '18.3.1' }, // not in KEV
	];

	const matches = matchLibraries(libraries, kevRecords);
	assert.equal(matches.length, 1);
	assert.equal(matches[0].cveId, 'CVE-2026-45659');
	assert.equal(matches[0].library, 'microsoft sharepoint server');
	assert.equal(matches[0].remediationAvailable, true);
});

test('matchLibraries returns one row per matching CVE for a product', () => {
	const kevRecords = [
		mapKevEntry({ ...sampleFeedEntry, cveID: 'CVE-2026-1' }),
		mapKevEntry({ ...sampleFeedEntry, cveID: 'CVE-2026-2' }),
	];
	const matches = matchLibraries([{ name: 'Microsoft SharePoint Server', version: '2019' }], kevRecords);
	assert.equal(matches.length, 2);
	assert.deepEqual(matches.map((m) => m.cveId).sort(), ['CVE-2026-1', 'CVE-2026-2']);
});

test('matchLibraries returns nothing when the catalog is empty', () => {
	assert.deepEqual(matchLibraries([{ name: 'anything', version: '1' }], []), []);
});
