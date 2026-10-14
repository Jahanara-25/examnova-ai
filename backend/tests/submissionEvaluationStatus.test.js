const test = require('node:test');
const assert = require('node:assert/strict');
const evaluationStatusFor = require('../lib/evaluationStatus');

test('submitted objective-only exams remain pending until a teacher publishes a result', () => {
  assert.equal(evaluationStatusFor({ _id: 'attempt-1', evaluationStatus: 'evaluated' }, new Set()), 'pending');
});

test('a saved draft stays unfinished, and only a persisted published result means evaluated', () => {
  assert.equal(evaluationStatusFor({ _id: 'attempt-1', evaluationStatus: 'saved' }, new Set()), 'saved');
  assert.equal(evaluationStatusFor({ _id: 'attempt-1', evaluationStatus: 'pending' }, new Set(['attempt-1'])), 'evaluated');
});
