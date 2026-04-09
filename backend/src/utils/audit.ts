import { pool } from '../db';

export const logAction = async (userId: number | null, action: string, resourceId: string | null, ipAddress: string) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, resource_id, ip_address) VALUES ($1, $2, $3, $4)',
            [userId, action, resourceId, ipAddress]
        );
    } catch (e) {
        console.error('Audit log failed', e);
    }
}
