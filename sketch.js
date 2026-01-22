let guitar;
let game;
let audioCtx;
let guitarSF;
let activeSounds = {};


function setup() {
    createCanvas(window.innerWidth, window.innerHeight);



    guitarSF = MIDI.Soundfont.electric_guitar_clean;
    guitar = new Guitar(12);
    game = new KynGame(guitar);

}


function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    if (guitar) guitar.resize();
}

function draw() {
    background(220);

    game.update();        // logique du jeu (timers, états, etc.)
    guitar.display();     // manche + notes
    game.renderUI();      // menus, score, consignes, countdown
}

function mouseMoved() {
    if (guitar) guitar.mouseMoved();
}

function mouseDragged() {
    if (guitar) guitar.mouseMoved();
    return false;
}

function mouseClicked() {

    //new Howl({ src: [guitarSF["C4"]] }).play();
    if (!guitar || !game) return false;

    // D’abord, laisser le jeu décider si le clic concerne un menu / bouton
    if (game.mouseClicked(mouseX, mouseY)) {
        return false; // clic consommé par le jeu (menus, difficulté, restart…)
    }

    // Sinon, clic “in‑game” sur le manche
    guitar.mouseClicked();
    if (guitar.clickedNote) {
        game.handleNoteClick(guitar.clickedNote);
        console.log("Note cliquée :", guitar.clickedNote.note);
        playNote(guitar.clickedNote.note);
    }
    return false;
}

function keyPressed() {
    if (!game) return;
    game.keyPressed(key, keyCode);
}

function keyReleased() {
    if (guitar && guitar.keyReleased) guitar.keyReleased();
}

function convertSharpToFlat(note) {
    // Exemple : "C#4" → "Db4"
    const map = {
        "C#": "Db",
        "D#": "Eb",
        "F#": "Gb",
        "G#": "Ab",
        "A#": "Bb"
    };

    // Extraire la partie note + altération (ex: "C#" ou "Db")
    const pitch = note.slice(0, -1);   // "C#" ou "Db"
    const octave = note.slice(-1);     // "4"

    // Si c’est un dièse, convertir
    if (map[pitch]) {
        return map[pitch] + octave;
    }

    // Sinon, renvoyer tel quel
    return note;
}

function playNote(noteName, duration = 1000) {
    console.log("playNote:", noteName);
    const flat = convertSharpToFlat(noteName);
    const url = guitarSF[flat];
    if (!url) return;

    // Stopper toutes les notes en cours
    for (let n in activeSounds) {
        activeSounds[n].stop();
        delete activeSounds[n];
    }

    const snd = new Howl({ src: [url], volume: 1.0 });
    const id = snd.play();

    activeSounds[flat] = snd;

    setTimeout(() => {
        snd.stop(id);
        delete activeSounds[flat];
    }, duration);
}

function requestFullscreen() {
    let el = document.documentElement;

    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

function isPortrait() {
    return window.innerHeight > window.innerWidth;
}
