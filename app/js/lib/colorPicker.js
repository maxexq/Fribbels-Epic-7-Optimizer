/*
 * Custom dark mode colors.
 *
 * Theme colors (background, text, accent, textbox, grid text) are applied as
 * --user-* CSS properties, which css/tokens.css only reads in dark mode.
 * Grid colors (red / neutral / green) feed the gradients used to color cells.
 *
 * The values are owned by the settings store (settings.js); this module only
 * applies them. The Settings page (app/ui) edits them through Settings.update().
 */
const tinygradient = require('tinygradient');

// Settings key -> CSS custom property read by css/tokens.css (dark mode only).
const THEME_COLOR_VARS = {
    settingBackgroundColor: '--user-background',
    settingTextColorPicker: '--user-foreground',
    settingAccentColorPicker: '--user-primary',
    settingInputColorPicker: '--user-field',
    settingGridTextColorPicker: '--user-grid-foreground',
};

// Defaults of the previous theme. They were always written to settings.ini, so
// treat them as "not customized" and let the new theme defaults apply.
const LEGACY_THEME_DEFAULTS = {
    settingBackgroundColor: '#212529',
    settingTextColorPicker: '#e2e2e2',
    settingAccentColorPicker: '#f84c48',
    settingInputColorPicker: '#2d3136',
    settingGridTextColorPicker: '#e2e2e2',
};

const GRID_COLOR_DEFAULTS = {
    settingRedColorPicker: '#5A1A06',
    settingNeutralColorPicker: '#343127',
    settingGreenColorPicker: '#38821F',
};

global.myColors = {
    bad: GRID_COLOR_DEFAULTS.settingRedColorPicker,
    neutral: GRID_COLOR_DEFAULTS.settingNeutralColorPicker,
    good: GRID_COLOR_DEFAULTS.settingGreenColorPicker,
};

function buildUserGradient() {
    return tinygradient([
        {color: myColors.bad, pos: 0}, // red
        {color: myColors.neutral, pos: 0.5},
        {color: myColors.good, pos: 1} // green
    ]);
}

// Grids keep a reference to these objects and read `.gradient`, so only the
// property is replaced, never the object.
var userGradient = {gradient: buildUserGradient()};
global.darkUserGradient = {gradient: tinygradient(myColors.neutral, myColors.good)};

function isHexColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

module.exports = {
    THEME_COLOR_KEYS: Object.keys(THEME_COLOR_VARS),
    GRID_COLOR_DEFAULTS: GRID_COLOR_DEFAULTS,

    /*
    Returns the stored theme color, or null when it is unset / a legacy default
    (meaning: use the built-in theme color).
    */
    normalizeThemeColor: (key, value) => {
        if (!isHexColor(value)) return null;
        if (LEGACY_THEME_DEFAULTS[key] && LEGACY_THEME_DEFAULTS[key] === value.toLowerCase()) return null;
        return value;
    },

    apply: (settings) => {
        const root = document.documentElement;
        for (const [key, cssVar] of Object.entries(THEME_COLOR_VARS)) {
            const value = module.exports.normalizeThemeColor(key, settings[key]);
            if (value) {
                root.style.setProperty(cssVar, value);
            } else {
                root.style.removeProperty(cssVar);
            }
        }

        myColors.bad = isHexColor(settings.settingRedColorPicker) ? settings.settingRedColorPicker : GRID_COLOR_DEFAULTS.settingRedColorPicker;
        myColors.neutral = isHexColor(settings.settingNeutralColorPicker) ? settings.settingNeutralColorPicker : GRID_COLOR_DEFAULTS.settingNeutralColorPicker;
        myColors.good = isHexColor(settings.settingGreenColorPicker) ? settings.settingGreenColorPicker : GRID_COLOR_DEFAULTS.settingGreenColorPicker;
        module.exports.redraw();
    },

    redraw: () => {
        userGradient.gradient = buildUserGradient();
        darkUserGradient.gradient = tinygradient(myColors.neutral, myColors.good);
        try {
            global.itemsGrid.gridOptions.api.redrawRows();
            global.buildsGrid.gridOptions.api.redrawRows();
            global.optimizerGrid.gridOptions.api.redrawRows();
        } catch (e) {
        }
    },

    // Kept for compatibility with older callers.
    loadColorSettings: (settings) => {
        module.exports.apply(settings);
    },

    // The color inputs now live in the React Settings page; nothing to wire here.
    initialize: () => {},

    getColors: () => {
        return userGradient;
    },

    get2Colors: () => {
        return darkUserGradient;
    },
}
