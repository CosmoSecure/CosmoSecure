// FontAwesome imports for platform icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGoogle, faGithub, faFacebook, faXTwitter, faLinkedin, faMicrosoft, faApple,
    faAmazon, faSpotify, faDiscord, faSlack, faDropbox, faYoutube, faInstagram,
    faPaypal, faWhatsapp, faTiktok, faTwitch, faReddit, faPinterest, faUber,
    faAirbnb, faShopify, faSteam, faPlaystation, faXbox, faFigma, faStripe,
    faSnapchat, faSkype, faTelegram, faVimeo, faSoundcloud, faWordpress,
    faBitcoin, faEthereum, faTrello, faMailchimp, faHubspot, faIntercom,
    faGitlab, faStackOverflow, faCodepen, faBehance, faDribbble,
    faMedium, faQuora, faFlickr, faPatreon, faKickstarter, faTumblr,
    faLastfm, faDeviantart, faImdb, faGoodreads, faEbay, faEtsy, faWix,
    faSquarespace, faCloudflare, faDigitalOcean, faAws, faYelp, faFoursquare,
    faUntappd
} from '@fortawesome/free-brands-svg-icons';
import {
    faPlay, faEllipsis, faFileAlt, faVideo, faPalette, faShield, faCamera,
    faCloud, faUniversity, faCreditCard, faGraduationCap, faHeart, faPlane,
    faTruck, faHome, faNewspaper, faEnvelope, faGamepad, faChess
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// Platform interface for type safety
export interface Platform {
    value: string;
    name: string;
    icon: IconDefinition;
    color: string;
}

// Centralized platform options with FontAwesome icons
export const PLATFORMS: Platform[] = [
    { value: 'google', name: 'Google', icon: faGoogle, color: 'bg-red-500' },
    { value: 'github', name: 'GitHub', icon: faGithub, color: 'bg-gray-800' },
    { value: 'facebook', name: 'Facebook', icon: faFacebook, color: 'bg-blue-600' },
    { value: 'twitter', name: 'Twitter (X)', icon: faXTwitter, color: 'bg-black' },
    { value: 'linkedin', name: 'LinkedIn', icon: faLinkedin, color: 'bg-blue-700' },
    { value: 'microsoft', name: 'Microsoft', icon: faMicrosoft, color: 'bg-blue-500' },
    { value: 'apple', name: 'Apple', icon: faApple, color: 'bg-gray-700' },
    { value: 'amazon', name: 'Amazon', icon: faAmazon, color: 'bg-orange-500' },
    { value: 'netflix', name: 'Netflix', icon: faPlay, color: 'bg-red-600' },
    { value: 'spotify', name: 'Spotify', icon: faSpotify, color: 'bg-green-500' },
    { value: 'discord', name: 'Discord', icon: faDiscord, color: 'bg-indigo-600' },
    { value: 'slack', name: 'Slack', icon: faSlack, color: 'bg-purple-600' },
    { value: 'dropbox', name: 'Dropbox', icon: faDropbox, color: 'bg-blue-500' },
    { value: 'youtube', name: 'YouTube', icon: faYoutube, color: 'bg-red-500' },
    { value: 'instagram', name: 'Instagram', icon: faInstagram, color: 'bg-pink-500' },
    { value: 'paypal', name: 'PayPal', icon: faPaypal, color: 'bg-blue-600' },
    { value: 'whatsapp', name: 'WhatsApp', icon: faWhatsapp, color: 'bg-green-600' },
    { value: 'tiktok', name: 'TikTok', icon: faTiktok, color: 'bg-black' },
    { value: 'twitch', name: 'Twitch', icon: faTwitch, color: 'bg-purple-500' },
    { value: 'reddit', name: 'Reddit', icon: faReddit, color: 'bg-orange-600' },
    { value: 'pinterest', name: 'Pinterest', icon: faPinterest, color: 'bg-red-600' },
    { value: 'uber', name: 'Uber', icon: faUber, color: 'bg-black' },
    { value: 'airbnb', name: 'Airbnb', icon: faAirbnb, color: 'bg-red-500' },
    { value: 'shopify', name: 'Shopify', icon: faShopify, color: 'bg-green-700' },
    { value: 'steam', name: 'Steam', icon: faSteam, color: 'bg-blue-900' },
    { value: 'playstation', name: 'PlayStation', icon: faPlaystation, color: 'bg-blue-600' },
    { value: 'xbox', name: 'Xbox', icon: faXbox, color: 'bg-green-600' },
    { value: 'figma', name: 'Figma', icon: faFigma, color: 'bg-purple-500' },
    { value: 'stripe', name: 'Stripe', icon: faStripe, color: 'bg-indigo-600' },
    { value: 'snapchat', name: 'Snapchat', icon: faSnapchat, color: 'bg-yellow-400' },
    { value: 'skype', name: 'Skype', icon: faSkype, color: 'bg-blue-500' },
    { value: 'telegram', name: 'Telegram', icon: faTelegram, color: 'bg-blue-400' },
    { value: 'vimeo', name: 'Vimeo', icon: faVimeo, color: 'bg-blue-500' },
    { value: 'soundcloud', name: 'SoundCloud', icon: faSoundcloud, color: 'bg-orange-500' },
    { value: 'wordpress', name: 'WordPress', icon: faWordpress, color: 'bg-blue-700' },
    { value: 'bitcoin', name: 'Bitcoin', icon: faBitcoin, color: 'bg-yellow-500' },
    { value: 'ethereum', name: 'Ethereum', icon: faEthereum, color: 'bg-gray-600' },

    // Productivity & Work
    { value: 'trello', name: 'Trello', icon: faTrello, color: 'bg-blue-600' },
    { value: 'notion', name: 'Notion', icon: faFileAlt, color: 'bg-gray-800' },
    { value: 'zoom', name: 'Zoom', icon: faVideo, color: 'bg-blue-500' },
    { value: 'canva', name: 'Canva', icon: faPalette, color: 'bg-purple-600' },
    { value: 'mailchimp', name: 'Mailchimp', icon: faMailchimp, color: 'bg-yellow-500' },
    { value: 'hubspot', name: 'HubSpot', icon: faHubspot, color: 'bg-orange-500' },
    { value: 'intercom', name: 'Intercom', icon: faIntercom, color: 'bg-blue-600' },
    { value: 'zendesk', name: 'Zendesk', icon: faShield, color: 'bg-green-600' },

    // Development & Design
    { value: 'gitlab', name: 'GitLab', icon: faGitlab, color: 'bg-orange-600' },
    { value: 'stackoverflow', name: 'Stack Overflow', icon: faStackOverflow, color: 'bg-orange-500' },
    { value: 'codepen', name: 'CodePen', icon: faCodepen, color: 'bg-black' },
    { value: 'behance', name: 'Behance', icon: faBehance, color: 'bg-blue-600' },
    { value: 'dribbble', name: 'Dribbble', icon: faDribbble, color: 'bg-pink-500' },

    // Entertainment & Media
    { value: 'chess', name: 'Chess.com', icon: faChess, color: 'bg-green-700' },
    { value: 'medium', name: 'Medium', icon: faMedium, color: 'bg-black' },
    { value: 'quora', name: 'Quora', icon: faQuora, color: 'bg-red-600' },
    { value: 'flickr', name: 'Flickr', icon: faFlickr, color: 'bg-pink-600' },
    { value: 'unsplash', name: 'Unsplash', icon: faCamera, color: 'bg-black' },
    { value: 'patreon', name: 'Patreon', icon: faPatreon, color: 'bg-orange-500' },
    { value: 'kickstarter', name: 'Kickstarter', icon: faKickstarter, color: 'bg-green-600' },
    { value: 'tumblr', name: 'Tumblr', icon: faTumblr, color: 'bg-blue-800' },
    { value: 'lastfm', name: 'Last.fm', icon: faLastfm, color: 'bg-red-600' },
    { value: 'deviantart', name: 'DeviantArt', icon: faDeviantart, color: 'bg-green-600' },
    { value: 'imdb', name: 'IMDb', icon: faImdb, color: 'bg-yellow-600' },
    { value: 'goodreads', name: 'Goodreads', icon: faGoodreads, color: 'bg-yellow-700' },

    // E-commerce & Shopping
    { value: 'ebay', name: 'eBay', icon: faEbay, color: 'bg-blue-600' },
    { value: 'etsy', name: 'Etsy', icon: faEtsy, color: 'bg-orange-600' },

    // Web Services & Hosting
    { value: 'wix', name: 'Wix', icon: faWix, color: 'bg-blue-600' },
    { value: 'squarespace', name: 'Squarespace', icon: faSquarespace, color: 'bg-black' },
    { value: 'godaddy', name: 'GoDaddy', icon: faCloud, color: 'bg-green-600' },
    { value: 'cloudflare', name: 'Cloudflare', icon: faCloudflare, color: 'bg-orange-500' },
    { value: 'digitalocean', name: 'DigitalOcean', icon: faDigitalOcean, color: 'bg-blue-600' },
    { value: 'heroku', name: 'Heroku', icon: faCloud, color: 'bg-purple-600' },
    { value: 'aws', name: 'Amazon AWS', icon: faAws, color: 'bg-orange-600' },

    // Local & Social
    { value: 'yelp', name: 'Yelp', icon: faYelp, color: 'bg-red-600' },
    { value: 'foursquare', name: 'Foursquare', icon: faFoursquare, color: 'bg-pink-600' },
    { value: 'untappd', name: 'Untappd', icon: faUntappd, color: 'bg-yellow-600' },

    // Generic Categories (using solid icons)
    { value: 'banking', name: 'Banking', icon: faUniversity, color: 'bg-blue-800' },
    { value: 'creditcard', name: 'Credit Card', icon: faCreditCard, color: 'bg-green-700' },
    { value: 'education', name: 'Education', icon: faGraduationCap, color: 'bg-blue-700' },
    { value: 'healthcare', name: 'Healthcare', icon: faHeart, color: 'bg-red-600' },
    { value: 'travel', name: 'Travel', icon: faPlane, color: 'bg-blue-600' },
    { value: 'food', name: 'Food Delivery', icon: faTruck, color: 'bg-orange-600' },
    { value: 'realestate', name: 'Real Estate', icon: faHome, color: 'bg-green-700' },
    { value: 'news', name: 'News', icon: faNewspaper, color: 'bg-gray-700' },
    { value: 'email', name: 'Email Service', icon: faEnvelope, color: 'bg-blue-600' },
    { value: 'cloud', name: 'Cloud Storage', icon: faCloud, color: 'bg-gray-600' },
    { value: 'gaming', name: 'Gaming', icon: faGamepad, color: 'bg-purple-600' },

    { value: 'other', name: 'Other', icon: faEllipsis, color: 'bg-gray-500' }
];

// Export FontAwesome component for convenience
export { FontAwesomeIcon };