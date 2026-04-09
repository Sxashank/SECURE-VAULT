import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import { logAction } from '../utils/audit';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const teamId = req.user?.team_id;
    const roleName = req.user?.role_name;

    try {
        // 1. Today's Audits
        const auditsRes = await pool.query(`SELECT COUNT(*) FROM audit_logs WHERE timestamp >= current_date`);
        const todayAudits = parseInt(auditsRes.rows[0].count);

        // 2. Active Members
        let membersQuery = 'SELECT COUNT(*) FROM users';
        let membersParams = [];
        if (roleName !== 'ADMIN') {
            membersQuery += ' WHERE team_id = $1';
            membersParams.push(teamId);
        }
        const membersRes = await pool.query(membersQuery, membersParams);
        const activeMembers = parseInt(membersRes.rows[0].count);

        // 3. Accessible Documents Count
        let docsQuery = 'SELECT COUNT(*) FROM documents';
        let docsParams = [];
        if (roleName !== 'ADMIN') {
            docsQuery += ' WHERE team_id = $1';
            docsParams.push(teamId);
            if (roleName !== 'MANAGER') {
                docsParams.push(userId);
                docsQuery += ' AND (target_user_id IS NULL OR target_user_id = $2)';
            }
        }
        const docsRes = await pool.query(docsQuery, docsParams);
        const totalDocs = parseInt(docsRes.rows[0].count);

        // 4. Categories For Bar Graph
        let catQuery = 'SELECT category, COUNT(*) as count FROM documents';
        let catParams = [];
        if (roleName !== 'ADMIN') {
            catQuery += ' WHERE team_id = $1';
            catParams.push(teamId);
            if (roleName !== 'MANAGER') {
                catParams.push(userId);
                catQuery += ' AND (target_user_id IS NULL OR target_user_id = $2)';
            }
        }
        catQuery += ' GROUP BY category';
        const catRes = await pool.query(catQuery, catParams);
        
        const categories = catRes.rows.map(r => ({ name: r.category, value: parseInt(r.count) }));

        // 5. Team Context & Members
        let teamInfo = null;
        let teamMembers: any[] = [];
        
        if (teamId) {
            const teamRes = await pool.query('SELECT name, invite_code FROM teams WHERE id = $1', [teamId]);
            if (teamRes.rows.length > 0) {
                teamInfo = teamRes.rows[0];
            }
            
            if (roleName === 'MANAGER' || roleName === 'ADMIN') {
                const memRes = await pool.query('SELECT id, full_name, email, role_id, created_at FROM users WHERE team_id = $1 ORDER BY created_at DESC', [teamId]);
                teamMembers = memRes.rows;
            }
        }

        await logAction(userId, 'DASHBOARD_STATS_VIEW', null, req.ip || 'unknown');

        res.json({
            todayAudits,
            activeMembers,
            totalDocs,
            categories,
            teamInfo,
            teamMembers
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};
