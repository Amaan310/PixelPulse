// This code runs on Netlify's servers, not in the user's browser.
// It has secure access to your environment variables.

exports.handler = async function (event, context) {
    const { query, page } = event.queryStringParameters;

    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    const pexelsAccessKey = process.env.PEXELS_ACCESS_KEY;

    const unsplashUrl = `https://api.unsplash.com/search/photos?page=${page}&query=${query}&client_id=${unsplashAccessKey}&per_page=15`;
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${query}&page=${page}&per_page=15`;

    try {
        const [unsplashResponse, pexelsResponse] = await Promise.allSettled([
            fetch(unsplashUrl),
            fetch(pexelsUrl, { headers: { Authorization: pexelsAccessKey } })
        ]);

        let combinedResults = [];
        
        // Process Unsplash results
        if (unsplashResponse.status === 'fulfilled' && unsplashResponse.value.ok) {
            const unsplashData = await unsplashResponse.value.json();
            if (unsplashData.results) {
                const unsplashFormatted = unsplashData.results.map(img => ({
                    src: img.urls.small,
                    alt: img.alt_description,
                    link: img.links.html,
                    source: 'Unsplash'
                }));
                combinedResults.push(...unsplashFormatted);
            }
        } else {
            console.error("Unsplash API Error");
        }
        
        // Process Pexels results
        if (pexelsResponse.status === 'fulfilled' && pexelsResponse.value.ok) {
            const pexelsData = await pexelsResponse.value.json();
            if (pexelsData.photos) {
                const pexelsFormatted = pexelsData.photos.map(img => ({
                    src: img.src.medium,
                    alt: img.alt || "Pexels image",
                    link: img.url,
                    source: 'Pexels'
                }));
                combinedResults.push(...pexelsFormatted);
            }
        } else {
            console.error("Pexels API Error");
        }

        // Shuffle the results
        combinedResults.sort(() => 0.5 - Math.random());

        return {
            statusCode: 200,
            body: JSON.stringify(combinedResults),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch images' }),
        };
    }
};