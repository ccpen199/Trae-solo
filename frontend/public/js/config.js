let API_BASE_URL = 'http://localhost:21123';

async function loadConfig() {
    try {
        const response = await fetch('/config');
        if (response.ok) {
            const config = await response.json();
            API_BASE_URL = config.apiBaseUrl || API_BASE_URL;
        }
    } catch (e) {
        console.log('使用默认API地址');
    }
}

loadConfig();
