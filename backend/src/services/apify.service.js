/**
 * Apify Service
 * Handles integration with Apify LinkedIn Profile Scraper API
 * Uses sync endpoint for faster response
 */

const axios = require('axios');

class ApifyService {
  constructor() {
    // Sync API endpoint - runs actor and returns dataset items directly
    this.actorId =
      process.env.APIFY_ACTOR_ID ||
      process.env.APIFY_ACTOR ||
      'dev_fusion~linkedin-profile-scraper';
    this.syncApiUrl = `https://api.apify.com/v2/acts/${this.actorId}/run-sync-get-dataset-items`;
    this.token = process.env.APIFY_TOKEN;
  }

  /**
   * Validate LinkedIn URL format
   * @param {string} url - LinkedIn profile URL
   * @returns {boolean}
   */
  validateLinkedInUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const linkedinPatterns = [
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i,
      /^https?:\/\/(www\.)?linkedin\.com\/pub\/[\w-]+\/?$/i,
    ];

    return linkedinPatterns.some((pattern) => pattern.test(url.trim()));
  }

  /**
   * Scrape LinkedIn profile using sync API
   * @param {string} linkedinUrl - LinkedIn profile URL to scrape
   * @returns {Promise<Object>} - Parsed profile data
   */
  async scrapeProfile(linkedinUrl) {
    try {
      if (!this.token) {
        throw new Error('APIFY_TOKEN is not set in environment variables');
      }

      if (!this.validateLinkedInUrl(linkedinUrl)) {
        throw new Error('Invalid LinkedIn URL format');
      }

      // Prepare actor input
      const input = {
        profileUrls: [linkedinUrl.trim()],
      };

      console.log(`Scraping LinkedIn profile: ${linkedinUrl}`);
      console.log(`Using Apify actor: ${this.actorId}`);
      console.log('Using sync API endpoint...');

      // Call sync API - runs actor and returns results directly
      const response = await axios.post(
        `${this.syncApiUrl}?token=${this.token}`,
        input,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minute timeout for sync request
        }
      );

      const items = response.data;

      if (!items || items.length === 0) {
        throw new Error('No profile data returned. Profile may be private or not found.');
      }

      console.log('Profile data received successfully');
      return items[0];

    } catch (error) {
      console.error('Apify scrape error:', error.message);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.message;

        if (status === 401) {
          throw new Error('Invalid Apify API token');
        } else if (status === 403) {
          if (message.toLowerCase().includes('rent') || message.toLowerCase().includes('paid actor')) {
            throw new Error(
              'Apify actor requires a paid rental or plan. Update APIFY_ACTOR_ID or rent the actor.'
            );
          }
          throw new Error('Apify actor access forbidden. Check your token and actor permissions.');
        } else if (status === 402) {
          throw new Error('Apify quota exceeded. Please upgrade your plan.');
        } else if (status === 404) {
          throw new Error('LinkedIn profile not found or is private');
        } else if (status === 429) {
          throw new Error('Apify rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Apify API error: ${message}`);
        }
      }

      if (error.message.includes('Invalid LinkedIn URL')) {
        throw error;
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('Network error: Could not connect to Apify API');
      }

      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The profile may be too large or Apify is busy.');
      }

      throw new Error(`Failed to scrape LinkedIn profile: ${error.message}`);
    }
  }
}

module.exports = new ApifyService();
