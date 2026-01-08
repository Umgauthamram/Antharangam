import axios from 'axios';

const BASE_URL = 'https://graph.facebook.com/v19.0';


export const fetchFacebookPosts = async (pageId, accessToken, limit = 10) => {
    try {
        console.log(`[FacebookAPI] Fetching ${limit} posts for page: ${pageId}`);
        const response = await axios.get(`${BASE_URL}/${pageId}/posts`, {
            params: {
                access_token: accessToken,
                limit: limit,
                fields: 'id,message,from,created_time,full_picture,permalink_url,shares,comments.summary(true).limit(0),likes.summary(true).limit(0)'
            }
        });

        if (!response.data || !response.data.data) {
            console.warn('[FacebookAPI] No data returned from Graph API.');
            return [];
        }

        return response.data.data.map(post => ({
            id: post.id,
            content: post.message || '[Media/No Text]',
            timestamp: new Date(post.created_time),
            imageUrl: post.full_picture,
            url: post.permalink_url,
            username: post.from ? post.from.name : 'Unknown',
            author: post.from ? post.from.name : 'Unknown',
            likes: post.likes ? post.likes.summary.total_count : 0,
            comments: post.comments ? post.comments.summary.total_count : 0,
            shares: post.shares ? post.shares.count : 0
        }));

    } catch (error) {
        if (error.response) {
            console.error(`[FacebookAPI] Error ${error.response.status}:`, error.response.data);
            throw new Error(`Facebook Graph API Error: ${error.response.data.error.message}`);
        } else {
            console.error('[FacebookAPI] Network Error:', error.message);
            throw error;
        }
    }
};
