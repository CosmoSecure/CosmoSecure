import { useNavigate } from "react-router-dom";

export function timeOut(navigate: ReturnType<typeof useNavigate>) {
    const sessionTimeout = 3 * 24 * 3600 * 1000; // 3 days in milliseconds

    const timeoutId = setTimeout(() => {
        // Remove session on expiration
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        alert("Session expired. Please log in again.");

        const timeoutId = sessionStorage.getItem("sessionTimeoutId");
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId, 10));
        }

        sessionStorage.removeItem("sessionTimeoutId");
        navigate("/login");
        console.log("Token Removed Successfully!");
    }, sessionTimeout);

    // Store the timeout ID for cleanup on logout/re-login
    sessionStorage.setItem("sessionTimeoutId", timeoutId.toString());
}