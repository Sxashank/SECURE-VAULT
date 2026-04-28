import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    console.error("CRITICAL SECURITY ERROR: JWT_SECRET is not defined in environment variables. Refusing to start with insecure fallback.");
    process.exit(1);
}

export const generateToken = (payload: object) => {
    return jwt.sign(payload, SECRET, { expiresIn: '8h' });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, SECRET);
};
