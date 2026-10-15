
import { getDb } from '../config/database.js';

const VALID_ROLES = [
  'CITIZEN',
  'AUTHORITY',
  'INVESTIGATOR',
  'VERIFIER',
  'ADMIN'
];

export async function listUsers(req, res) {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );
    const offset = (page - 1) * limit;
    const { role, search } = req.query;

    const whereParts = [];
    const params = [];

    if (role) {
      const normalizedRole = role.toUpperCase();

      if (!VALID_ROLES.includes(normalizedRole)) {
        return res.status(400).json({ error: 'Invalid role filter' });
      }

      whereParts.push('role = ?');
      params.push(normalizedRole);
    }

    if (search) {
      whereParts.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(' AND ')}`
      : '';

    const total = await db.get(
      `SELECT COUNT(*) AS cnt FROM users ${whereClause}`,
      params
    );

    const users = await db.all(
      `SELECT id, name, email, phone, role, department,
              badge_number, is_active, created_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      users,
      pagination: {
        total: total.cnt,
        page,
        limit,
        pages: Math.ceil(total.cnt / limit)
      }
    });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function listOfficers(req, res) {
  try {
    const db = getDb();

    const officers = await db.all(
      `SELECT id, name, email, department, badge_number, role
       FROM users
       WHERE role IN ('AUTHORITY', 'INVESTIGATOR')
         AND is_active = 1
       ORDER BY name`
    );

    return res.json({ officers });
  } catch (err) {
    console.error('Failed to fetch officers:', err);
    return res.status(500).json({ error: 'Failed to fetch officers' });
  }
}

export async function toggleUserStatus(req, res) {
  const db = getDb();
  let transactionStarted = false;

  try {
    await db.exec('BEGIN IMMEDIATE');
    transactionStarted = true;

    const user = await db.get(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      req.params.id
    );

    if (!user) {
      await db.exec('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'User not found' });
    }

    const newStatus = user.is_active ? 0 : 1;

    if (newStatus === 0 && user.role === 'ADMIN') {
      const activeAdmins = await db.get(
        `SELECT COUNT(*) AS count
         FROM users
         WHERE role = 'ADMIN' AND is_active = 1`
      );

      if (activeAdmins.count <= 1) {
        await db.exec('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          error: 'Cannot deactivate the last active Admin account'
        });
      }
    }

    await db.run(
      'UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?',
      [newStatus, new Date().toISOString(), user.id]
    );

    await db.exec('COMMIT');
    transactionStarted = false;

    return res.json({
      message: `User ${newStatus ? 'activated' : 'deactivated'}`,
      is_active: newStatus === 1
    });
  } catch (err) {
    if (transactionStarted) {
      try {
        await db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    console.error('Failed to update user status:', err);
    return res.status(500).json({
      error: 'Failed to update user status'
    });
  }
}

export async function updateUserRole(req, res) {
  const requestedRole = req.body?.role;

  if (typeof requestedRole !== 'string') {
    return res.status(400).json({ error: 'A valid role is required' });
  }

  const role = requestedRole.toUpperCase();

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const db = getDb();
  let transactionStarted = false;

  try {
    await db.exec('BEGIN IMMEDIATE');
    transactionStarted = true;

    const user = await db.get(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      req.params.id
    );

    if (!user) {
      await db.exec('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'ADMIN' && role !== 'ADMIN' && user.is_active) {
      const activeAdmins = await db.get(
        `SELECT COUNT(*) AS count
         FROM users
         WHERE role = 'ADMIN' AND is_active = 1`
      );

      if (activeAdmins.count <= 1) {
        await db.exec('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          error: 'Cannot demote the last active Admin account'
        });
      }
    }

    await db.run(
      'UPDATE users SET role = ?, updated_at = ? WHERE id = ?',
      [role, new Date().toISOString(), user.id]
    );

    await db.exec('COMMIT');
    transactionStarted = false;

    return res.json({ message: 'Role updated successfully' });
  } catch (err) {
    if (transactionStarted) {
      try {
        await db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    console.error('Failed to update user role:', err);
    return res.status(500).json({ error: 'Failed to update role' });
  }
}

