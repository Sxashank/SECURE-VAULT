import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_development';

export const generateToken = (payload: object) => {
    return jwt.sign(payload, SECRET, { expiresIn: '8h' });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, SECRET);
};
