function scoreObjectiveAnswers(questions, answers) {
  let objectiveMarks = 0;
  const scoredAnswers = answers.map((answer) => {
    const question = questions.find((item) => String(item._id) === String(answer.questionId));
    if (question?.questionType !== 'mcq') return { ...answer, marksAwarded: null };
    const marksAwarded = question.correctAnswer === answer.selectedAnswer ? Number(question.marks) : 0;
    objectiveMarks += marksAwarded;
    return { ...answer, marksAwarded };
  });
  return { answers: scoredAnswers, objectiveMarks };
}

module.exports = { scoreObjectiveAnswers };
