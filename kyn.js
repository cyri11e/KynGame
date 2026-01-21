class KynGame {
    constructor(guitar) {
        this.guitar = guitar;

        // États principaux
        this.state = "home"; // "home" | "difficulty" | "playing" | "answer" | "end"

        // Mode de jeu
        this.gameMode = null; // "intervals" | "degrees" | "notes"
        this.useFlatMode = true;

        this.customConfig = {
            timerValues: [1000, 2000, 3000, 5000, 10000, Infinity],
            timerIndex: 2,          // 3s par défaut
            directionIndex: 0,      // 0: UP, 1: DOWN, 2: UP & DOWN
            selectedItems: new Set(),
            presetName: null
        };


        // Difficulté
        this.timeLimitSeconds = 3;
        this.sessionQuestions = 10;
        this.difficulty = null; // "noob" | "slow" | "normal" | "expert" | "custom"


        // Question en cours
        this.startingNote = null;
        this.startingNotePosition = null;
        this.targetNote = null;
        this.currentInterval = 0;
        this.currentDegree = 0;
        this.currentTargetNoteName = null;
        this.correctNotePosition = null;

        // Timers
        this.questionDisplayTime = 0;
        this.startingNoteDisplayTime = 0;
        this.displayTimeDelay = 1000; // délai avant affichage de la note de départ
        this.startingNoteVisible = false;
        this.timeoutOccurred = false;

        // Score & stats
        this.score = 0;
        this.totalCorrectResponses = 0;
        this.responseTimes = [];
        this.questionsAnswered = 0;

        // Réponse utilisateur
        this.showingAnswer = false;
        this.answerWasCorrect = false;

        // Interval lists
        this.noobIntervals   = INTERVAL_SETS.noob;
        this.slowIntervals   = INTERVAL_SETS.slow;
        this.normalIntervals = INTERVAL_SETS.normal;
        this.expertIntervals = INTERVAL_SETS.expert;

        this.customPresets = CUSTOM_INTERVAL_PRESETS;

    }

    // ---------------------------------------------------------
    // BOUCLE PRINCIPALE
    // ---------------------------------------------------------
    update() {
        if (this.state !== "playing") return;

        // Affichage différé de la note de départ
        const now = millis();
        const timeSinceQuestionDisplay = now - this.questionDisplayTime;

        if (!this.startingNoteVisible && timeSinceQuestionDisplay >= this.displayTimeDelay) {
            this.startingNoteVisible = true;
            this.startingNoteDisplayTime = now;
            this.guitar.startingNoteVisible = true;
           // this.playStartingNote();
        }

        // Countdown
        if (this.startingNoteVisible && !this.showingAnswer) {
            const elapsedSinceStart = now - this.startingNoteDisplayTime;
            const timeRemaining = this.timeLimitSeconds * 1000 - elapsedSinceStart;

            if (timeRemaining <= 0 && !this.timeoutOccurred) {
                this.timeoutOccurred = true;
                this.showingAnswer = true;
                this.answerWasCorrect = false;
                this.questionsAnswered++;

                if (this.correctNotePosition) {
                    this.guitar.setPlayedNote([this.targetNote]);
                }

                // Passage à l’état "answer"
                this.state = "answer";
            }
        }

        // Fin de session
        if (this.questionsAnswered >= this.sessionQuestions && this.state === "answer") {
            this.state = "end";
        }
    }

    // ---------------------------------------------------------
    // GESTION DES CLICS (menus + jeu)
    // ---------------------------------------------------------
    mouseClicked(mx, my) {
        if (this.state === "home") {
            return this._handleHomeClick(mx, my);
        }
        if (this.state === "difficulty") {
            return this._handleDifficultyClick(mx, my);
        }
        if (this.state === "customConfig") {
            return this._handleCustomConfigClick(mx, my);
        }

        if (this.state === "end") {
            return this._handleEndClick(mx, my);
        }
        if (this._handleDirectionCyclerClick(mx, my)) return true;
        if (this._handleCustomGridClick(mx, my)) return true;

        // En mode "playing" ou "answer", le clic sur le manche est géré ailleurs
        return false;
    }

    keyPressed(k, keyCode) {
        // Espace pour passer à la question suivante ou terminer la session
        if (k === ' ' || keyCode === 32) {
            if (this.state === "answer") {
                if (this.questionsAnswered >= this.sessionQuestions) {
                    this.state = "end";
                } else {
                    this.state = "playing";
                    this._startNewQuestion();
                }
            }
        }
    }

    // Clic sur une note du manche (jeu)
    handleNoteClick(clickedNote) {
        if (this.state !== "playing") return;
        if (!this.startingNoteVisible || this.showingAnswer) return;

        this.userSelectedNote = clickedNote;

        if (clickedNote.note === this.targetNote) {
            this.answerWasCorrect = true;
            this.score++;
            const responseTime = millis() - this.startingNoteDisplayTime;
            this.responseTimes.push(responseTime);
            this.totalCorrectResponses++;
        } else {
            this.answerWasCorrect = false;
        }

        this.questionsAnswered++;
        this.showingAnswer = true;

        if (this.correctNotePosition) {
            this.guitar.setPlayedNote([this.targetNote]);
        }

        this.state = "answer";
    }

    // ---------------------------------------------------------
    // MENUS
    // ---------------------------------------------------------
    _handleHomeClick(mx, my) {
        const buttonY = height / 2 + 50;
        const buttonWidth = 120;
        const buttonHeight = 50;

        // Intervalles
        if (this._inRect(mx, my, width / 2 - 200, buttonY, buttonWidth, buttonHeight)) {
            this.gameMode = "intervals";
            this.useFlatMode = random() > 0.5;
            this.state = "difficulty";
            return true;
        }

        // Degrés
        if (this._inRect(mx, my, width / 2, buttonY, buttonWidth, buttonHeight)) {
            this.gameMode = "degrees";
            this.useFlatMode = random() > 0.5;
            this.state = "difficulty";
            return true;
        }

        // Notes
        if (this._inRect(mx, my, width / 2 + 200, buttonY, buttonWidth, buttonHeight)) {
            this.gameMode = "notes";
            this.useFlatMode = random() > 0.5;
            this.state = "difficulty";
            return true;
        }

        return false;
    }

    _handleDifficultyClick(mx, my) {
        const buttonY = height / 2 + 50;
        const buttonWidth = 100;
        const buttonHeight = 50;
        const buttonsX = [
                        width / 2 - 210,
                        width / 2 - 105,
                        width / 2,
                        width / 2 + 105,
                        width / 2 + 210   
            ];

        const difficulties = [
            { label: 'NOOB',   time: 10 },
            { label: 'SLOW',   time: 5 },
            { label: 'NORMAL', time: 4 },
            { label: 'EXPERT', time: 2 },
            { label: 'CUSTOM', time: null }

        ];

        if (this._inRect(mx, my, width * 0.15, height - 80, 200, 60)) {
            this.state = "home";
            return true;
        }


        for (let i = 0; i < difficulties.length; i++) {
            if (this._inRect(mx, my, buttonsX[i], buttonY, buttonWidth, buttonHeight)) {

                this.difficulty = difficulties[i].label.toLowerCase();

                if (difficulties[i].label === "CUSTOM") {
                    this.state = "customConfig";   // 🔥 NOUVEAU ÉCRAN
                    return true;
                }

                this.timeLimitSeconds = difficulties[i].time;
                this._resetSessionState();
                this._startNewQuestion();
                this.state = "playing";
                return true;
            }

        }

        return false;
    }

    _handleCustomConfigClick(mx, my) {

        // --- 1. Bouton Retour ---
        if (this._inRect(mx, my, width * 0.15, height - 80, 200, 60)) {
            this.state = "difficulty";
            return true;
        }

        // --- 2. Bouton START ---
        if (this._inRect(mx, my, width/2, height - 80, 300, 80)) {
            this.difficulty = "custom";
            this.timeLimitSeconds = this.customConfig.timerValues[this.customConfig.timerIndex];
            this._resetSessionState();
            this._startNewQuestion();
            this.state = "playing";
            return true;
        }

if (this._handleDirectionCyclerClick(mx, my)) return true;

        // --- 3. Clic sur la grille ---
        if (this._handleCustomGridClick(mx, my)) {
            return true;
        }

        // --- 4. Clic sur les boutons de direction ---
        if (this._handleDirectionClick(mx, my)) {
            return true;
        }

        // --- 5. Clic sur les presets (si tu veux les activer plus tard) ---
        // if (this._handlePresetClick(mx, my)) return true;

        return false;
    }


_handleDirectionClick(mx, my) {
    const areaX = width * 0.75;
    const cx = areaX + (width * 0.25) / 2;
    const startY = 150;
    const btnW = 200;
    const btnH = 60;
    const spacing = 20;

    for (let i = 0; i < 3; i++) {
        const y = startY + i * (btnH + spacing);

        // centre du bouton
        const cy = y + btnH / 2;

        if (this._inRect(mx, my, cx, cy, btnW, btnH)) {
            this.customConfig.directionIndex = i;
            return true;
        }
    }

    return false;
}



_handleCustomGridClick(mx, my) {
    const cols = 4;
    const rows = 3;

    const areaWidth = width * 0.75;
    const offsetX = width * 0.25;

    const cellW = (areaWidth * 0.8) / cols;
    const cellH = cellW * 0.6;

    const totalWidth = cols * cellW;
    const startX = offsetX + (areaWidth - totalWidth) / 2;
    const startY = 150;

    let i = 0;

    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {

            // case DIR gérée ailleurs
            if (r === 0 && c === 0) continue;

            const x = startX + c * cellW;
            const y = startY + r * cellH;

            const cx = x + cellW / 2;
            const cy = y + cellH / 2;

            if (this._inRect(mx, my, cx, cy, cellW, cellH)) {
                if (this.customConfig.selectedItems.has(i)) {
                    this.customConfig.selectedItems.delete(i);
                } else {
                    this.customConfig.selectedItems.add(i);
                }
                return true;
            }

            i++;
            if (i >= 11) return false;
        }
    }

    return false;
}


_handleDirectionCyclerClick(mx, my) {
    const cols = 4;
    const areaWidth = width * 0.75;
    const offsetX = width * 0.25;

    const cellW = (areaWidth * 0.8) / cols;
    const cellH = cellW * 0.6;

    const totalWidth = cols * cellW;
    const startX = offsetX + (areaWidth - totalWidth) / 2;
    const startY = 150;

    const x = startX;
    const y = startY;

    const cx = x + cellW / 2;
    const cy = y + cellH / 2;

    if (this._inRect(mx, my, cx, cy, cellW, cellH)) {
        this.customConfig.directionIndex =
            (this.customConfig.directionIndex + 1) % 3;
        return true;
    }

    return false;
}


_handleDirectionCyclerClick(mx, my) {
    const cellW = 160;
    const cellH = 100;

    const cols = 4;
    const totalWidth = cols * cellW;
    const startX = width * 0.25 + (width * 0.75 - totalWidth) / 2;
    const startY = 150;

    const x = startX;
    const y = startY;

    const cx = x + cellW / 2;
    const cy = y + cellH / 2;

    if (this._inRect(mx, my, cx, cy, cellW, cellH)) {
        this.customConfig.directionIndex =
            (this.customConfig.directionIndex + 1) % 3;
        return true;
    }

    return false;
}

    _handleEndClick(mx, my) {
        const restartButtonY = height / 2 + 120;
        const restartButtonWidth = 150;
        const restartButtonHeight = 50;

        if (this._inRect(mx, my, width / 2, restartButtonY, restartButtonWidth, restartButtonHeight)) {
            this._fullReset();
            this.state = "home";
            return true;
        }
        return false;
    }

    _inRect(mx, my, cx, cy, w, h) {
        return mx > cx - w / 2 && mx < cx + w / 2 &&
               my > cy - h / 2 && my < cy + h / 2;
    }

    // ---------------------------------------------------------
    // QUESTIONS
    // ---------------------------------------------------------
    _startNewQuestion() {
        let validQuestion = false;
        let attempts = 0;

        this.showingAnswer = false;
        this.answerWasCorrect = false;
        this.timeoutOccurred = false;
        this.startingNoteVisible = false;
        this.guitar.startingNoteVisible = false;
        this.guitar.playedNotes = [];
        this.guitar.setPlayedNote([]);

        // 🔥 Correctif indispensable
        this.startingNoteDisplayTime = 0;
        this.questionDisplayTime = millis();


        while (!validQuestion && attempts < 20) {
            const randomString = floor(random(6));
            const randomFret = floor(random(1, this.guitar.fretCount));

            this.startingNote = this.guitar.getNoteFromCoordinates(randomString, randomFret);
            this.startingNotePosition = { string: randomString, fret: randomFret };

// 🔥 CHOIX DE L’INTERVALLE / DIRECTION — À METTRE ICI
let direction = this.customConfig.directionIndex; // 0 = UP, 1 = DOWN, 2 = BOTH

if (this.difficulty === "custom") {
    if (this.gameMode === "intervals") {
        const allowed = this._getIntervalsForCurrentDifficulty();
        let interval = random(allowed);

        if (direction === 1) interval *= -1; // DOWN
        if (direction === 2 && random() < 0.5) interval *= -1; // BOTH

        this.currentInterval = interval;
        this.targetNote = this._calculateTargetNote(this.startingNote, interval);
    }

    else if (this.gameMode === "degrees") {
        const allowed = this._getIntervalsForCurrentDifficultyDegrees();
        let interval = random(allowed);

        if (direction === 1) interval *= -1;
        if (direction === 2 && random() < 0.5) interval *= -1;

        this.currentDegree = interval;
        this.targetNote = this._calculateTargetNoteByDegree(this.startingNote, interval);
    }

    else if (this.gameMode === "notes") {
        const allowed = this._getIntervalsForCurrentDifficultyNotes();
        let interval = random(allowed);

        if (direction === 1) interval *= -1;
        if (direction === 2 && random() < 0.5) interval *= -1;

        this.targetNote = this._calculateTargetNote(this.startingNote, interval);
        this.currentTargetNoteName = this.targetNote.match(/[A-G]#?b?/)[0];
    }
}


            this.correctNotePosition = this._findNoteOnFretboard(this.targetNote);
            if (this.correctNotePosition) validQuestion = true;
            attempts++;
        }


        this.guitar.startingNotePosition = this.startingNotePosition;
        this.guitar.startingNoteVisible = false;
        this.guitar.startingNote = this.startingNote;

        if (this.gameMode === "notes") {
            this.guitar.degreMode = false;
            this.guitar.tonic = null;
        } else {
            this.guitar.degreMode = true;
            this.guitar.tonic = {
                note: this.startingNote,
                string: this.startingNotePosition.string,
                fret: this.startingNotePosition.fret
            };
        }

        this.guitar.selectionMode = 'single';
        this.guitar.intervals = [];
        this.guitar.clickedNotes = [];
        this.guitar.playedNotes = [];
    }

    _resetSessionState() {
        this.score = 0;
        this.totalCorrectResponses = 0;
        this.responseTimes = [];
        this.questionsAnswered = 0;
        this.showingAnswer = false;
        this.answerWasCorrect = false;
        this.timeoutOccurred = false;
    }

    _fullReset() {
        this.gameMode = null;
        this.timeLimitSeconds = 3;
        this._resetSessionState();
        this.startingNote = null;
        this.startingNotePosition = null;
        this.targetNote = null;
        this.correctNotePosition = null;
        this.startingNoteVisible = false;
        this.guitar.startingNoteVisible = false;
        this.guitar.playedNotes = [];
        this.guitar.setPlayedNote([]);
    }

    // ---------------------------------------------------------
    // INTERVALS / DIFFICULTY HELPERS
    // ---------------------------------------------------------

    _getIntervalsForDifficulty(mode) {
        switch (this.difficulty) {
            case "noob":   return INTERVAL_SETS.noob;
            case "slow":   return INTERVAL_SETS.slow;
            case "normal": return INTERVAL_SETS.normal;
            case "expert": return INTERVAL_SETS.expert;
            case "custom": return this._getCustomIntervals(mode);
        }
    }


   
    _getIntervalsForCurrentDifficulty() {
        return this._getIntervalsForDifficulty("intervals");
    }

    _getIntervalsForCurrentDifficultyDegrees() {
        return this._getIntervalsForDifficulty("degrees");
    }

    _getIntervalsForCurrentDifficultyNotes() {
        return this._getIntervalsForDifficulty("notes");
    }

    _getCustomIntervals(mode) {
        const selected = [...this.customConfig.selectedItems];

        if (selected.length === 0) {
            return []; // rien sélectionné
        }

        if (mode === "intervals") {
            const labels = ['P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7'];
            return selected.map(i => INTERVALS[labels[i]]);
        }

        if (mode === "degrees") {
            // degrés → demi‑tons relatifs
            const degreeSemitones = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            return selected.map(i => degreeSemitones[i]);
        }

        if (mode === "notes") {
            // notes → demi‑tons absolus (C = 0)
            const noteSemitones = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            return selected.map(i => noteSemitones[i]);
        }

        return [];
    }


    // ---------------------------------------------------------
    // MUSIQUE
    // ---------------------------------------------------------
    _calculateTargetNote(startNote, interval) {
        const notesOrderSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        let noteName = startNote.match(/[A-G]#?/)[0];
        let octave = parseInt(startNote.match(/\d+/)[0]);

        let noteIndex = notesOrderSharp.indexOf(noteName);
        let midiIndex = noteIndex + (octave * 12);
        let targetMidiIndex = midiIndex + interval;

        let targetOctave = Math.floor(targetMidiIndex / 12);
        let targetNoteIndex = targetMidiIndex % 12;
        if (targetNoteIndex < 0) {
            targetNoteIndex += 12;
            targetOctave -= 1;
        }

        let targetNote = notesOrderSharp[targetNoteIndex] + targetOctave;

        if (this.useFlatMode) {
            let targetNoteName = targetNote.match(/[A-G]#?b?/)[0];
            if (targetNoteName.includes('#')) {
                const enharmonics = {
                    'C#': 'Db',
                    'D#': 'Eb',
                    'F#': 'Gb',
                    'G#': 'Ab',
                    'A#': 'Bb'
                };
                targetNoteName = enharmonics[targetNoteName];
                targetNote = targetNoteName + targetOctave;
            }
        }

        return targetNote;
    }

    _calculateTargetNoteByDegree(startNote, interval) {
        const notesOrderSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        let noteName = startNote.match(/[A-G]#?/)[0];
        let octave = parseInt(startNote.match(/\d+/)[0]);

        let noteIndex = notesOrderSharp.indexOf(noteName);
        let midiIndex = noteIndex + (octave * 12);
        let targetMidiIndex = midiIndex + Math.abs(interval);

        let targetOctave = Math.floor(targetMidiIndex / 12) - (interval < 0 ? 1 : 0);
        let targetNoteIndex = targetMidiIndex % 12;

        let targetNote = notesOrderSharp[targetNoteIndex] + targetOctave;

        if (this.useFlatMode) {
            let targetNoteName = targetNote.match(/[A-G]#?b?/)[0];
            if (targetNoteName.includes('#')) {
                const enharmonics = {
                    'C#': 'Db',
                    'D#': 'Eb',
                    'F#': 'Gb',
                    'G#': 'Ab',
                    'A#': 'Bb'
                };
                targetNoteName = enharmonics[targetNoteName];
                targetNote = targetNoteName + targetOctave;
            }
        }

        return targetNote;
    }

    _findNoteOnFretboard(noteName) {
        for (let string = 0; string < 6; string++) {
            for (let fret = 0; fret <= this.guitar.fretCount; fret++) {
                let noteOnFret = this.guitar.getNoteFromCoordinates(string, fret);
                if (noteOnFret === noteName) {
                    return { string, fret };
                }
            }
        }
        return null;
    }

    // ---------------------------------------------------------
    // RENDU UI COMPLET
    // ---------------------------------------------------------
    renderUI() {
        push()
        if (this.state === "home") {
            this._renderHomeScreen();
        } else if (this.state === "difficulty") {
            this._renderDifficultyScreen();
        } else if (this.state === "customConfig") {
            this._renderCustomConfigScreen();   
        } else if (this.state === "playing" || this.state === "answer") {
            this._renderGameScreen();
        } else if (this.state === "end") {
            this._renderEndScreen();
        }
        pop()
    }



    _renderCustomConfigScreen() {

        // Label dynamique
        let label = "";
        if (this.gameMode === "intervals") label = "Choix des intervalles";
        else if (this.gameMode === "degrees") label = "Choix des degrés";
        else if (this.gameMode === "notes") label = "Choix des notes";

        const leftWidth = width * 0.25;
        const rightWidth = width * 0.75;

        // ---------------------------
        // 1. Zone PRESETS (gauche)
        // ---------------------------
        this._renderCustomPresetsPanel(0, 0, leftWidth, height);

        // ---------------------------
        // 2. Zone principale (droite)
        // ---------------------------
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text(label, leftWidth + rightWidth / 2, 60);

        // Grille centrée dans la zone droite
        this._renderCustomGrid(150, leftWidth, rightWidth);



        // Gros bouton START
        this._drawButton(leftWidth + rightWidth / 2, height - 80, 300, 80, "START");
        
        this._drawButton(width * 0.15, height - 80, 200, 60, "BACK");

    }





    _renderHomeScreen() {
        fill(0);
        textSize(48);
        textAlign(CENTER, CENTER);
        text('The KYN Game', width / 2, height / 2 - 100);

        textSize(32);
        text('Know Your Neck !', width / 2, height / 2 - 50);

        textSize(24);
        text('Sélectionnez votre type de jeu', width / 2, height / 2 - 10);

        let buttonY = height / 2 + 50;
        let buttonWidth = 120;
        let buttonHeight = 50;

        // Intervalles
        this._drawButton(width / 2 - 200, buttonY, buttonWidth, buttonHeight, '1 - INTERVALLES');

        // Degrés
        this._drawButton(width / 2, buttonY, buttonWidth, buttonHeight, '2 - DEGRÉS');

        // Notes
        this._drawButton(width / 2 + 200, buttonY, buttonWidth, buttonHeight, '3 - NOTES');

        fill(100);
        textSize(14);
        text('Intervalles: montée/descente', width / 2 - 200, height / 2 + 110);
        text('Degrés: dans une gamme', width / 2, height / 2 + 110);
        text('Notes: trouver une note spécifique', width / 2 + 200, height / 2 + 110);
    }

    _renderDifficultyScreen() {
        fill(0);
        textSize(48);
        textAlign(CENTER, CENTER);
        text('The KYN Game', width / 2, height / 2 - 100);

        textSize(32);
        text('Know Your Neck !', width / 2, height / 2 - 50);

        textSize(24);
        text('Sélectionnez votre niveau de difficulté', width / 2, height / 2 - 10);

        let buttonY = height / 2 + 50;
        let buttonWidth = 100;
        let buttonHeight = 50;

        const buttonsX = [
            width / 2 - 210,
            width / 2 - 105,
            width / 2,
            width / 2 + 105,
            width / 2 + 210
        ];

        let difficulties = [
            { label: 'NOOB', time: '10s' },
            { label: 'SLOW', time: '5s' },
            { label: 'NORMAL', time: '4s' },
            { label: 'EXPERT', time: '2s' },
            { label: 'CUSTOM', time: null }
        ];

        for (let i = 0; i < difficulties.length; i++) {
            this._drawButton(buttonsX[i], buttonY, buttonWidth, buttonHeight, difficulties[i].label);

            fill(255);
            textSize(12);

            if (difficulties[i].time !== null) {
                text(difficulties[i].time, buttonsX[i], buttonY + 20);
            }
        }
    }


    _renderGameScreen() {
        let uiY = this.guitar.neckY + this.guitar.neckHeight + 80;

        // Score
        fill(0);
        textAlign(CENTER, TOP);
        textSize(24);
        text('Score: ' + this.score, width / 3, 40);

        // Countdown
        if (this.startingNoteVisible && !this.showingAnswer) {
            let timeElapsedSinceStart = millis() - this.startingNoteDisplayTime;
            let timeRemaining = this.timeLimitSeconds * 1000 - timeElapsedSinceStart;
            let secondsRemaining = max(0, timeRemaining / 1000);

            if (secondsRemaining > 2) {
                fill(0);
            } else if (secondsRemaining > 1) {
                fill(200, 150, 0);
            } else {
                fill(200, 0, 0);
            }
            textSize(40);
            text(secondsRemaining.toFixed(1) + 's', 100, uiY + 40);
        }

        // Consigne selon le mode
        fill(0);
        textAlign(CENTER, TOP);

        if (this.gameMode === "intervals") {
            let intervalInfo = this._getIntervalName(int(this.currentInterval));
            let directionText = "";
            let codeText = "";
            let nameText = "";

            if (this.currentInterval === 0) {
                directionText = "FIND";
                codeText = "unisson";
            } else if (this.currentInterval > 0) {
                directionText = "UP";
                codeText = intervalInfo.code;
                nameText = intervalInfo.fr;
            } else {
                directionText = "DOWN";
                codeText = intervalInfo.code;
                nameText = intervalInfo.fr;
            }

            textSize(70);
            textStyle(BOLD);
            text(directionText + ' ' + codeText, width / 2, uiY);

            if (nameText) {
                textSize(28);
                textStyle(NORMAL);
                text((directionText == "UP" ? 'Monte ' : 'Descends ') +
                     (nameText == 'triton' ? "d'un " : "d'une ") +
                     nameText, width / 2, uiY + 80);
            }
        } else if (this.gameMode === "degrees") {
            let degreeInfo = this._getDegreeName(int(this.currentDegree));
            let directionText = "";

            if (this.currentDegree === 0) {
                directionText = "FIND";
            } else if (this.currentDegree > 0) {
                directionText = "UP " + degreeInfo;
            } else {
                directionText = "DOWN " + degreeInfo;
            }

            textSize(70);
            textStyle(BOLD);
            text(directionText, width / 2, uiY);

            textSize(28);
            textStyle(NORMAL);
            text((this.currentDegree === 0 ? 'Trouve le meme ' :
                 (this.currentDegree > 0 ? 'Monte à ' : 'Descends à ')) +
                 degreeInfo, width / 2, uiY + 80);
        } else if (this.gameMode === "notes") {
            let startNoteName = this.startingNote.match(/[A-G]#?b?/)[0];
            let startOctave = parseInt(this.startingNote.match(/\d+/)[0]);
            let targetOctave = parseInt(this.targetNote.match(/\d+/)[0]);
            let directionText = "";

            if (this.currentTargetNoteName === startNoteName && targetOctave === startOctave) {
                directionText = "FIND " + this.currentTargetNoteName;
            } else if (targetOctave > startOctave) {
                directionText = "UP " + this.currentTargetNoteName;
            } else if (targetOctave < startOctave) {
                directionText = "DOWN " + this.currentTargetNoteName;
            } else {
                directionText = "UP " + this.currentTargetNoteName;
            }

            textSize(70);
            textStyle(BOLD);
            text(directionText, width / 2, uiY);
        }

        // Message de résultat si réponse affichée
        if (this.showingAnswer) {
            textAlign(CENTER, TOP);
            textSize(32);
            if (this.answerWasCorrect) {
                fill(0, 150, 0);
                text('Correct !', width / 2, uiY + 140);
            } else if (this.timeoutOccurred) {
                fill(200, 0, 0);
                text('Temps écoulé !', width / 2, uiY + 140);
            } else {
                fill(200, 0, 0);
                text('Raté…', width / 2, uiY + 140);
            }

            fill(0);
            textSize(20);
            text('Appuie sur ESPACE pour continuer', width / 2, uiY + 190);
        }
    }


_renderCustomGrid(topY, offsetX = 0, areaWidth = width) {
    const cols = 4;
    const rows = 3;

    const cellW = (areaWidth * 0.8) / cols;
    const cellH = cellW * 0.6;

    const startX = offsetX + (areaWidth - cols * cellW) / 2;
    const startY = topY;

    let labels;
    if (this.gameMode === "intervals") {
        labels = ['P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7'];
    } else if (this.gameMode === "degrees") {
        labels = ['1','b2','2','b3','3','4','#4/b5','5','b6','6','b7','7'];
    } else if (this.gameMode === "notes") {
        labels = ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B'];
    } else {
        labels = Array(12).fill("?");
    }

    // on n’utilise que 11 labels (1..11), la 12e est ignorée
    let i = 0;

    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {

            // bas-gauche = DIR
            if (r === 0 && c === 0) {
                this._renderDirectionCycler(startX, startY, cellW, cellH);
                continue;
            }

            const x = startX + c * cellW;
            const y = startY + r * cellH;

            const selected = this.customConfig.selectedItems.has(i);

            fill(selected ? '#66cc66' : '#333333');
            rect(x, y, cellW, cellH, 12);

            fill(255);
            textAlign(CENTER, CENTER);
            textSize(cellH * 0.4);
            text(labels[i], x + cellW / 2, y + cellH / 2);

            i++;
            if (i >= 11) return; // on s’arrête à 11
        }
    }
}

_renderDirectionCycler(startX, startY, cellW, cellH) {
    const x = startX;
    const y = startY; // bas-gauche

    const cx = x + cellW / 2;
    const cy = y + cellH / 2;

    const states = ["UP", "UP&DOWN", "DOWN"];
    const label = states[this.customConfig.directionIndex];

    fill("#444");
    rect(x, y, cellW, cellH, 12);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(cellH * 0.35);
    text(label, cx, cy);
}


    _renderCustomPresetsPanel(x, y, w, h) {
        const btnW = w * 0.8;
        const btnH = 60;
        const startX = x + w * 0.5;
        let currentY = 120;

        const presets = [
            "Triades",
            "Modes",
            "Pentatonique",
            "Blues",
            "Chromatique"
        ];

        for (let p of presets) {
            this._drawButton(startX, currentY, btnW, btnH, p);
            currentY += btnH + 20;
        }
    }


    _renderEndScreen() {
        fill(0);
        textSize(48);
        textAlign(CENTER, CENTER);
        text('Session terminée!', width / 2, height / 2 - 100);

        textSize(32);
        text('Score: ' + this.score + '/' + this.sessionQuestions, width / 2, height / 2 - 20);

        let percentageScore = (this.score / this.sessionQuestions) * 10;
        if (percentageScore >= 8) {
            let averageTimeMs = 0;
            if (this.totalCorrectResponses > 0) {
                averageTimeMs = this.responseTimes.reduce((a, b) => a + b, 0) / this.totalCorrectResponses;
            }
            let averageTime = averageTimeMs / 1000;
            text('Temps moyen: ' + averageTime.toFixed(1) + 's', width / 2, height / 2 + 30);
        } else {
            fill(150, 0, 0);
            textSize(28);
            text('Prends ton temps', width / 2, height / 2 + 30);
            fill(0);
            textSize(16);
            text('(Score trop faible pour afficher le temps)', width / 2, height / 2 + 60);
        }

        let restartButtonY = height / 2 + 120;
        let restartButtonWidth = 150;
        let restartButtonHeight = 50;

        this._drawButton(width / 2, restartButtonY, restartButtonWidth, restartButtonHeight, 'Recommencer');
    }

    _drawButton(cx, cy, w, h, label) {
        push();
        rectMode(CENTER);
        textAlign(CENTER, CENTER);

        // Fond
        fill(0, 100, 200);
        rect(cx, cy, w, h, 8);

        // Texte
        fill(255);
        textSize(18);
        text(label, cx, cy);

        pop();
    }


    // ---------------------------------------------------------
    // INTERVAL / DEGREE NAMES (simplifiés)
    // ---------------------------------------------------------
    _getIntervalName(semitones) {
        const map = {
            0:  { code: 'P1', fr: 'unisson' },
            1:  { code: 'm2', fr: 'seconde mineure' },
            2:  { code: 'M2', fr: 'seconde majeure' },
            3:  { code: 'm3', fr: 'tierce mineure' },
            4:  { code: 'M3', fr: 'tierce majeure' },
            5:  { code: 'P4', fr: 'quarte juste' },
            6:  { code: 'TT', fr: 'triton' },
            7:  { code: 'P5', fr: 'quinte juste' },
            8:  { code: 'm6', fr: 'sixte mineure' },
            9:  { code: 'M6', fr: 'sixte majeure' },
            10: { code: 'm7', fr: 'septième mineure' },
            11: { code: 'M7', fr: 'septième majeure' },
            12: { code: 'P8', fr: 'octave' }
        };
        const abs = Math.abs(semitones);
        return map[abs] || { code: '?', fr: 'intervalle' };
    }

    _getDegreeName(semitones) {
        const abs = Math.abs(semitones);
        const map = {
            0: '1',
            1: 'b2',
            2: '2',
            3: 'b3',
            4: '3',
            5: '4',
            6: 'b5',
            7: '5',
            8: 'b6',
            9: '6',
            10: 'b7',
            11: '7',
            12: '8'
        };
        return map[abs] || '?';
    }

    // audio

    playStartingNote() {
        if (!guitarSF) return; // instrument pas encore chargé

        guitarSF.play(this.startingNote, audioCtx.currentTime, {
            gain: 1.0,
            duration: 1.5
        });
    }

}
