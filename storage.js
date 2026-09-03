const STORAGE_KEY = 'flashcards-app-state';
const STORAGE_VERSION = 1;

function loadState(fallbackState) {
	try {
		const storedValue = window.localStorage.getItem(STORAGE_KEY);
		if (!storedValue) return fallbackState;

		const parsedState = JSON.parse(storedValue);
		if (parsedState?.version !== STORAGE_VERSION || !isValidState(parsedState.data)) {
			return fallbackState;
		}

		return parsedState.data;
	} catch {
		return fallbackState;
	}
}

function isValidState(state) {
	if (!state || !Array.isArray(state.decks)) return false;
	if (state.activeDeckId !== undefined && (typeof state.activeDeckId !== 'number' || !Number.isFinite(state.activeDeckId))) return false;
	if (state.theme !== undefined && !['light', 'rainbow'].includes(state.theme)) return false;
	const cardIds = new Set();

	return state.decks.every((deck) =>
		typeof deck?.id === 'number' &&
		Number.isFinite(deck.id) &&
		typeof deck.name === 'string' &&
		Array.isArray(deck.cards) &&
		deck.cards.every((card) =>
			typeof card?.id === 'number' &&
			Number.isFinite(card.id) &&
			!cardIds.has(card.id) &&
			cardIds.add(card.id) &&
			typeof card.question === 'string' &&
			typeof card.answer === 'string'
		)
	);
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
