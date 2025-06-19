import { query } from "../config/database.js";
import bcrypt from "bcryptjs";

export class User {
  static async create(userData) {
    const { name, email, password, role, post, department } = userData;
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, post, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, post, department, join_date, created_at`,
      [name, email, passwordHash, role, post, department],
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      `SELECT * FROM users WHERE email = $1 AND is_active = true`,
      [email],
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT id, name, email, role, post, department, avatar_url, join_date, last_login, created_at
       FROM users WHERE id = $1 AND is_active = true`,
      [id],
    );
    return result.rows[0];
  }

  static async updateProfile(id, updates) {
    const { name, post, department, avatar_url } = updates;
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($2, name),
           post = COALESCE($3, post),
           department = COALESCE($4, department),
           avatar_url = COALESCE($5, avatar_url)
       WHERE id = $1
       RETURNING id, name, email, role, post, department, avatar_url, join_date`,
      [id, name, post, department, avatar_url],
    );
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    await query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [id],
    );
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async changePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [
      id,
      passwordHash,
    ]);
  }

  static async findAll(role = null) {
    let queryText = `
      SELECT id, name, email, role, post, department, avatar_url, join_date, last_login, is_active
      FROM users
    `;
    let params = [];

    if (role) {
      queryText += ` WHERE role = $1`;
      params = [role];
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, params);
    return result.rows;
  }

  static async deactivate(id) {
    await query(`UPDATE users SET is_active = false WHERE id = $1`, [id]);
  }
}
