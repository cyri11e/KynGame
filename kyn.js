class KynGame {
    constructor(guitar) {
        this.guitar = guitar;

        // ui
        this.ui = new UIButtonManager();
    
        // États principaux
        this.state = "home"; // "home" | "difficulty" | "playing" | "answer" | "end"

        // Mode de jeu
        this.gameMode = null; // "intervals" | "degrees" | "notes"
        this.useFlatMode = true;
        this.hintShown = false;

        this.customConfig = {
            timerValues: [1000, 2000, 3000, 5000, 10000, Infinity],
            timerIndex: 2,          // 3s par défaut
            directionIndex: 0,      // 0: UP, 1: DOWN, 2: UP & DOWN
            selectedItems: new Set(),
            presetName: null,
            accordsIndex: 0,
            pentaIndex: 0,
            diatoniqueIndex: 0
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
        this.displayTimeDelay = 0; // délai avant affichage de la note de départ
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

    // ---------------------------------------------------------
    // 1) TIMER AUTO-CONTINUE (fonctionne même hors "playing")
    // ---------------------------------------------------------
    if (this.state === "answer") {
        const now = millis();

        // initialisation du timer
        if (!this.answerTimerStart) {
            this.answerTimerStart = now;
        }

        // après 2 secondes → question suivante ou fin
        if (now - this.answerTimerStart >= 2000) {
            this.answerTimerStart = null;

            if (this.questionsAnswered >= this.sessionQuestions) {
                this.state = "end";
            } else {
                this.state = "playing";
                this._startNewQuestion();
            }
        }

        return; // IMPORTANT : on ne fait rien d’autre en mode answer
    }

    // ---------------------------------------------------------
    // 2) SI PAS EN MODE PLAYING → STOP
    // ---------------------------------------------------------
    if (this.state !== "playing") return;

    // ---------------------------------------------------------
    // 3) LOGIQUE DU MODE PLAYING
    // ---------------------------------------------------------

    const now = millis();
    const timeSinceQuestionDisplay = now - this.questionDisplayTime;
    
if (this.gameMode === "blind" && !this.hintShown && this.startingNoteVisible) {
    const elapsedSinceStart = now - this.startingNoteDisplayTime;
    const timeRemaining = this.timeLimitSeconds * 1000 - elapsedSinceStart;

    if (timeRemaining <= 2000) {
        this.hintShown = true;
    }
}




    // Affichage différé de la note de départ
    if (!this.startingNoteVisible && timeSinceQuestionDisplay >= this.displayTimeDelay) {
        this.startingNoteVisible = true;
        this.startingNoteDisplayTime = now;
        this.guitar.startingNoteVisible = true;
        //this.playStartingNote();
    }

    // Countdown / Timeout
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

            // passage en mode answer → timer auto
            this.state = "answer";
            this.answerTimerStart = null;
        }
    }
}



    // ---------------------------------------------------------
    // GESTION DES CLICS (menus + jeu)
    // ---------------------------------------------------------
mouseClicked(mx, my) {

    if (this.state === "home") return this._handleHomeClick(mx, my);
    if (this.state === "difficulty") return this._handleDifficultyClick(mx, my);
    if (this.state === "customConfig") {
        return UICustomScreen.click(this, this.ui, mx, my);
    }

    if (this.state === "end") return this._handleEndClick(mx, my);

    // En mode playing/answer → NE TOUCHE PAS AUX HANDLERS CUSTOM
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

    if (this.state !== "playing") {
        console.log('CLICK IGNORED: state !== "playing"');
        return;
    }
    if (!this.startingNoteVisible) {
        console.log('CLICK IGNORED: startingNoteVisible === false');
        return;
    }
    if (this.showingAnswer) {
        console.log('CLICK IGNORED: showingAnswer === true');
        return;
    }

    if (this.gameMode === "blind") {

        if (!this.hintShown) {
            // Réponse AVANT indice → 1 point
            if (clickedNote.note === this.targetNote) {
                this.score += 1;
                this.answerWasCorrect = true;
            } else {
                this.answerWasCorrect = false;
            }
        } else {
            // Réponse APRÈS indice → 0.5 point
            if (clickedNote.note === this.targetNote) {
                this.score += 0.5;
                this.answerWasCorrect = true;
            } else {
                this.answerWasCorrect = false;
            }
        }

        this.questionsAnswered++;
        this.showingAnswer = true;

        if (this.correctNotePosition) {
            this.guitar.setPlayedNote([this.targetNote]);
        }

        this.state = "answer";
        return;
    }

    // à partir d’ici, le clic est accepté
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
    return UIHomeScreen.click(this, this.ui, mx, my);
}




_handleDifficultyClick(mx, my) {
    return UIDifficultyScreen.click(this, this.ui, mx, my);
}



    _handleEndClick(mx, my) {
        return UIEndScreen.click(this, this.ui, mx, my);
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

    this.startingNoteDisplayTime = 0;
    this.questionDisplayTime = millis();
    this.hintShown = false;


    while (!validQuestion && attempts < 20) {

        // --- 1. NOTE DE DÉPART ---
        const randomString = floor(random(6));
        const randomFret = floor(random(1, this.guitar.fretCount));

        this.startingNote = this.guitar.getNoteFromCoordinates(randomString, randomFret);
        this.startingNotePosition = { string: randomString, fret: randomFret };

        // Jouer la note de départ
        playNote(this.startingNote, 2000    );

        // --- 2. CHOIX INTERVALLE / DEGRÉ / NOTE ---
        let interval;

        if (this.gameMode === "intervals") {
            const allowed = this._getIntervalsForCurrentDifficulty();
            interval = random(allowed);

            // direction appliquée UNIQUEMENT en mode custom
            if (this.difficulty === "custom") {
                const dir = this.customConfig.directionIndex; // 0=UP,1=DOWN,2=BOTH
                if (dir === 1) interval *= -1;
                if (dir === 2 && random() < 0.5) interval *= -1;
            }

            this.currentInterval = interval;
            this.targetNote = this._calculateTargetNote(this.startingNote, interval);
        
        }

        else if (this.gameMode === "degrees") {
            const allowed = this._getIntervalsForCurrentDifficultyDegrees();
            interval = random(allowed);

            if (this.difficulty === "custom") {
                const dir = this.customConfig.directionIndex;
                if (dir === 1) interval *= -1;
                if (dir === 2 && random() < 0.5) interval *= -1;
            }

            this.currentDegree = interval;
            this.targetNote = this._calculateTargetNoteByDegree(this.startingNote, interval);
        }

        else if (this.gameMode === "notes") {
            const allowed = this._getIntervalsForCurrentDifficultyNotes();
            interval = random(allowed);

            if (this.difficulty === "custom") {
                const dir = this.customConfig.directionIndex;
                if (dir === 1) interval *= -1;
                if (dir === 2 && random() < 0.5) interval *= -1;
            }

            this.targetNote = this._calculateTargetNote(this.startingNote, interval);
            this.currentTargetNoteName = this.targetNote.match(/[A-G]#?b?/)[0];
            
            // --- Harmonisation des altérations du manche ---
            if (this.targetNote.includes('#')) {
                this.useFlatMode = false;   // force dièses
            } else if (this.targetNote.includes('b')) {
                this.useFlatMode = true;    // force bémols
            } else {
                this.useFlatMode = true;    // naturel → bémol par défaut
            }

        }
        else if (this.gameMode === "blind") {
            const allowed = this._getIntervalsForCurrentDifficulty();
            interval = random(allowed);

            // direction custom
            if (this.difficulty === "custom") {
                const dir = this.customConfig.directionIndex;
                if (dir === 1) interval *= -1;
                if (dir === 2 && random() < 0.5) interval *= -1;
            }

            this.currentInterval = interval;
            this.targetNote = this._calculateTargetNote(this.startingNote, interval);
        }


        // --- 3. VALIDATION : la note existe sur le manche ---
        this.correctNotePosition = this._findNoteOnFretboard(this.targetNote);
        if (this.correctNotePosition) validQuestion = true;

        attempts++;
    }

    // --- 4. MISE À JOUR GUITARE ---
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


        // Jouer la note réponse juste après
        setTimeout(() => {
            console.log("Playing target note:", targetNote);
            playNote(targetNote, 600);
        }, 650);

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
        // Jouer la note réponse juste après
        setTimeout(() => {
            console.log("Playing target note:", targetNote);
            playNote(targetNote, 600);
        }, 650);

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
        if (isPortrait()) {
            this._renderRotateDeviceOverlay();
            return;
        }

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

    _renderRotateDeviceOverlay() {
        push();
        background(0, 0, 0, 200);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text("Tournez votre appareil en mode paysage", width / 2, height / 2);
        pop();
    }


_renderCustomConfigScreen() {
    UICustomScreen.render(this, this.ui);
}




_renderHomeScreen() {
    UIHomeScreen.render(this, this.ui);
}



_renderDifficultyScreen() {
    UIDifficultyScreen.render(this, this.ui);
}

_renderGameScreen() {

    // ============================================================
    // 1) DÉCOUPAGE DE L'ÉCRAN EN 2 ZONES 50/50
    // ============================================================

    const topHalfTop = 0;
    const topHalfBottom = height * 0.5;

    const bottomHalfTop = height * 0.5;
    const bottomHalfHeight = height * 0.5;


    // ============================================================
    // 2) POSITIONNEMENT DU MANCHE DANS LA MOITIÉ BASSE
    //    - centré verticalement
    //    - décalé vers la droite pour libérer les cordes à vide
    // ============================================================

    // Position verticale : centré dans la moitié basse
    this.guitar.neckY = bottomHalfTop + (bottomHalfHeight - this.guitar.neckHeight) / 2;

    // Décalage horizontal vers la droite (10% de l'écran)
    const offsetX = width * 0.10;
    this.guitar.neckX = offsetX;


    // ============================================================
    // 3) POSITION DES CONSIGNES DANS LA MOITIÉ HAUTE
    // ============================================================

    // uiY = ligne principale des consignes
    let uiY = topHalfTop + (topHalfBottom - topHalfTop) * 0.45;


    // ============================================================
    // 4) SCORE (en haut)
    // ============================================================

    fill(0);
    textAlign(CENTER, TOP);
    textSize(height/8);
    text('Score: ' + this.score, width / 2, topHalfTop);


    // ============================================================
    // 5) TIMER (en haut à gauche)
    // ============================================================

    if (this.startingNoteVisible && !this.showingAnswer) {
        let timeElapsedSinceStart = millis() - this.startingNoteDisplayTime;
        let timeRemaining = this.timeLimitSeconds * 1000 - timeElapsedSinceStart;
        let secondsRemaining = max(0, timeRemaining / 1000);

        if (secondsRemaining > 2) fill(0);
        else if (secondsRemaining > 1) fill(200,150,0);
        else fill(200,0,0);

        textSize(40);
        textAlign(LEFT, TOP);
        text(secondsRemaining.toFixed(1) + 's', width * 0.05, topHalfTop + 10);
    }


    // ============================================================
    // 6) CONSIGNES (dans la moitié haute)
    //    — AUCUNE TAILLE MODIFIÉE —
    // ============================================================

    fill(0);
    textAlign(CENTER, TOP);

    if (this.gameMode === "blind") {
        textSize(32);

        if (!this.hintShown) {
            text("Find the note", width / 2, uiY);
        } else {
            let intervalInfo = this._getIntervalName(int(this.currentInterval));
            let directionText = this.currentInterval >= 0 ? "UP" : "DOWN";
            text(directionText + " " + intervalInfo.code, width / 2, uiY);
        }
        return;
    }


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

        textSize(height/4);
        textStyle(BOLD);
        text(directionText + ' ' + codeText, width / 2, uiY);

        if (nameText) {
            textSize(height/9);
            textStyle(NORMAL);
            text(
                (directionText == "UP" ? 'Monte ' : 'Descends ') +
                (nameText == 'triton' ? "d\'un " : "d\'une ") +
                nameText,
                width / 2,
                uiY + (topHalfBottom - topHalfTop) * 0.20
            );
        }
    }


    else if (this.gameMode === "degrees") {

        let degreeInfo = this._getDegreeName(int(this.currentDegree));
        let directionText = "";

        if (this.currentDegree === 0) directionText = "FIND";
        else if (this.currentDegree > 0) directionText = "UP " + degreeInfo;
        else directionText = "DOWN " + degreeInfo;

        textSize(70);
        textStyle(BOLD);
        text(directionText, width / 2, uiY);

        textSize(28);
        textStyle(NORMAL);
        text(
            (this.currentDegree === 0 ? 'Trouve le meme ' :
             (this.currentDegree > 0 ? 'Monte à ' : 'Descends à ')) +
            degreeInfo,
            width / 2,
            uiY + (topHalfBottom - topHalfTop) * 0.20
        );
    }


    else if (this.gameMode === "notes") {

        let startNoteName = this.startingNote.match(/[A-G]#?b?/)[0];
        let startOctave = parseInt(this.startingNote.match(/\d+/)[0]);
        let targetOctave = parseInt(this.targetNote.match(/\d+/)[0]);
        let directionText = "";

        if (this.currentTargetNoteName === startNoteName && targetOctave === startOctave)
            directionText = "FIND " + this.currentTargetNoteName;
        else if (targetOctave > startOctave)
            directionText = "UP " + this.currentTargetNoteName;
        else if (targetOctave < startOctave)
            directionText = "DOWN " + this.currentTargetNoteName;
        else
            directionText = "UP " + this.currentTargetNoteName;

        textSize(70);
        textStyle(BOLD);
        text(directionText, width / 2, uiY);
    }


    // ============================================================
    // 7) MESSAGE DE RÉSULTAT (toujours dans la moitié haute)
    // ============================================================

    if (this.showingAnswer) {

        textAlign(CENTER, TOP);
        textSize(32);

        const baseY = uiY + (topHalfBottom - topHalfTop) * 0.25;

        if (this.answerWasCorrect) {
            fill(0,150,0);
            text('Correct !', width / 2, baseY);
        } else if (this.timeoutOccurred) {
            fill(200,0,0);
            text('Temps écoulé !', width / 2, baseY);
        } else {
            fill(200,0,0);
            text('Raté…', width / 2, baseY);
        }

        fill(0);
        textSize(20);
        text(
            'Appuie sur ESPACE pour continuer',
            width / 2,
            baseY + (topHalfBottom - topHalfTop) * 0.18
        );
    }
}


_
_renderDirectionCycler(x, y, cellW, cellH) {
    const cx = x + cellW / 2;
    const cy = y + cellH / 2;

    const states = ["UP", "UP&DOWN", "DOWN"];
    const label = states[this.customConfig.directionIndex];

    stroke("#ffaa00");     // liseret orange
    strokeWeight(4);
    fill("#663300");       // fond marron/orange foncé
    rect(x, y, cellW, cellH); // carré, pas de radius

    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(cellH * 0.35);
    text(label, cx, cy);
}



_renderEndScreen() {
    UIEndScreen.render(this, this.ui);
}


    _drawButton(cx, cy, w, h, label, fillColor = 'blue',  ) {
        push();
        rectMode(CENTER);
        textAlign(CENTER, CENTER);

        // Fond
        fill(fillColor);
        rect(cx, cy, w, h, 8);

        // Texte
        fill(255);
        textSize(h/2);
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


}
