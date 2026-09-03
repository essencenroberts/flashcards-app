# Flashcards App

This is a small flashcards app built with plain HTML, CSS, and JavaScript. It lets you organize flashcards into decks and study them in the browser.

## Features

- Create, rename, and delete decks
- Choose an active deck from the sidebar
- Create, edit, and delete flashcards
- Search cards by keyword
- Flip cards to see the front and back
- Move to the previous or next card
- Shuffle cards
- Start Study mode with keyboard shortcuts
- Save decks, cards, and the active deck in LocalStorage
- Switch between the regular light theme and a pastel rainbow theme
- Use the app with keyboard focus styles and accessible labels

## Project Files

- `index.html` contains the page structure, forms, buttons, and dialogs.
- `styles.css` contains the layout, colors, responsive styles, and card flip animation.
- `app.js` contains the deck and card data, user interactions, Study mode, and UI updates.
- `storage.js` contains the LocalStorage helpers for saving and loading data.

## How to Run

1. Open the `flashcards-app` folder in VS Code.
2. Open `index.html` in a browser.
3. You can also use a VS Code live-server extension if you have one installed.

The app does not need a database or a separate server. Data is saved in the browser's LocalStorage.

## How to Use It

### Decks

Use **New Deck** to create a deck. Select a deck in the sidebar to view its cards. The Edit and Delete buttons next to a deck let you rename or remove it.

The app keeps at least one deck so there is always an active deck available.

### Cards

Choose **New Card** and enter text for the Front and Back. Cards appear in the card list below the study card. Each card has Edit and Delete actions.

Use the search box to find cards in the active deck. Search waits briefly after typing before filtering the results.

### Study Mode

Choose **Start Study** in the sidebar. The study card opens in a larger popup and the page behind it is blurred.

- Click the card or choose **Flip** to show the other side.
- Choose **Previous** or **Next** to move through the deck.
- Use the left and right arrow keys to navigate.
- Press Space or Enter to flip the card.
- Press Escape or choose **Exit Study** to close Study mode.

### Theme

Use the theme button in the header to switch between the normal light theme and the pastel rainbow theme. The selected theme is saved in LocalStorage.

## Accessibility

The app uses labels connected to form fields, named buttons, dialog labels, visible keyboard focus styles, and `aria-pressed` for the active deck. The dialogs support Escape to close, focus trapping, and returning focus to the button that opened them.

## Reflection

I developed a plain HTML, CSS, and JavaScript flashcards app with deck and card management. Users can create, rename, and delete decks, add and edit cards, search cards, study with keyboard shortcuts, and flip cards between the front and back.

### Acessibility
I added labels for form fields, accessible names for buttons, visible focus styles, dialog roles, focus trapping, Escape-to-close behavior, and focus restoration. I also used `aria-pressed` for the active deck and `aria-hidden` to manage the visible card face.

One issue I discovered was that the empty-card action was being created inside `cardList`, but its event listener was initially attached to `deckList`. This showed me that dynamically rendered content must use the correct delegated event container.

### Data and Saving
The app stores decks, cards, and the active deck in LocalStorage. I added versioning and safe parsing so malformed or outdated data falls back safely. I also used unique card IDs to prevent edit and delete actions from affecting the wrong card.

### Challenges 
The biggest challenges were keeping the UI state synchronized after deck or card changes, resetting the flip state when navigating, and preventing duplicate event listeners after re-rendering. Centralizing state resets and using delegated event listeners made the behavior more reliable.

### What I Would Improve
I would improve the project by adding automated browser tests for keyboard-only navigation, modal focus trapping, LocalStorage reload behavior, and card CRUD. I would also improve error messages, add stronger validation for duplicate deck names, and test the app with a screen reader.

### What I Learned
This project helped me understand that accessibility is more than adding ARIA attributes. The structure of the DOM, focus behavior, keyboard interaction, and dynamic event handling all affect usability. I also learned that persistence requires validating stored data and saving the complete application state consistently.
