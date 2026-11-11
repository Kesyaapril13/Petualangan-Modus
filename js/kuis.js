(() => {
  const quizRoot = document.querySelector('#quiz-app');
  const questionBank = window.soalLatihan;

  if (!quizRoot || !Array.isArray(questionBank) || questionBank.length === 0) return;

  const bestScoreKey = 'petualanganModusBestQuizScore';
  const scoreDisplay = quizRoot.querySelector('#quiz-score');
  const streakDisplay = quizRoot.querySelector('#quiz-streak');
  const bestDisplay = quizRoot.querySelector('#quiz-best');
  const livesDisplay = quizRoot.querySelector('#quiz-lives');
  const livesLabel = quizRoot.querySelector('#quiz-lives-label');
  const roundDisplay = quizRoot.querySelector('#quiz-round');
  const progressTrack = quizRoot.querySelector('.progress-track');
  const progressFill = quizRoot.querySelector('#quiz-progress-fill');
  const questionView = quizRoot.querySelector('#quiz-question-view');
  const prompt = quizRoot.querySelector('#quiz-prompt');
  const dataDisplay = quizRoot.querySelector('#quiz-data');
  const choicesDisplay = quizRoot.querySelector('#quiz-choices');
  const feedbackDisplay = quizRoot.querySelector('#quiz-feedback');
  const nextButton = quizRoot.querySelector('#quiz-next');
  const nextLabel = quizRoot.querySelector('#quiz-next-label');
  const resultView = quizRoot.querySelector('#quiz-result');
  const resultTitle = quizRoot.querySelector('#quiz-result-title');
  const starsDisplay = quizRoot.querySelector('#quiz-stars');
  const finalScoreDisplay = quizRoot.querySelector('#quiz-final-score');
  const resultSummary = quizRoot.querySelector('#quiz-result-summary');
  const wrongList = quizRoot.querySelector('#quiz-wrong-list');
  const restartButton = quizRoot.querySelector('#quiz-restart');
  let questions = [];
  let questionIndex = 0;
  let score = 0;
  let lives = 3;
  let streak = 0;
  let correctCount = 0;
  let wrongAnswers = [];
  let bestScore = Number(localStorage.getItem(bestScoreKey)) || 0;

  function shuffleQuestions(source) {
    const shuffled = [...source];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
  }

  function updateScoreboard() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    bestDisplay.textContent = bestScore;
    livesLabel.textContent = `${lives} ${lives === 1 ? 'nyawa tersisa' : 'nyawa tersisa'}`;
    livesDisplay.setAttribute('aria-label', `${lives} nyawa tersisa`);
    livesDisplay.querySelectorAll('[aria-hidden="true"]').forEach((heart, index) => {
      heart.classList.toggle('is-lost', index >= lives);
    });
  }

  function renderQuestion() {
    const question = questions[questionIndex];
    questionView.hidden = false;
    resultView.hidden = true;
    feedbackDisplay.hidden = true;
    feedbackDisplay.className = 'quiz-feedback';
    nextButton.hidden = true;
    roundDisplay.textContent = `Soal ${questionIndex + 1} dari ${questions.length}`;
    progressTrack.setAttribute('aria-valuemax', String(questions.length));
    progressTrack.setAttribute('aria-valuenow', String(questionIndex + 1));
    progressFill.style.width = `${((questionIndex + 1) / questions.length) * 100}%`;
    prompt.textContent = question.prompt;
    dataDisplay.replaceChildren();
    choicesDisplay.replaceChildren();
    renderQuestionData(question);

    question.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      const letter = document.createElement('span');
      const answer = document.createElement('span');
      button.type = 'button';
      button.className = 'answer-option';
      letter.className = 'answer-letter';
      letter.textContent = String.fromCharCode(65 + index);
      answer.textContent = choice;
      button.append(letter, answer);
      button.addEventListener('click', () => selectAnswer(button, choice, question));
      choicesDisplay.append(button);
    });
  }

  function renderQuestionData(question) {
    const label = document.createElement('p');
    label.className = 'question-data-label';
    label.textContent = 'Data yang diamati';
    dataDisplay.append(label);

    if (question.values) {
      const values = document.createElement('div');
      values.className = 'question-values';
      values.setAttribute('aria-label', `Data: ${question.values.join(', ')}`);
      question.values.forEach((value) => {
        const chip = document.createElement('span');
        chip.textContent = value;
        values.append(chip);
      });
      dataDisplay.append(values);
      return;
    }

    const table = document.createElement('table');
    const caption = document.createElement('caption');
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    const body = document.createElement('tbody');
    table.className = 'exercise-table';
    caption.textContent = question.table.caption;
    question.table.headers.forEach((header) => {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = header;
      headRow.append(cell);
    });
    head.append(headRow);
    question.table.rows.forEach((row) => {
      const tableRow = document.createElement('tr');
      row.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.scope = 'row';
        cell.textContent = value;
        tableRow.append(cell);
      });
      body.append(tableRow);
    });
    table.append(caption, head, body);
    dataDisplay.append(table);
  }

  function selectAnswer(selectedButton, selectedAnswer, question) {
    if (selectedButton.disabled) return;

    const isCorrect = selectedAnswer === question.answer;
    let earnedPoints = 0;

    if (isCorrect) {
      streak += 1;
      correctCount += 1;
      const bonus = streak > 1 ? 5 : 0;
      earnedPoints = 10 + bonus;
      score += earnedPoints;
    } else {
      lives -= 1;
      streak = 0;
      wrongAnswers.push({ question, selectedAnswer });
    }

    updateScoreboard();
    choicesDisplay.querySelectorAll('.answer-option').forEach((button) => {
      button.disabled = true;
      if (button.lastElementChild.textContent === question.answer) button.classList.add('is-correct');
    });
    if (!isCorrect) selectedButton.classList.add('is-incorrect');

    feedbackDisplay.classList.toggle('is-incorrect', !isCorrect);
    feedbackDisplay.replaceChildren();
    const heading = document.createElement('h3');
    const explanation = document.createElement('p');
    heading.className = 'quiz-feedback-heading';
    explanation.className = 'quiz-feedback-explanation';
    heading.textContent = isCorrect
      ? `Tepat! +${earnedPoints} poin${streak > 1 ? ' termasuk bonus beruntun +5' : ''}.`
      : `Belum tepat. Jawaban yang benar: ${question.answer}.`;
    explanation.textContent = question.explanation[question.explanation.length - 1];
    feedbackDisplay.append(heading, explanation);
    feedbackDisplay.hidden = false;
    nextLabel.textContent = lives === 0 || questionIndex === questions.length - 1 ? 'Lihat hasil' : 'Lanjut';
    nextButton.hidden = false;
    feedbackDisplay.focus();
  }

  function addWrongAnswerReview() {
    wrongList.replaceChildren();

    if (wrongAnswers.length === 0) {
      const item = document.createElement('li');
      item.className = 'no-wrong-answers';
      item.textContent = 'Semua jawabanmu benar. Pertahankan ketelitianmu!';
      wrongList.append(item);
      return;
    }

    wrongAnswers.forEach(({ question, selectedAnswer }, index) => {
      const item = document.createElement('li');
      const promptText = document.createElement('h4');
      const dataText = document.createElement('p');
      const answerText = document.createElement('p');
      promptText.textContent = `${index + 1}. ${question.prompt}`;
      dataText.className = 'wrong-question-data';
      dataText.textContent = question.values
        ? `Data: ${question.values.join(', ')}`
        : question.table.rows.map(([value, frequency]) => `${value} muncul ${frequency} kali`).join('; ');
      answerText.textContent = `Jawabanmu: ${selectedAnswer}. Jawaban benar: ${question.answer}.`;
      item.append(promptText, dataText, answerText);
      wrongList.append(item);
    });
  }

  function finishGame() {
    questionView.hidden = true;
    resultView.hidden = false;
    roundDisplay.textContent = 'Kuis selesai';
    progressTrack.setAttribute('aria-valuenow', String(questionIndex + 1));
    const rating = correctCount >= 4 ? 3 : correctCount >= 2 ? 2 : 1;
    const stars = [...starsDisplay.children];
    stars.forEach((star, index) => star.classList.toggle('is-earned', index < rating));
    starsDisplay.setAttribute('aria-label', `${rating} dari 3 bintang`);
    resultTitle.textContent = lives === 0 ? 'Nyawamu habis!' : 'Kuis selesai!';
    finalScoreDisplay.textContent = score;
    resultSummary.textContent = `${correctCount} dari ${questions.length} jawaban benar · Skor terbaik: ${bestScore}`;
    addWrongAnswerReview();
    restartButton.focus();
  }

  function startGame() {
    questions = shuffleQuestions(questionBank);
    questionIndex = 0;
    score = 0;
    lives = 3;
    streak = 0;
    correctCount = 0;
    wrongAnswers = [];
    updateScoreboard();
    renderQuestion();
  }

  nextButton.addEventListener('click', () => {
    if (lives === 0 || questionIndex === questions.length - 1) {
      const previousBest = bestScore;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem(bestScoreKey, String(bestScore));
        bestDisplay.textContent = bestScore;
      }
      if (bestScore !== previousBest) resultSummary.textContent = `${correctCount} dari ${questions.length} jawaban benar · Rekor baru!`;
      finishGame();
      return;
    }

    questionIndex += 1;
    renderQuestion();
    prompt.focus();
  });

  restartButton.addEventListener('click', startGame);
  startGame();
})();
