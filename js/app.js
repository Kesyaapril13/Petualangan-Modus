const playerForm = document.querySelector('#player-form');
if (playerForm) {
  const playerNameInput = document.querySelector('#player-name');
  const formMessage = document.querySelector('#form-message');
  const savedPlayerName = localStorage.getItem('petualanganModusPlayer');

  if (savedPlayerName) {
    playerNameInput.value = savedPlayerName;
    formMessage.textContent = `Selamat datang kembali, ${savedPlayerName}! Namamu sudah tersimpan.`;
  }

  playerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const playerName = playerNameInput.value.trim();

    if (!playerName) {
      playerNameInput.focus();
      return;
    }

    localStorage.setItem('petualanganModusPlayer', playerName);
    formMessage.textContent = `Siap, ${playerName}! Petualanganmu akan segera dimulai.`;
  });
}

const lessonTabs = [...document.querySelectorAll('[role="tab"]')];

lessonTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateLessonTab(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = index;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % lessonTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + lessonTabs.length) % lessonTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = lessonTabs.length - 1;
    else return;

    event.preventDefault();
    activateLessonTab(lessonTabs[nextIndex], true);
  });
});

function activateLessonTab(activeTab, moveFocus = false) {
  lessonTabs.forEach((tab) => {
    const isActive = tab === activeTab;
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    panel.hidden = !isActive;
  });

  if (moveFocus) activeTab.focus();
}

const exerciseRoot = document.querySelector('#exercise-app');

if (exerciseRoot && Array.isArray(window.soalLatihan)) {
  initializeExercise(exerciseRoot, window.soalLatihan);
}

function initializeExercise(root, questions) {
  const questionNumber = root.querySelector('#question-number');
  const scoreDisplay = root.querySelector('#score-display');
  const progressTrack = root.querySelector('.progress-track');
  const progressFill = root.querySelector('#progress-fill');
  const questionView = root.querySelector('#question-view');
  const questionPrompt = root.querySelector('#question-prompt');
  const stagePrompt = root.querySelector('#stage-prompt');
  const questionData = root.querySelector('#question-data');
  const answerChoices = root.querySelector('#answer-choices');
  const answerFeedback = root.querySelector('#answer-feedback');
  const nextQuestionButton = root.querySelector('#next-question');
  const nextQuestionLabel = nextQuestionButton.querySelector('.button-label');
  const resultView = root.querySelector('#exercise-result');
  const finalScore = root.querySelector('#final-score');
  const finalGrade = root.querySelector('#final-grade');
  const resultSummary = root.querySelector('#result-summary');
  const scoreBreakdown = root.querySelector('#score-breakdown');
  const retryButton = root.querySelector('#retry-exercise');
  const totalStages = questions.reduce((total, question) => total + question.stages.length, 0);
  const maximumScore = questions.reduce(
    (total, question) => total + question.stages.reduce((questionTotal, stage) => questionTotal + stage.points, 0),
    0
  );
  let currentIndex = 0;
  let currentStageIndex = 0;
  let score = 0;
  let questionScores = questions.map(() => 0);

  function renderQuestion(moveFocus = false) {
    const question = questions[currentIndex];
    const stage = question.stages[currentStageIndex];
    const stageNumber = questions
      .slice(0, currentIndex)
      .reduce((total, previousQuestion) => total + previousQuestion.stages.length, currentStageIndex + 1);
    questionView.hidden = false;
    resultView.hidden = true;
    answerFeedback.hidden = true;
    answerFeedback.className = 'answer-feedback';
    nextQuestionButton.hidden = true;
    questionNumber.textContent = `Soal ${currentIndex + 1} dari ${questions.length} · Tahap ${currentStageIndex + 1} dari ${question.stages.length}`;
    scoreDisplay.textContent = `Skor ${score} / ${maximumScore}`;
    progressTrack.setAttribute('aria-valuemax', String(totalStages));
    progressTrack.setAttribute('aria-valuenow', String(stageNumber));
    progressFill.style.width = `${(stageNumber / totalStages) * 100}%`;
    questionPrompt.textContent = question.prompt;
    stagePrompt.textContent = stage.prompt;
    questionData.replaceChildren();
    answerChoices.replaceChildren();
    renderQuestionData(question);

    stage.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      const letter = document.createElement('span');
      const answer = document.createElement('span');
      button.type = 'button';
      button.className = 'answer-option';
      letter.className = 'answer-letter';
      letter.textContent = String.fromCharCode(65 + index);
      answer.textContent = choice;
      button.append(letter, answer);
      button.addEventListener('click', () => selectAnswer(button, choice, stage));
      answerChoices.append(button);
    });

    if (moveFocus) questionPrompt.focus();
  }

  function renderQuestionData(question) {
    const label = document.createElement('p');
    label.className = 'question-data-label';
    label.textContent = 'Data yang diamati';
    questionData.append(label);

    if (question.values) {
      const values = document.createElement('div');
      values.className = 'question-values';
      values.setAttribute('aria-label', `Data: ${question.values.join(', ')}`);
      question.values.forEach((value) => {
        const chip = document.createElement('span');
        chip.textContent = value;
        values.append(chip);
      });
      questionData.append(values);
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
    questionData.append(table);
  }

  function selectAnswer(selectedButton, selectedAnswer, stage) {
    const isCorrect = selectedAnswer === stage.answer;
    const pointsEarned = isCorrect ? stage.points : 0;
    score += pointsEarned;
    questionScores[currentIndex] += pointsEarned;

    answerChoices.querySelectorAll('.answer-option').forEach((button) => {
      button.disabled = true;
      const answerText = button.lastElementChild.textContent;
      if (answerText === stage.answer) button.classList.add('is-correct');
    });

    if (!isCorrect) selectedButton.classList.add('is-incorrect');
    scoreDisplay.textContent = `Skor ${score} / ${maximumScore}`;
    answerFeedback.classList.toggle('is-incorrect', !isCorrect);
    answerFeedback.replaceChildren();

    const heading = document.createElement('h3');
    heading.className = 'feedback-heading';
    heading.textContent = isCorrect
      ? `Benar! Kamu mendapat ${pointsEarned} poin.`
      : `Belum tepat. Jawaban yang benar: ${stage.answer}.`;
    const steps = document.createElement('ol');
    steps.className = 'explanation-list';
    const step = document.createElement('li');
    const label = document.createElement('span');
    const text = document.createElement('p');
    label.textContent = `Poin: ${pointsEarned} / ${stage.points}`;
    text.textContent = stage.explanation;
    step.append(label, text);
    steps.append(step);
    answerFeedback.append(heading, steps);
    answerFeedback.hidden = false;
    const isLastStage = currentStageIndex === questions[currentIndex].stages.length - 1;
    const isLastQuestion = currentIndex === questions.length - 1;
    nextQuestionLabel.textContent = isLastStage
      ? (isLastQuestion ? 'Lihat hasil' : 'Soal berikutnya')
      : 'Tahap berikutnya';
    nextQuestionButton.hidden = false;
    answerFeedback.focus();
  }

  function showResult() {
    questionView.hidden = true;
    resultView.hidden = false;
    questionNumber.textContent = 'Latihan selesai';
    progressTrack.setAttribute('aria-valuenow', String(totalStages));
    progressFill.style.width = '100%';
    scoreDisplay.textContent = `Skor ${score} / ${maximumScore}`;
    finalScore.textContent = `${score} / ${maximumScore}`;
    finalGrade.textContent = `Nilai: ${((score / maximumScore) * 100).toFixed(2)} / 100`;
    resultSummary.textContent = score === maximumScore
      ? 'Hebat! Kamu berhasil menyelesaikan semua tahap.'
      : score >= maximumScore / 2
        ? 'Kerja bagus! Terus berlatih agar makin jeli menemukan modus.'
        : 'Terus berlatih, ya. Tinjau kembali langkah-langkah menentukan modus.';
    scoreBreakdown.replaceChildren();
    questions.forEach((question, index) => {
      const item = document.createElement('li');
      const questionLabel = document.createElement('span');
      const questionScore = document.createElement('strong');
      const questionMaximum = question.stages.reduce((total, stage) => total + stage.points, 0);
      questionLabel.textContent = `Soal ${index + 1}`;
      questionScore.textContent = `${questionScores[index]} / ${questionMaximum}`;
      item.append(questionLabel, questionScore);
      scoreBreakdown.append(item);
    });
    retryButton.focus();
  }

  nextQuestionButton.addEventListener('click', () => {
    if (currentStageIndex < questions[currentIndex].stages.length - 1) {
      currentStageIndex += 1;
      renderQuestion(true);
      return;
    }

    if (currentIndex === questions.length - 1) {
      showResult();
      return;
    }

    currentIndex += 1;
    currentStageIndex = 0;
    renderQuestion(true);
  });

  retryButton.addEventListener('click', () => {
    currentIndex = 0;
    currentStageIndex = 0;
    score = 0;
    questionScores = questions.map(() => 0);
    renderQuestion(true);
  });

  renderQuestion();
}
