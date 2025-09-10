"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const mockWebsites = [
            {
                id: '1',
                url: 'https://diskominfo.example.com',
                name: 'Diskominfo Website',
                status: 'active',
                last_ping: new Date().toISOString(),
                response_time: 250,
                total_requests: 1500,
                last_request: new Date().toISOString(),
            },
        ];
        res.json({
            success: true,
            data: mockWebsites,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting websites:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get websites',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
//# sourceMappingURL=websites.js.map