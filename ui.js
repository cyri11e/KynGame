// ============================================================
// ui.js — Interface utilisateur 100% responsive
// ============================================================

// ------------------------------------------------------------
// 1. Gestionnaire de boutons générique
// ------------------------------------------------------------
class UIButtonManager {
    constructor() {
        this.buttons = [];
    }

    add(id, x, y, w, h, label, color = 'SlateBlue', callback = null) {
        this.buttons.push({ id, x, y, w, h, label, color, callback });
    }

    clear() {
        this.buttons = [];
    }

render(drawButtonFn) {
    for (let b of this.buttons) {

        // Bouton cyclique = label sous forme d'objet {top, bottom}
        if (typeof b.label === "object") {
            this.drawCyclingButton(b.x, b.y, b.w, b.h, b.label.top, b.label.bottom, b.color);
        }

        // Bouton normal
        else {
            drawButtonFn(b.x, b.y, b.w, b.h, b.label, b.color);
        }
    }
}


    click(mx, my, inRectFn) {
        for (let b of this.buttons) {
            if (inRectFn(mx, my, b.x, b.y, b.w, b.h)) {
                if (b.callback) b.callback();
                return b.id;
            }
        }
        return null;
    }

drawCyclingButton(x, y, w, h, labelTop, labelBottom, color = "SteelBlue") {
    const cx = x;
    const cy = y;

    // Fond
    stroke(255);
    strokeWeight(3);
    fill(color);
    rectMode(CENTER);
    rect(cx, cy, w, h, 10);

    // Triangles fixes
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(h * 0.20);

    const triangleOffset = w * 0.40;
    text("◀", cx - triangleOffset, cy);
    text("▶", cx + triangleOffset, cy);

    // Texte sur 2 lignes
    textSize(h * 0.30);
    text(labelTop, cx, cy - h * 0.18);
    text(labelBottom, cx, cy + h * 0.18);
}



}



// ------------------------------------------------------------
// 2. Layout responsive (mobile + desktop)
// ------------------------------------------------------------
class UILayout {

    static isMobile() {
        return window.innerWidth < 900;
    }

    static isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    // Taille responsive d'un bouton
    static buttonSize() {
        if (this.isMobile()) {
            return {
                w: width * 0.85,
                h: height * 0.10
            };
        }
        return {
            w: width * 0.25,
            h: height * 0.12
        };
    }

    // Grille 2x2 desktop
    static grid2x2(btnW, btnH) {
        const spacingX = btnW * 1.2;
        const spacingY = btnH * 1.2;
        const cx = width / 2;
        const cy = height / 2;

        return [
            { x: cx - spacingX / 2, y: cy - spacingY / 2 },
            { x: cx + spacingX / 2, y: cy - spacingY / 2 },
            { x: cx - spacingX / 2, y: cy + spacingY / 2 },
            { x: cx + spacingX / 2, y: cy + spacingY / 2 }
        ];
    }
}



// ------------------------------------------------------------
// 3. Écran d'accueil
// ------------------------------------------------------------
class UIHomeScreen {

    static render(game, ui) {
        ui.clear();

        // Titres responsives
        textAlign(CENTER, CENTER);
        fill(0);

        textSize(height * 0.10);
        text('The KYN Game', width / 2, height * 0.10);

        textSize(height * 0.05);
        text('Know Your Neck !', width / 2, height * 0.20);

        textSize(height * 0.04);
        text('Sélectionnez votre type de jeu', width / 2, height * 0.85);

        // Boutons
        const { w, h } = UILayout.buttonSize();

        if (UILayout.isMobile()) {
            const cx = width / 2;
            let y = height * 0.35;

            ui.add("intervals", cx, y, w, h, "INTERVALLES");
            ui.add("degrees",   cx, y + h * 1.3, w, h, "DEGRÉS");
            ui.add("notes",     cx, y + h * 2.6, w, h, "NOTES");
            ui.add("blind",     cx, y + h * 3.9, w, h, "BLIND");
        }

        else {
            const pos = UILayout.grid2x2(w, h);

            ui.add("intervals", pos[0].x, pos[0].y, w, h, "INTERVALLES");
            ui.add("degrees",   pos[1].x, pos[1].y, w, h, "DEGRÉS");
            ui.add("notes",     pos[2].x, pos[2].y, w, h, "NOTES");
            ui.add("blind",     pos[3].x, pos[3].y, w, h, "BLIND");
        }

        ui.render(game._drawButton.bind(game));
    }


    static click(game, ui, mx, my) {
        const id = ui.click(mx, my, game._inRect.bind(game));
        if (!id) return false;

        game.gameMode = id;
        game.useFlatMode = random() > 0.5;
        game.state = "difficulty";
        return true;
    }
}



// ------------------------------------------------------------
// 4. Écran de difficulté
// ------------------------------------------------------------
class UIDifficultyScreen {

    static render(game, ui) {
        ui.clear();

        fill(0);
        textAlign(CENTER, TOP);
        textSize(height * 0.05);
        text("Sélectionnez la difficulté", width / 2, height * 0.05);

        const { w, h } = UILayout.buttonSize();
        const startX = width * 0.15;
        const startY = height * 0.20;
        const spacing = h * 0.3;

        const difficulties = [
            { id: "noob",    label: "NOOB" },
            { id: "slow",    label: "SLOW" },
            { id: "normal",  label: "NORMAL" },
            { id: "expert",  label: "EXPERT" },
            { id: "custom",  label: "CUSTOM" }
        ];

        for (let i = 0; i < difficulties.length; i++) {
            const y = startY + i * (h + spacing);
            ui.add(difficulties[i].id, startX, y, w, h, difficulties[i].label, 'SteelBlue');
        }

        // 🔥 AJOUT DU BOUTON BACK ICI
        ui.add("back_home", width * 0.5, height * 0.85, w, h, "BACK", "DarkRed");

        ui.render(game._drawButton.bind(game));
    }



    static click(game, ui, mx, my) {
        const id = ui.click(mx, my, game._inRect.bind(game));
        if (!id) return false;

        if (id === "back_home") {
            game.state = "home";
            return true;
        }

        game.difficulty = id;

        if (id === "custom") {
            game.state = "customConfig";
            return true;
        }

        const times = { noob: 10, slow: 5, normal: 4, expert: 2 };
        game.timeLimitSeconds = times[id];

        game._resetSessionState();
        game._startNewQuestion();
        game.state = "playing";
        return true;
    }

}

// ------------------------------------------------------------
// Grille custom 5x3 (notes / degrés / intervalles / blind)
// ------------------------------------------------------------
class UICustomGrid {

static render(game, topY, offsetX = 0, areaWidth = width) {
    const cols = 5;
    const rows = 3;

    const cellW = (areaWidth * 0.8) / cols;
    const cellH = cellW * 0.6;

    const startX = offsetX + (areaWidth - cols * cellW) / 2;
    const startY = topY;

    let labels;
    if (game.gameMode === "intervals" || game.gameMode === "blind") {
        labels = ['P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7','P8'];
    } else if (game.gameMode === "degrees") {
        labels = ['1','b2','2','b3','3','4','#4/b5','5','b6','6','b7','7','8/1'];
    } else if (game.gameMode === "notes") {
        labels = ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B','C'];
    } else {
        labels = Array(13).fill("?");
    }

    let i = 0;

    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
            const x = startX + c * cellW;
            const y = startY + r * cellH;

            const diameter = min(cellW, cellH);
            const cx = x + cellW / 2;
            const cy = y + cellH / 2;

            // --- Case direction cycler ---
            if (r === rows - 1 && c === 0) {
                UICustomGrid.renderDirectionCycler(game, x, y, cellW, cellH);
                continue;
            }

            if (i >= labels.length) return;

            const selected = game.customConfig.selectedItems.has(i);

            stroke(255);
            strokeWeight(3);
            fill(selected ? '#66cc66' : '#333333');

            ellipseMode(CENTER);
            ellipse(cx, cy, diameter, diameter);

            noStroke();
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(diameter * 0.35);
            text(labels[i], cx, cy);

            i++;
        }
    }
}


static renderDirectionCycler(game, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    const labels = ["UP", "DOWN", "UP & DOWN"];
    const label = labels[game.customConfig.directionIndex];

    // Triangles compacts
    const display = `◀ ${label} ▶`;

    // Fond
    stroke(255);
    strokeWeight(3);
    fill("#444");
    rectMode(CENTER);
    rect(cx, cy, w, h, 10);

    // Texte
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(h * 0.35);
    text(display, cx, cy);
}


static click(game, mx, my, topY, offsetX = 0, areaWidth = width) {
    const cols = 5;
    const rows = 3;

    const cellW = (areaWidth * 0.8) / cols;
    const cellH = cellW * 0.6;

    const startX = offsetX + (areaWidth - cols * cellW) / 2;
    const startY = topY;

    let i = 0;

    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
            const x = startX + c * cellW;
            const y = startY + r * cellH;

            const diameter = min(cellW, cellH);
            const cx = x + cellW / 2;
            const cy = y + cellH / 2;

            // --- Case direction cycler ---
            if (r === rows - 1 && c === 0) {
                if (game._inRect(mx, my, cx, cy, cellW, cellH)) {
                    game.customConfig.directionIndex =
                        (game.customConfig.directionIndex + 1) % 3;
                    return true;
                }
                continue;
            }

            if (i >= 13) return false;

            if (game._inRect(mx, my, cx, cy, diameter, diameter)) {
                if (game.customConfig.selectedItems.has(i)) {
                    game.customConfig.selectedItems.delete(i);
                } else {
                    game.customConfig.selectedItems.add(i);
                }
                return true;
            }

            i++;
        }
    }

    return false;
}



}


// ------------------------------------------------------------
// 5. Écran de fin
// ------------------------------------------------------------
class UIEndScreen {

    static render(game, ui) {
        ui.clear();

        fill(0);
        textAlign(CENTER, CENTER);

        textSize(height * 0.08);
        text("Session terminée !", width / 2, height * 0.25);

        textSize(height * 0.06);
        text(`Score : ${game.score}`, width / 2, height * 0.45);

        const { w, h } = UILayout.buttonSize();
        ui.add("restart", width / 2, height * 0.70, w, h, "REJOUER", "DarkOrange");

        ui.render(game._drawButton.bind(game));
    }

    static click(game, ui, mx, my) {
        const id = ui.click(mx, my, game._inRect.bind(game));
        if (id === "restart") {
            game._fullReset();
            game.state = "home";
            return true;
        }
        return false;
    }
}
// ------------------------------------------------------------
// 6. Écran CUSTOM (configuration personnalisée)
// ------------------------------------------------------------
// ============================================================
// 6. Écran CUSTOM (configuration personnalisée)
// ============================================================
class UICustomScreen {

    static render(game, ui) {
        ui.clear();

        fill(0);
        textAlign(CENTER, TOP);
        textSize(height * 0.05);
        text("Configuration personnalisée", width / 2, height * 0.05);

        const { w, h } = UILayout.buttonSize();

        // --- Cycles ---
        const ACCORDS_CYCLE = ["Triades", "Tétrades", "Sus", "Étendus"];
        const PENTA_CYCLE   = ["Mineure", "Majeure"];
        const DIATONIC_CYCLE = [
            "Ionien","Dorien","Phrygien","Lydien",
            "Mixolydien","Éolien","Locrien"
        ];

        // --- Labels cycliques sur 2 lignes ---
        const accordsLabel = {
            top: "Accords",
            bottom: ACCORDS_CYCLE[game.customConfig.accordsIndex]
        };

        const pentaLabel = {
            top: "Pentatonique",
            bottom: PENTA_CYCLE[game.customConfig.pentaIndex]
        };

        const diaLabel = {
            top: "Diatonique",
            bottom: DIATONIC_CYCLE[game.customConfig.diatoniqueIndex]
        };

        // --- Boutons en ligne ---

        const spacingX = w * 1.25;
        const startX = width / 2 - spacingX;
        const y = height * 0.12;
        const hPresets = h * 1.4;   // par exemple 1.4x plus haut que les autres

        ui.add("preset_chords",   startX + spacingX * 0, y, w, hPresets, accordsLabel, "SteelBlue");
        ui.add("preset_penta",    startX + spacingX * 1, y, w, hPresets, pentaLabel,   "SteelBlue");
        ui.add("preset_diatonic", startX + spacingX * 2, y, w, hPresets, diaLabel,     "SteelBlue");
            
        // --- Grille ---
        const topY = height * 0.25;
        const offsetX = width * 0.10;
        const areaWidth = width * 0.80;
        UICustomGrid.render(game, topY, offsetX, areaWidth);

        // --- BACK / START ---
        ui.add("custom_back",  width * 0.25, height * 0.85, w, h, "BACK",  "DarkRed");
        ui.add("custom_start", width * 0.75, height * 0.85, w, h, "START", "DarkOrange");

        ui.render(game._drawButton.bind(game));
    }



    static click(game, ui, mx, my) {

        const topY = height * 0.25;
        const offsetX = width * 0.10;
        const areaWidth = width * 0.80;

        if (UICustomGrid.click(game, mx, my, topY, offsetX, areaWidth)) {
            return true;
        }

        const id = ui.click(mx, my, game._inRect.bind(game));
        if (!id) return false;

        // --- START ---
        if (id === "custom_start") {
            game.difficulty = "custom";
            game.timeLimitSeconds = game.customConfig.timerValues[game.customConfig.timerIndex];
            game._resetSessionState();
            game._startNewQuestion();
            game.state = "playing";
            return true;
        }

        // --- BACK ---
        if (id === "custom_back") {
            game.state = "difficulty";
            return true;
        }

        // --- Cycles ---
        const ACCORDS_CYCLE = ["Triades", "Tétrades", "Sus", "Étendus"];
        const PENTA_CYCLE   = ["Mineure", "Majeure"];
        const DIATONIC_CYCLE = [
            "Ionien","Dorien","Phrygien","Lydien",
            "Mixolydien","Éolien","Locrien"
        ];

        // --- ACCORDS ---
        if (id === "preset_chords") {
            game.customConfig.accordsIndex =
                (game.customConfig.accordsIndex + 1) % ACCORDS_CYCLE.length;

            const mode = ACCORDS_CYCLE[game.customConfig.accordsIndex];

            if (mode === "Triades")   game.customConfig.selectedItems = new Set([0,3,4,6,7,12]);
            if (mode === "Tétrades")  game.customConfig.selectedItems = new Set([0,3,4,6,7,9,10,11,12]);
            if (mode === "Sus")       game.customConfig.selectedItems = new Set([0,2,5,6,7,12]);
            if (mode === "Étendus")   game.customConfig.selectedItems = new Set([0,3,4,7,9,11,12]);

            return true;
        }

        // --- PENTATONIQUE ---
        if (id === "preset_penta") {
            game.customConfig.pentaIndex =
                (game.customConfig.pentaIndex + 1) % PENTA_CYCLE.length;

            const mode = PENTA_CYCLE[game.customConfig.pentaIndex];

            if (mode === "Mineure") game.customConfig.selectedItems = new Set([0,3,5,7,10,12]);
            if (mode === "Majeure") game.customConfig.selectedItems = new Set([0,2,4,7,9,12]);

            return true;
        }

        // --- DIATONIQUE ---
        if (id === "preset_diatonic") {
            game.customConfig.diatoniqueIndex =
                (game.customConfig.diatoniqueIndex + 1) % DIATONIC_CYCLE.length;

            const mode = DIATONIC_CYCLE[game.customConfig.diatoniqueIndex];

            if (mode === "Ionien")      game.customConfig.selectedItems = new Set([0,2,4,5,7,9,11,12]);
            if (mode === "Dorien")      game.customConfig.selectedItems = new Set([0,2,3,5,7,9,10,12]);
            if (mode === "Phrygien")    game.customConfig.selectedItems = new Set([0,1,3,5,7,8,12,10]);
            if (mode === "Lydien")      game.customConfig.selectedItems = new Set([0,2,4,6,7,9,11,12]);
            if (mode === "Mixolydien")  game.customConfig.selectedItems = new Set([0,2,4,5,7,9,10,12]);
            if (mode === "Éolien")      game.customConfig.selectedItems = new Set([0,2,3,5,7,8,10,12]);
            if (mode === "Locrien")     game.customConfig.selectedItems = new Set([0,1,3,5,6,8,10,12]);

            return true;
        }


        return false;
    }
}
