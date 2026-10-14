const express = require("express");
const cors = require("cors");
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const questionGenerationRoutes = require('./routes/questionGenerationRoutes');
const questionPaperRoutes = require('./routes/questionPaperRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const dataRoutes = require('./routes/dataRoutes');
const { router: recordingRoutes, purgeExpiredRecordings } = require('./routes/recordingRoutes');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (for example curl or server-to-server calls) are allowed.
    if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON' });
  }
  return next(error);
});

app.use("/api/auth", authRoutes);
app.use('/api/auth/password-reset', passwordResetRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/question-generation', questionGenerationRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api', dataRoutes);

app.get("/", (req, res) => {
  res.send("ExamNova AI Backend is Running Successfully 🚀");
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing from backend/.env');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully ✅");

    const retentionSweep = setInterval(() => purgeExpiredRecordings().catch((error) => console.error('Recording retention cleanup failed:', error.message)), 60 * 60 * 1000);
    retentionSweep.unref();
    purgeExpiredRecordings().catch((error) => console.error('Recording retention cleanup failed:', error.message));
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
  });
