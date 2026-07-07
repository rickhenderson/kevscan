import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractBearerToken } from './auth.js';

test('extractBearerToken pulls the token from a Bearer header', () => {
	assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
});

test('extractBearerToken is case-insensitive on the scheme', () => {
	assert.equal(extractBearerToken('bearer abc.def.ghi'), 'abc.def.ghi');
});

test('extractBearerToken accepts a bare token without a scheme', () => {
	assert.equal(extractBearerToken('abc.def.ghi'), 'abc.def.ghi');
});

test('extractBearerToken trims surrounding whitespace', () => {
	assert.equal(extractBearerToken('  Bearer   abc.def.ghi  '), 'abc.def.ghi');
});

test('extractBearerToken returns null for missing or empty values', () => {
	assert.equal(extractBearerToken(''), null);
	assert.equal(extractBearerToken('   '), null);
	assert.equal(extractBearerToken(undefined), null);
	assert.equal(extractBearerToken(null), null);
	assert.equal(extractBearerToken('Bearer '), null);
});
