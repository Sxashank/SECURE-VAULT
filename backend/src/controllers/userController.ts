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
        SELECT id, full_name, email, team_id, department_id 
        FROM users 
        WHERE (full_name ILIKE $1 OR email ILIKE $1)
        ORDER BY 
            CASE WHEN team_id = $2 THEN 0 ELSE 1 END,
            full_name ASC 
        LIMIT 10
    `;
    const values = [`%${q}%`, req.user?.team_id || null];
    
    try {
        const result = await pool.query(query, values);
        res.json({ users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Search failed' });
    }
};
