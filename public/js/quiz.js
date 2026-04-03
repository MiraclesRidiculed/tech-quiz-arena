document.addEventListener('DOMContentLoaded', () => {
	const questionElement = document.getElementById('question');
	const answerButtons = document.getElementById('options');
	const statusElement = document.getElementById('status');
	const timerElement = document.getElementById('timer');
	const streakElement = document.getElementById('streak');
	const fallbackDurationMs = 25 * 60 * 1000;
	const quizDurationMs =
		Number(sessionStorage.getItem('quizDurationMs')) || fallbackDurationMs;

	const deadline = Date.now() + quizDurationMs;
	let countdownInterval = null;
	let isFinishing = false;
	let isSubmitting = false;

	function formatRemainingTime(remainingMs) {
		const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
			2,
			'0'
		)}`;
	}

	async function finishQuiz() {
		if (isFinishing) {
			return;
		}

		isFinishing = true;
		window.clearInterval(countdownInterval);

		try {
			await window.quizApi.postJson('/api/quiz/finish', {
				timeEnded: Date.now(),
			});
		} catch (error) {
			console.error(error);
		}

		window.location.assign('/result');
	}

	function updateTimer() {
		const remainingMs = deadline - Date.now();
		timerElement.textContent = formatRemainingTime(remainingMs);

		if (remainingMs <= 0) {
			finishQuiz();
		}
	}

	function disableAnswerButtons() {
		answerButtons.querySelectorAll('button').forEach((button) => {
			button.disabled = true;
		});
	}

	function highlightCorrectAnswer(correctAnswer) {
		answerButtons.querySelectorAll('button').forEach((button) => {
			if (button.textContent === correctAnswer) {
				button.classList.add('correct');
			}
		});
	}

	async function loadQuestion() {
		try {
			const question = await window.quizApi.requestJson('/api/quiz/question');
			questionElement.textContent = question.question;
			statusElement.textContent = `Question ${question.questionNumber} of ${question.totalQuestions}`;
			streakElement.textContent = question.streak;
			answerButtons.innerHTML = '';

			question.options.forEach((option) => {
				const button = document.createElement('button');
				button.type = 'button';
				button.textContent = option;
				button.className = 'answer-button';
				button.addEventListener('click', () => submitAnswer(option, button));
				answerButtons.appendChild(button);
			});
		} catch (error) {
			if (error.status === 404 && error.payload?.isComplete) {
				finishQuiz();
				return;
			}

			questionElement.textContent =
				'Unable to load the next question. Please refresh the page.';
			answerButtons.innerHTML = '';
			statusElement.textContent = '';
			streakElement.textContent = '';
		}
	}

	async function submitAnswer(option, selectedButton) {
		if (isSubmitting) {
			return;
		}

		isSubmitting = true;
		disableAnswerButtons();

		try {
			const result = await window.quizApi.postJson('/api/quiz/answer', {
				userAnswer: option,
			});

			if (result.isCorrect) {
				selectedButton.classList.add('correct');
			} else {
				selectedButton.classList.add('incorrect');
				highlightCorrectAnswer(result.correctAnswer);
			}

			window.setTimeout(() => {
				isSubmitting = false;

				if (result.isComplete) {
					finishQuiz();
					return;
				}

				loadQuestion();
			}, 900);
		} catch (error) {
			console.error(error);
			isSubmitting = false;
			questionElement.textContent =
				'Unable to submit your answer. Please refresh the page.';
		}
	}

	updateTimer();
	countdownInterval = window.setInterval(updateTimer, 1000);
	loadQuestion();
});
