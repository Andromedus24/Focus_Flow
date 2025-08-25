// Test Configuration for Focus Flow API
export const testConfig = {
    // Server Configuration
    server: {
        baseUrl: 'http://localhost:3000',
        apiPath: '/api',
        timeout: 10000
    },

    // Test Data
    testData: {
        validTask: {
            taskGoal: 'Complete project documentation',
            context: 'Software development project'
        },
        validWebsiteCheck: {
            titleTab: 'GitHub - username/repository',
            goalNeeded: 'Complete project documentation',
            URLTab: 'https://github.com/username/repository',
            context: 'Working on software project'
        },
        invalidData: {
            // Missing required fields
            incompleteTask: {},
            incompleteWebsiteCheck: {
                titleTab: 'Some Website'
                // Missing goalNeeded and URLTab
            }
        }
    },

    // Expected Responses
    expectedResponses: {
        health: {
            status: 'OK',
            version: '1.0.0'
        },
        apiInfo: {
            message: 'Welcome to Focus Flow API',
            version: '1.0.0'
        }
    },

    // Test Scenarios
    testScenarios: [
        {
            name: 'Health Check',
            endpoint: '/health',
            method: 'GET',
            expectedStatus: 200,
            description: 'Should return server health status'
        },
        {
            name: 'API Information',
            endpoint: '/api/',
            method: 'GET',
            expectedStatus: 200,
            description: 'Should return API information and endpoints'
        },
        {
            name: 'Website Relevance Check - Valid',
            endpoint: '/api/check',
            method: 'POST',
            expectedStatus: 200,
            description: 'Should check website relevance with valid data'
        },
        {
            name: 'Website Relevance Check - Invalid',
            endpoint: '/api/check',
            method: 'POST',
            expectedStatus: 400,
            description: 'Should return validation error for invalid data'
        },
        {
            name: 'Generate Task Websites - Valid',
            endpoint: '/api/initial',
            method: 'POST',
            expectedStatus: 200,
            description: 'Should generate websites for valid task'
        },
        {
            name: 'Generate Task Websites - Invalid',
            endpoint: '/api/initial',
            method: 'POST',
            expectedStatus: 400,
            description: 'Should return validation error for invalid task'
        },
        {
            name: 'Get Analytics',
            endpoint: '/api/analytics',
            method: 'GET',
            expectedStatus: 200,
            description: 'Should return productivity analytics'
        },
        {
            name: 'Get Task Suggestions - Valid',
            endpoint: '/api/suggestions',
            method: 'POST',
            expectedStatus: 200,
            description: 'Should return task suggestions for valid goal'
        }
    ],

    // Performance Thresholds
    performance: {
        maxResponseTime: 2000, // 2 seconds
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxCpuUsage: 80 // 80%
    },

    // Error Messages
    errorMessages: {
        missingField: 'Missing required field:',
        invalidData: 'Invalid data provided',
        serverError: 'Internal server error',
        notFound: 'Route not found'
    }
};

// Test Utilities
export const testUtils = {
    // Generate random test data
    generateRandomTask() {
        const tasks = [
            'Complete project documentation',
            'Learn new technology',
            'Research for assignment',
            'Build web application',
            'Write research paper'
        ];
        
        const contexts = [
            'Software development project',
            'Academic research',
            'Personal learning',
            'Work assignment',
            'Side project'
        ];

        return {
            taskGoal: tasks[Math.floor(Math.random() * tasks.length)],
            context: contexts[Math.floor(Math.random() * contexts.length)]
        };
    },

    // Generate random website data
    generateRandomWebsite() {
        const websites = [
            'https://github.com/username/repo',
            'https://stackoverflow.com/questions/123',
            'https://youtube.com/watch?v=abc123',
            'https://wikipedia.org/wiki/Topic',
            'https://medium.com/article'
        ];

        const titles = [
            'GitHub - username/repository',
            'Stack Overflow - Question Title',
            'YouTube - Video Title',
            'Wikipedia - Article Title',
            'Medium - Article Title'
        ];

        return {
            titleTab: titles[Math.floor(Math.random() * titles.length)],
            URLTab: websites[Math.floor(Math.random() * websites.length)],
            goalNeeded: 'Complete project documentation'
        };
    },

    // Validate response structure
    validateResponse(response, expectedFields) {
        for (const field of expectedFields) {
            if (!(field in response)) {
                throw new Error(`Missing field: ${field}`);
            }
        }
        return true;
    },

    // Check response time
    checkResponseTime(startTime, maxTime = 2000) {
        const responseTime = Date.now() - startTime;
        if (responseTime > maxTime) {
            throw new Error(`Response time ${responseTime}ms exceeds maximum ${maxTime}ms`);
        }
        return responseTime;
    },

    // Generate test report
    generateTestReport(results) {
        const total = results.length;
        const passed = results.filter(r => r.status === 'PASS').length;
        const failed = results.filter(r => r.status === 'FAIL').length;
        const skipped = results.filter(r => r.status === 'SKIP').length;

        return {
            summary: {
                total,
                passed,
                failed,
                skipped,
                successRate: ((passed / total) * 100).toFixed(2) + '%'
            },
            results,
            timestamp: new Date().toISOString()
        };
    }
};

// Export for use in tests
export default { testConfig, testUtils };
