// Connection settings for the API server (server2, a different origin).
// Update API_BASE_URL once server2 is deployed - see ../API_CONTRACT.md

class AppConfig {
    static API_BASE_URL = "http://localhost:8080/api/v1/sql";
    static REQUEST_TIMEOUT_MS = 10000;
}
