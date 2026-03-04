/**
 * Centralized URL Configuration for Frontend
 * All external URLs and API endpoints should be defined here
 */

// GitHub Repository URLs
export const GITHUB_URLS = {
    REPO_OWNER: 'akash2061',
    REPO_NAME: 'NoteBook-App',
    RELEASES: 'https://github.com/akash2061/NoteBook-App/releases',
    PROFILE: 'https://github.com/akash2061',
    CODE_CANVAS: 'https://github.com/akash2061/Code_Canvas',
    COSMOSECURE_ORG: 'https://github.com/CosmoSecure',
} as const;

// Social Media URLs
export const SOCIAL_URLS = {
    LINKEDIN: 'https://www.linkedin.com/in/akash2061/',
    TWITTER: '',
    YOUTUBE: '',
} as const;

// Project URLs
export const WEBSITE_URLS = {
    WEBSITE: 'https://cosmosecure.vercel.app',
    ABOUT: 'https://cosmosecure.vercel.app/about',
    DOCS: 'https://cosmosecure.vercel.app/docs',
    SIGNUP: 'https://cosmosecure.vercel.app/signup',
    FORGOT_PASSWORD: 'https://cosmosecure.vercel.app/forgot-password',
} as const;

// API Endpoints
export const API_URLS = {
    // Email breach check API
    EMAIL_BREACH: 'https://api.xposedornot.com/v1/breach-analytics',
} as const;

// Documentation URLs
export const DOCS_URLS = {
    NODEJS: 'https://nodejs.org/',
    RUST: 'https://www.rust-lang.org/tools/install',
    TAURI: 'https://v2.tauri.app/',
    CARGO_DOCS: 'https://doc.rust-lang.org/cargo/reference/manifest.html',
} as const;

// Development URLs
export const DEV_URLS = {
    LOCALHOST: 'http://localhost:1420',
    VITE_HMR_HOST: 'http://localhost:1421',
} as const;

// Helper function to build GitHub API URL
export const buildGitHubApiUrl = (endpoint: string) => {
    return `https://api.github.com/repos/${GITHUB_URLS.REPO_OWNER}/${GITHUB_URLS.REPO_NAME}${endpoint}`;
};

// Helper function to build email breach URL with email
export const buildEmailBreachUrl = (email: string) => {
    return `${API_URLS.EMAIL_BREACH}?email=${encodeURIComponent(email)}`;
};

export default {
    GITHUB_URLS,
    SOCIAL_URLS,
    WEBSITE_URLS,
    API_URLS,
    DOCS_URLS,
    DEV_URLS,
    buildGitHubApiUrl,
    buildEmailBreachUrl,
};
