const STORAGE_KEY = 'flashcards-app-state';
const STORAGE_VERSION = 1;

function loadState(fallbackState) {
	try {
		const storedValue = window.localStorage.getItem(STORAGE_KEY);
		if (!storedValue) return fallbackState;

		const parsedState = JSON.parse(storedValue);
		if (parsedState?.version !== STORAGE_VERSION || !parsedState.data) {
			return fallbackState;
		}

		return parsedState.data;
	} catch {
		return fallbackState;
	}
}

function saveState(state) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
			version: STORAGE_VERSION,
			data: state
		}));
		return true;
	} catch {
		return false;
	}
}
