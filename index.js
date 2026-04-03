const crypto = require('crypto');
const express = require('express');
const path = require('path');
const constants = require('./info/constants');
const {
	createGameSession,
	finishSession,
	getNextQuestion,
	getResultInfo,
	submitAnswer,
	touchSession,
} = require('./lib/game-session');

const app = express();
const sessionStore = new Map();
const publicDirectory = path.join(__dirname, 'public');
const pagesDirectory = path.join(publicDirectory, 'webpages');

app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(publicDirectory));

function parseCookies(cookieHeader = '') {
	return cookieHeader
		.split(';')
		.map((cookie) => cookie.trim())
		.filter(Boolean)
		.reduce((cookies, entry) => {
			const separatorIndex = entry.indexOf('=');
			const key = entry.slice(0, separatorIndex);
			const value = entry.slice(separatorIndex + 1);

			if (separatorIndex > 0) {
				cookies[key] = decodeURIComponent(value);
			}

			return cookies;
		}, {});
}

function pruneExpiredSessions(now = Date.now()) {
	for (const [sessionId, session] of sessionStore.entries()) {
		if (now - session.lastTouchedAt > constants.sessionTtlMs) {
			sessionStore.delete(sessionId);
		}
	}
}

function setSessionCookie(res, sessionId) {
	res.setHeader(
		'Set-Cookie',
		`${constants.sessionCookieName}=${encodeURIComponent(
			sessionId
		)}; HttpOnly; Path=/; SameSite=Lax`
	);
}

function getSessionId(req) {
	const cookies = parseCookies(req.headers.cookie);
	return cookies[constants.sessionCookieName] ?? null;
}

function getSession(req, res) {
	pruneExpiredSessions();

	const sessionId = getSessionId(req);
	if (!sessionId || !sessionStore.has(sessionId)) {
		return null;
	}

	const session = touchSession(sessionStore.get(sessionId));
	setSessionCookie(res, sessionId);
	return session;
}

function createOrResetSession(req, res, startedAt = Date.now()) {
	pruneExpiredSessions(startedAt);

	const sessionId = getSessionId(req) ?? crypto.randomUUID();
	const session = createGameSession(startedAt);

	sessionStore.set(sessionId, session);
	setSessionCookie(res, sessionId);

	return session;
}

function ensureSession(req, res, { autoCreate = false } = {}) {
	const session = getSession(req, res);

	if (session || !autoCreate) {
		return session;
	}

	return createOrResetSession(req, res);
}

function sendPage(pageName) {
	return (_, res) => {
		res.sendFile(path.join(pagesDirectory, pageName));
	};
}

function respondWithMissingSession(res) {
	res.status(409).json({
		error: 'No active game session was found. Start from the hangman round first.',
	});
}

function getTimestamp(value) {
	const numericValue = Number(value);
	return Number.isFinite(numericValue) && numericValue > 0
		? numericValue
		: Date.now();
}

app.get('/', (_, res) => {
	res.redirect('/home');
});

app.get('/home', sendPage('home.html'));
app.get('/hangman', sendPage('hangman.html'));
app.get('/quiz', sendPage('quiz.html'));
app.get('/quizinfo', sendPage('transition.html'));
app.get('/result', sendPage('result.html'));

app.post('/api/session/start', (req, res) => {
	const startedAt = getTimestamp(req.body?.startedAt);
	const session = createOrResetSession(req, res, startedAt);

	res.json({
		timeStarted: session.startedAt,
		quizDurationMs: constants.quizDurationMs,
		totalQuestions: constants.totalQuizQuestions,
	});
});

app.get('/api/quiz/question', (req, res) => {
	const session = ensureSession(req, res, { autoCreate: true });
	const nextQuestion = getNextQuestion(session);

	if (!nextQuestion) {
		finishSession(session);
		return res.status(404).json({
			error: 'No questions remaining.',
			isComplete: true,
		});
	}

	res.json(nextQuestion);
});

app.post('/api/quiz/answer', (req, res) => {
	const session = getSession(req, res);
	if (!session) {
		return respondWithMissingSession(res);
	}

	if (typeof req.body?.userAnswer !== 'string') {
		return res.status(400).json({
			error: '`userAnswer` must be provided in the request body.',
		});
	}

	const result = submitAnswer(session, req.body.userAnswer);
	if (result.error) {
		return res.status(409).json(result);
	}

	if (result.isComplete) {
		finishSession(session);
	}

	res.json(result);
});

app.post('/api/quiz/finish', (req, res) => {
	const session = getSession(req, res);
	if (!session) {
		return respondWithMissingSession(res);
	}

	const finishedSession = finishSession(session, getTimestamp(req.body?.timeEnded));
	res.json(getResultInfo(finishedSession));
});

app.get('/api/results', (req, res) => {
	const session = getSession(req, res);
	if (!session) {
		return res.json({
			timeStarted: null,
			timeEnded: null,
			duration: null,
			score: 0,
			answeredQuestions: 0,
		});
	}

	res.json(getResultInfo(session));
});

if (require.main === module) {
	app.listen(constants.port, () => {
		console.log(`Client application running at http://localhost:${constants.port}/`);
	});
}

module.exports = {
	app,
	sessionStore,
};
