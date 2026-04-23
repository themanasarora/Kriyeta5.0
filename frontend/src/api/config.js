// Centralized API configuration
// During local development (npm start), this will point to 127.0.0.1:5000.
// In production, this can be set via an environment variable or default to the current host.

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export default API_BASE_URL;
