import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { generateToken } from '../utils/jwt';
import { logAction } from '../utils/audit';
import { AuthRequest } from '../middlewares/authMiddleware';

export const signup = async (req: Request, res: Response): Promise<void> => {
    const { email, password, roleName, fullName, teamCode, teamName, departmentName } = req.body;

    if (!fullName) {
        res.status(400).json({ message: 'Full name is required' });
        return;
    }

    try {
        const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName || 'USER']);
        if (roleRes.rows.length === 0) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }
        const roleId = roleRes.rows[0].id;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Fetch Department ID
        let deptId = null;
        if (departmentName) {
            const deptRes = await pool.query('SELECT id FROM departments WHERE name = $1', [departmentName]);
            if (deptRes.rows.length > 0) deptId = deptRes.rows[0].id;
        }

        let finalTeamId = null;
        if (roleName === 'MANAGER') {
            if (!teamName || !teamCode) {
                res.status(400).json({ message: 'Managers must provide a Team Name and Team Code to create their network.' });
                return;
            }
            try {
                const newTeam = await pool.query(
                    'INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id',
                    [teamName, teamCode]
                );
                finalTeamId = newTeam.rows[0].id;
            } catch (err: any) {
                if (err.code === '23505') { // Unique violation for invite_code
                     res.status(409).json({ message: 'Team Code already in use. Please create a unique one.' });
                     return;
                }
                throw err;
            }
        } else if (teamCode) {
            const teamRes = await pool.query('SELECT id FROM teams WHERE invite_code = $1', [teamCode]);
            if (teamRes.rows.length > 0) {
                finalTeamId = teamRes.rows[0].id;
            } else {
                res.status(404).json({ message: 'Invalid Team Join Code' });
                return;
            }
        }

        const userRes = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role_id, team_id, department_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [fullName, email, passwordHash, roleId, finalTeamId, deptId]
        );

        const userId = userRes.rows[0].id;
        await logAction(userId, 'SIGNUP_SUCCESS', null, req.ip || 'unknown');

        res.status(201).json({ message: 'User created successfully', userId });
    } catch (err: any) {
        if (err.code === '23505') {
            await logAction(null, 'SIGNUP_FAILED_DUPLICATE', null, req.ip || 'unknown');
            res.status(409).json({ message: 'Email already exists. Please log in.' });
            return;
        }
        console.error(err);
        await logAction(null, 'SIGNUP_FAILED', null, req.ip || 'unknown');
        res.status(500).json({ message: 'Error creating user' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const userRes = await pool.query(
            'SELECT users.id, users.password_hash, users.full_name, users.team_id, roles.name as role_name, roles.id as role_id FROM users JOIN roles ON users.role_id = roles.id WHERE email = $1',
            [email]
        );

        if (userRes.rows.length === 0) {
            await logAction(null, 'LOGIN_FAILED_NO_USER', null, req.ip || 'unknown');
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            await logAction(user.id, 'LOGIN_FAILED_BAD_PASSWORD', null, req.ip || 'unknown');
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const token = generateToken({ 
            id: user.id, 
            email, 
            role_name: user.role_name, 
            role_id: user.role_id,
            team_id: user.team_id,
            full_name: user.full_name
        });
        await logAction(user.id, 'LOGIN_SUCCESS', null, req.ip || 'unknown');

        res.json({ 
            token, 
            role: user.role_name, 
            userId: user.id, 
            teamId: user.team_id, 
            fullName: user.full_name 
        });
    } catch (err) {
        console.error(err);
        await logAction(null, 'LOGIN_ERROR', null, req.ip || 'unknown');
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const joinTeam = async (req: AuthRequest, res: Response): Promise<void> => {
    const { teamCode } = req.body;
    const userId = req.user?.id;

    try {
        const teamRes = await pool.query('SELECT id, name FROM teams WHERE invite_code = $1', [teamCode]);
        if (teamRes.rows.length === 0) { 
            res.status(404).json({ message: 'Invalid team code' }); 
            return; 
        }
        
        await pool.query('UPDATE users SET team_id = $1 WHERE id = $2', [teamRes.rows[0].id, userId]);
        await logAction(userId, 'JOINED_TEAM', `team_${teamRes.rows[0].id}`, req.ip || 'unknown');
        
        const userRes = await pool.query('SELECT users.id, users.email, users.full_name, users.team_id, roles.name as role_name, roles.id as role_id FROM users JOIN roles ON users.role_id = roles.id WHERE users.id = $1', [userId]);
        const user = userRes.rows[0];
        
        const token = generateToken({ 
            id: user.id, 
            email: user.email, 
            role_name: user.role_name, 
            role_id: user.role_id, 
            team_id: user.team_id, 
            full_name: user.full_name 
        });
        
        res.json({ message: 'Joined team successfully', token, teamName: teamRes.rows[0].name });
    } catch(err) { 
        res.status(500).json({message: 'Server error'}); 
    }
};
