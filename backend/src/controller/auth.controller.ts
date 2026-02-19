import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { hashPassword, createToken, verifyPassword } from "../auth.js";
import { prisma } from "../prisma";
import { AppError } from "../utils/AppError.js";

export const register = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[register] Request received, body keys:', Object.keys(req.body));
    const { username, password, age, gender } = req.body;
    console.log('[register] Parsed:', { username, age, gender, passwordLength: password?.length });
      
    if (!username || !password || age === undefined || !gender) {
        console.log('[register] Validation failed: missing required fields');
        throw new AppError(400, 'username, password, age, and gender are required');
    }

    if (!Object.values(Role).includes(gender)) {
        console.log('[register] Validation failed: invalid gender', gender);
        throw new AppError(400, 'gender must be Male, Female, or Other');
    }
      
    const hashed = hashPassword(password);
    console.log('[register] Creating user...');
      
    try {
        const user = await prisma.user.create({
            data: {
                username,
                password: hashed,
                age: parseInt(String(age)),
                gender,
            },
            select: { id: true, username: true, age: true, gender: true },
        });
        const token = createToken(user);
        console.log('[register] Success: userId', user.id, 'username', user.username);
        res.json({ token, user });
    } catch (err: unknown) {
        console.log('[register] Error:', (err as Error).message);
        next(err);
    }
      
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[login] Request received, username:', req.body?.username);
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('[login] Validation failed: username/password required');
      throw new AppError(400, 'username and password are required');
    }
  
    try {
        console.log('[login] Looking up user...');
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !verifyPassword(password, user.password)) {
            console.log('[login] Invalid credentials for:', username);
            throw new AppError(401, 'Invalid credentials');
        }
  
        const token = createToken(user);
        console.log('[login] Success: userId', user.id, 'username', user.username);
        res.json({ token, user });
    } catch (err: unknown) {
        console.log('[login] Error:', (err as Error).message);
        next(err);
    }
}
