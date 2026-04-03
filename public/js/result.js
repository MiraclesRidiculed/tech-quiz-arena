document.addEventListener('DOMContentLoaded', async () => {
	const timeStartedElement = document.getElementById('timeStarted');
	const timeEndedElement = document.getElementById('timeEnded');
	const durationElement = document.getElementById('duration');
	const scoreElement = document.getElementById('score');
	const instructionsElement = document.getElementById('instructions');

	function formatTime(value) {
		if (!value) {
			return 'Not available';
		}

		return new Date(value).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	}

	function formatDuration(durationMs) {
		if (typeof durationMs !== 'number' || Number.isNaN(durationMs)) {
			return 'Not available';
		}

		const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		return `${minutes} minute(s), ${seconds} second(s)`;
	}

	try {
		const stats = await window.quizApi.requestJson('/api/results');

		timeStartedElement.textContent = formatTime(stats.timeStarted);
		timeEndedElement.textContent = formatTime(stats.timeEnded);
		durationElement.textContent = formatDuration(stats.duration);
		scoreElement.textContent = String(stats.score ?? 0);
		instructionsElement.textContent = `Questions answered: ${stats.answeredQuestions ?? 0}`;
	} catch (error) {
		console.error(error);
		instructionsElement.textContent =
			'Unable to load the results right now. Please refresh the page.';
	}
});
