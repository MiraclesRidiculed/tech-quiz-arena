const constants = require('../info/constants');
const { questions, superQuestions } = require('../info/questions1');

function cloneQuestion(question) {
	return {
		question: question.question,
		options: [...question.options],
		answer: question.answer,
	};
}

function buildQuestionPool(source) {
	return source.map(cloneQuestion);
}

function shuffle(items) {
	const shuffled = [...items];

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
	}

	return shuffled;
}

function normalizeAnswer(value) {
	return String(value ?? '').trim().toLowerCase();
}

function createGameSession(startedAt = Date.now()) {
	return {
		startedAt,
		endedAt: null,
		score: 0,
		streak: 0,
		answeredQuestions: 0,
		pendingQuestion: null,
		questionPool: shuffle(buildQuestionPool(questions)),
		superQuestionPool: shuffle(buildQuestionPool(superQuestions)),
		lastTouchedAt: startedAt,
	};
}

function touchSession(session, now = Date.now()) {
	session.lastTouchedAt = now;
	return session;
}

function shouldAskSuperQuestion(session) {
	return (
		session.streak >= constants.superQuestionTriggerStreak &&
		session.superQuestionPool.length > 0
	);
}

function getQuestionLabel(session, isSuperQuestion) {
	if (isSuperQuestion) {
		return `${constants.superQuestionMultiplier}x`;
	}

	return `${session.streak + 1}x`;
}

function nextQuestionFromPool(pool) {
	return pool.pop() ?? null;
}

function getNextQuestion(session) {
	touchSession(session);

	if (session.answeredQuestions >= constants.totalQuizQuestions) {
		return null;
	}

	if (session.pendingQuestion) {
		return buildQuestionPayload(session, session.pendingQuestion);
	}

	const isSuperQuestion = shouldAskSuperQuestion(session);
	const pool = isSuperQuestion ? session.superQuestionPool : session.questionPool;
	const nextQuestion = nextQuestionFromPool(pool);

	if (!nextQuestion) {
		return null;
	}

	session.pendingQuestion = {
		...nextQuestion,
		isSuperQuestion,
	};

	return buildQuestionPayload(session, session.pendingQuestion);
}

function buildQuestionPayload(session, question) {
	return {
		question: question.isSuperQuestion
			? `Super Question: ${question.question}`
			: question.question,
		options: question.options,
		streak: getQuestionLabel(session, question.isSuperQuestion),
		questionNumber: session.answeredQuestions + 1,
		totalQuestions: constants.totalQuizQuestions,
		isSuperQuestion: question.isSuperQuestion,
	};
}

function awardPoints(session, question) {
	if (question.isSuperQuestion) {
		session.streak = 0;
		return constants.baseQuestionPoints * constants.superQuestionMultiplier;
	}

	session.streak += 1;
	return constants.baseQuestionPoints * session.streak;
}

function submitAnswer(session, userAnswer) {
	touchSession(session);

	if (!session.pendingQuestion) {
		return {
			error: 'No active question.',
		};
	}

	const isCorrect =
		normalizeAnswer(userAnswer) === normalizeAnswer(session.pendingQuestion.answer);

	let pointsAwarded = 0;

	if (isCorrect) {
		pointsAwarded = awardPoints(session, session.pendingQuestion);
		session.score += pointsAwarded;
	} else {
		session.streak = 0;
	}

	const result = {
		correctAnswer: session.pendingQuestion.answer,
		pointsAwarded,
		isCorrect,
		score: session.score,
		streak: session.streak,
	};

	session.pendingQuestion = null;
	session.answeredQuestions += 1;
	result.isComplete = session.answeredQuestions >= constants.totalQuizQuestions;

	return result;
}

function finishSession(session, endedAt = Date.now()) {
	touchSession(session, endedAt);

	if (!session.endedAt) {
		session.endedAt = endedAt;
	}

	return session;
}

function getResultInfo(session) {
	const endedAt = session.endedAt ?? null;
	const duration =
		session.startedAt && endedAt ? endedAt - session.startedAt : null;

	return {
		timeStarted: session.startedAt ?? null,
		timeEnded: endedAt,
		duration,
		score: session.score,
		answeredQuestions: session.answeredQuestions,
	};
}

module.exports = {
	createGameSession,
	finishSession,
	getNextQuestion,
	getResultInfo,
	submitAnswer,
	touchSession,
};
