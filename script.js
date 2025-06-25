// --- Auth0 Configuration ---
let auth0Client = null;

const unsplashAccessKey = "oxPBPX1L_olznwdEZxLRK7aAItQE33u5lHpM7GkoJ28";

const AUTH0_DOMAIN = "dev-nxkhq7y0hlsy6mb8"; 
const AUTH0_CLIENT_ID = "QgfVrNnUenIJRfIBPqYE3ixqghvhFjPL"; 

// --- Pexels API Key ---
const pexelsAccessKey = "DAvC9EPeLKWATdhadugV1KmHU4Wd8XJsB1xFfhwhRRU9X8s85fwLAJ4r"; // PEXELS API KEY

// --- DOM Elements (Updated for new IDs/Classes) ---
const searchInput = document.getElementById('search-input-modern');
const searchButton = document.getElementById('search-button-modern');
const imageGrid = document.getElementById('search-results-modern'); // Changed ID
const showMoreBtn = document.getElementById('show-more-button-modern'); // Changed ID
const loadingSpinner = document.querySelector('.loading-spinner');
const resultsHeading = document.getElementById('results-heading-modern'); // Changed ID
const messageArea = document.querySelector('.message-area-modern'); // Changed class

// Auth0 related elements
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const userDisplay = document.getElementById('user-display');

// --- Global Variables for Pexels Search ---
let currentPage = 1;
let currentQuery = '';
let isSearching = false; // To prevent multiple simultaneous searches

// --- Helper Functions ---
function displayMessage(message, type = 'info') {
    messageArea.textContent = message;
    // Removed old specific message-type classes, using one for visibility
    messageArea.className = `message-area-modern message-${type}`; // Keep specific type for potential future styling
    messageArea.style.display = 'block';

    // Auto-hide messages after 5 seconds, except for 'no-results' which might stay
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

// --- Auth0 Initialization and UI Update ---
const updateUI = async () => {
    // Only attempt to update if auth0Client is initialized
    if (!auth0Client) {
        // If Auth0 setup failed, ensure buttons are hidden
        loginButton.classList.add('hidden');
        logoutButton.classList.add('hidden');
        userDisplay.classList.add('hidden');
        return;
    }

    try {
        const isAuthenticated = await auth0Client.isAuthenticated();
        if (isAuthenticated) {
            logoutButton.classList.remove('hidden');
            loginButton.classList.add('hidden');

            const user = await auth0Client.getUser();
            userDisplay.textContent = `Welcome, ${user.name || user.nickname || user.email || 'User'}!`;
            userDisplay.classList.remove('hidden');
        } else {
            loginButton.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            userDisplay.classList.add('hidden');
            userDisplay.textContent = '';
        }
    } catch (e) {
        console.error("Error updating UI based on Auth0 status:", e);
        // Fallback to hiding buttons if there's an issue
        loginButton.classList.add('hidden');
        logoutButton.classList.add('hidden');
        userDisplay.classList.add('hidden');
    }
};

const configureAuth0 = async () => {
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || AUTH0_DOMAIN === "YOUR_AUTH0_DOMAIN") {
        console.error("Auth0 configuration missing. Please update script.js with your Auth0 Domain and Client ID.");
        loginButton.classList.add('hidden');
        logoutButton.classList.add('hidden');
        return;
    }

    try {
        auth0Client = await Auth0Client.createAuth0Client({
            domain: AUTH0_DOMAIN,
            clientId: AUTH0_CLIENT_ID,
            authorizationParams: {
                redirect_uri: window.location.origin 
            }
        });

        if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
            await auth0Client.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        updateUI();
    } catch (e) {
        console.error("Error initializing Auth0:", e);
        displayMessage("Authentication service not available. Check configuration or try again later.", "error");
        loginButton.classList.add('hidden');
        logoutButton.classList.add('hidden');
    }
};

// --- Auth0 Event Handlers ---
loginButton.addEventListener('click', async () => {
    if (auth0Client) {
        try {
            await auth0Client.loginWithRedirect({
                authorizationParams: {
                    redirect_uri: window.location.origin
                }
            });
        } catch (e) {
            console.error("Auth0 login error:", e);
            displayMessage("Could not initiate login. Please try again.", "error");
        }
    }
});

logoutButton.addEventListener('click', async () => {
    if (auth0Client) {
        try {
            await auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
        } catch (e) {
            console.error("Auth0 logout error:", e);
            displayMessage("Could not log out. Please try again.", "error");
        }
    }
});

// --- Pexels API Interaction ---
async function fetchImages(query, page) {
    if (isSearching) return []; 
    isSearching = true;
    loadingSpinner.style.display = 'block';
    clearMessages(); // Clear messages at start of fetch

    if (!pexelsAccessKey || pexelsAccessKey === "YOUR_PEXELS_API_KEY") {
        errorMessage.textContent = 'Pexels API key is missing. Please add it to script.js.';
        errorMessage.classList.remove('hidden');
        loadingSpinner.style.display = 'none';
        isSearching = false;
        return [];
    }

    const url = query
        ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}`
        : `https://api.pexels.com/v1/curated?per_page=15&page=${page}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: pexelsAccessKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessageDetail = `HTTP error! Status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessageDetail = errorJson.error || errorJson.message || errorMessageDetail;
            } catch (e) {
                errorMessageDetail = errorText || errorMessageDetail;
            }

            if (response.status === 401) {
                throw new Error(`Unauthorized: Invalid Pexels API Key. ${errorMessageDetail}`);
            } else if (response.status === 429) {
                throw new Error(`Rate Limit Exceeded: Too many requests to Pexels API. ${errorMessageDetail}`);
            } else {
                throw new Error(`Failed to fetch images: ${errorMessageDetail}`);
            }
        }

        const data = await response.json();
        return data.photos;

    } catch (error) {
        console.error('Error fetching images:', error);
        displayMessage(`Error: ${error.message}`, "error");
        return [];
    } finally {
        loadingSpinner.style.display = 'none';
        isSearching = false;
    }
}

function displayImages(photos, append = false) {
    if (!append) {
        imageGrid.innerHTML = ''; // Clear existing images if not appending
    }

    if (photos.length === 0 && !append && currentQuery) {
        displayMessage(`No results found for "${currentQuery}". Try a different search!`, "no-results");
        resultsHeading.classList.add('hidden'); // Hide heading if no results for a specific search
        showMoreBtn.classList.add('hidden');
        return;
    } else if (photos.length === 0 && !append && !currentQuery) {
        // No curated images initially or after loading, very unlikely but handle
        displayMessage('Could not load initial images. Please try refreshing.', 'error');
        resultsHeading.classList.add('hidden');
        showMoreBtn.classList.add('hidden');
        return;
    }


    photos.forEach(photo => {
        const card = document.createElement('div');
        card.classList.add('image-card');

        card.innerHTML = `
            <img src="${photo.src.medium}" alt="${photo.alt || 'Pexels Photo'}">
            <div class="image-details">
                <h3>${photo.alt || 'Untitled'}</h3>
                <p>Photographer: ${photo.photographer}</p>
                <a href="${photo.src.original}" target="_blank" rel="noopener noreferrer" class="download-link" download="${photo.alt || 'image'}.jpg">Download</a>
            </div>
        `;
        imageGrid.appendChild(card);
    });

    resultsHeading.classList.remove('hidden'); // Show heading once results are displayed

    // Simple check for more images - ideally Pexels API would give 'next_page' URL in response
    // For this simple pagination, we assume if we got 15 images, there might be more.
    if (photos.length === 15) {
        showMoreBtn.classList.remove('hidden');
    } else {
        showMoreBtn.classList.add('hidden');
    }
}

async function handleSearch() {
    currentQuery = searchInput.value.trim();
    currentPage = 1; 
    
    // Set heading text
    if (currentQuery === '') {
        resultsHeading.textContent = "Editor's Picks";
    } else {
        resultsHeading.textContent = `Results for "${currentQuery}"`;
    }
    resultsHeading.classList.remove('hidden'); // Show heading

    const photos = await fetchImages(currentQuery, currentPage);
    displayImages(photos);
}

async function handleLoadMore() {
    currentPage++;
    const photos = await fetchImages(currentQuery, currentPage);
    displayImages(photos, true); // Append images
}

// --- Event Listeners for Pexels Search ---
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});
showMoreBtn.addEventListener('click', handleLoadMore);

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', async () => {
    // Highlight active navigation link
    const currentPath = window.location.pathname.split('/').pop();
    document.querySelectorAll('.main-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath === '' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('active');
        }
    });

    await configureAuth0(); // Initialize Auth0 first
    // Then load initial images (curated or default search)
    handleSearch(); // Call handleSearch to load initial content
});
