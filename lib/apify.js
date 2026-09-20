import { ApifyClient } from 'apify-client';

export const runScraper = async (input = {}, customToken = null) => {
    try {
        const tokenToUse = customToken || process.env.APIFY_API_TOKEN;
        if (!tokenToUse) {
            throw new Error("Apify API Token is required. Please provide it in the UI or set APIFY_API_TOKEN in .env");
        }

        const client = new ApifyClient({
            token: tokenToUse,
        });

        // Extract actorId from input, or default to a popular Google Maps scraper for leads
        const actorId = input.actorId || 'compass/google-maps-extractor';
        
        // Remove actorId from the input parameters that get sent to Apify
        const apifyInput = { ...input };
        delete apifyInput.actorId;
        
        let run;
        try {
            // Assume it's an Actor Task ID first, as these are typically alphanumeric hashes
            run = await client.task(actorId).call(apifyInput);
        } catch (taskError) {
            console.log(`Failed to call as Task, trying as Actor: ${taskError.message}`);
            // Fallback to Actor ID
            run = await client.actor(actorId).call(apifyInput);
        }

        console.log(`Apify run started. Run ID: ${run.id}`);

        // Fetch results from the default dataset of the run
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items;

    } catch (error) {
        console.error('Error running Apify scraper:', error);
        throw error;
    }
};
