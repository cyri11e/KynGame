class Guitar{
    constructor(fretCount){
        this.neckX = 50; // offset
        this.neckY = 100;
        this.fretCount = fretCount;
        this.stringCount = 6;

        this.canvasWidth = windowWidth;
        this.canvasHeight = windowHeight;
        this.neckWidth = 12/14*this.canvasWidth;
        this.neckHeight = this.canvasWidth/6
        this.markerDiameter = this.neckHeight/10
        this.noteMarkerDiameter = this.neckHeight/5 // Diamètre des pastilles de note
        this.textSize = 0.8*this.noteMarkerDiameter
        this.markerPositions = [3, 5, 7, 9, 12];
        this.openStringNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
        this.stringThickness = [1, 1.5, 2, 2.5, 3, 4]; // Épaisseurs des cordes du Mi aigu au Mi grave
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const startIndex = this.noteNames.indexOf('F');
        this.ENoteNames = this.noteNames.slice(startIndex)
                                          .concat(this.noteNames.slice(0, startIndex));
        this.hoveredNote = null;
        this.clickedNote = null;
        this.playedNoteName = null;
        this.playedNotes = [];
        this.midiPlayedNotes = [];
        this.clickedNotes = []
        this.highlightedNotes = [];
        this.flatMode = true;
        this.startingNotePosition = null; // {string, fret} de la note de départ
        this.startingNote = null; // Nom de la note de départ (ex: "C4")
        this.startingNoteVisible = false; // La note de départ doit-elle être visible ?
        this.godMode = true; // Affiche la pastille sous le curseur
        this.noteColors = [
            color(255, 20, 20),          // Do (C) - Rouge
            color(255, 82, 90),        // Do# (C#) / Réb (Db) - Intermédiaire entre rouge et orange
            color(255, 165, 10),        // Ré (D) - Orange
            color(255, 210, 10),        // Ré# (D#) / Mib (Eb) - Intermédiaire entre orange et jaune
            color(200, 200, 10),        // Mi (E) - Jaune
            color(144, 238, 144),      // Fa (F) - Vert clair
            color(72, 169, 127),       // Fa# (F#) / Solb (Gb) - Intermédiaire entre vert clair et bleu
            color(20, 40, 255),          // Sol (G) - Bleu
            color(68, 103, 192),       // Sol# (G#) / Lab (Ab) - Intermédiaire entre bleu et indigo
            color(75, 10, 130),         // La (A) - Indigo
            color(111, 21, 168),       // La# (A#) / Sib (Bb) - Intermédiaire entre indigo et violet
            color(148, 10, 211)         // Si (B) - Violet foncé
          ];
          this.anim = this.fade(10)
    }

    fade(speed) {
        let val = speed > 0 ? 0 : 100; // Renommé 'value' en 'val' pour éviter le conflit p5.js
        if (!speed) speed = 1;
        return () => {
            if (speed > 0 && val < 100) {
                val += speed;
            } else if (speed < 0 && val > 0) {
                val += speed;
            }
            return val;
        };
    }

    setPlayedNote(notes){
        this.playedNotes = notes
    }

    resize(){
        this.canvasWidth = windowWidth;
        this.canvasHeight = windowHeight;
        this.neckWidth = 12/14*this.canvasWidth;
        this.neckHeight = this.canvasWidth/6
        this.markerDiameter = this.neckHeight/12
        this.noteMarkerDiameter = this.neckHeight/5 // Diamètre des pastilles de note
        this.textSize = this.noteMarkerDiameter
   }

    display() {
        background(220);
        this.drawHead();
        this.drawNeckBackground();
        this.drawStrings();
        this.drawMarkers();
        this.drawOpenNotes();
        //this.drawENotes();
        this.drawPlayedNotes();
        this.drawStartingNote();
       // this.drawHoveredNote();
        this.drawGodMode();
    }

    drawNeckBackground() {
// Ombre portée du manche
push();
fill(60); // noir transparent
noStroke();

// même forme que le manche, mais décalée
rect(
    this.neckX + 6,          // décalage horizontal
    this.neckY - 10 + 6,     // décalage vertical
    this.neckWidth,
    this.neckHeight + 20
);
pop();


        fill('#eedbcbff'); // Couleur marron pour le manche
        rect(this.neckX, this.neckY-10, this.neckWidth, this.neckHeight+20);

        // Dessiner le sillet
        fill(0); // Couleur noire pour le sillet
        rect(this.neckX - 5, this.neckY-10, 5, this.neckHeight+20);

        // Dessiner les frettes avec un effet métallique
        for (let i = 0; i <= this.fretCount; i++) {
            let x = this.neckX + i * (this.neckWidth / this.fretCount);
            let gradient = drawingContext.createLinearGradient(x, this.neckY, x + (this.neckWidth / this.fretCount), this.neckY + this.neckHeight);
            gradient.addColorStop(0, '#D3D3D3'); // Gris clair
            gradient.addColorStop(0.5, '#FFFFFF'); // Blanc pour le reflet
            gradient.addColorStop(1, '#A9A9A9'); // Gris foncé
            drawingContext.fillStyle = gradient;
            rect(x, this.neckY-10, 4, this.neckHeight+20);
            push()
            stroke(80);          // noir
            strokeWeight(1);    // épaisseur 1 px
            line(x + 4, this.neckY-10, x + 4, this.neckY + this.neckHeight+10);
            stroke(250);          // noir
            strokeWeight(1);    // épaisseur 1 px
            line(x , this.neckY-10, x  , this.neckY + this.neckHeight+10);
            pop()
        }
    }
    drawPlayedNotes() {
        if (this.playedNoteName != null) {
            let noteColor;
            if (this.tonic) {

                noteColor = this.noteColors[this.calculeDegreeChromatique(this.tonic, { note : this.playedNoteName } )];
            }
            else
                noteColor = 'red';
            if (noteColor)
                fill(color(noteColor));
            this.drawAllOccurrences(this.playedNoteName, true);
        }

        if (this.playedNotes)
            for ( let playedNote of this.playedNotes){
                let noteColor;
                if (this.tonic) {

                    let dc = this.calculeDegreeChromatique(this.tonic, { note : playedNote } )
                    //console.log(this.tonic, playedNote, dc)

                    noteColor = this.noteColors[dc];
                }
                else
                    noteColor = 'red';
                if (noteColor)
                    fill(color(noteColor));
                this.drawAllOccurrences({ note :playedNote}, true);
            }

        for ( let midiPlayedNote of this.midiPlayedNotes){
            let noteColor;
            if (this.tonic)
                noteColor = this.noteColors[this.calculeDegreeChromatique(this.tonic, midiPlayedNote)];
            else
                noteColor = 'red';
            if (noteColor)
                fill(color(noteColor));
            this.drawAllOccurrences(midiPlayedNote, true);
        }

    }

    drawHoveredNote() {
        if (this.hoveredNote) {
            let noteColor;
            if (this.tonic)
                noteColor = this.noteColors[this.calculeDegreeChromatique(this.tonic||this.hoveredNote, this.hoveredNote)];
            else
                noteColor = color(255, 0, 0); // Rouge si pas de tonique

            fill(noteColor);

            // Mode 'all' : octaves + intervalles + occurrences
            if (this.selectionMode === 'all') {
                this.drawAllOctaves(this.hoveredNote, null, true);
                this.drawAllIntervals(this.hoveredNote, this.intervals, null, true);
                this.drawAllOccurrences(this.hoveredNote, null, true);
            }
            // Mode 'exact' : note exacte + intervalles exacts (pas d'octaves)
            else if (this.selectionMode === 'exact') {
                this.drawExactIntervals(this.hoveredNote, this.intervals, null, true);
                this.drawExactOccurrences(this.hoveredNote, null, true);
            }
            // Mode 'single' : uniquement la note exacte survolée (pas d'intervalles, pas d'autres notes)
            else if (this.selectionMode === 'single') {
                this.drawNoteOnFretboard(this.hoveredNote.note, this.hoveredNote.string, this.hoveredNote.fret, null, true);
            }
        }
    }

    drawStartingNote() {
        // Afficher la note de départ avec une pastille rouge normale
        if (!this.startingNoteVisible) return; // Ne pas afficher si pas encore visible
        
        if (this.startingNotePosition && this.startingNote) {
            let stringIdx = this.startingNotePosition.string;
            let fretIdx = this.startingNotePosition.fret;
            
            push();
            let stringHeight = this.neckHeight / (this.stringCount - 1);
            let fretWidth = this.neckWidth / this.fretCount;
            
            let x = fretIdx === 0 ? this.neckX - 20 : this.neckX + fretIdx * fretWidth - (fretWidth / 2);
            let y = this.neckY + stringIdx * stringHeight;
            
            // Dessiner la pastille rouge normale
            fill(255, 0, 0); // Rouge pour la note de départ
            strokeWeight(4);
            stroke(0);
            ellipse(x, y, this.noteMarkerDiameter, this.noteMarkerDiameter);
            
            // Déterminer le label à afficher
            let noteLabel;
            if (this.degreMode && this.tonic) {
                // En mode degré: afficher "1" pour la tonique
                noteLabel = '1';
            } else {
                // En mode note: afficher le nom de la note
                let notePart = this.startingNote.slice(0, -1);
                let octave = this.startingNote.slice(-1);
                if (this.flatMode) notePart = this.swapEnharmonics(notePart);
                noteLabel = notePart + octave;
            }
            
            // Afficher le texte
            textSize(this.textSize * 0.8);
            textAlign(CENTER, CENTER);
            noStroke();
            fill(255);
            text(noteLabel, x, y);
            
            pop();
        }
    }

    drawGodMode() {
        // Afficher une pastille sous le curseur pour tous les modes quand god_mode est true
        if (this.godMode && this.hoveredNote) {
            let stringIdx = this.hoveredNote.string;
            let fretIdx = this.hoveredNote.fret;
            
            push();
            let stringHeight = this.neckHeight / (this.stringCount - 1);
            let fretWidth = this.neckWidth / this.fretCount;
            
            let x = this.neckX + fretIdx * fretWidth - (fretWidth / 2);
            let y = this.neckY + stringIdx * stringHeight;
            
            // Dessiner un cercle pulsant rouge transparent par-dessus la note survolée
            fill(255, 0, 0, 80); // Rouge semi-transparent
            stroke(255, 0, 0);
            strokeWeight(2);
            
            // Ajouter une pulsation légère
            let pulse = sin(frameCount * 0.1) * 2;
            ellipse(x, y, this.noteMarkerDiameter * 1.2 + pulse, this.noteMarkerDiameter * 1.2 + pulse);
            
            pop();
        }
    }

    drawNoteOnFretboard(note, string, fret, vibre, hover) {
        // Couleur doit etre definie avant l'appel
        push()
        const prevAlpha = drawingContext.globalAlpha || 1;

        // Ne pas afficher les notes hors zone visible
        if (fret < 0 || fret > this.fretCount || string < 0 || string >= this.stringCount) {
            pop();
            return;
        }

        // En mode tonic, afficher toutes les pastilles noires + tonique avec contour rouge
        if (this.tonicMode) {
            noStroke();
            let x = fret === 0 ? this.neckX - 20 : this.neckX + fret * (this.neckWidth / this.fretCount) - (this.neckWidth / this.fretCount) / 2;
            let y = this.neckY + string * (this.neckHeight / (this.stringCount - 1));
            
            fill(0); // Pastille noire
            
            // Vérifier si c'est une occurrence de la tonique (même note, peu importe la position)
            if (this.tonic && this.getNoteName(note) === this.getNoteName(this.tonic.note)) {
                // Tonique : contour rouge
                strokeWeight(4);
                stroke(255, 0, 0);
            } else {
                // Autres notes : pas de contour
                noStroke();
            }
            
            ellipse(x, y, this.noteMarkerDiameter, this.noteMarkerDiameter);
            
            pop();
            return;
        }

        // En mode blank, afficher uniquement les pastilles noires sans labels
        if (this.blankMode) {
            noStroke();
            let x = fret === 0 ? this.neckX - 20 : this.neckX + fret * (this.neckWidth / this.fretCount) - (this.neckWidth / this.fretCount) / 2;
            let y = this.neckY + string * (this.neckHeight / (this.stringCount - 1));
            
            fill(0); // Noir
            strokeWeight(4);
            stroke(0);
            ellipse(x, y, this.noteMarkerDiameter, this.noteMarkerDiameter);
            
            pop();
            return;
        }

        // Appliquer le filtre d'affichage selon selectionMode SEULEMENT en mode single
        if (this.selectionMode === 'single' && this.hoveredNote && this.clickedNotes.length === 0 && this.intervals.length === 0) {
            const isSamePosition = (this.hoveredNote.string === string && this.hoveredNote.fret === fret && this.hoveredNote.note === note);
            // En mode single, on n'affiche que la note survolée exacte
            if (!isSamePosition) {
                pop();
                return;
            }
        }

        // Transparence proportionnelle à la distance du curseur (TOUJOURS appliquée si hoveredNote existe)
        let alpha = 1;
        if (this.hoveredNote) {
            const isSamePosition = (this.hoveredNote.string === string && this.hoveredNote.fret === fret && this.hoveredNote.note === note);
            const isSelected = this.clickedNotes.some(n => n.note === note && n.string === string && n.fret === fret);
            
            if (isSamePosition || isSelected) {
                alpha = 1; // pleine opacité pour la note sous le curseur ou sélectionnée
            } else {
                // Calculer la distance (Manhattan) entre la note courante et la note survolée
                const fretDist = Math.abs(fret - this.hoveredNote.fret);
                const stringDist = Math.abs(string - this.hoveredNote.string);
                const distance = fretDist + stringDist;
                
                // Transparence inversement proportionnelle avec facteur ajustable
                const maxDist = 6; // distance maximale pour atténuation
                alpha = Math.max(0.2, 1 - (distance / maxDist) * this.transparencyFactor);
            }
        }
        drawingContext.globalAlpha = alpha;

        noStroke();
        let x = fret === 0 ? this.neckX - 20 : this.neckX + fret * (this.neckWidth / this.fretCount) - (this.neckWidth / this.fretCount) / 2;
        let y = this.neckY + string * (this.neckHeight / (this.stringCount - 1));
        let pulse, noteLabel

	if (vibre){
		stroke(255);
		strokeWeight(2);
		pulse = sin(frameCount*0.8) * 3
	}
	else {
		noStroke()
		pulse = 0
	}

	let offset = this.textSize / 20
	let hoverPulse = 0
      
	if (hover){
		hoverPulse = sin(frameCount*0.1) * 2
		push()
		fill(40,100)
		ellipse(x+offset-hoverPulse, y+offset-hoverPulse, this.noteMarkerDiameter*1.1 , this.noteMarkerDiameter*1.1 );
		pop()
	    strokeWeight(4)
	    stroke(0)     
		ellipse(x-offset, y-offset+hoverPulse, this.noteMarkerDiameter , this.noteMarkerDiameter );
	
	} else  {  
	    strokeWeight(4)
	    stroke(0)            
		ellipse(x, y, this.noteMarkerDiameter +pulse, this.noteMarkerDiameter + pulse);
    }
	// Vérifiez si la note est surlignée
	if (this.highlightedNotes.some(highlightedNote => highlightedNote.note === note && highlightedNote.string === string && highlightedNote.fret === fret)) {
		fill(255, 255, 0, 100);
		rect(x - this.noteMarkerDiameter, y - this.noteMarkerDiameter / 2, 2 * this.noteMarkerDiameter, this.noteMarkerDiameter);
	}

	textSize(this.textSize);
	textAlign(CENTER, CENTER);
	blendMode(BLEND);
	noStroke()
	fill(25);
	if (this.degreMode)
		noteLabel = this.chromaticToDiatonic(this.calculeDegreeChromatique(this.tonic||this.hoveredNote,{note : note}),)
	else
		noteLabel = note

	if (this.degreMode)
		this.renderDegreLabel(noteLabel, x, offset, y, hoverPulse);
	else
		this.renderNoteLabel(noteLabel, x, offset, y, hoverPulse);
	
	drawingContext.globalAlpha = prevAlpha;
        pop()
}

    swapEnharmonics(note) {
        const enharmonics = {
            'C#': 'Db',
            'D#': 'Eb',
            'F#': 'Gb',
            'G#': 'Ab',
            'A#': 'Bb'
        };
        return this.flatMode && enharmonics[note] ? enharmonics[note] : note;
    }

    renderNoteLabel(noteLabel, x, offset, y, hoverPulse) {
        let noteName = noteLabel.slice(0, -1);
        let octave = noteLabel.slice(-1);
        let alteration = '';

        if (this.flatMode) noteName = this.swapEnharmonics(noteName);

        if (noteName.includes('#')) {
            noteName = noteName.replace('#', '');
            alteration = '♯';
        } else if (noteName.includes('b')) {
            noteName = noteName.replace('b', '');
            alteration = '♭';
        }

        textSize(this.textSize* 0.8);
        textAlign(CENTER, CENTER);
        blendMode(BLEND);
        strokeWeight(2);
        stroke(0)
        fill(255)
        // fill(25); // Couleur grise pour l'ombre
        // text(noteName, x  - offset * 3 , y + offset + hoverPulse);
        // textSize(this.textSize * 0.7);
        // text(octave, x + offset + this.textSize * 0.4, y + offset * 2 + hoverPulse + this.textSize * 0.4);
        // textSize(this.textSize * 0.8);
        // text(alteration, x + offset + this.textSize * 0.4, y + offset + hoverPulse - this.textSize * 0.3);
        // fill(255); // Couleur blanche pour le texte
        textSize(this.textSize*0.8);
        text(noteName, x  , y + hoverPulse);
        textSize(this.textSize * 0.5);
        text(octave, x + this.textSize * 0.4, y + hoverPulse + this.textSize * 0.4);
        textSize(this.textSize * 0.8);
        text(alteration, x + this.textSize * 0.4, y + hoverPulse - this.textSize * 0.3);
    }

    renderDegreLabel(degreLabel, x, offset, y, hoverPulse) {
        let degreeName = degreLabel.slice(-1);
        let alteration = degreLabel.slice(0, -1);
        
        textSize(this.textSize * 0.8);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        blendMode(BLEND);
        noStroke();

        // fill(25); // Couleur grise pour l'ombre
        // text(degreeName, x + offset * 3 , y + hoverPulse + offset);
        // textSize(this.textSize );
        // text(alteration.replace('b', '♭'), x + offset - this.textSize * 0.4, y + offset + hoverPulse - this.textSize * 0.3);
        
        stroke(0)
        strokeWeight(2)
        fill(255); // Couleur blanche pour le texte
        textSize(this.textSize * 0.8);
        text(degreeName, x  , y + hoverPulse);
        textSize(this.textSize *0.8 );
        text(alteration.replace('b', '♭'), x - this.textSize * 0.4, y + hoverPulse - this.textSize * 0.3);
    }

    drawAllOccurrences(note, pulse, hover) {
        push()
        // Dessiner toutes les occurrences de la note
        noStroke();
        // Parcourir toutes les cordes et frettes pour dessiner les occurrences de la note
        for (let string = 0; string < this.stringCount; string++) {
          for (let fret = 0; fret < this.fretCount+1; fret++) {
            if (this.getNoteFromCoordinates(string, fret) === note.note) {
              this.drawNoteOnFretboard(note.note, string, fret, pulse, hover);          
            }
          }
        }
        pop()
      }

    drawExactOccurrences(note, pulse, hover) {
        push()
        // Dessiner uniquement la note exacte (avec octave)
        noStroke();
        // Parcourir toutes les cordes et frettes pour dessiner la note exacte
        for (let string = 0; string < this.stringCount; string++) {
            for (let fret = 0; fret < this.fretCount+1; fret++) {
                if (this.getNoteFromCoordinates(string, fret) === note.note) {
                    this.drawNoteOnFretboard(note.note, string, fret, pulse, hover);          
                }
            }
        }
        pop()
    }

    drawAllOctaves(note, pulse, hover) {
        push()
        // Dessiner toutes les occurrences de la note
        noStroke();
        // Parcourir toutes les cordes et frettes pour dessiner les occurrences de la note
        for (let string = 0; string < this.stringCount; string++) {
          for (let fret = 0; fret < this.fretCount+1; fret++) {
            if (this.getNoteName(this.getNoteFromCoordinates(string, fret)) === this.getNoteName(note.note)) {
              this.drawNoteOnFretboard(this.getNoteFromCoordinates(string, fret), string, fret, pulse, hover);          
            }
          }
        }
        pop()
      }
    
drawAllIntervals(note, intervals = [0, 4, 7], pulse, hover) {
    push();
    noStroke();

    // Toujours inclure la tonique (0) mais sans doublon
    const fullIntervals = intervals.includes(0) ? intervals : [0, ...intervals];

    for (let string = 0; string < this.stringCount; string++) {
        for (let fret = 0; fret <= this.fretCount; fret++) {
            let currentNote = this.getNoteFromCoordinates(string, fret);

            if (fullIntervals.some(interval => {
                let transposedNote = this.transpose(note.note, interval);
                return this.getNoteName(currentNote) === this.getNoteName(transposedNote);
            })) {
                fill(color(this.noteColors[
                    this.calculeDegreeChromatique(this.tonic ?? note.note, {note: currentNote})
                ]));

                this.drawNoteOnFretboard(currentNote, string, fret, pulse, hover);
            }
        }
    }
    pop();
}


    drawExactIntervals(note, intervals = [0, 4, 7], pulse, hover) {
        push();
        // Dessiner la note exacte et les intervalles (SANS les octaves)
        noStroke();
        
        // Parcourir toutes les cordes et frettes pour dessiner la note exacte et ses intervalles
        for (let string = 0; string < this.stringCount; string++) {
            for (let fret = 0; fret < this.fretCount + 1; fret++) {
                let currentNote = this.getNoteFromCoordinates(string, fret);
                if (currentNote === note.note || (intervals && intervals.some(interval => {
                    let transposedNote = this.transpose(note.note, interval);
                    return currentNote === transposedNote; // Comparaison exacte (avec octave)
                }))) {
                    fill(color(this.noteColors[this.calculeDegreeChromatique(this.tonic||this.hoveredNote, {note : currentNote })]));

                    this.drawNoteOnFretboard(currentNote, string, fret, pulse, hover);
                }
            }
        }
        pop();
    }

    //  INTERACTIONS
    mouseMoved() {
        if (mouseX > this.neckX - this.neckWidth 
            && mouseX < this.neckX + this.neckWidth 
            && mouseY > this.neckY - this.neckHeight/12
            && mouseY < this.neckY + this.neckHeight+ this.neckHeight/10) {
          let fretWidth = this.neckWidth / this.fretCount;
          let stringHeight = this.neckHeight / (this.stringCount - 1);
          let fret = Math.floor((mouseX - this.neckX + fretWidth ) / fretWidth);
          let string = Math.floor((mouseY - this.neckY + stringHeight / 2) / stringHeight);
          let note = this.getNoteFromCoordinates(string, fret);
          //console.log(string)

          if (fret > -1 )
              this.hoveredNote = { note, string, fret };
          else 
           this.hoveredNote = null;  
        } else {
          this.hoveredNote = null;
        }
      }  

    mouseClicked() {
        // Si on est en mode segment : ne pas commuter/sélectionner les notes,
        // uniquement enregistrer la paire et sortir.
        if (this.segmentMode && this.hoveredNote) {
            this._segmentBuffer.push({ string: this.hoveredNote.string, fret: this.hoveredNote.fret, colorIndex : this.segmentColorIndex });
            if (this._segmentBuffer.length === 2) {
                this.segments.push([ this._segmentBuffer[0], this._segmentBuffer[1] ]);
                this._segmentBuffer = [];
            }
            return;
        }

        if (this.hoveredNote) {
            // CTRL+CLIC : ajouter toutes les notes visibles de la sélection
            if (keyIsDown(CONTROL) && !keyIsDown(SHIFT)) {
                // Récupérer toutes les occurrences visibles de la sélection
                this.addAllVisibleSelectionsToClickedNotes();
                return;
            }

            let index = this.clickedNotes.findIndex(item => 
                item.note === this.hoveredNote.note && item.string === this.hoveredNote.string
            );

            if (!keyIsDown(SHIFT) && !keyIsDown(CONTROL)) {
                if (index !== -1) {
                    // Si la note est déjà dans le tableau, la supprimer
                    this.clickedNotes.splice(index, 1);
                    if (this.clickedNote 
                        && this.clickedNote.note === this.hoveredNote.note
                        && this.clickedNote.string === this.hoveredNote.string
                    ) {
                        this.clickedNote = null;
                    }
                    // Retirer la note de la surbrillance si elle est désélectionnée
                    let highlightIndex = this.highlightedNotes.findIndex(item =>
                        item.note === this.hoveredNote.note && item.string === this.hoveredNote.string
                    );
                    if (highlightIndex !== -1) {
                        this.highlightedNotes.splice(highlightIndex, 1);
                    }
                } else {
                    // Sinon, ajouter la note au tableau
                    this.clickedNote = { note: this.hoveredNote.note, string: this.hoveredNote.string, fret: this.hoveredNote.fret };
                    this.clickedNotes.push(this.clickedNote);
                }
            }

            // Si la tonique n'est pas encore définie ou si shift est enfoncé, la définir comme la première note cliquée
            if (!this.tonic || keyIsDown(SHIFT)) {
                this.tonic = this.hoveredNote;
            }

            // Gestion de la surbrillance avec CTRL + clic
            if (keyIsDown(CONTROL) && keyIsDown(SHIFT)) {
                let highlightIndex = this.highlightedNotes.findIndex(item =>
                    item.note === this.hoveredNote.note && item.string === this.hoveredNote.string
                );

                if (highlightIndex !== -1) {
                    // Si la note est déjà surlignée, la supprimer de la surbrillance
                    this.highlightedNotes.splice(highlightIndex, 1);
                } else {
                    // Sinon, ajouter la note à la surbrillance
                    this.highlightedNotes.push({ note: this.hoveredNote.note, string: this.hoveredNote.string, fret: this.hoveredNote.fret });
                }

                // Vérifier et surligner les cases entourées
                this.highlightSurroundedNotes();
            }
        }
    }

    addAllVisibleSelectionsToClickedNotes() {
        // Ajouter ou retirer toutes les notes visibles en fonction du mode de sélection
        const notesToToggle = new Set(); // Notes à ajouter/retirer
        let shouldRemove = false; // Déterminer si on ajoute ou retire

        if (this.selectionMode === 'all') {
            // Mode 'all' : ajouter/retirer toutes les occurrences (octaves)
            for (let string = 0; string < this.stringCount; string++) {
                for (let fret = 0; fret <= this.fretCount; fret++) {
                    if (this.getNoteName(this.getNoteFromCoordinates(string, fret)) === this.getNoteName(this.hoveredNote.note)) {
                        const key = `${string}-${fret}`;
                        notesToToggle.add(key);
                    }
                }
            }
        } else if (this.selectionMode === 'exact') {
            // Mode 'exact' : ajouter/retirer toutes les occurrences exactes (avec octave)
            for (let string = 0; string < this.stringCount; string++) {
                for (let fret = 0; fret <= this.fretCount; fret++) {
                    if (this.getNoteFromCoordinates(string, fret) === this.hoveredNote.note) {
                        const key = `${string}-${fret}`;
                        notesToToggle.add(key);
                    }
                }
            }
        } else if (this.selectionMode === 'single') {
            // Mode 'single' : ajouter/retirer uniquement la note survolée
            const key = `${this.hoveredNote.string}-${this.hoveredNote.fret}`;
            notesToToggle.add(key);
        }

        // Vérifier si la première note à ajouter/retirer est déjà sélectionnée
        for (let key of notesToToggle) {
            const [string, fret] = key.split('-').map(Number);
            const note = this.getNoteFromCoordinates(string, fret);
            const isAlreadySelected = this.clickedNotes.some(n => 
                n.string === string && n.fret === fret && n.note === note
            );
            if (isAlreadySelected) {
                shouldRemove = true;
                break;
            }
        }

        // Ajouter ou retirer les notes
        for (let key of notesToToggle) {
            const [string, fret] = key.split('-').map(Number);
            const note = this.getNoteFromCoordinates(string, fret);

            if (shouldRemove) {
                // Retirer la note
                this.clickedNotes = this.clickedNotes.filter(n => 
                    !(n.string === string && n.fret === fret && n.note === note)
                );
            } else {
                // Ajouter la note si elle n'existe pas déjà
                const alreadyExists = this.clickedNotes.some(n => 
                    n.string === string && n.fret === fret && n.note === note
                );
                if (!alreadyExists) {
                    this.clickedNotes.push({ note: note, string: string, fret: fret });
                }
            }
        }
    }

    getHighlightedNotesMatrix() {
        let highlightedMatrix = [];

        for (let note of this.highlightedNotes) {
            highlightedMatrix.push([note.string, note.fret, note.note]);
        }

        return highlightedMatrix;
    }
      
    handleCheckboxChange(interval) {
        const intervalMap = {
            2: [2, 1], // seconde majeure et mineure
            3: [4, 3], // tierce majeure et mineure
            4: [5, 4], // quarte juste et diminuée
            5: [7, 6], // quinte juste et diminuée
            6: [9, 8], // sixte majeure et mineure
            7: [11, 10], // septième majeure et mineure
            8: [12] // octave
        };

        let intervals = intervalMap[interval];
        let currentInterval = intervals[0];
        let minorInterval = intervals[1];       

        if (!this.intervals.includes(currentInterval) && (!minorInterval || !this.intervals.includes(minorInterval))) {
            this.intervals.push(currentInterval);
        } else if (this.intervals.includes(currentInterval)) {
            this.intervals = this.intervals.filter(interval => interval !== currentInterval);
            if (minorInterval) this.intervals.push(minorInterval);
        } else if (minorInterval && this.intervals.includes(minorInterval)) {
            this.intervals = this.intervals.filter(interval => interval !== minorInterval);
        }
    }

    keyPressed(){
        // Transposition géométrique des notes sélectionnées
        if (keyCode === UP_ARROW) {
            // Flèche haut : déplacement vers la corde grave (+1 corde)
            // Transposer la tonique UNIQUEMENT si Shift n'est pas appuyé
            this.transposeVertical(-1, !keyIsDown(SHIFT));
            return;
        }
        if (keyCode === DOWN_ARROW) {
            // Flèche bas : déplacement vers la corde aiguë (-1 corde)
            this.transposeVertical(1, !keyIsDown(SHIFT));
            return;
        }
        if (keyCode === RIGHT_ARROW) {
            // Flèche droite : déplacement vers les aigus (+1 frette)
            this.transposeHorizontal(1, !keyIsDown(SHIFT));
            return;
        }
        if (keyCode === LEFT_ARROW) {
            // Flèche gauche : déplacement vers les graves (-1 frette)
            this.transposeHorizontal(-1, !keyIsDown(SHIFT));
            return;
        }

        if (keyCode == 79) {
            // Touche O (actuellement non utilisée)
        }  
        if (keyCode == 68) {
            // touche "D" pour basculer entre les modes Note / Degrés / Blank / Tonic
            if (!this.degreMode && !this.blankMode && !this.tonicMode) {
                this.degreMode = true;  // Note → Degrés
            } else if (this.degreMode && !this.blankMode && !this.tonicMode) {
                this.blankMode = true;  // Degrés → Blank
                this.degreMode = false;
            } else if (this.blankMode && !this.tonicMode) {
                this.tonicMode = true;  // Blank → Tonic
                this.blankMode = false;
            } else {
                this.tonicMode = false; // Tonic → Note
            }
        }
        if (keyCode == 66) this.flatMode = !this.flatMode; // touche "B" pour commuter le mode bémol
        
        if (keyCode == 90) { // touche "Z" pour basculer le mode zoom
            this.zoomMode = !this.zoomMode;
            if (this.zoomMode) {
                this.noteMarkerDiameter = this.neckHeight/5 // Diamètre des pastilles de note
                this.textSize = this.noteMarkerDiameter           
            } else {
                this.noteMarkerDiameter = this.neckHeight/6 // Diamètre des pastilles de note
                this.textSize = this.noteMarkerDiameter 
                 }
        }
        
        //if (keyCode == 80) this.setPlayedNote ('C3') // 80 = p

        // Gestion des touches 2 à 8 pour les intervalles
        const intervalMap = {
            49: [0], // touche "1" pour tonique
            50: [2, 1], // touche "2" pour seconde majeure et mineure
            51: [4, 3], // touche "3" pour tierce majeure et mineure
            52: [5, 4], // touche "4" pour quarte juste et diminuée
            // touche "4" gérée par toggleIntervalButton dans sketch.js
            53: [7, 6], // touche "5" pour quinte juste et diminuée
            54: [9, 8], // touche "6" pour sixte majeure et mineure
            55: [11, 10], // touche "7" pour septième majeure et mineure
            56: [12] // touche "8" pour octave
        };

        if (intervalMap[keyCode]) {
            let intervals = intervalMap[keyCode];
            let currentInterval = intervals[0];
            let minorInterval = intervals[1];

            if (!this.intervals.includes(currentInterval) && (!minorInterval || !this.intervals.includes(minorInterval))) {
                this.intervals.push(currentInterval);
            } else if (this.intervals.includes(currentInterval)) {
                this.intervals = this.intervals.filter(interval => interval !== currentInterval);
                if (minorInterval) this.intervals.push(minorInterval);
            } else if (minorInterval && this.intervals.includes(minorInterval)) {
                this.intervals = this.intervals.filter(interval => interval !== minorInterval);
            }

        }

        // Gestion des touches pour les accords et les gammes
        if (keyCode == 67 || keyCode == 65) { // touche "C" ou "A" pour accords majeurs
            this.isMajor = !this.isMajor;
            this.intervals = this.isMajor ? this.majorChord : this.minorChord;
        }
        if (keyCode == 83 || keyCode == 71) { // touche "S" ou "G" pour gammes majeures
            this.isMajor = !this.isMajor;
            this.intervals = this.isMajor ? this.majorScale : this.minorScale;
        }
        if (keyCode == 80) { // touche "P" pour gamme pentatonique
            this.isMajor = !this.isMajor;
            this.intervals = this.isMajor ? this.majorPentatonicScale : this.minorPentatonicScale;
        }
        if (keyCode == 84) { // touche "T" pour basculer de triade  à tétrade
            this.isTriad = !this.isTriad;
            if (this.isTriad) {
                this.majorChord = [0, 4, 7];
                this.minorChord = [0, 3, 7];
            } else {
                this.majorChord = [0, 4, 7, 11];
                this.minorChord = [0, 3, 7, 10];
            }
            this.intervals = this.isMajor ? this.majorChord : this.minorChord;
        }

        if (keyCode == 58) { // 0 vide le buffer de selection
            this.intervals = []
        }
        // Gestion de la touche Backspace pour effacer  suppr pour vider les notes sélectionnées
        if (keyCode == 8) 
            if (!this.segmentMode){ // touche "Backspace"
                this.clickedNotes.pop()
s
            } else
                this.segments.pop()

        if (keyCode == 46) 
            if (!this.segmentMode){ // touche "Suppr"
                this.clickedNotes = [];
                this.playedNotes = [];
                this.tonic = null;
                this.intervals = []
            } else
                this.segments = []


        if (keyCode == 76 ) { // touche "L"
            this.segmentMode = !this.segmentMode 
        }    

      }

      keyReleased(){
        this.setPlayedNote(null)
      }

    transpose(note, semitones) {
        const notesOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let noteName = note.slice(0, -1);
        let octave = parseInt(note.slice(-1));
        let noteIndex = notesOrder.indexOf(noteName);
        let newIndex = noteIndex + semitones;
        
        while (newIndex < 0) {
            newIndex += 12;
            octave -= 1;
        }
        
        while (newIndex >= 12) {
            newIndex -= 12;
            octave += 1;
        }
        
        return notesOrder[newIndex] + octave;
    }

    // Dessine les segments (noir, épais) sur le manche, sous les pastilles (notes)

    drawStrings() {
        for (let i = 0; i < this.stringCount; i++) {
            let y = this.neckY + i * (this.neckHeight / (this.stringCount - 1));
            { // Appliquer l'effet métallique 
                let gradient = drawingContext.createLinearGradient(this.neckX, y, this.neckX + this.neckWidth, y);
                gradient.addColorStop(0, '#C0C0C0'); // Argenté
                gradient.addColorStop(0.5, '#585757ff'); // Blanc pour le reflet
                gradient.addColorStop(1, '#808080'); // Gris foncé
                drawingContext.fillStyle = gradient;
                noStroke();
                rect(this.neckX, y - this.stringThickness[i] / 2, this.neckWidth, this.stringThickness[i]);
            }
        }
    }

    
drawHead() {
    push()
    const x = this.neckX;
    const y = this.neckY;
    const h = this.neckHeight;
    const w = this.neckWidth;
    const stringCount = this.stringCount;
    const stringSpacing = h / (stringCount - 1);

    const headLength = w * 0.2;

    // Limites VISUELLES du manche (comme dans drawNeckBackground)
    const neckTop = y - 10;
    const neckBottom = y + h + 10;
    const fullH = neckBottom - neckTop;

    // --- TÊTE : TRAPÈZE PLUS ÉVASÉ ---
    fill('#eedbcbff');
    noStroke();
// Ombre portée de la tête
push();
fill(100);
noStroke();

beginShape();
vertex(x + 6, neckTop + 6);
vertex(x - headLength + 6, neckTop - fullH * 0.3 + 6);
vertex(x - headLength + 6, neckBottom + fullH * 0.3 + 6);
vertex(x + 6, neckBottom + 6);
endShape(CLOSE);

pop();

    beginShape();
    // Coin haut droit : aligné sur le haut du manche
    vertex(x, neckTop);
    // Coin haut gauche : plus haut et plus à gauche → évasé
    vertex(x - headLength, neckTop - fullH * 0.3);
    // Coin bas gauche : plus bas et plus à gauche → évasé
    vertex(x - headLength, neckBottom + fullH * 0.3);
    // Coin bas droit : aligné sur le bas du manche
    vertex(x, neckBottom);
    endShape(CLOSE);

    // --- Cordes évasées, aigu en haut (inchangé) ---
    stroke(180);
    for (let i = 0; i < stringCount; i++) {
        const thickness = this.stringThickness[i] || 2;
        strokeWeight(thickness);

        const sy = y + i * stringSpacing;
        const fanOffset = (i - (stringCount - 1) / 2) * stringSpacing * 0.6;
        const startX = x - headLength * 1.2;
        const startY = sy + fanOffset;

        line(startX, startY, x, sy);
    }
    pop()
}



    drawOpenNotes() {
        fill(0);
        textSize(this.textSize/2);
        textAlign(CENTER, CENTER);
        for (let i = 0; i < this.stringCount; i++) {
            let y = this.neckY + i * (this.neckHeight / (this.stringCount - 1));
            text(this.openStringNotes[this.stringCount - 1 - i], this.neckX - 20, y);
        }
    }

    drawENotes() {
        fill(150);
        textSize(this.textSize);
        textAlign(CENTER, CENTER);
        for (let i = 0; i < this.fretCount -1; i++) {
            let x = this.neckX + i * (this.neckWidth / (this.fretCount ));
            if (!this.ENoteNames[i].includes('#'))
                text(this.ENoteNames[i], x + (this.neckWidth / (this.fretCount )/2), this.neckY +this.neckHeight *1.2 );
        }
    }

    getNoteFromCoordinates(string, fret) {
        let openStringOctaves = [4, 3, 3, 3, 2, 2]; // Octaves des cordes à vide du Mi aigu au Mi grave
        let openNoteIndex = this.noteNames.indexOf(this.openStringNotes[this.stringCount - 1 - string]);
        let noteIndex = (openNoteIndex + fret) % this.noteNames.length;
        let octave = openStringOctaves[string] + Math.floor((openNoteIndex + fret) / this.noteNames.length);
        return this.noteNames[noteIndex] + octave;
    }

    getNoteName(noteString) {
        // Vérifiez que noteString est une chaîne de caractères avant d'appeler match
        if (typeof noteString === 'string') {
            let match = noteString.match(/([A-G]#?)/);
            return match ? match[1] : null;
        }
        return null;
    }

    getOctavesCoordinates(note) {
        let coordinates = [];
        
        for (let stringIndex = 0; stringIndex < this.stringCount; stringIndex++) {
          let openNoteIndex = this.noteNames.indexOf(this.openStringNotes[this.stringCount - 1 - stringIndex]);
          for (let fretIndex = 0; fretIndex <= this.fretCount; fretIndex++) {
            let noteIndex = (openNoteIndex + fretIndex) % this.noteNames.length;
     
            if (this.noteNames[noteIndex] === note) {
              coordinates.push({ string: stringIndex, fret: fretIndex });
            }
          }
        }
        return coordinates;
    }

    getNoteIndex(note) {
        const notesOrderSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        if (note.note) {
            const noteName = note.note.match(/[A-G]#?/)[0];
            const octave = parseInt(note.note.match(/\d+/)[0]);
            return notesOrderSharp.indexOf(noteName) + (octave * 12);
        } else return 0
    }
    
    calculateSemitoneDistance(note1, note2) {
        const note1Index = this.getNoteIndex(note1);
        const note2Index = this.getNoteIndex(note2);
        return (note2Index - note1Index) % 12;
    }
    
    calculeDegreeChromatique(tonic, note) {
        if (tonic){
            const semitoneDistance = this.calculateSemitoneDistance(tonic, note);
            return (semitoneDistance + 12) % 12;
        } else 
            return 0
    }
    
    chromaticToDiatonic(degreeChromatic) {
        const conversionTable = {
            0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
            6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
        };
        return conversionTable[degreeChromatic % 12];
    }
    animated(drawFunction,targetDiameter,growthRate) {
        if (diameter < targetDiameter) {
            diameter += growthRate;
            drawFunction(circleX, circleY, diameter, fillColor);
        } else {
            diameter = targetDiameter;
        }
    }

    transposeSelectedNotes(semitones) {
        if (this.clickedNotes.length === 0) return;
        
        const notesOrderSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const openStringOctaves = [4, 3, 3, 3, 2, 2];
        
        for (let note of this.clickedNotes) {
            let noteName = note.note.slice(0, -1);
            let octave = parseInt(note.note.slice(-1));
            let noteIndex = notesOrderSharp.indexOf(noteName);
            
            if (noteIndex === -1) continue;
            
            // Calculer l'indice MIDI de la note actuelle
            let midiIndex = notesOrderSharp.indexOf(noteName) + (octave * 12);
            let newMidiIndex = midiIndex + semitones;
            
            // Récupérer la nouvelle note et octave
            let newOctave = Math.floor(newMidiIndex / 12);
            let newNoteIndex = newMidiIndex % 12;
            let newNoteName = notesOrderSharp[newNoteIndex];
            note.note = newNoteName + newOctave;
            
            // Trouver la nouvelle position (string, fret) qui correspond à cette note
            for (let string = 0; string < this.stringCount; string++) {
                for (let fret = 0; fret <= this.fretCount; fret++) {
                    if (this.getNoteFromCoordinates(string, fret) === note.note) {
                        // Garder la même corde si possible, sinon prendre la première occurrence
                        if (string === note.string || fret === 0) {
                            note.string = string;
                            note.fret = fret;
                            throw new Error('break'); // Sortir des deux boucles
                        }
                    }
                }
            }
        }
    }

    transposeHorizontal(fretOffset, transposeTonic = true) {
        if (this.segmentMode) {
            // Mode segment : déplacer les segments
            for (let segment of this.segments) {
                for (let point of segment) {
                    point.fret += fretOffset;
                }
            }
        } else {
            // Mode note : déplacer les notes sélectionnées
            if (this.clickedNotes.length === 0) return;
            
            for (let note of this.clickedNotes) {
                let newFret = note.fret + fretOffset;
                note.fret = newFret;
                note.note = this.getVirtualNoteFromCoordinates(note.string, note.fret);
            }
            
            // Transposer la tonique seulement si transposeTonic est true
            if (this.tonic && transposeTonic) {
                let newFret = this.tonic.fret + fretOffset;
                this.tonic.fret = newFret;
                this.tonic.note = this.getVirtualNoteFromCoordinates(this.tonic.string, this.tonic.fret);
            }
        }
    }

    transposeVertical(stringOffset, transposeTonic = true) {
        if (this.segmentMode) {
            // Mode segment : déplacer les segments
            for (let segment of this.segments) {
                for (let point of segment) {
                    point.string += stringOffset;
                    
                    // Appliquer l'ajustement de frette (règle corde 1-2)
                    if (point.string === 1 && point.string - stringOffset === 2) {
                        point.fret -= 1;
                    } else if (point.string === 2 && point.string - stringOffset === 1) {
                        point.fret += 1;
                    }
                }
            }
        } else {
            // Mode note : déplacer les notes sélectionnées
            if (this.clickedNotes.length === 0) return;
            
            for (let note of this.clickedNotes) {
                let newString = note.string + stringOffset;
                let fretAdjustment = 0;
                
                if (note.string === 1 && newString === 2) {
                    fretAdjustment = -1;
                }
                else if (note.string === 2 && newString === 1) {
                    fretAdjustment = 1;
                }
                
                note.string = newString;
                note.fret = note.fret + fretAdjustment;
                note.note = this.getVirtualNoteFromCoordinates(note.string, note.fret);
            }
            
            // Transposer la tonique seulement si transposeTonic est true
            if (this.tonic && transposeTonic) {
                let newString = this.tonic.string + stringOffset;
                let fretAdjustment = 0;
                
                if (this.tonic.string === 1 && newString === 2) {
                    fretAdjustment = -1;
                }
                else if (this.tonic.string === 2 && newString === 1) {
                    fretAdjustment = 1;
                }
                
                this.tonic.string = newString;
                this.tonic.fret = this.tonic.fret + fretAdjustment;
                this.tonic.note = this.getVirtualNoteFromCoordinates(this.tonic.string, this.tonic.fret);
            }
        }
    }

    getVirtualNoteFromCoordinates(string, fret) {
        // Calcule la note même si string/fret sont hors limites
        const notesOrderSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const openStringOctaves = [4, 3, 3, 3, 2, 2];
        const openStringNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
        
        // Limiter string à la plage valide pour obtenir l'octave de base
        let safeString = Math.max(0, Math.min(string, this.stringCount - 1));
        let openNoteIndex = notesOrderSharp.indexOf(openStringNotes[this.stringCount - 1 - safeString]);
        let octave = openStringOctaves[safeString];
        
        // Ajouter le décalage de frette (positif ou négatif)
        let noteIndex = (openNoteIndex + fret) % 12;
        octave += Math.floor((openNoteIndex + fret) / 12);
        
        // Gérer les indices négatifs
        while (noteIndex < 0) {
            noteIndex += 12;
            octave -= 1;
        }
        
        return notesOrderSharp[noteIndex] + octave;
    }

drawMarkers() {
    fill(200);
    noStroke();

    const fretW = this.neckWidth / this.fretCount;
    const textColor = 'rgb(255, 255, 255)'; // couleur du manche

    textAlign(CENTER, CENTER);
    textSize(this.markerDiameter * 0.7);

    for (let i of this.markerPositions) {

        let x = this.neckX + i * fretW - fretW / 2;

        // --- FRETTES NORMALES ---
        if (i !== 12) {
            // pastille
            fill(200);
            ellipse(x, this.neckY + 0.9 * this.neckHeight, this.markerDiameter, this.markerDiameter);

            // numéro
            fill(textColor);
            noStroke();
            text(i, x, this.neckY + 0.9 * this.neckHeight);
        }

        // --- FRETTE 12 : DEUX PASTILLES AVEC "12" DANS CHACUNE ---
        else {
            // pastille haute
            fill(200);
            ellipse(x, this.neckY + 0.7 * this.neckHeight, this.markerDiameter, this.markerDiameter);
            // numéro
            fill(textColor);
            text("12", x, this.neckY + 0.7 * this.neckHeight);

            // pastille basse
            fill(200);
            ellipse(x, this.neckY + 0.9 * this.neckHeight, this.markerDiameter, this.markerDiameter);
            // numéro
            fill(textColor);
            text("12", x, this.neckY + 0.9 * this.neckHeight);
        }
    }

    // --- FRETTE 0 ---
    let x0 = this.neckX - fretW / 2;
    fill(200);
    ellipse(x0, this.neckY + 0.9 * this.neckHeight, this.markerDiameter, this.markerDiameter);

    fill(textColor);
    text("0", x0, this.neckY + 0.9 * this.neckHeight);
}


    highlightSurroundedNotes() {
        // Placeholder pour la méthode
    }
}