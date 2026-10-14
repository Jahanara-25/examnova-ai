function evaluationStatusFor(submission, evaluatedSubmissionIds) {
  if (evaluatedSubmissionIds.has(String(submission._id))) return 'evaluated';
  return submission.evaluationStatus === 'saved' ? 'saved' : 'pending';
}

module.exports = evaluationStatusFor;
