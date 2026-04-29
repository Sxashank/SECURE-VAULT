import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') { 
        res.json({ users: [] }); 
        return; 
    }
    
    const query = `
        SELECT id, full_name, email, department_id 
        FROM users 
        WHERE (full_name ILIKE $1 OR email ILIKE $1)
        ORDER BY full_name ASC 
        LIMIT 10
    `;
    const values = [`%${q}%`];
    
    try {
        const result = await pool.query(query, values);
        res.json({ users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Search failed' });
    }
};

export const leaveTeam = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { teamId } = req.body;
    if (!teamId) {
        res.status(400).json({ message: 'teamId is required' });
        return;
    }
    try {
        await pool.query('DELETE FROM user_teams WHERE user_id = $1 AND team_id = $2', [userId, teamId]);
        res.json({ message: 'Left team successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to leave team' });
    }
};

export const kickMember = async (req: AuthRequest, res: Response): Promise<void> => {
    const { userIdToKick, teamId } = req.body;
    
    // If teamId is provided, kick from specific team. Otherwise, kick from all managed teams.
    const managedTeamIds = req.user?.teams
        ?.filter((t: any) => t.role_name === 'MANAGER' || t.role_name === 'ADMIN')
        .map((t: any) => t.team_id) || [];

    if (req.user?.role_name !== 'ADMIN' && managedTeamIds.length === 0) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    try {
        if (teamId) {
            // Check if they manage THIS team, or are global admin
            if (req.user?.role_name !== 'ADMIN' && !managedTeamIds.includes(teamId)) {
                res.status(403).json({ message: 'Forbidden' }); return;
            }
            await pool.query('DELETE FROM user_teams WHERE user_id = $1 AND team_id = $2', [userIdToKick, teamId]);
        } else {
            // Kick from ALL teams managed by the admin
            if (req.user?.role_name === 'ADMIN') {
                 await pool.query('DELETE FROM user_teams WHERE user_id = $1', [userIdToKick]);
            } else {
                 await pool.query('DELETE FROM user_teams WHERE user_id = $1 AND team_id = ANY($2::int[])', [userIdToKick, managedTeamIds]);
            }
        }
        res.json({ message: 'Member kicked successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to kick member' });
    }
};
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    console.log('GET ALL USERS ATTEMPT:', { userId: req.user?.id, role: req.user?.role_name });
    if (req.user?.role_name !== 'ADMIN') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    try {
        const result = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.role_id, r.name as role_name, u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        res.json({ users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role_name !== 'ADMIN') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    const { userId, newRoleId } = req.body;
    if (!userId || !newRoleId) {
        res.status(400).json({ message: 'userId and newRoleId are required' });
        return;
    }

    try {
        await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [newRoleId, userId]);
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update user role' });
    }
};
