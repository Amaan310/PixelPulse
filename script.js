const unsplashAccessKey = "oxPBPX1L_olznwdEZxLRK7aAItQE33u5lHpM7GkoJ28";
const pexelsAccessKey = "DAvC9EPeLKWATdhadugV1KmHU4Wd8XJsB1xFfhwhRRU9X8s85fwLAJ4r"; // PEXELS API KEY

// Auth0 Configuration - !!! REPLACE THESE WITH YOUR ACTUAL AUTH0 DOMAIN AND CLIENT ID !!!
const AUTH0_DOMAIN = "dev-nxkhq7y0hlsy6mb8"; 
const AUTH0_CLIENT_ID = "QgfVrNnUenIJRfIBPqYE3ixqghvhFjPL"; 

const formEl = document.querySelector("form");
const inputEl = document.getElementById("search-input");
const searchResultsEl = document.querySelector(".search-results");
const showMoreBtn = document.getElementById("show-more-button");
const loadingSpinner = document.querySelector(".loading-spinner");
const resultsHeading = document.getElementById("results-heading");
const messageArea = document.querySelector('.message-area');

// Auth0 related elements
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const userDisplay = document.getElementById('user-display');

let auth0Client = null; // Will hold the Auth0 client instance
let inputData = "";
let page = 1;

// --- Helper Functions ---
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

// --- Auth0 Specific Functions ---

// Function to initialize Auth0 client
const configureAuth0 = async () => {
    // Only attempt to create if Auth0 SDK is loaded and config is set
    if (typeof Auth0Client !== 'undefined' && AUTH0_DOMAIN && AUTH0_CLIENT_ID) {
        try {
            auth0Client = await Auth0Client.createAuth0Client({
                domain: AUTH0_DOMAIN,
                clientId: AUTH0_CLIENT_ID,
                authorizationParams: {
                    redirect_uri: window.location.origin // Redirect back to the current page
                }
            });

            // Handle the redirect after login/signup
            if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
                await auth0Client.handleRedirectCallback();
                window.history.replaceState({}, document.title, window.location.pathname); // Clean up the URL
            }

            updateUI(); // Update UI based on authentication state
        } catch (e) {
            console.error("Error initializing Auth0:", e);
            displayMessage("Authentication service not available. Check configuration.", "error");
            // Hide auth buttons if Auth0 fails to initialize
            loginButton.classList.add('hidden');
            logoutButton.classList.add('hidden');
        }
    } else {
        console.warn("Auth0 SDK not loaded or configuration missing. Auth features disabled.");
        loginButton.classList.add('hidden');
        logoutButton.classList.add('hidden');
    }
};

// Function to update the UI based on login status
const updateUI = async () => {
    if (!auth0Client) { // Ensure client is initialized
        return;
    }

    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
        loginButton.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        userDisplay.classList.remove('hidden');

        const user = await auth0Client.getUser();
        userDisplay.textContent = `Welcome, ${user.nickname || user.email || 'User'}!`;
    } else {
        loginButton.classList.remove('hidden');
        logoutButton.classList.add('hidden');
        userDisplay.classList.add('hidden');
        userDisplay.textContent = '';
    }
};

// Login function
const login = async () => {
    if (!auth0Client) return;
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
};

// Logout function
const logout = async () => {
    if (!auth0Client) return;
    try {
        await auth0Client.logout({
            logoutParams: {
                returnTo: window.location.origin // Redirect to home page after logout
            }
        });
    } catch (e) {
        console.error("Auth0 logout error:", e);
        displayMessage("Could not log out. Please try again.", "error");
    }
};

// --- Image Search Functions ---
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

        // --- Handle Unsplash Response ---
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

        // --- Handle Pexels Response ---
        if (pexelsResponse.status === 'fulfilled' && pexelsResponse.value.ok) {
            const pexelsData = await pexelsResponse.value.json(); // Corrected from 'pexels.json()'
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

        combinedResults.sort(() => 0.5 - Math.random()); // Shuffle for better mix

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

            imageWrapper.appendChild(image);
            imageWrapper.appendChild(imageLink);
            imageWrapper.appendChild(sourceSpan);

            setTimeout(() => {
                imageWrapper.classList.add("animate-in");
            }, index * 80);

            searchResultsEl.appendChild(imageWrapper);
        });

        page++;

        // Show "Show More" if either API indicates more results are available
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

// --- Event Listeners ---
formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    page = 1; // Reset page for new search
    searchImages();
    // Scroll to the main content area after search
    document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

showMoreBtn.addEventListener("click", () => {
    searchImages();
});

// Auth0 specific event listeners
loginButton.addEventListener('click', login);
logoutButton.addEventListener('click', logout);


// Call functions on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Auth0 first
    await configureAuth0(); 
    
    // Then start image search
    searchImages();

    // Highlight active navigation link
    const currentPath = window.location.pathname.split('/').pop();
    document.querySelectorAll('.main-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath === '' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('active');
        }
    });
});