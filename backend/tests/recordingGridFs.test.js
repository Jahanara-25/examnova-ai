const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const storage = require('../lib/gridFsStorage');
const { normalizedMediaType, matchesMediaType } = require('../routes/recordingRoutes');

test('the installed MongoDB driver exposes GridFS through the existing Mongoose dependency', () => {
  assert.equal(typeof mongoose.mongo.GridFSBucket, 'function');
  assert.equal(storage.BUCKET_NAME, 'examRecordings');
  assert.equal(storage.CHUNK_SIZE_BYTES, 255 * 1024);
});

test('recording retention must be a positive whole number', () => {
  assert.equal(storage.retentionDays({ RECORDING_RETENTION_DAYS: '30' }), 30);
  assert.equal(storage.retentionDays({ RECORDING_RETENTION_DAYS: '' }), null);
  assert.equal(storage.retentionDays({ RECORDING_RETENTION_DAYS: '0' }), null);
  assert.equal(storage.retentionDays({ RECORDING_RETENTION_DAYS: '30.5' }), null);
});

test('production recording is disabled unless explicitly approved', () => {
  assert.equal(storage.productionApproved({ NODE_ENV: 'production', RECORDING_PRODUCTION_APPROVED: 'false' }), false);
  assert.equal(storage.productionApproved({ NODE_ENV: 'production', RECORDING_PRODUCTION_APPROVED: 'true' }), true);
  assert.equal(storage.productionApproved({ NODE_ENV: 'development' }), true);
});

test('GridFS refuses to claim readiness without the existing MongoDB connection', () => {
  const previous = process.env.RECORDING_RETENTION_DAYS;
  process.env.RECORDING_RETENTION_DAYS = '30';
  try {
    assert.equal(storage.config(), null);
    assert.ok(storage.missingConfiguration().includes('MongoDB connection'));
  } finally {
    if (previous === undefined) delete process.env.RECORDING_RETENTION_DAYS;
    else process.env.RECORDING_RETENTION_DAYS = previous;
  }
});

test('MediaRecorder codec parameters are accepted while the container signature is checked', () => {
  assert.equal(normalizedMediaType('video/webm;codecs=vp8,opus'), 'video/webm');
  assert.equal(normalizedMediaType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'), 'video/mp4');
  assert.equal(matchesMediaType({ mimetype: 'video/webm;codecs=vp8,opus', buffer: Buffer.from([0x1a, 0x45, 0xdf, 0xa3]) }), true);
  assert.equal(matchesMediaType({ mimetype: 'video/webm;codecs=vp8,opus', buffer: Buffer.from('nope') }), false);
});
