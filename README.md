# Tech Quiz Arena

A lightweight browser game built around a two-stage tech challenge:

1. Players start with a hangman round.
2. Winning the round unlocks the quiz.
3. The quiz awards streak-based points and occasional super questions.
4. A final results page shows the recorded time and score.

The project uses a small Express server and vanilla HTML, CSS, and JavaScript, so it is easy to run locally and easy to customize for future events.

## Features

- Hangman round with reset and hint support
- Quiz round with shuffled questions and streak-based scoring
- Super questions that appear after a correct-answer streak
- Per-browser in-memory game sessions instead of shared global state
- Results screen with start time, end time, duration, and score
- Small test suite for the core game-session logic

## Tech Stack

- Node.js
- Express
- Vanilla JavaScript
- HTML/CSS

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

### Test

```bash
npm test
```

## Game Flow

### Round 1: Hangman

- Visiting `/hangman` starts a fresh session.
- The session start time is recorded on the server.
- Winning redirects the player to the quiz instructions page.
- Losing redirects the player back to the home page.

### Round 2: Quiz

- The quiz serves one question at a time from a shuffled pool.
- Each correct answer increases the streak.
- Regular question scoring is `10 x current streak`.
- After 4 consecutive correct answers, the next question becomes a 10x super question.
- The quiz ends after 50 answered questions or when the timer expires.

### Results

- The results page reads the active session from the server.
- It displays the recorded start time, end time, duration, score, and answered-question count.

## Project Structure

```text
.
|-- index.js                  # Express server and route wiring
|-- info/
|   |-- constants.js          # App-wide settings
|   `-- questions1.js         # Main question bank used by the app
|-- lib/
|   `-- game-session.js       # Session, scoring, and question-selection logic
|-- public/
|   |-- css/                  # Stylesheets
|   |-- img/                  # Background assets
|   |-- js/                   # Browser scripts
|   `-- webpages/             # HTML pages
`-- test/
    `-- game-session.test.js  # Unit tests for the core game logic
```

## Important Notes

- Sessions are stored in memory, so restarting the server clears active games.
- This project is best suited for local events, demos, or small internal deployments.
- The current app uses `info/questions1.js` as the active quiz bank. `questions2.js` and `questions3.js` are still present in the repository as extra data sets but are not currently wired into the game flow.

## Customization Ideas

- Replace the question bank with event-specific content
- Persist results to a database or file
- Add an admin panel for live score tracking
- Enforce a hangman countdown on the UI
- Add difficulty levels or category-specific rounds

## License

MIT
