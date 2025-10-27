document.addEventListener('DOMContentLoaded', () => {
    // Wait a brief moment to ensure auth.js has initialized authManager
    setTimeout(initializeFavoritesPage, 100);
});

function initializeFavoritesPage() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const messageArea = document.getElementById('favorites-message');

    // Check if the user is logged in
    if (window.authManager && window.authManager.currentUser) {
        const user = window.authManager.currentUser;
        const favorites = loadFavoritesFromStorage(user.email);

        if (favorites.length === 0) {
            // User is logged in but has no favorites
            showMessage('You haven’t saved any favorites yet. Start exploring!', 'info');
        } else {
            // User is logged in and has favorites, so display them
            displayFavorites(favorites);
        }
    } else {
        // User is not logged in
        showMessage('Please log in to view your favorites.', 'no-results');
        const loginButton = document.createElement('button');
        loginButton.textContent = 'Login Here';
        loginButton.onclick = () => window.authManager.openLoginModal();
        messageArea.appendChild(document.createElement('br'));
        messageArea.appendChild(loginButton);
    }
}

function showMessage(text, type) {
    const messageArea = document.getElementById('favorites-message');
    messageArea.textContent = text;
    messageArea.className = `message-area message-${type}`;
    messageArea.style.display = 'block';
}

function loadFavoritesFromStorage(email) {
    const storedFavorites = localStorage.getItem(`pixelpulse_favorites_${email}`);
    try {
        return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (e) {
        console.error('Failed to parse favorites from storage:', e);
        return [];
    }
}

function saveFavoritesToStorage(email, favorites) {
    localStorage.setItem(`pixelpulse_favorites_${email}`, JSON.stringify(favorites));
}

function displayFavorites(favorites) {
    const favoritesGrid = document.getElementById('favorites-grid');
    favoritesGrid.innerHTML = ''; // Clear any previous content

    favorites.forEach(imageData => {
        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('search-result', 'animate-in');
        
        const image = document.createElement('img');
        image.src = imageData.src;
        image.alt = imageData.alt;

        const imageLink = document.createElement('a');
        imageLink.href = imageData.link;
        imageLink.target = '_blank';
        imageLink.textContent = imageData.alt || `View on ${imageData.source}`;

        const sourceSpan = document.createElement('span');
        sourceSpan.classList.add('image-source');
        sourceSpan.textContent = imageData.source;
        sourceSpan.style.opacity = '1'; // Make it always visible on this page

        // Create a "Remove" button
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('favorite-btn');
        removeBtn.innerHTML = '❤️'; // Filled heart for favorited items
        removeBtn.title = 'Remove from favorites';

        removeBtn.onclick = (e) => {
            e.preventDefault();
            // Remove the image from the DOM immediately for a fast UX
            imageWrapper.remove();
            
            // Get current favorites, filter out the removed one, and save back to storage
            const currentUser = window.authManager.currentUser;
            let currentFavorites = loadFavoritesFromStorage(currentUser.email);
            currentFavorites = currentFavorites.filter(fav => fav.src !== imageData.src);
            saveFavoritesToStorage(currentUser.email, currentFavorites);
            
            window.authManager.showNotification('Removed from favorites!', 'info');
            
            // If it was the last favorite, show the empty message
            if (currentFavorites.length === 0) {
                 showMessage('You haven’t saved any favorites yet. Start exploring!', 'info');
            }
        };

        imageWrapper.appendChild(image);
        imageWrapper.appendChild(imageLink);
        imageWrapper.appendChild(sourceSpan);
        imageWrapper.appendChild(removeBtn);
        favoritesGrid.appendChild(imageWrapper);
    });
}