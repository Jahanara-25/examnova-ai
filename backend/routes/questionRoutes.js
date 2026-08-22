const express = require('express');
const Question = require('../models/question');
const Exam = require('../models/exam');
const { requireAuth, allowRoles } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth, allowRoles('teacher'));
const fields = ['examId','questionText','questionType','options','correctAnswer','marks','explanation','order','subject','difficulty'];
const pick = body => Object.fromEntries(fields.filter(k => body[k] !== undefined).map(k => [k, body[k]]));
async function ownsExam(id, user) { return !id || await Exam.exists({ _id: id, createdBy: user._id, status: 'draft' }); }
function valid(q) { if (!q.questionText || Number(q.marks) <= 0) return false; if (q.questionType === 'descriptive') return true; return Array.isArray(q.options) && q.options.length === 4 && q.options.every(Boolean) && q.options.includes(q.correctAnswer); }
router.get('/', async (req,res) => { const filter={createdBy:req.user._id}; if(req.query.examId) filter.examId=req.query.examId; res.json({questions:await Question.find(filter).sort({order:1,createdAt:-1})}); });
router.post('/', async (req,res) => { try { const input=pick(req.body); input.marks=Number(input.marks); input.questionType=input.questionType || 'mcq'; if(!await ownsExam(input.examId,req.user)) return res.status(403).json({message:'Questions can only be attached to your draft exams'}); if(!valid(input)) return res.status(400).json({message:'Provide question text and positive marks; MCQs require four options and a correct answer'}); const question=await Question.create({...input, createdBy:req.user._id}); res.status(201).json({question}); } catch { res.status(400).json({message:'Unable to save question'}); } });
router.patch('/:id', async (req,res) => { const q=await Question.findOne({_id:req.params.id,createdBy:req.user._id}); if(!q) return res.status(404).json({message:'Question not found'}); const input=pick(req.body); if(!await ownsExam(input.examId || q.examId,req.user)) return res.status(403).json({message:'Questions on published exams cannot be changed'}); Object.assign(q,input); q.marks=Number(q.marks); if(!valid(q)) return res.status(400).json({message:'Invalid question'}); await q.save(); res.json({question:q}); });
router.delete('/:id', async (req,res) => { const q=await Question.findOne({_id:req.params.id,createdBy:req.user._id}); if(!q) return res.status(404).json({message:'Question not found'}); if(q.examId && !await ownsExam(q.examId,req.user)) return res.status(400).json({message:'Questions on published exams cannot be removed'}); await q.deleteOne(); res.status(204).end(); });
module.exports=router;
