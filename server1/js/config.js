/**
 * Author: Andre Di Lascio
 * Connection settings for the API server (server2).
 * Written with help of Claude.
 */

class AppConfig {
    // Replace with the deployed https URL of server2 (see ../API_CONTRACT.md)
    static API_BASE_URL = "http://localhost:8080/api/v1/sql";
    static REQUEST_TIMEOUT_MS = 10000;
}
