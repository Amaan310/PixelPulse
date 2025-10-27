const formEl = document.querySelector("form");
if (formEl) {

    const unsplashAccessKey = "oxPBPX1L_olznwdEZxLRK7aAItQE33u5lHpM7GkoJ28";
    const pexelsAccessKey = "DAvC9EPeLKWATdhadugV1KmHU4Wd8XJsB1xFfhwhRRU9X8s85fwLAJ4r";

    const inputEl = document.getElementById("search-input");
    const searchResultsEl = document.querySelector(".search-results");
    const showMoreBtn = document.getElementById("show-more-button");
    const loadingSpinner = document.querySelector(".loading-spinner");
    const resultsHeading = document.getElementById("results-heading");
    const messageArea = document.querySelector('.message-area');

    let inputData = "";
    let page = 1;
    let userFavorites = [];

    function displayMessage(message, type = 'info') {
        messageArea.textContent = message;
        messageArea.className = `message-area message-${type}`;
        messageArea.style.display = 'block';

        if (type !== 'no-results') {
            setTimeout(() => {
                messageArea.style.display = 'none';
                messageArea.textContent = '';
            }, 5000);
        }
    }

    function clearMessages() {
        messageArea.style.display = 'none';
        messageArea.textContent = '';
    }

    function loadUserFavorites() {
        if (window.authManager && window.authManager.currentUser) {
            const user = window.authManager.currentUser;
            const storedFavorites = localStorage.getItem(`pixelpulse_favorites_${user.email}`);
            if (storedFavorites) {
                try {
                    userFavorites = JSON.parse(storedFavorites);
                } catch (e) {
                    console.error('Error loading favorites:', e);
                    userFavorites = [];
                }
            }
        }
    }

    function saveUserFavorites() {
        if (window.authManager && window.authManager.currentUser) {
            const user = window.authManager.currentUser;
            localStorage.setItem(`pixelpulse_favorites_${user.email}`, JSON.stringify(userFavorites));
        }
    }

    function toggleFavorite(imageData) {
        if (!window.authManager || !window.authManager.currentUser) {
            window.authManager.openLoginModal();
            window.authManager.showNotification('Please login to save favorites!', 'info');
            return;
        }

        const index = userFavorites.findIndex(fav => fav.src === imageData.src);
        
        if (index === -1) {
            userFavorites.push(imageData);
            window.authManager.showNotification('Added to favorites!', 'success');
        } else {
            userFavorites.splice(index, 1);
            window.authManager.showNotification('Removed from favorites!', 'info');
        }
        
        saveUserFavorites();
        return index === -1;
    }

    function isFavorite(imageSrc) {
        return userFavorites.some(fav => fav.src === imageSrc);
    }

    async function searchImages() {
        inputData = inputEl.value.trim();

        if (!inputData && page === 1) {
            inputData = "trending images";
            resultsHeading.textContent = "Editor's Picks";
            resultsHeading.classList.remove('initial-hidden');
        } else if (inputData && page === 1) {
            resultsHeading.textContent = `Results for "${inputData}"`;
            resultsHeading.classList.remove('initial-hidden');
        }

        loadingSpinner.style.display = "block";
        showMoreBtn.classList.add("hidden");
        clearMessages();

        if (page === 1) {
            searchResultsEl.innerHTML = "";
        }

        const unsplashUrl = `https://api.unsplash.com/search/photos?page=${page}&query=${inputData}&client_id=${unsplashAccessKey}&per_page=15`;
        const pexelsUrl = `https://api.pexels.com/v1/search?query=${inputData}&page=${page}&per_page=15`;

        let combinedResults = [];
        let unsplashHasMore = false;
        let pexelsHasMore = false;

        try {
            const [unsplashResponse, pexelsResponse] = await Promise.allSettled([
                fetch(unsplashUrl),
                fetch(pexelsUrl, { headers: { Authorization: pexelsAccessKey } })
            ]);

            if (unsplashResponse.status === 'fulfilled' && unsplashResponse.value.ok) {
                const unsplashData = await unsplashResponse.value.json();
                if (unsplashData.results) {
                    combinedResults = combinedResults.concat(unsplashData.results.map(img => ({
                        src: img.urls.small,
                        alt: img.alt_description,
                        link: img.links.html,
                        source: 'Unsplash'
                    })));
                    unsplashHasMore = unsplashData.results.length === 15;
                }
            } else {
                console.error("Unsplash API Error:", unsplashResponse.reason?.status, unsplashResponse.reason?.statusText || unsplashResponse.reason);
                displayMessage("Could not load images from Unsplash.", "warning");
            }

            if (pexelsResponse.status === 'fulfilled' && pexelsResponse.value.ok) {
                const pexelsData = await pexelsResponse.value.json();
                if (pexelsData.photos) {
                    combinedResults = combinedResults.concat(pexelsData.photos.map(img => ({
                        src: img.src.medium,
                        alt: img.alt || "Pexels image",
                        link: img.url,
                        source: 'Pexels'
                    })));
                    pexelsHasMore = pexelsData.photos.length === 15;
                }
            } else {
                console.error("Pexels API Error:", pexelsResponse.reason?.status, pexelsResponse.reason?.statusText || pexelsResponse.reason);
                if (pexelsResponse.reason?.status === 403 || pexelsResponse.reason?.status === 429) {
                    displayMessage("Pexels API rate limit exceeded or invalid key. Please check your key or try again later.", "warning");
                } else {
                    displayMessage("Could not load images from Pexels.", "warning");
                }
            }

            combinedResults.sort(() => 0.5 - Math.random());

            if (combinedResults.length === 0 && page === 1) {
                displayMessage(`No results found for "${inputEl.value.trim() || 'trending images'}". Try a different search!`, "no-results");
                resultsHeading.classList.add('initial-hidden');
                loadingSpinner.style.display = "none";
                return;
            }

            combinedResults.forEach((result, index) => {
                const imageWrapper = document.createElement('div');
                imageWrapper.classList.add("search-result");

                const image = document.createElement('img');
                image.src = result.src;
                image.alt = result.alt || "Image description";

                const imageLink = document.createElement('a');
                imageLink.href = result.link;
                imageLink.target = "_blank";
                imageLink.rel = "noopener noreferrer";
                
                const sourceSpan = document.createElement('span');
                sourceSpan.classList.add('image-source');
                sourceSpan.textContent = result.source;

                const titleSpan = document.createElement('span');
                titleSpan.classList.add('image-title-text');
                titleSpan.textContent = result.alt || `View on ${result.source}`;

                imageLink.appendChild(titleSpan);

                if (window.authManager && window.authManager.currentUser) {
                    const favoriteBtn = document.createElement('button');
                    favoriteBtn.classList.add('favorite-btn');
                    favoriteBtn.innerHTML = isFavorite(result.src) ? '❤️' : '🤍';
                    favoriteBtn.title = 'Add to favorites';
                    
                    favoriteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const wasAdded = toggleFavorite(result);
                        favoriteBtn.innerHTML = wasAdded ? '❤️' : '🤍';
                    });
                    
                    imageWrapper.appendChild(favoriteBtn);
                }

                imageWrapper.appendChild(image);
                imageWrapper.appendChild(imageLink);
                imageWrapper.appendChild(sourceSpan);

                setTimeout(() => {
                    imageWrapper.classList.add("animate-in");
                }, index * 80);

                searchResultsEl.appendChild(imageWrapper);
            });

            page++;

            if (unsplashHasMore || pexelsHasMore) {
                showMoreBtn.classList.remove("hidden");
            } else {
                showMoreBtn.classList.add("hidden");
            }

        } catch (error) {
            console.error("An unexpected error occurred during image search:", error);
            displayMessage("An unexpected error occurred. Please try again later.", "error");
            resultsHeading.classList.add('initial-hidden');
        } finally {
            loadingSpinner.style.display = "none";
        }
    }

    formEl.addEventListener("submit", (event) => {
        event.preventDefault();
        page = 1;
        searchImages();
        document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    showMoreBtn.addEventListener("click", () => {
        searchImages();
    });

    window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('pixelpulse_user')) {
            loadUserFavorites();
        }
    });

    document.addEventListener("DOMContentLoaded", async () => {
        setTimeout(() => {
            loadUserFavorites();
            if (window.authManager && window.authManager.currentUser) {
                const user = window.authManager.currentUser;
                console.log('Logged in as:', user.email);
                console.log('Favorites loaded:', userFavorites.length);
            }
        }, 100);
        
        searchImages();

        const currentPath = window.location.pathname.split('/').pop();
        document.querySelectorAll('.main-nav a').forEach(link => {
            if (link.getAttribute('href') === currentPath || (currentPath === '' && link.getAttribute('href') === 'index.html')) {
                link.classList.add('active');
            }
        });
    });
}