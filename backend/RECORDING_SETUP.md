# Recording storage with MongoDB GridFS

The application stores webcam video chunks in the existing MongoDB database, using the existing Mongoose connection. It requests no microphone permission and records no audio. It creates a GridFS bucket named `examRecordings`, with the standard `examRecordings.files` and `examRecordings.chunks` collections. Each acknowledged browser MediaRecorder fragment is a separate GridFS file; its GridFS file ID is referenced by the `RecordingChunk` metadata record, and GridFS metadata records the storage key, content type, student, exam, attempt, recording session, and sequence. Playback streams the stored fragments back in sequence. The application does not place video binaries in ordinary user, exam, submission, or recording-session documents.

## Local/demo configuration

No separate object-storage account or credentials are required. Keep the existing `MONGODB_URI` and database name unchanged. `RECORDING_RETENTION_DAYS` must be a positive integer; this environment has approval for 30 days and uses `RECORDING_RETENTION_DAYS=30`. Restart the backend after changing its environment.

The existing authentication uses `JWT_SECRET` (or legacy `JWT_KEY`). A locally generated `JWT_SECRET` is present in the ignored `backend/.env` for this demo; it is not committed or printed. After restarting the backend with a changed signing key, sign in again so the browser receives a token signed with the active key. Keep the key private and use a separate secret in each deployment environment.

GridFS is enabled only when the existing MongoDB connection is connected and a valid retention duration is configured. If either condition is missing, the policy endpoint reports the missing requirement and exam start remains blocked. The existing backend hourly cleanup removes expired GridFS files and recording metadata; it does not drop collections or reset the database.

## Production gate

Production recording remains disabled unless `RECORDING_PRODUCTION_APPROVED=true` is explicitly set. Do not set that flag until the institution has approved retention and consent policy, the MongoDB deployment is private and encrypted, access is restricted to the backend identity, transport uses TLS, and backup/access controls are reviewed. A production approval flag does not configure or validate those controls by itself.

## Capacity and backups

GridFS splits stored files into MongoDB documents in its `files` and `chunks` collections. The bucket uses 255 KiB GridFS chunks. Camera capture requests 640×360 at 15 fps (bounded at 1280×720 and 24 fps) and asks MediaRecorder for approximately 1.2 Mbps; browsers and camera devices may negotiate different values. At 1.2 Mbps, raw video is about 9 MB per minute or 540 MB per hour, before container overhead. Three-second MediaRecorder fragments are stored in order as independent GridFS files and are streamed in sequence for playback; they are not treated as individually playable videos. Recording bytes consume the same database storage quota as other MongoDB data and are included in database backups. Storage is not unlimited or automatically free. Monitor database storage, backup size, and restore duration before production use.
