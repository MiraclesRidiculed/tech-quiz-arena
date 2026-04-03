const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const wordBank = [
	{
		word: 'pascaline',
		clue: 'Adding machine invented in 1641.',
	},
	{
		word: 'univac',
		clue: 'One of the earliest commercial computers.',
	},
	{
		word: 'bjarne stroustrup',
		clue: 'Often called the father of C++.',
	},
	{
		word: 'inheritance',
		clue: 'The OOP property where a class acquires features of a parent class.',
	},
	{
		word: 'word processor',
		clue: 'Software used to create and edit documents.',
	},
	{
		word: 'trojan horse',
		clue: 'Wooden on the outside, warriors on the inside.',
	},
	{
		word: 'keyboard',
		clue: 'It has keys but cannot open locks.',
	},
	{
		word: 'micro processor',
		clue: 'The brain of your computer, where bytes come to play.',
	},
	{
		word: 'broadband',
		clue: 'A high-speed connection bringing the internet to your location.',
	},
	{
		word: 'monitor',
		clue: 'A pixel-packed display that shows images in high definition.',
	},
	{
		word: 'primary memory',
		clue: 'A high-speed memory device that stores data temporarily.',
	},
	{
		word: 'variable',
		clue: 'A named storage location used to hold and retrieve data in code.',
	},
	{
		word: 'algorithm',
		clue: 'A finite sequence of rigorous instructions used to solve a problem.',
	},
	{
		word: 'javascript',
		clue: 'A scripting language commonly embedded in HTML documents.',
	},
	{
		word: 'antivirus',
		clue: 'Software designed to detect, prevent, and remove malware.',
	},
	{
		word: 'cache',
		clue: 'High-speed temporary storage for frequently accessed data.',
	},
	{
		word: 'compilation',
		clue: 'The process of converting human-readable code into machine code.',
	},
	{
		word: 'cloud storage',
		clue: 'A web-based service for storing and accessing files anywhere.',
	},
	{
		word: 'artificial intelligence',
		clue: 'Machines performing tasks associated with human intelligence.',
	},
	{
		word: 'hard disk',
		clue: 'Long-term computer storage that keeps data even when powered off.',
	},
];

document.addEventListener('DOMContentLoaded', async () => {
	const buttonsContainer = document.getElementById('buttons');
	const categoryNameElement = document.getElementById('categoryName');
	const wordHolder = document.getElementById('hold');
	const livesElement = document.getElementById('mylives');
	const clueElement = document.getElementById('clue');
	const hintButton = document.getElementById('hint');
	const resetButton = document.getElementById('reset');
	const canvasElement = document.getElementById('stickman');
	const context = canvasElement.getContext('2d');

	const state = {
		currentEntry: null,
		lives: 10,
		matchedLetters: 0,
		displayedLetters: [],
		redirectTimer: null,
	};

	try {
		const session = await window.quizApi.postJson('/api/session/start', {
			startedAt: Date.now(),
		});

		sessionStorage.setItem('quizDurationMs', String(session.quizDurationMs));
		sessionStorage.setItem('totalQuestions', String(session.totalQuestions));
	} catch (error) {
		livesElement.textContent =
			'Unable to start a new session. Refresh the page and try again.';
		return;
	}

	function drawLine(fromX, fromY, toX, toY) {
		context.beginPath();
		context.moveTo(fromX, fromY);
		context.lineTo(toX, toY);
		context.stroke();
	}

	function setupCanvas() {
		context.clearRect(0, 0, canvasElement.width, canvasElement.height);
		context.strokeStyle = '#ffffff';
		context.lineWidth = 2;
	}

	const drawSteps = [
		() => drawLine(0, 150, 150, 150),
		() => drawLine(10, 0, 10, 600),
		() => drawLine(0, 5, 70, 5),
		() => drawLine(60, 5, 60, 15),
		() => {
			context.beginPath();
			context.arc(60, 25, 10, 0, Math.PI * 2, true);
			context.stroke();
		},
		() => drawLine(60, 36, 60, 70),
		() => drawLine(60, 46, 100, 50),
		() => drawLine(60, 46, 20, 50),
		() => drawLine(60, 70, 100, 100),
		() => drawLine(60, 70, 20, 100),
	];

	function updateLivesMessage(message) {
		livesElement.textContent = message ?? `You have ${state.lives} lives`;
	}

	function scheduleRedirect(path, delayMs) {
		window.clearTimeout(state.redirectTimer);
		state.redirectTimer = window.setTimeout(() => {
			window.location.assign(path);
		}, delayMs);
	}

	function renderAlphabet() {
		buttonsContainer.innerHTML = '';

		const letters = document.createElement('ul');
		letters.id = 'alphabet';

		alphabet.forEach((letter) => {
			const item = document.createElement('li');
			item.textContent = letter;
			item.addEventListener(
				'click',
				() => {
					handleGuess(letter, item);
				},
				{ once: true }
			);
			letters.appendChild(item);
		});

		buttonsContainer.appendChild(letters);
	}

	function renderWord() {
		wordHolder.innerHTML = '';
		state.displayedLetters = [];
		state.matchedLetters = 0;

		const list = document.createElement('ul');
		list.id = 'my-word';

		for (const character of state.currentEntry.word) {
			const item = document.createElement('li');
			item.className = 'guess';

			if (character === '-') {
				item.textContent = '-';
				state.matchedLetters += 1;
			} else {
				item.textContent = '_';
			}

			state.displayedLetters.push(item);
			list.appendChild(item);
		}

		wordHolder.appendChild(list);
	}

	function revealMatches(letter) {
		let matched = false;

		for (let index = 0; index < state.currentEntry.word.length; index += 1) {
			if (state.currentEntry.word[index] === letter) {
				state.displayedLetters[index].textContent = letter;
				state.matchedLetters += 1;
				matched = true;
			}
		}

		return matched;
	}

	function showWinState() {
		updateLivesMessage('You win. Redirecting you to the quiz round...');
		scheduleRedirect('/quizinfo', 1500);
	}

	function showLossState() {
		updateLivesMessage('Game over. Redirecting you back to the start...');
		scheduleRedirect('/home', 1500);
	}

	function handleGuess(letter, item) {
		if (state.lives <= 0) {
			return;
		}

		item.classList.add('active');

		const isCorrect = revealMatches(letter);
		if (!isCorrect) {
			state.lives -= 1;
			const drawStep = drawSteps[10 - state.lives - 1];
			if (drawStep) {
				drawStep();
			}
		}

		if (state.matchedLetters === state.currentEntry.word.length) {
			showWinState();
			return;
		}

		if (state.lives === 0) {
			showLossState();
			return;
		}

		updateLivesMessage();
	}

	function pickRandomEntry() {
		const randomIndex = Math.floor(Math.random() * wordBank.length);
		const selectedEntry = wordBank[randomIndex];

		return {
			word: selectedEntry.word.replace(/\s+/g, '-').toLowerCase(),
			clue: selectedEntry.clue,
		};
	}

	function startRound() {
		window.clearTimeout(state.redirectTimer);
		state.currentEntry = pickRandomEntry();
		state.lives = 10;
		clueElement.textContent = '';
		categoryNameElement.textContent = state.currentEntry.clue;
		setupCanvas();
		renderAlphabet();
		renderWord();
		updateLivesMessage();
	}

	hintButton.addEventListener('click', () => {
		clueElement.textContent = `Clue: ${state.currentEntry.clue}`;
	});

	resetButton.addEventListener('click', startRound);

	startRound();
});
