import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { pool } from '../db';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const requireRole = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const roleId = req.user.role_id;
        try {
            const { rows } = await pool.query('SELECT name FROM roles WHERE id = $1', [roleId]);
            if (rows.length === 0 || !roles.includes(rows[0].name)) {
                res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
                return;
            }
            next();
        } catch (err) {
            res.status(500).json({ message: 'Internal server error while checking role' });
        }
    };
};
