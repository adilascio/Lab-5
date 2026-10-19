/**
 * Author: Andre Di Lascio
 * Connection settings for the API server (server2).
 * Written with help of Claude.
 */

class AppConfig {
    // Replace with the deployed https URL of server2 (see ../API_CONTRACT.md)
    static API_BASE_URL = "https://lab-5-hygb.onrender.com/api/v1/sql";
    // 60s so a sleeping free-tier server has time to wake up
    static REQUEST_TIMEOUT_MS = 60000;
}
