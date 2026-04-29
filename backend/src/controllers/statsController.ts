import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import { logAction } from '../utils/audit';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const roleName = req.user?.role_name;
    const teamIds = req.user?.teams?.map((t: any) => t.team_id) || [];

    try {
        // 1. Today's Audits
        const auditsRes = await pool.query(`SELECT COUNT(*) FROM audit_logs WHERE timestamp >= current_date`);
        const todayAudits = parseInt(auditsRes.rows[0].count);

        // 2. Active Members
        let membersQuery = 'SELECT COUNT(*) FROM users';
        let membersParams: any[] = [];
        if (roleName !== 'ADMIN') {
            membersQuery = 'SELECT COUNT(DISTINCT user_id) FROM user_teams WHERE team_id = ANY($1::int[])';
            membersParams.push(teamIds);
        }
        const membersRes = await pool.query(membersQuery, membersParams);
        const activeMembers = parseInt(membersRes.rows[0].count);

        // 3. Accessible Documents Count
        let docsQuery = 'SELECT COUNT(*) FROM documents';
        let docsParams: any[] = [];
        if (roleName !== 'ADMIN') {
            docsQuery += ' WHERE (team_id = ANY($1::int[]) OR uploaded_by = $2 OR is_public_to_department = true OR id IN (SELECT document_id FROM document_permissions WHERE user_id = $2))';
            docsParams = [teamIds, userId];
        }
        const docsRes = await pool.query(docsQuery, docsParams);
        const totalDocs = parseInt(docsRes.rows[0].count);

        // 4. Categories For Bar Graph
        let catQuery = 'SELECT category, COUNT(*) as count FROM documents';
        let catParams: any[] = [];
        if (roleName !== 'ADMIN') {
            catQuery += ' WHERE (team_id = ANY($1::int[]) OR uploaded_by = $2 OR is_public_to_department = true OR id IN (SELECT document_id FROM document_permissions WHERE user_id = $2))';
            catParams = [teamIds, userId];
        }
        catQuery += ' GROUP BY category';
        const catRes = await pool.query(catQuery, catParams);
        
        const categories = catRes.rows.map(r => ({ name: r.category, value: parseInt(r.count) }));

        // 5. Team Context & Members
        let teams: any[] = [];
        let teamMembers: any[] = [];
        
        if (roleName === 'ADMIN') {
            const teamRes = await pool.query('SELECT id, name, invite_code FROM teams');
            teams = teamRes.rows;
        } else if (teamIds.length > 0) {
            const teamRes = await pool.query('SELECT id, name, invite_code FROM teams WHERE id = ANY($1::int[])', [teamIds]);
            teams = teamRes.rows;
        }

        // Fetch members of all user's teams and include their team_id
        if (roleName === 'ADMIN') {
            const memRes = await pool.query(`
                SELECT u.id, u.full_name, u.email, ut.role_id, ut.team_id, t.name as team_name, u.created_at 
                FROM users u
                JOIN user_teams ut ON u.id = ut.user_id
                JOIN teams t ON ut.team_id = t.id
                ORDER BY u.created_at DESC
            `);
            teamMembers = memRes.rows;
        } else if (teamIds.length > 0) {
            const memRes = await pool.query(`
                SELECT u.id, u.full_name, u.email, ut.role_id, ut.team_id, t.name as team_name, u.created_at 
                FROM users u
                JOIN user_teams ut ON u.id = ut.user_id
                JOIN teams t ON ut.team_id = t.id
                WHERE ut.team_id = ANY($1::int[])
                ORDER BY u.created_at DESC
            `, [teamIds]);
            teamMembers = memRes.rows;
        }

        await logAction(userId, 'DASHBOARD_STATS_VIEW', null, req.ip || 'unknown');

        res.json({
            todayAudits,
            activeMembers,
            totalDocs,
            categories,
            teams,
            teamMembers,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};
