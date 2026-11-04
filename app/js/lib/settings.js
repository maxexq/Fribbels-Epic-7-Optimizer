/*
 * Settings store.
 *
 * Holds the parsed settings.ini in memory and is the single source of truth for
 * every setting. The Settings page (app/ui, React) reads it with getState() /
 * subscribe() and writes it with update(); legacy modules keep using the
 * existing helpers (parseNumberValue, getOptimizerOptions, getDefaultPath, ...).
 *
 * Two values still live in legacy widgets on the Optimizer tab and are read
 * from there when saving: the "exclude equipped" and "enhance limit" selects.
 */
const remote = require('@electron/remote');
const dialog = remote.dialog
const currentWindow = remote.getCurrentWindow();
const documentsPath = remote.app.getPath('documents');
const savesFolder = documentsPath + '/FribbelsOptimizerSaves';

const defaultPath = savesFolder;

const settingsPath = defaultPath + "/settings.ini";

const OPTIMIZER_DEFAULT_KEYS = [
    'settingDefaultUseReforgedStats',
    'settingDefaultUseHeroPriority',
    'settingDefaultUseSubstatMods',
    'settingDefaultLockedItems',
    'settingDefaultEquippedItems',
    'settingDefaultKeepCurrent',
];

var state = {};
var loaded = false;
const listeners = new Set();

function isNullUndefined(x) {
    return x === null || x === undefined;
}

function emit() {
    for (const listener of listeners) {
        try {
            listener(state);
        } catch (e) {
            console.warn("Settings listener failed", e);
        }
    }
}

function toInt(value, fallback) {
    const parsed = parseInt(String(isNullUndefined(value) ? '' : value).replace(/,/g, ''));
    return isNaN(parsed) ? fallback : parsed;
}

/*
Fill in missing values and coerce types, so the rest of the app can rely on
the shape of the state regardless of how old the settings.ini file is.
*/
function normalize(settings) {
    const defaults = module.exports.getDefaultSettings();
    const result = Object.assign({}, defaults, settings);

    for (const key of ['settingGpu', 'settingUnlockOnUnequip', 'settingRageSet', 'settingPenSet', 'settingDefaultUseReforgedStats']) {
        if (isNullUndefined(settings[key])) result[key] = defaults[key];
        result[key] = !!result[key];
    }
    for (const key of OPTIMIZER_DEFAULT_KEYS.concat(['settingDarkMode'])) {
        result[key] = !!result[key];
    }

    result.settingMaxResults = toInt(result.settingMaxResults, defaults.settingMaxResults) || defaults.settingMaxResults;
    result.settingMaxRamGb = toInt(result.settingMaxRamGb, defaults.settingMaxRamGb) || defaults.settingMaxRamGb;
    result.settingPenDefense = toInt(result.settingPenDefense, defaults.settingPenDefense);
    result.settingLocatorWidth = toInt(result.settingLocatorWidth, defaults.settingLocatorWidth) || defaults.settingLocatorWidth;

    for (const key of ColorPicker.THEME_COLOR_KEYS) {
        result[key] = ColorPicker.normalizeThemeColor(key, result[key]);
    }

    return result;
}

function readLegacySelects() {
    const result = {};
    try {
        result.settingExcludeEquipped = $('#optionsExcludeGearFrom').multipleSelect('getSelects');
        result.settingEnhanceLimit = $('#optionsEnhanceLimit').multipleSelect('getSelects');
    } catch (e) {
        // Selects not initialized yet; keep the stored values.
    }
    return result;
}

module.exports = {
    initialize: async () => {
        await module.exports.loadSettings();

        $('#optionsExcludeGearFrom').change(module.exports.saveSettings)
        $('#optionsEnhanceLimit').change(module.exports.saveSettings)
    },

    isLoaded: () => loaded,

    getState: () => state,

    /*
    Subscribe to changes. Returns an unsubscribe function.
    */
    subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    /*
    Merge a partial update into the store, apply its side effects and persist.
    Pass { persist: false } for live previews (e.g. while dragging a color).
    */
    update: (partial, options) => {
        const persist = !options || options.persist !== false;
        state = Object.assign({}, state, partial);

        const keys = Object.keys(partial);
        if (keys.some(key => ColorPicker.THEME_COLOR_KEYS.includes(key) || key in ColorPicker.GRID_COLOR_DEFAULTS)) {
            ColorPicker.apply(state);
        }
        if ('settingDarkMode' in partial && DarkMode.isDark() !== !!partial.settingDarkMode) {
            DarkMode.setDark(!!partial.settingDarkMode);
        }

        emit();

        if (persist) {
            module.exports.saveSettings();
        }
    },

    selectSavesFolder: async () => {
        const options = {
            title: "Open folder",
            defaultPath : module.exports.getDefaultPath(),
            buttonLabel : "Open folder",
            properties: ['openDirectory'],
        }

        const result = await dialog.showOpenDialog(currentWindow, options);
        const filenames = result && result.filePaths;

        if (!filenames || filenames.length < 1) {
            return console.warn("Invalid filename")
        };

        const path = Files.path(filenames[0]);
        module.exports.update({ settingDefaultPath: path });
        Notifier.info(path);
        return path;
    },

    getDefaultPath: () => {
        return Files.path(state.settingDefaultPath || defaultPath);
    },

    getExcludeSelects: () => {
        return state.settingExcludeEquipped || [];
    },

    getOptimizerOptions: () => {
        const options = {};
        for (const key of OPTIMIZER_DEFAULT_KEYS) {
            options[key] = !!state[key];
        }
        if (isNullUndefined(state.settingDefaultUseReforgedStats)) {
            options.settingDefaultUseReforgedStats = true;
        }
        return options;
    },

    getDefaultSettings: () => {
        return {
            settingGpu: true,
            settingUnlockOnUnequip: true,
            settingRageSet: true,
            settingPenSet: true,
            settingMaxResults: 5_000_000,
            settingMaxRamGb: 6,
            settingPenDefense: 1_500,
            settingLocatorWidth: 5,
            settingDefaultPath: defaultPath,
            settingExcludeEquipped: [],
            settingEnhanceLimit: 0,
            settingDarkMode: true,
            settingArchetypes: GearRating.getDefaultArchetypes(),
            settingDefaultUseReforgedStats: true,
            settingDefaultUseHeroPriority: false,
            settingDefaultUseSubstatMods: false,
            settingDefaultLockedItems: false,
            settingDefaultEquippedItems: false,
            settingDefaultKeepCurrent: false,
            // null = use the built-in theme color
            settingBackgroundColor: null,
            settingTextColorPicker: null,
            settingAccentColorPicker: null,
            settingInputColorPicker: null,
            settingGridTextColorPicker: null,
            settingRedColorPicker: '#5A1A06',
            settingNeutralColorPicker: '#343127',
            settingGreenColorPicker: '#38821F'
        }
    },

    /*
    Numeric settings by id, e.g. parseNumberValue('settingMaxRamGb').
    Returns NaN before settings are loaded so callers fall back to their defaults.
    */
    parseNumberValue: (id) => {
        return toInt(state[id], NaN);
    },

    loadSettings: async () => {
        try {
            Saves.createFolder();
        } catch (e) {
            Notifier.error("Unable to create the Documents/FribbelsOptimizerSaves folder. Try disabling running the app as admin and disabling your virus scan");
            return;
        }

        console.log("LOAD SETTINGS", settingsPath);
        var settings;
        try {
            const text = await Files.readFileSync(Files.path(settingsPath));
            settings = JSON.parse(text)
        } catch (e) {
            settings = module.exports.getDefaultSettings();
            Notifier.error(`There was an error parsing the ${Files.path(settingsPath)} file. Please repair the file or delete it.`)
            Notifier.error(`Using default settings instead.`)
        }

        state = normalize(settings);
        loaded = true;

        DarkMode.setDark(state.settingDarkMode);

        if (state.settingExcludeEquipped) {
            $('#optionsExcludeGearFrom').multipleSelect('setSelects', state.settingExcludeEquipped)
        }

        if (state.settingEnhanceLimit) {
            $('#optionsEnhanceLimit').multipleSelect('setSelects', state.settingEnhanceLimit)
        }

        ColorPicker.apply(state);

        const currentVersion = Updater.getCurrentVersion();
        if (state.settingVersion != currentVersion) {
            Updater.showNewFeatures(currentVersion);
            module.exports.saveSettings();
        }

        if (state.settingArchetypes) {
            GearRating.setArchetypes(state.settingArchetypes)
        }

        emit();
        Api.setSettings(module.exports.toApiSettings());
    },

    saveSettings: async () => {
        if (!loaded) {
            return;
        }

        try {
            Saves.createFolder();
        } catch (e) {
            Notifier.error("Unable to create the Documents/FribbelsOptimizerSaves folder. Try disabling running the app as admin and disabling your virus scan");
            return;
        }

        console.log("SAVE SETTINGS");
        state = Object.assign({}, state, readLegacySelects(), {
            settingDarkMode: DarkMode.isDark(),
            settingVersion: Updater.getCurrentVersion(),
            settingArchetypes: GearRating.getArchetypes(),
        });

        Files.saveFile(settingsPath, JSON.stringify(state, null, 2))
        Api.setSettings(module.exports.toApiSettings());
    },

    toApiSettings: () => {
        const settings = Object.assign({}, state);
        if (Files.isMac()) {
            settings.settingGpu = false;
        }
        return settings;
    },
}
