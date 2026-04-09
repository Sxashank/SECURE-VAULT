import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await pool.query(`
            SELECT a.id, a.action, a.resource_id, a.ip_address, a.timestamp, u.full_name as user_name
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC LIMIT 100
        `);
        res.json({ logs: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching global audit logs' });
    }
};

export const getSuspiciousActivity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT ip_address, user_id, COUNT(*) as failed_attempts, MAX(timestamp) as last_attempt
            FROM audit_logs
            WHERE action = 'LOGIN_FAILED_BAD_PASSWORD' 
              AND timestamp >= NOW() - INTERVAL '30 minutes'
            GROUP BY ip_address, user_id
            HAVING COUNT(*) >= 3
            ORDER BY failed_attempts DESC
        `;
        const result = await pool.query(query);
        res.json({ alerts: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error analyzing suspicious activity' });
    }
};

export const getTeamInsights = async (req: AuthRequest, res: Response): Promise<void> => {
    const teamId = req.user?.team_id;
    if (!teamId || req.user?.role_name !== 'MANAGER') {
        res.status(403).json({ message: 'Forbidden: Manager access only.' }); return;
    }

    try {
        const query = `
            SELECT a.id, a.action, a.resource_id, a.timestamp, u.full_name as user_name
            FROM audit_logs a
            JOIN users u ON a.user_id = u.id
            WHERE u.team_id = $1
            ORDER BY a.timestamp DESC LIMIT 200
        `;
        const result = await pool.query(query, [teamId]);
        res.json({ insights: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching team insights' });
    }
};
