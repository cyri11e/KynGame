class KynGame {
    constructor(guitar) {
        this.guitar = guitar;
        this.flashImage = null;   // l’image générée une seule fois
        this.flashUntil = 0;      // timestamp de fin
        this.flashTriggered = false;


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

    triggerFlash(isCorrect) {

        let pg = createGraphics(width, height);

        // Fond
        pg.noStroke();
        pg.fill(isCorrect ? color(0,180,0) : color(200,0,0));
        pg.rect(0, 0, width, height);

        // Emojis (générés UNE seule fois)
        pg.textAlign(CENTER, CENTER);
        pg.textSize(width * 0.15);
        pg.fill(255);

        let emojisGood = ["😄", "🎉", "✨", "👏", "😎"];
        let emojisBad  = ["😢", "💩", "😡", "👎", "😭"];
        let list = isCorrect ? emojisGood : emojisBad;

        for (let i = 0; i < 20; i++) {
            pg.text(list[int(random(list.length))], random(width), random(height));
        }

        // Texte central
        pg.textSize(width * 0.15);
        pg.textStyle(BOLD);
        pg.fill(255);
        pg.text(isCorrect ? "Correct !" : "Raté…", width / 2, height / 2);

        // Stockage
        this.flashImage = pg;
        this.flashUntil = millis() + 400;
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
this.flashTriggered = false;


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
// ============================================================
// FLASH VISUEL FIXE + FADE OUT
// ============================================================
if (this.flashImage && millis() < this.flashUntil) {

    const remaining = this.flashUntil - millis();
    let alpha = 255;

    // Fade-out sur les 100 dernières ms
    if (remaining < 100) {
        alpha = map(remaining, 0, 100, 0, 255);
    }

    push();
    tint(255, alpha);   // applique l’alpha sur l’image
    image(this.flashImage, 0, 0);
    pop();

    return;
}



    // ============================================================
    // 1) DÉCOUPAGE DE L'ÉCRAN
    // ============================================================

    const topH = height * 0.5;
    const bottomH = height * 0.5;

    // Découpage horizontal de la moitié haute
    const scoreY       = 0;
    const scoreH       = topH * 0.25;

    const consigneY    = scoreY + scoreH;
    const consigneH    = topH * 0.50;

    const descY        = consigneY + consigneH;
    const descH        = topH * 0.25;


    // ============================================================
    // 2) POSITIONNEMENT DU MANCHE (moitié basse)
    // ============================================================

    this.guitar.neckY = topH + (bottomH - this.guitar.neckHeight) / 2;
    this.guitar.neckX = width * 0.10; // décalage pour cordes à vide


    // ============================================================
    // 3) SCORE (bande haute 25%)
    // ============================================================

    fill(0);
    textAlign(CENTER, TOP);
    textSize(scoreH * 0.6);
    text("Score: " + this.score, width / 2, scoreY + scoreH * 0.1);


    // ============================================================
    // 4) TIMER (toujours dans la bande score)
    // ============================================================

    if (this.startingNoteVisible && !this.showingAnswer) {

        let elapsed = millis() - this.startingNoteDisplayTime;
        let remaining = this.timeLimitSeconds * 1000 - elapsed;
        let sec = max(0, remaining / 1000);

        if (sec > 2) fill(0);
        else if (sec > 1) fill(200,150,0);
        else fill(200,0,0);

        textSize(scoreH * 0.4);
        textAlign(LEFT, TOP);
        text(sec.toFixed(1) + "s", width * 0.05, scoreY + scoreH * 0.15);
    }


    // ============================================================
    // 5) CONSIGNE (bande centrale 50%)
    // ============================================================

    fill(0);
    textAlign(CENTER, TOP);
    textSize(consigneH);

    const consigneCenterY = consigneY + consigneH * 0.15;

    if (this.gameMode === "blind") {
        if (!this.hintShown) {
            text("Find the note", width / 2, consigneCenterY);
        } else {
            let info = this._getIntervalName(int(this.currentInterval));
            let dir = this.currentInterval >= 0 ? "UP" : "DOWN";
            text(dir + " " + info.code, width / 2, consigneCenterY);
        }
        return;
    }


    if (this.gameMode === "intervals") {

        let info = this._getIntervalName(int(this.currentInterval));
        let dir = this.currentInterval > 0 ? "UP" :
                  this.currentInterval < 0 ? "DOWN" : "FIND";
        let code = this.currentInterval === 0 ? "unisson" : info.code;
        let name = this.currentInterval === 0 ? "" : info.fr;

        // CONSIGNE (milieu)
        textStyle(BOLD);
        text(dir + " " + code, width / 2, consigneCenterY);

        // DESCRIPTION (bande du bas)
        if (name) {
            textSize(descH );
            textStyle(NORMAL);
            text(
                (dir === "UP" ? "Monte " : "Descends ") +
                (name === "triton" ? "d'un " : "d'une ") +
                name,
                width / 2,
                descY + descH * 0.15
            );
        }
    }


    else if (this.gameMode === "degrees") {

        let deg = this._getDegreeName(int(this.currentDegree));
        let dir = this.currentDegree === 0 ? "FIND" :
                  this.currentDegree > 0 ? "UP " + deg :
                                           "DOWN " + deg;

        // CONSIGNE
        textStyle(BOLD);
        text(dir, width / 2, consigneCenterY);

        // DESCRIPTION
        textSize(descH);
        textStyle(NORMAL);
        text(
            (this.currentDegree === 0 ? "Trouve le même " :
             this.currentDegree > 0 ? "Trouve le prochain " : "Trouve le precedent ") + deg,
            width / 2,
            descY + descH * 0.15
        );
    }


else if (this.gameMode === "notes") {
    const NOTE_FR = {
    "C": "do",
    "C#": "do#",
    "Db": "réb",
    "D": "ré",
    "D#": "ré#",
    "Eb": "mib",
    "E": "mi",
    "F": "fa",
    "F#": "fa#",
    "Gb": "solb",
    "G": "sol",
    "G#": "sol#",
    "Ab": "lab",
    "A": "la",
    "A#": "la#",
    "Bb": "sib",
    "B": "si"
};


    let startName = this.startingNote.match(/[A-G]#?b?/)[0];
    let startOct = parseInt(this.startingNote.match(/\d+/)[0]);

    let targetName = this.currentTargetNoteName;
    let targetOct = parseInt(this.targetNote.match(/\d+/)[0]);
    let targetFR = NOTE_FR[targetName];

    // Convertir en valeur MIDI pour comparer correctement
    const noteToMidi = (name, oct) => {
        const map = { C:0, "C#":1, Db:1, D:2, "D#":3, Eb:3, E:4, F:5, "F#":6, Gb:6, G:7, "G#":8, Ab:8, A:9, "A#":10, Bb:10, B:11 };
        return map[name] + 12 * (oct + 1);
    };

    const startMidi = noteToMidi(startName, startOct);
    const targetMidi = noteToMidi(targetName, targetOct);

    let dir = "";
    if (targetMidi === startMidi)
        dir = "FIND " + targetName;
    else if (targetMidi > startMidi)
        dir = "UP " + targetName;
    else
        dir = "DOWN " + targetName;

    // CONSIGNE
    textSize(consigneH);
    textStyle(BOLD);
    text(dir, width / 2, consigneCenterY);

    // DESCRIPTION
    textSize(descH);
    textStyle(NORMAL);

    let desc = "";
    if (targetMidi === startMidi)
        desc = "Trouve le même " + targetFR;
    else if (targetMidi > startMidi)
        desc = "Trouve le prochain " + targetFR;
    else
        desc = "Trouve le précédent " + targetFR;

    text(desc, width / 2, descY + descH * 0.15);
}


    // ============================================================
    // 6) MESSAGE DE RÉSULTAT → déclenchement du flash
    // ============================================================
    if (this.showingAnswer && !this.flashTriggered) {

        this.triggerFlash(this.answerWasCorrect);
        this.flashTriggered = true;
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
