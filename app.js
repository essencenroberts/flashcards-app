const initialCards = [
	{
		id: 1,
		question: 'What is semantic HTML?',
		answer: 'HTML elements that communicate the meaning and structure of their content.'
	},
	{
		id: 2,
		question: 'What does CSS control?',
		answer: 'The presentation and layout of a web page.'
	},
	{
		id: 3,
		question: 'What does JavaScript add to a page?',
		answer: 'Interactivity and dynamic behavior.'
	}
];

const defaultDecks = [
	{ id: 1, name: 'General', cards: initialCards },
	{ id: 2, name: 'Programming', cards: [] }
];

const savedState = loadState({ decks: defaultDecks });
const storedDecks = Array.isArray(savedState.decks) && savedState.decks.length > 0
	? savedState.decks
	: defaultDecks;
const decks = storedDecks.map((deck) => ({
	...deck,
	cards: Array.isArray(deck.cards) ? deck.cards : []
}));

const savedActiveDeckId = savedState?.activeDeckId;
const restoredDeck = decks.find((deck) => deck.id === savedActiveDeckId);

let nextCardId = Math.max(0, ...decks.flatMap((deck) => deck.cards.map((card) => card.id))) + 1;

function createCardId() {
	return nextCardId++;
}

let activeDeckId = restoredDeck?.id ?? decks[0].id;
let cards = restoredDeck?.cards ?? decks[0].cards;
let visibleCards = [...cards];
let currentIndex = 0;
let showingAnswer = false;
let searchQuery = '';
let searchDebounceId = null;

const cardFace = document.querySelector('#card-face');
const cardFrontContent = document.querySelector('#card-front-content');
const cardBackContent = document.querySelector('#card-back-content');
const cardLabels = cardFace.querySelectorAll('.card-label');
const cardCount = document.querySelector('#card-count');
const searchInput = document.querySelector('#card-search');
const previousButton = document.querySelector('#previous-button');
const nextButton = document.querySelector('#next-button');
const deckList = document.querySelector('#deck-list');
const activeDeckName = document.querySelector('#active-deck-name');
const cardList = document.querySelector('#card-list');
const themeToggle = document.querySelector('#theme-toggle');
const startStudyButton = document.querySelector('#start-study-button');
const exitStudyButton = document.querySelector('#exit-study-button');
const studyOverlay = document.querySelector('#study-overlay');
const exitStudyModalButton = document.querySelector('#exit-study-modal-button');
let studyModeCleanup = null;
let rainbowThemeEnabled = savedState?.theme === 'rainbow';

function getActiveDeck() {
	return decks.find((deck) => deck.id === activeDeckId);
}

function resetFlipState() {
	showingAnswer = false;
	cardFace.classList.remove('is-flipped');
}

function renderDecks() {
	deckList.replaceChildren();
	if (decks.length === 0) {
		const emptyItem = document.createElement('li');
		emptyItem.className = 'empty-state';
		emptyItem.innerHTML = '<span class="empty-state-icon" aria-hidden="true">+</span><strong>No decks yet</strong><span>Create a deck to organize your cards.</span><button type="button" data-empty-new-deck>Add Deck</button>';
		deckList.append(emptyItem);
		return;
	}

	decks.forEach((deck) => {
		const item = document.createElement('li');
		item.className = 'deck-item';

		const selectButton = document.createElement('button');
		selectButton.type = 'button';
		selectButton.dataset.deckId = deck.id;
		selectButton.setAttribute('aria-pressed', String(deck.id === activeDeckId));
		selectButton.textContent = deck.name;

		const actions = document.createElement('span');
		actions.className = 'deck-actions';

		const editButton = document.createElement('button');
		editButton.type = 'button';
		editButton.dataset.editDeckId = deck.id;
		editButton.setAttribute('aria-label', `Rename ${deck.name} deck`);
		editButton.textContent = 'Edit';

		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.dataset.deleteDeckId = deck.id;
		deleteButton.setAttribute('aria-label', `Delete ${deck.name} deck`);
		deleteButton.textContent = 'Delete';

		actions.append(editButton, deleteButton);
		item.append(selectButton, actions);
		deckList.append(item);
	});
}

function selectDeck(deckId) {
	const deck = decks.find((item) => item.id === deckId);
	if (!deck) return;

	activeDeckId = deck.id;
	cards = deck.cards;
	visibleCards = [...cards];
	currentIndex = 0;
	resetFlipState();
	searchInput.value = '';
	searchQuery = '';
	activeDeckName.textContent = `${deck.name} deck`;
	persistState();
	renderDecks();
	renderCardList();
	renderCard();
}

function persistState() {
	saveState({
		decks,
		activeDeckId,
		theme: rainbowThemeEnabled ? 'rainbow' : 'light'
	});
}

function applyTheme() {
	document.body.classList.toggle('rainbow-theme', rainbowThemeEnabled);
	themeToggle.setAttribute('aria-pressed', String(rainbowThemeEnabled));
	themeToggle.textContent = rainbowThemeEnabled ? 'Light mode' : 'Pastel rainbow mode';
}

function enterStudyMode(deckId) {
	const deck = decks.find((item) => item.id === deckId);
	if (!deck) return;

	studyModeCleanup?.();
	activeDeckId = deck.id;
	cards = deck.cards;
	searchQuery = '';
	visibleCards = [...cards];
	currentIndex = 0;
	resetFlipState();
	searchInput.value = '';
	activeDeckName.textContent = `${deck.name} deck`;
	persistState();
	renderDecks();
	renderCardList();
	renderCard();

	const handleStudyKeydown = (event) => {
		if (!deckModal.hidden || !cardModal.hidden) return;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			moveCard(-1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			moveCard(1);
		} else if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			flipCard();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			exitStudyMode();
		}
	};

	document.addEventListener('keydown', handleStudyKeydown);
	studyModeCleanup = () => {
		document.removeEventListener('keydown', handleStudyKeydown);
		studyModeCleanup = null;
		startStudyButton.hidden = false;
		exitStudyButton.hidden = true;
	};
	startStudyButton.hidden = true;
	exitStudyButton.hidden = false;
	studyOverlay.classList.add('study-active');
	studyOverlay.setAttribute('role', 'dialog');
	studyOverlay.setAttribute('aria-modal', 'true');
	cardFace.focus();
}

function exitStudyMode() {
	studyModeCleanup?.();
	studyOverlay.classList.remove('study-active');
	studyOverlay.removeAttribute('role');
	studyOverlay.removeAttribute('aria-modal');
	startStudyButton.focus();
}

function renderCard() {
	if (visibleCards.length === 0) {
		cardFrontContent.textContent = 'No cards to study';
		cardBackContent.textContent = 'Create a card to begin.';
		cardFace.classList.remove('is-flipped');
		cardFace.disabled = true;
		cardFace.setAttribute('aria-label', 'No cards available');
		cardFace.querySelector('.card-front').setAttribute('aria-hidden', 'false');
		cardFace.querySelector('.card-back').setAttribute('aria-hidden', 'true');
		cardCount.textContent = '0 cards';
		if (searchQuery) cardCount.textContent = '0 matches';
		previousButton.disabled = true;
		nextButton.disabled = true;
		return;
	}

	const card = visibleCards[currentIndex];
	cardFrontContent.textContent = card.question;
	cardBackContent.textContent = card.answer;
	cardLabels.forEach((label) => {
		label.textContent = label.closest('.card-front') ? 'Front' : 'Back';
	});
	cardFace.disabled = false;
	cardFace.classList.toggle('is-flipped', showingAnswer);
	cardFace.setAttribute('aria-label', showingAnswer ? 'Show card front' : 'Show card back');
	cardFace.querySelector('.card-front').setAttribute('aria-hidden', String(showingAnswer));
	cardFace.querySelector('.card-back').setAttribute('aria-hidden', String(!showingAnswer));
	cardCount.textContent = searchQuery
		? `${visibleCards.length} ${visibleCards.length === 1 ? 'match' : 'matches'}`
		: `${currentIndex + 1} of ${visibleCards.length}`;
	previousButton.disabled = visibleCards.length < 2;
	nextButton.disabled = visibleCards.length < 2;
}

function renderCardList() {
	cardList.replaceChildren();
	if (cards.length > 0 && visibleCards.length === 0 && searchQuery) {
		const emptyItem = document.createElement('li');
		emptyItem.className = 'empty-state';
		emptyItem.innerHTML = '<span class="empty-state-icon" aria-hidden="true">?</span><strong>No cards found</strong><span>Try another keyword or clear your search.</span><button type="button" data-clear-search>Clear search</button>';
		cardList.append(emptyItem);
		return;
	}
	if (cards.length === 0) {
		const emptyItem = document.createElement('li');
		emptyItem.className = 'empty-state';
		emptyItem.innerHTML = '<span class="empty-state-icon" aria-hidden="true">+</span><strong>No cards in this deck yet</strong><span>Add your first card to start studying.</span><button type="button" data-empty-new-card>Add Card</button>';
		cardList.append(emptyItem);
		return;
	}

	cards.forEach((card) => {
		const item = document.createElement('li');
		item.className = 'card-preview';
		item.dataset.cardId = card.id;
		const front = document.createElement('p');
		front.textContent = card.question;
		const actions = document.createElement('div');
		actions.className = 'card-preview-actions';
		const editButton = document.createElement('button');
		editButton.type = 'button';
		editButton.dataset.editCardId = card.id;
		editButton.setAttribute('aria-label', `Edit card: ${card.question}`);
		editButton.textContent = 'Edit';
		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.dataset.deleteCardId = card.id;
		deleteButton.setAttribute('aria-label', `Delete card: ${card.question}`);
		deleteButton.textContent = 'Delete';
		actions.append(editButton, deleteButton);
		item.append(front, actions);
		cardList.append(item);
	});
}

function flipCard() {
	showingAnswer = !showingAnswer;
	renderCard();
}

function moveCard(step) {
	if (visibleCards.length < 2) return;
	currentIndex = (currentIndex + step + visibleCards.length) % visibleCards.length;
	resetFlipState();
	renderCard();
}

cardFace.addEventListener('click', flipCard);
document.querySelector('#flip-button').addEventListener('click', flipCard);
previousButton.addEventListener('click', () => moveCard(-1));
nextButton.addEventListener('click', () => moveCard(1));

document.querySelector('#shuffle-button').addEventListener('click', () => {
	visibleCards.sort(() => Math.random() - 0.5);
	currentIndex = 0;
	resetFlipState();
	renderCard();
});

searchInput.addEventListener('input', (event) => {
	clearTimeout(searchDebounceId);
	searchDebounceId = setTimeout(() => {
		searchQuery = event.target.value.trim().toLowerCase();
		visibleCards = cards.filter((card) =>
			`${card.question} ${card.answer}`.toLowerCase().includes(searchQuery)
		);
		currentIndex = 0;
		resetFlipState();
		renderCardList();
		renderCard();
	}, 300);
});

document.querySelector('#new-card-button').addEventListener('click', () => {
	openCardModal();
});

startStudyButton.addEventListener('click', () => enterStudyMode(activeDeckId));
exitStudyButton.addEventListener('click', exitStudyMode);
exitStudyModalButton.addEventListener('click', exitStudyMode);
studyOverlay.querySelector('[data-close-study]').addEventListener('click', exitStudyMode);

const newDeckButton = document.querySelector('#new-deck-button');
const deckModal = document.querySelector('#deck-modal');
const deckForm = document.querySelector('#deck-form');
const deckNameInput = document.querySelector('#deck-name');
const closeDeckModalButton = document.querySelector('#close-deck-modal');
const cancelDeckModalButton = document.querySelector('#cancel-deck-modal');
const deckModalTitle = document.querySelector('#deck-modal-title');
const deckSubmitButton = document.querySelector('#deck-submit-button');
const cardModal = document.querySelector('#card-modal');
const cardForm = document.querySelector('#card-form');
const cardFrontInput = document.querySelector('#card-front');
const cardBackInput = document.querySelector('#card-back');
const cardModalTitle = document.querySelector('#card-modal-title');
const cardSubmitButton = document.querySelector('#card-submit-button');
let modalOpener = null;
let editingDeckId = null;
let editingCardId = null;

function getModalFocusableElements(modal) {
	return [...modal.querySelectorAll('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])')]
		.filter((element) => !element.disabled);
}

function openDeckModal() {
	modalOpener = document.activeElement;
	editingDeckId = null;
	deckModalTitle.textContent = 'Create a new deck';
	deckSubmitButton.textContent = 'Create deck';
	deckModal.hidden = false;
	deckNameInput.focus();
}

function closeDeckModal() {
	deckModal.hidden = true;
	deckForm.reset();
	editingDeckId = null;
	modalOpener?.focus();
	modalOpener = null;
}

function openCardModal(card = null) {
	modalOpener = document.activeElement;
	editingCardId = card?.id ?? null;
	cardModalTitle.textContent = card ? 'Edit card' : 'Create a new card';
	cardSubmitButton.textContent = card ? 'Save changes' : 'Save card';
	cardForm.reset();
	if (card) {
		cardFrontInput.value = card.question;
		cardBackInput.value = card.answer;
	}
	cardModal.hidden = false;
	cardFrontInput.focus();
}

function closeCardModal() {
	cardModal.hidden = true;
	cardForm.reset();
	editingCardId = null;
	modalOpener?.focus();
	modalOpener = null;
}

newDeckButton.addEventListener('click', openDeckModal);
closeDeckModalButton.addEventListener('click', closeDeckModal);
cancelDeckModalButton.addEventListener('click', closeDeckModal);
deckModal.querySelector('[data-close-modal]').addEventListener('click', closeDeckModal);

themeToggle.addEventListener('click', () => {
	rainbowThemeEnabled = !rainbowThemeEnabled;
	applyTheme();
	persistState();
});

document.addEventListener('focusin', (event) => {
	const openModal = !deckModal.hidden ? deckModal : !cardModal.hidden ? cardModal : null;
	if (openModal && !openModal.contains(event.target)) {
		getModalFocusableElements(openModal)[0]?.focus();
	}
});

cardModal.querySelector('[data-close-card-modal]').addEventListener('click', closeCardModal);
document.querySelector('#close-card-modal').addEventListener('click', closeCardModal);
document.querySelector('#cancel-card-modal').addEventListener('click', closeCardModal);

deckList.addEventListener('click', (event) => {
	const target = event.target;
	if (target.matches('[data-empty-new-deck]')) {
		openDeckModal();
		return;
	}
	const deckId = Number(target.dataset.deckId);

	if (target.matches('[data-deck-id]')) {
		selectDeck(deckId);
		return;
	}

	if (target.matches('[data-edit-deck-id]')) {
		const deck = decks.find((item) => item.id === Number(target.dataset.editDeckId));
		if (!deck) return;
		modalOpener = target;
		editingDeckId = deck.id;
		deckModalTitle.textContent = 'Rename deck';
		deckSubmitButton.textContent = 'Save name';
		deckNameInput.value = deck.name;
		deckModal.hidden = false;
		deckNameInput.focus();
		return;
	}

	if (target.matches('[data-delete-deck-id]')) {
		const deckToDelete = decks.find((item) => item.id === Number(target.dataset.deleteDeckId));
		if (!deckToDelete || decks.length === 1) return;
		if (!window.confirm(`Delete the ${deckToDelete.name} deck?`)) return;

		const deletedIndex = decks.findIndex((item) => item.id === deckToDelete.id);
		decks.splice(deletedIndex, 1);
		persistState();
		if (deckToDelete.id === activeDeckId) {
			selectDeck(decks[Math.min(deletedIndex, decks.length - 1)].id);
		} else {
			renderDecks();
		}
	}
});

function handleModalKeydown(modal, event) {
	if (event.key === 'Escape') {
		event.preventDefault();
		if (modal === cardModal) {
			closeCardModal();
		} else {
			closeDeckModal();
		}
		 return;
	}

	if (event.key !== 'Tab') return;
	const focusableElements = getModalFocusableElements(modal);
	const firstElement = focusableElements[0];
	const lastElement = focusableElements[focusableElements.length - 1];

	if (event.shiftKey && document.activeElement === firstElement) {
		event.preventDefault();
		lastElement.focus();
	} else if (!event.shiftKey && document.activeElement === lastElement) {
		event.preventDefault();
		firstElement.focus();
	}
}

deckModal.addEventListener('keydown', (event) => handleModalKeydown(deckModal, event));
cardModal.addEventListener('keydown', (event) => handleModalKeydown(cardModal, event));

cardList.addEventListener('click', (event) => {
	const target = event.target;
	if (target.matches('[data-empty-new-card]')) {
		openCardModal();
		return;
	}
	if (target.matches('[data-clear-search]')) {
		clearTimeout(searchDebounceId);
		searchInput.value = '';
		searchQuery = '';
		visibleCards = [...cards];
		currentIndex = 0;
		resetFlipState();
		renderCardList();
		renderCard();
		searchInput.focus();
		return;
	}
	if (target.matches('[data-edit-card-id]')) {
		const card = cards.find((item) => item.id === Number(target.dataset.editCardId));
		if (card) openCardModal(card);
		return;
	}
	if (target.matches('[data-delete-card-id]')) {
		const cardIndex = cards.findIndex((item) => item.id === Number(target.dataset.deleteCardId));
		if (cardIndex < 0 || !window.confirm('Delete this card?')) return;
		cards.splice(cardIndex, 1);
		persistState();
		visibleCards = visibleCards.filter((item) => item.id !== Number(target.dataset.deleteCardId));
		currentIndex = Math.min(currentIndex, Math.max(visibleCards.length - 1, 0));
		resetFlipState();
		renderCardList();
		renderCard();
	}
});

cardForm.addEventListener('submit', (event) => {
	event.preventDefault();
	if (!cardForm.reportValidity()) return;
	const question = cardFrontInput.value.trim();
	const answer = cardBackInput.value.trim();
	if (!question || !answer) return;

	if (editingCardId !== null) {
		const card = cards.find((item) => item.id === editingCardId);
		if (card) {
			card.question = question;
			card.answer = answer;
		}
	} else {
		cards.push({ id: createCardId(), question, answer });
	}
	persistState();
	visibleCards = [...cards];
	currentIndex = Math.min(currentIndex, Math.max(visibleCards.length - 1, 0));
	resetFlipState();
	renderCardList();
	renderCard();
	closeCardModal();
});

deckForm.addEventListener('submit', (event) => {
	event.preventDefault();
	const deckName = deckNameInput.value.trim();
	if (!deckName) return;

	if (editingDeckId !== null) {
		const deck = decks.find((item) => item.id === editingDeckId);
		if (deck) {
			deck.name = deckName;
			if (deck.id === activeDeckId) activeDeckName.textContent = `${deck.name} deck`;
		}
	} else {
		const deck = { id: Date.now(), name: deckName, cards: [] };
		decks.push(deck);
		selectDeck(deck.id);
	}

	persistState();
	renderDecks();
	closeDeckModal();
});

renderDecks();
renderCardList();
renderCard();
applyTheme();
