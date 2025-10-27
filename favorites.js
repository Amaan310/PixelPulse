// NEW: Wait for the auth signal before doing anything
document.addEventListener('authStateReady', initializeFavoritesPage);

function initializeFavoritesPage() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const messageArea = document.getElementById('favorites-message');

    if (window.authManager && window.authManager.currentUser) {
        const user = window.authManager.currentUser;
        const favorites = loadFavoritesFromStorage(user.email);
        if (favorites.length === 0) {
            showMessage('You haven’t saved any favorites yet. Start exploring!', 'info');
        } else {
            displayFavorites(favorites);
        }
    } else {
        showMessage('Please log in to view your favorites.', 'no-results');
        const loginButton = document.createElement('button');
        loginButton.textContent = 'Login Here';
        loginButton.className = 'auth-submit-btn'; // Use a consistent button style
        loginButton.style.marginTop = '15px';
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
    favoritesGrid.innerHTML = ''; 

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
        sourceSpan.style.opacity = '1';

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('favorite-btn');
        removeBtn.innerHTML = '❤️';
        removeBtn.title = 'Remove from favorites';

        removeBtn.onclick = (e) => {
            e.preventDefault();
            imageWrapper.style.transition = 'opacity 0.3s ease';
            imageWrapper.style.opacity = '0';
            
            setTimeout(() => {
                imageWrapper.remove();
                const currentUser = window.authManager.currentUser;
                let currentFavorites = loadFavoritesFromStorage(currentUser.email);
                currentFavorites = currentFavorites.filter(fav => fav.src !== imageData.src);
                saveFavoritesToStorage(currentUser.email, currentFavorites);
                
                if (currentFavorites.length === 0) {
                    showMessage('You haven’t saved any favorites yet. Start exploring!', 'info');
                }
            }, 300);
            
            window.authManager.showNotification('Removed from favorites!', 'info');
        };

        imageWrapper.appendChild(image);
        imageWrapper.appendChild(imageLink);
        imageWrapper.appendChild(sourceSpan);
        imageWrapper.appendChild(removeBtn);
        favoritesGrid.appendChild(imageWrapper);
    });
}