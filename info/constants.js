const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);

module.exports = Object.freeze({
	port: Number.isNaN(parsedPort) ? 3000 : parsedPort,
	totalQuizQuestions: 50,
	quizDurationMs: 25 * 60 * 1000,
	baseQuestionPoints: 10,
	superQuestionTriggerStreak: 4,
	superQuestionMultiplier: 10,
	sessionCookieName: 'crackathon_session',
	sessionTtlMs: 2 * 60 * 60 * 1000,
});

