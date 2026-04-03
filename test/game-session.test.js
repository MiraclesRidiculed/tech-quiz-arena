const test = require('node:test');
const assert = require('node:assert/strict');
const {
	finishSession,
	getNextQuestion,
	getResultInfo,
	submitAnswer,
} = require('../lib/game-session');

function createSession(overrides = {}) {
	return {
		startedAt: 1_000,
		endedAt: null,
		score: 0,
		streak: 0,
		answeredQuestions: 0,
		pendingQuestion: null,
		questionPool: [],
		superQuestionPool: [],
		lastTouchedAt: 1_000,
		...overrides,
	};
}

test('submitAnswer awards streak-based points for regular questions', () => {
	const session = createSession({
		pendingQuestion: {
			question: 'Question',
			options: ['Answer'],
			answer: 'Answer',
			isSuperQuestion: false,
		},
	});

	const result = submitAnswer(session, ' answer ');

	assert.equal(result.isCorrect, true);
	assert.equal(result.pointsAwarded, 10);
	assert.equal(session.score, 10);
	assert.equal(session.streak, 1);
	assert.equal(session.answeredQuestions, 1);
	assert.equal(session.pendingQuestion, null);
});

test('submitAnswer resets streak and awards bonus points for super questions', () => {
	const session = createSession({
		score: 40,
		streak: 4,
		pendingQuestion: {
			question: 'Super',
			options: ['Heap'],
			answer: 'Heap',
			isSuperQuestion: true,
		},
	});

	const result = submitAnswer(session, 'Heap');

	assert.equal(result.isCorrect, true);
	assert.equal(result.pointsAwarded, 100);
	assert.equal(session.score, 140);
	assert.equal(session.streak, 0);
});

test('getNextQuestion prioritizes super questions when the streak threshold is reached', () => {
	const session = createSession({
		streak: 4,
		superQuestionPool: [
			{
				question: 'What is a heap?',
				options: ['Stack', 'Queue', 'Heap'],
				answer: 'Heap',
			},
		],
	});

	const question = getNextQuestion(session);

	assert.equal(question.isSuperQuestion, true);
	assert.match(question.question, /^Super Question:/);
	assert.equal(question.streak, '10x');
});

test('finishSession and getResultInfo compute duration from start and end times', () => {
	const session = createSession({
		score: 150,
		answeredQuestions: 12,
	});

	finishSession(session, 61_000);
	const result = getResultInfo(session);

	assert.equal(result.timeStarted, 1_000);
	assert.equal(result.timeEnded, 61_000);
	assert.equal(result.duration, 60_000);
	assert.equal(result.score, 150);
	assert.equal(result.answeredQuestions, 12);
});
