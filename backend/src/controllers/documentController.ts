import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import { logAction } from '../utils/audit';

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, encrypted_path, category, scope_type, assigned_users } = req.body;
    const userId = req.user?.id;
    const teamId = req.body.team_id || (req.user?.teams && req.user.teams.length > 0 ? req.user.teams[0].team_id : null);

    if (!userId) {
        res.status(401).json({ message: 'Authenticated user was not found locally' });
        return;
    }

    if (!title || !encrypted_path) {
        res.status(400).json({ message: 'Title and path are required' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch User's Department safely coercing to null
        const userRes = await client.query('SELECT department_id FROM users WHERE id = $1', [userId]);
        const deptId = userRes.rows[0]?.department_id || null;

        const isPublicTeam = scope_type === 'TEAM' && !!teamId;
        const isPublicDept = scope_type === 'DEPARTMENT' && !!deptId;

        // 1. Insert Core Document
        const docRes = await client.query(
            `INSERT INTO documents 
            (title, category, team_id, department_id, uploaded_by, is_public_to_team, is_public_to_department) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [title, category || 'Uncategorized', teamId, deptId, userId, isPublicTeam, isPublicDept]
        );
        const documentId = docRes.rows[0].id;

        // 2. Insert Version 1
        await client.query(
            `INSERT INTO document_versions 
            (document_id, version_number, encrypted_path, content, uploaded_by) 
            VALUES ($1, $2, $3, $4, $5)`,
            [documentId, 1, encrypted_path, req.body.content || '', userId]
        );

        // 3. Document Permissions Mapping
        if (scope_type === 'SPECIFIC' && Array.isArray(assigned_users) && assigned_users.length > 0) {
            for (const assigned of assigned_users) {
                if (assigned.id && assigned.access) {
                    await client.query(
                        'INSERT INTO document_permissions (document_id, user_id, access_type) VALUES ($1, $2, $3)',
                        [documentId, assigned.id, assigned.access]
                    );
                }
            }
        }
        
        // Ensure uploader always has full access
        await client.query(
            'INSERT INTO document_permissions (document_id, user_id, access_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [documentId, userId, 'DELETE']
        );

        await logAction(userId, 'DOC_UPLOAD_V2', `doc_${documentId}`, req.ip || 'unknown');
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Document uploaded and securely mapped', documentId });
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error("UPLOAD ERROR:", err.message);
        await logAction(userId, 'DOC_UPLOAD_FAILED', null, req.ip || 'unknown');
        res.status(500).json({ message: 'Error uploading document', error: err.message });
    } finally {
        client.release();
    }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const roleName = req.user?.role_name;

    try {
        const userRes = await pool.query('SELECT department_id FROM users WHERE id = $1', [userId]);
        const deptId = userRes.rows[0]?.department_id;

        let query = `
            SELECT d.id, d.title, d.category, d.is_public_to_team, d.is_public_to_department, d.created_at, u.full_name as uploader
            FROM documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
        `;
        let values: any[] = [];

        if (roleName !== 'ADMIN') {
            const teamIds = req.user?.teams?.map((t: any) => t.team_id) || [];
            
            query += `
                WHERE d.uploaded_by = $1
                   OR (d.is_public_to_team = true AND d.team_id = ANY($2::int[]))
                   OR (d.is_public_to_department = true AND d.department_id = $3)
                   OR EXISTS (
                       SELECT 1 FROM document_permissions dp 
                       WHERE dp.document_id = d.id AND dp.user_id = $1
                   )
            `;
            values = [userId, teamIds, deptId];
        }

        query += ' ORDER BY d.created_at DESC';

        const docsRes = await pool.query(query, values);
        
        await logAction(userId, 'DOC_LIST_VIEW_V2', null, req.ip || 'unknown');
        
        res.json({ documents: docsRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching documents' });
    }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    const documentId = req.params.id;
    const userId = req.user?.id;
    const roleName = req.user?.role_name;

    try {
        // Validation: Must be ADMIN, the UPLOADER, or have DELETE permission, or be a TEAM MANAGER
        if (roleName !== 'ADMIN') {
            const checkRes = await pool.query(`
                SELECT uploaded_by, team_id FROM documents WHERE id = $1
            `, [documentId]);
            
            if (checkRes.rows.length === 0) {
                res.status(404).json({ message: 'Document not found' });
                return;
            }

            const docTeamId = checkRes.rows[0].team_id;
            const userTeamRole = req.user?.teams?.find((t: any) => t.team_id === docTeamId)?.role_name;
            const isTeamManager = userTeamRole === 'MANAGER' || userTeamRole === 'ADMIN';
            const isUploader = checkRes.rows[0].uploaded_by === userId;
            
            if (!isUploader && !isTeamManager) {
                const permRes = await pool.query(`
                    SELECT 1 FROM document_permissions 
                    WHERE document_id = $1 AND user_id = $2 AND access_type = 'DELETE'
                `, [documentId, userId]);
                
                if (permRes.rows.length === 0) {
                    res.status(403).json({ message: 'Forbidden' });
                    return;
                }
            }
        }

        await pool.query('DELETE FROM documents WHERE id = $1', [documentId]);
        await logAction(userId, 'DOC_DELETE', `doc_${documentId}`, req.ip || 'unknown');
        
        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error("DELETE ERROR:", err);
        res.status(500).json({ message: 'Error deleting document' });
    }
};

export const getDocumentContent = async (req: AuthRequest, res: Response): Promise<void> => {
    const documentId = req.params.id;
    const userId = req.user?.id || null;
    try {
        const docRes = await pool.query('SELECT uploaded_by FROM documents WHERE id = $1', [documentId]);
        if (docRes.rows.length === 0) { res.status(404).json({ message: 'Not found' }); return; }
        
        const verRes = await pool.query('SELECT content, version_number FROM document_versions WHERE document_id = $1 ORDER BY version_number DESC LIMIT 1', [documentId]);
        
        await logAction(userId, 'DOC_VIEW', `doc_${documentId}`, req.ip || 'unknown');
        
        let access = 'READ';
        if (docRes.rows[0].uploaded_by === userId || req.user?.role_name === 'ADMIN') {
            access = 'OWNER';
        } else {
            const pRes = await pool.query("SELECT access_type FROM document_permissions WHERE document_id = $1 AND user_id = $2 AND access_type IN ('WRITE', 'DELETE')", [documentId, userId]);
            if (pRes.rows.length > 0) access = 'WRITE';
        }

        res.json({ content: verRes.rows[0]?.content || '', version: verRes.rows[0]?.version_number || 1, access, uploaderId: docRes.rows[0].uploaded_by });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching content' });
    }
};

export const commitDocumentVersion = async (req: AuthRequest, res: Response): Promise<void> => {
    const documentId = req.params.id;
    const { content, commit_message } = req.body;
    const userId = req.user?.id || null;
    try {
        const docRes = await pool.query('SELECT uploaded_by FROM documents WHERE id = $1', [documentId]);
        if (docRes.rows.length === 0) { res.status(404).json({ message: 'Not found' }); return; }
        
        if (docRes.rows[0].uploaded_by !== userId && req.user?.role_name !== 'ADMIN') {
            const pRes = await pool.query("SELECT 1 FROM document_permissions WHERE document_id = $1 AND user_id = $2 AND access_type IN ('WRITE', 'DELETE')", [documentId, userId]);
            if (pRes.rows.length === 0) { res.status(403).json({ message: 'Forbidden' }); return; }
        }

        const verRes = await pool.query('SELECT MAX(version_number) as max_v FROM document_versions WHERE document_id = $1', [documentId]);
        const nextV = (verRes.rows[0].max_v || 0) + 1;

        await pool.query(
            `INSERT INTO document_versions (document_id, version_number, encrypted_path, content, commit_message, uploaded_by) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [documentId, nextV, `vault/v${nextV}_${Date.now()}.enc`, content, commit_message || 'Update file', userId]
        );

        await logAction(userId, 'DOC_EDIT', `doc_${documentId}`, req.ip || 'unknown');
        
        res.json({ message: 'Version committed', version: nextV });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error committing version' });
    }
};

export const getDocumentLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    const documentId = req.params.id;
    const userId = req.user?.id || null;
    try {
        const docRes = await pool.query('SELECT uploaded_by FROM documents WHERE id = $1', [documentId]);
        if (docRes.rows.length === 0) { res.status(404).json({ message: 'Not found' }); return; }
        if (docRes.rows[0].uploaded_by !== userId && req.user?.role_name !== 'ADMIN') {
            res.status(403).json({ message: 'Only uploader or admin can view logs' }); return;
        }

        const logsRes = await pool.query(`
            SELECT a.action, a.timestamp, u.full_name, u.email 
            FROM audit_logs a
            JOIN users u ON a.user_id = u.id
            WHERE a.resource_id = $1
            ORDER BY a.timestamp DESC
        `, [`doc_${documentId}`]);
        
        res.json({ logs: logsRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching logs' });
    }
};
