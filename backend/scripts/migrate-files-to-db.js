/*
 * One-time migration: moves files that were saved under backend/uploads/
 * into the database (schema v3.0) and drops the old path columns.
 *
 * Usage (from the backend folder):  node scripts/migrate-files-to-db.js
 *
 * Safe to run more than once - steps that are already done are skipped.
 * Old PDF reports are not migrated; they are regenerated on demand.
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const BACKEND_DIR = path.join(__dirname, '..');

const MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

const readStoredFile = (storedPath) => {
    const fullPath = path.join(BACKEND_DIR, storedPath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`   ⚠️  Missing file, skipped: ${storedPath}`);
        return null;
    }
    const ext = path.extname(fullPath).toLowerCase();
    return {
        name: path.basename(fullPath),
        mime: MIME_TYPES[ext] || 'application/octet-stream',
        data: fs.readFileSync(fullPath)
    };
};

const columnExists = async (table, column) => {
    const [rows] = await pool.query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows.length > 0;
};

const createNewTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS event_payment_qr (
            event_id INT PRIMARY KEY,
            file_name VARCHAR(255),
            mime_type VARCHAR(100) NOT NULL,
            file_data MEDIUMBLOB NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )`);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS event_reports (
            id INT PRIMARY KEY AUTO_INCREMENT,
            event_id INT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
            file_data LONGBLOB NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            INDEX idx_event_reports (event_id)
        )`);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS participation_files (
            id INT PRIMARY KEY AUTO_INCREMENT,
            participation_id INT NOT NULL,
            file_type ENUM('document', 'payment_screenshot') NOT NULL,
            file_name VARCHAR(255),
            mime_type VARCHAR(100) NOT NULL,
            file_data LONGBLOB NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (participation_id) REFERENCES participations(id) ON DELETE CASCADE,
            UNIQUE KEY unique_participation_file (participation_id, file_type)
        )`);
    console.log('✅ New tables ready');
};

const migrateGallery = async () => {
    if (!(await columnExists('event_gallery', 'image_path'))) {
        console.log('⏭️  event_gallery already migrated');
        return;
    }

    if (!(await columnExists('event_gallery', 'file_data'))) {
        await pool.query(`
            ALTER TABLE event_gallery
                ADD COLUMN file_name VARCHAR(255) AFTER event_id,
                ADD COLUMN mime_type VARCHAR(100) AFTER file_name,
                ADD COLUMN file_data LONGBLOB AFTER mime_type`);
    }

    const [rows] = await pool.query('SELECT id, image_path FROM event_gallery WHERE file_data IS NULL');
    for (const row of rows) {
        const file = readStoredFile(row.image_path);
        if (file) {
            await pool.query(
                'UPDATE event_gallery SET file_name = ?, mime_type = ?, file_data = ? WHERE id = ?',
                [file.name, file.mime, file.data, row.id]
            );
        } else {
            await pool.query('DELETE FROM event_gallery WHERE id = ?', [row.id]);
        }
    }

    await pool.query(`
        ALTER TABLE event_gallery
            DROP COLUMN image_path,
            MODIFY mime_type VARCHAR(100) NOT NULL,
            MODIFY file_data LONGBLOB NOT NULL`);
    console.log(`✅ event_gallery: ${rows.length} image(s) moved into the database`);
};

const migratePaymentQr = async () => {
    if (!(await columnExists('events', 'payment_qr_code'))) {
        console.log('⏭️  events.payment_qr_code already migrated');
        return;
    }

    const [rows] = await pool.query('SELECT id, payment_qr_code FROM events WHERE payment_qr_code IS NOT NULL');
    for (const row of rows) {
        const file = readStoredFile(row.payment_qr_code);
        if (file) {
            await pool.query(
                `INSERT IGNORE INTO event_payment_qr (event_id, file_name, mime_type, file_data) VALUES (?, ?, ?, ?)`,
                [row.id, file.name, file.mime, file.data]
            );
        }
    }

    await pool.query('ALTER TABLE events DROP COLUMN payment_qr_code');
    console.log(`✅ events: ${rows.length} payment QR code(s) moved into the database`);
};

const migrateDocuments = async () => {
    if (!(await columnExists('participations', 'document_path'))) {
        console.log('⏭️  participations.document_path already migrated');
        return;
    }

    const [rows] = await pool.query('SELECT id, document_path FROM participations WHERE document_path IS NOT NULL');
    for (const row of rows) {
        const file = readStoredFile(row.document_path);
        if (file) {
            await pool.query(
                `INSERT IGNORE INTO participation_files (participation_id, file_type, file_name, mime_type, file_data)
                 VALUES (?, 'document', ?, ?, ?)`,
                [row.id, file.name, file.mime, file.data]
            );
        }
    }

    await pool.query('ALTER TABLE participations DROP COLUMN document_path');
    console.log(`✅ participations: ${rows.length} document(s) moved into the database`);
};

(async () => {
    try {
        await createNewTables();
        await migrateGallery();
        await migratePaymentQr();
        await migrateDocuments();
        console.log('\n🎉 Migration complete. The backend/uploads folder is no longer used and can be deleted.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
