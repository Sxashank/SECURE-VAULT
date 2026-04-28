import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { pool } from '../db';

export interface AuthRequest extends Request {
    auth?: any;
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const clerkId = getAuth(req).userId;

    if (!clerkId) {
        res.status(401).json({ message: 'Unauthenticated' });
        return;
    }

    try {
        // Find local user by clerk_id or email (to link existing seeded accounts)
        let userRes = await pool.query('SELECT * FROM users WHERE clerk_id = $1', [clerkId]);
        
        let localUser;
        if (userRes.rows.length === 0) {
            // First time this Clerk user is hitting our API
            const clerkUser = await clerkClient.users.getUser(clerkId);
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User';

            // See if a user with this email already exists (e.g. from seed_demo)
            const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            
            if (emailCheck.rows.length > 0) {
                // Link the existing user to this Clerk ID
                const updatedUser = await pool.query(
                    'UPDATE users SET clerk_id = $1 WHERE email = $2 RETURNING *',
                    [clerkId, email]
                );
                localUser = updatedUser.rows[0];
                console.log(`Linked existing user ${email} to Clerk ID ${clerkId}`);
            } else {
                // Create new user, default to USER role (id 3)
                const newUser = await pool.query(
                    'INSERT INTO users (clerk_id, full_name, email, role_id) VALUES ($1, $2, $3, 3) RETURNING *',
                    [clerkId, fullName, email]
                );
                localUser = newUser.rows[0];
                console.log(`Created new Clerk-synced user: ${email}`);
            }
        } else {
            localUser = userRes.rows[0];
        }

        // Attach local user details (role, etc) to request
        const roleRes = await pool.query('SELECT name FROM roles WHERE id = $1', [localUser.role_id]);
        
        // Fetch all teams the user belongs to, along with their roles in those teams
        const teamsRes = await pool.query(`
            SELECT ut.team_id, r.name as role_name 
            FROM user_teams ut
            JOIN roles r ON ut.role_id = r.id
            WHERE ut.user_id = $1
        `, [localUser.id]);

        req.user = {
            ...localUser,
            role_name: roleRes.rows[0]?.name,
            teams: teamsRes.rows // Array of { team_id, role_name }
        };
        
        next();
    } catch (err) {
        console.error('Auth Error:', err);
        res.status(401).json({ message: 'Authentication failed' });
    }
};

export const requireRole = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        if (!roles.includes(req.user.role_name)) {
            res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
            return;
        }
        next();
    };
};
