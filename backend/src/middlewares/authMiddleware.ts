import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { pool } from '../db';

export interface AuthRequest extends Request {
    auth?: any;
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    console.log('AUTH CHECK:', req.method, req.url);
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
                console.log(`Linked existing user ${email} (Role ID: ${localUser.role_id}) to Clerk ID ${clerkId}`);
            } else {
                // Create new user
                // Check if they should be ADMIN based on email or if they are the first user
                const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
                const isFirstUser = parseInt(userCountRes.rows[0].count) === 0;
                const isAdminEmail = email === process.env.INITIAL_ADMIN_EMAIL;
                
                const roleId = (isFirstUser || isAdminEmail) ? 1 : 3; // 1 = ADMIN, 3 = USER

                const newUser = await pool.query(
                    'INSERT INTO users (clerk_id, full_name, email, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
                    [clerkId, fullName, email, roleId]
                );
                localUser = newUser.rows[0];
                console.log(`Created new Clerk-synced user: ${email} with Role ID: ${roleId}`);
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
