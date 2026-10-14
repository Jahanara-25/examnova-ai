const mongoose = require('mongoose');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const BUCKET_NAME = 'examRecordings';
const CHUNK_SIZE_BYTES = 255 * 1024;

function retentionDays(env = process.env) {
  const days = Number(env.RECORDING_RETENTION_DAYS);
  return Number.isInteger(days) && days > 0 ? days : null;
}

function productionApproved(env = process.env) {
  return env.NODE_ENV !== 'production' || env.RECORDING_PRODUCTION_APPROVED === 'true';
}

function config() {
  const days = retentionDays();
  if (!mongoose.connection.db || mongoose.connection.readyState !== 1 || !days) return null;
  if (!productionApproved()) return null;
  return { bucketName: BUCKET_NAME, retentionDays: days };
}

function isConnected() {
  return Boolean(mongoose.connection.db && mongoose.connection.readyState === 1);
}

function missingConfiguration() {
  const missing = [];
  if (!mongoose.connection.db || mongoose.connection.readyState !== 1) missing.push('MongoDB connection');
  if (!retentionDays()) missing.push('RECORDING_RETENTION_DAYS');
  if (!productionApproved()) missing.push('RECORDING_PRODUCTION_APPROVED=true (production policy and security approval)');
  return missing;
}

function bucket({ requireRecordingConfig = true } = {}) {
  if (!isConnected() || (requireRecordingConfig && !config())) throw new Error('GridFS is unavailable: check the MongoDB connection and recording policy configuration');
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME, chunkSizeBytes: CHUNK_SIZE_BYTES });
}

async function filesForKey(key) {
  return bucket().find({ filename: key }).sort({ uploadDate: -1 }).toArray();
}

async function put(key, body, contentType, metadata = {}) {
  const target = bucket();
  for (const file of await target.find({ filename: key }).toArray()) await target.delete(file._id);
  const upload = target.openUploadStream(key, { metadata: { ...metadata, storageKey: key, contentType } });
  try {
    await pipeline(Readable.from([body]), upload);
    return upload.id;
  } catch (error) {
    if (typeof upload.abort === 'function') await upload.abort().catch(() => {});
    throw error;
  }
}

async function get(key, fileId) {
  if (fileId && mongoose.isValidObjectId(fileId)) return bucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));
  const files = await filesForKey(key);
  if (!files.length) throw new Error('GridFS recording chunk was not found');
  return bucket().openDownloadStream(files[0]._id);
}

async function head(key, fileId) {
  const files = fileId && mongoose.isValidObjectId(fileId)
    ? await bucket().find({ _id: new mongoose.Types.ObjectId(fileId) }).limit(1).toArray()
    : await filesForKey(key);
  return files.length ? Number(files[0].length) : null;
}

async function remove(key, fileId) {
  const target = bucket({ requireRecordingConfig: false });
  if (fileId && mongoose.isValidObjectId(fileId)) {
    try { await target.delete(new mongoose.Types.ObjectId(fileId)); } catch (error) { if (error.code !== 26 && !/not found/i.test(error.message)) throw error; }
  }
  for (const file of await target.find({ filename: key }).toArray()) await target.delete(file._id);
}

module.exports = { BUCKET_NAME, CHUNK_SIZE_BYTES, retentionDays, productionApproved, isConnected, config, missingConfiguration, put, get, head, remove };
