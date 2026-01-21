// ===============================
// INTERVALS.JS
// ===============================

// Intervalles chromatiques de base (en demi-tons)
const INTERVALS = {
    // Intervalles simples
    P1: 0,
    m2: 1,
    M2: 2,
    m3: 3,
    M3: 4,
    P4: 5,
    TT: 6,
    P5: 7,
    m6: 8,
    M6: 9,
    m7: 10,
    M7: 11,
    P8: 12
};

// ===============================
// DIFFICULTÉS EXISTANTES
// ===============================

const INTERVAL_SETS = {
    noob:     [3, 4, 7, 11, 12],
    slow:     [3, 4, 6, 7, 10, 11, 12, -3, -4, -6, -7, -10, -11, -12],
    normal:   [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
               -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12],
    expert:   [-12, -11, -10, -9, -8, -7, -5, -4, -3, -2, -1, 0,
                1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]
};

// ===============================
// PRESETS CUSTOM
// ===============================

// Triades (en demi-tons)
const CUSTOM_INTERVAL_PRESETS = {
    triade_majeure: [0, 4, 7],
    triade_mineure: [0, 3, 7],
    triade_diminuee: [0, 3, 6],
    triade_augmente: [0, 4, 8],

    // Tétrades
    tetrade_maj7: [0, 4, 7, 11],
    tetrade_7:    [0, 4, 7, 10],
    tetrade_m7:   [0, 3, 7, 10],
    tetrade_mMaj7:[0, 3, 7, 11],
    tetrade_dim7: [0, 3, 6, 9],

    // Pentas
    penta_majeure: [0, 2, 4, 7, 9],
    penta_mineure: [0, 3, 5, 7, 10],

    // Modes de la gamme majeure
    ionien:     [0, 2, 4, 5, 7, 9, 11],
    dorien:     [0, 2, 3, 5, 7, 9, 10],
    phrygien:   [0, 1, 3, 5, 7, 8, 10],
    lydien:     [0, 2, 4, 6, 7, 9, 11],
    mixolydien: [0, 2, 4, 5, 7, 9, 10],
    aeolien:    [0, 2, 3, 5, 7, 8, 10],
    locrien:    [0, 1, 3, 5, 6, 8, 10],

    // Modes mélodiques
    mel_min_ionien: [0, 2, 3, 5, 7, 9, 11],
    mel_min_dorien: [0, 2, 3, 5, 7, 9, 10],

    // Modes harmoniques
    harm_min: [0, 2, 3, 5, 7, 8, 11],
    harm_min_locrian_nat6: [0, 1, 3, 5, 6, 9, 10],

    // Exemple : Mixolydien b9 b13
    mixo_b9_b13: [0, 1, 4, 5, 7, 8, 10]
};
