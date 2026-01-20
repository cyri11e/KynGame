let guitar;
let game;

function setup() {
    createCanvas(windowWidth, windowHeight);
    guitar = new Guitar(13);
    game = new KynGame(guitar);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
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
    if (!guitar || !game) return false;

    // D’abord, laisser le jeu décider si le clic concerne un menu / bouton
    if (game.mouseClicked(mouseX, mouseY)) {
        return false; // clic consommé par le jeu (menus, difficulté, restart…)
    }

    // Sinon, clic “in‑game” sur le manche
    guitar.mouseClicked();
    if (guitar.clickedNote) {
        game.handleNoteClick(guitar.clickedNote);
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
