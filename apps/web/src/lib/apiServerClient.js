import pb from '@/lib/pocketbaseClient';

const API_SERVER_URL = '/hcgi/api';

const apiServerClient = {
    fetch: async (url, options = {}) => {
        // Forward the logged-in user's PocketBase token so the API can verify
        // the caller's identity and enforce record ownership server-side.
        const headers = { ...(options.headers || {}) };
        if (pb.authStore.isValid && pb.authStore.token) {
            headers['Authorization'] = `Bearer ${pb.authStore.token}`;
        }

        return await window.fetch(API_SERVER_URL + url, { ...options, headers });
    }
};

export default apiServerClient;

export { apiServerClient };
