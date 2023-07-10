import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import generateToken from '../utils/jwtGenerator';
import db from '../db';

export async function register(req: Request, res: Response) {
    try {
        const { 
            name_first, 
            email, 
            password, 
            birth_date, 
            gender 
        } = req.body;
    
        // Check if the user exists in the database.
        const existingUser = await db.query(`
            SELECT * 
            FROM Users
            WHERE email = $1;
        `, [email]);
    
        // If user already exists, return error.
        if (existingUser.rows.length !== 0) {
            return res
            .status(401)
            .send({ message: `User with the email ${email} already exists.`});
        }
    
        // The user does not exist, so we proceed to create a new user.
    
        // The salt pretty much determines how encrypted we want our password to be.
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
    
        // Encrypt the password with the salt.
        const passwordHash = await bcrypt.hash(password, salt);
    
        // Enter the new user into the database, storing the encrypted password.
    
        const resultUser = await db.query(`
            INSERT INTO Users (name_first, email, password, gender, birth_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [name_first, email, passwordHash, gender, birth_date]);
    
        const newUser = resultUser.rows[0];
    
        // Generate our JWT token and return it to the user's client.
        const token = generateToken(newUser.user_id, newUser.email);
        res.json({ token });

    } catch (error) {
        res.status(500).send({ 
            message: error 
        });
    }
}

export async function login(req: Request, res: Response) {

}

/**
 * STATUS CODES:
 * 401 - Means user is 'Unauthenticated'.
 * 403 - Means user is 'Unauthorized'.
 */