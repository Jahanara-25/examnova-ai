const express = require('express');
const mongoose = require('mongoose');
const Exam = require('../models/exam');
const Question = require('../models/question');
const Submission = require('../models/submission');
const Notification = require('../models/notification');
const multer = require('multer');
const path = require('path');
const { requireAuth, allowRoles } = require('../middleware/auth');
const router = express.Router();
const { notifyOnce } = require('../lib/notifications');
const validId = (id) => mongoose.isValidObjectId(id);
const teacherOnly = [requireAuth, allowRoles('teacher')];
const upload = multer({ dest: path.join(__dirname, '..', 'uploads'), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) });
const examFields = ['title', 'description', 'subject', 'department', 'duration', 'totalMarks', 'startDate', 'endDate', 'instructions'];
const pickExam = (body) => Object.fromEntries(examFields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
const normalized = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-IN');
const kolkataTime = (value) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short', hour12: false }).format(new Date(value));
async function migrateLegacyTimes() {
  const legacy = await Exam.find({ timezoneVersion: { $ne: 'ist-v1' } });
  if (!legacy.length) return;
  await Promise.all(legacy.map(async (exam) => { exam.startDate = new Date(exam.startDate.getTime() - 5.5 * 60 * 60 * 1000); exam.endDate = new Date(exam.endDate.getTime() - 5.5 * 60 * 60 * 1000); exam.timezoneVersion = 'ist-v1'; await exam.save(); await Notification.updateMany({ title: 'Exam published', message: { $regex: String(exam.title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } }, { $set: { message: `${exam.title} starts ${kolkataTime(exam.startDate)} IST.` } }); }));
}

function validExam(body) {
  const { title, subject, department, duration, totalMarks, startDate, endDate } = body;
  return title && subject && department && Number(duration) > 0 && Number(totalMarks) > 0 && new Date(startDate) < new Date(endDate);
}
router.post('/', ...teacherOnly, async (req,res) => { try {
  if (!validExam(req.body)) return res.status(400).json({message:'Provide title, subject, department, marks, duration, and valid dates'});
  const exam = await Exam.create({...pickExam(req.body), duration:Number(req.body.duration), totalMarks:Number(req.body.totalMarks), createdBy:req.user._id, status:'draft', timezoneVersion:'ist-v1'});
  res.status(201).json({exam});
} catch(e){res.status(400).json({message:'Unable to create exam'});} });
router.get('/mine', ...teacherOnly, async(req,res)=>{await migrateLegacyTimes();res.json({exams:await Exam.find({createdBy:req.user._id}).sort({createdAt:-1})});});
router.get('/available', requireAuth, allowRoles('student'), async(req,res)=>{
 await migrateLegacyTimes();
 const studentDepartment=normalized(req.user.department);
 if (!studentDepartment) return res.json({exams:[]});
 // Do not filter by time here: published exams remain visible as upcoming/live/ended.
 const published=await Exam.find({status:'published'}).populate('createdBy','name').sort({startDate:1});
 const exams=published.filter(exam=>normalized(exam.department)===studentDepartment || (Array.isArray(exam.eligibility) && exam.eligibility.some(value=>normalized(value)===studentDepartment))).map(exam=>({
   ...exam.toObject(), createdBy: exam.createdBy ? { name: exam.createdBy.name } : undefined,
   availability: new Date() < exam.startDate ? 'upcoming' : new Date() > exam.endDate ? 'ended' : 'live',
 }));
 const attempts=await Submission.find({studentId:req.user._id,examId:{$in:exams.map(exam=>exam._id)}}).select('examId status');
 const attemptStates=new Map(attempts.map(attempt=>[String(attempt.examId),attempt.status]));
 exams.forEach(exam=>{exam.attemptStatus=attemptStates.get(String(exam._id))||'not_started';});
 res.json({exams});
});
router.get('/:id', requireAuth, async(req,res)=>{ await migrateLegacyTimes(); if(!validId(req.params.id)) return res.status(400).json({message:'Invalid exam'}); const exam=await Exam.findById(req.params.id); if(!exam)return res.status(404).json({message:'Exam not found'}); if(req.user.role==='teacher'&&String(exam.createdBy)!==String(req.user._id))return res.status(403).json({message:'Not your exam'}); if(req.user.role==='student'&&(exam.status!=='published'||normalized(exam.department)!==normalized(req.user.department)))return res.status(403).json({message:'Exam unavailable'}); res.json({exam}); });
router.patch('/:id', ...teacherOnly, async(req,res)=>{ const exam=await Exam.findOne({_id:req.params.id,createdBy:req.user._id}); if(!exam)return res.status(404).json({message:'Exam not found'}); if(exam.status!=='draft')return res.status(400).json({message:'Only draft exams can be edited'}); Object.assign(exam,pickExam(req.body)); if(!validExam(exam))return res.status(400).json({message:'Invalid exam settings'}); await exam.save();res.json({exam}); });
router.post('/:id/paper', ...teacherOnly, upload.single('paper'), async(req,res)=>{const exam=await Exam.findOne({_id:req.params.id,createdBy:req.user._id,status:'draft'});if(!exam)return res.status(404).json({message:'Draft exam not found'});if(!req.file)return res.status(400).json({message:'Upload a PDF, DOC, or DOCX file'});exam.questionPaper={filename:req.file.filename,originalName:req.file.originalname,mimeType:req.file.mimetype,size:req.file.size,uploadedAt:new Date()};await exam.save();res.json({exam});});
router.delete('/:id/paper',...teacherOnly,async(req,res)=>{const exam=await Exam.findOne({_id:req.params.id,createdBy:req.user._id,status:'draft'});if(!exam)return res.status(404).json({message:'Draft exam not found'});exam.questionPaper=undefined;await exam.save();res.status(204).end();});
router.post('/:id/publish', ...teacherOnly, async(req,res)=>{const exam=await Exam.findOne({_id:req.params.id,createdBy:req.user._id});if(!exam)return res.status(404).json({message:'Exam not found'});const alreadyPublished=exam.status==='published';if(exam.status!=='draft'&&!alreadyPublished)return res.status(400).json({message:'Only draft exams can be published'});const questions=await Question.find({examId:exam._id});const marks=questions.reduce((n,q)=>n+q.marks,0);if(!validExam(exam))return res.status(400).json({message:'Exam configuration is invalid'});if(!questions.length)return res.status(400).json({message:'Attach at least one question before publishing'});if(marks!==exam.totalMarks)return res.status(400).json({message:`Exam cannot be published. Attached questions total ${marks} marks, but exam total marks is ${exam.totalMarks}.`});if(!alreadyPublished){exam.status='published';await exam.save();}const students=await require('../models/user').find({role:'student'}).select('_id department');const eligibleStudents=students.filter(s=>normalized(s.department)===normalized(exam.department)||(Array.isArray(exam.eligibility)&&exam.eligibility.some(value=>normalized(value)===normalized(s.department))));if(eligibleStudents.length)await Promise.all(eligibleStudents.map(s=>notifyOnce({userId:s._id,eventKey:'exam-published:'+exam._id+':'+s._id,examId:exam._id,title:'Exam published',message:`${exam.title} starts ${kolkataTime(exam.startDate)} IST.`,link:'/student/exam-schedule'})));res.json({exam,alreadyPublished});});
router.post('/:id/close',...teacherOnly,async(req,res)=>{const exam=await Exam.findOneAndUpdate({_id:req.params.id,createdBy:req.user._id},{status:'closed'},{new:true});if(!exam)return res.status(404).json({message:'Exam not found'});res.json({exam});});
module.exports=router;

