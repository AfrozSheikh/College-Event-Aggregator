const pool = require('../config/db');

// Streams a file stored as a BLOB in the database back to the client
const sendStoredFile = (res, rows) => {
    if (rows.length === 0) {
        return res.status(404).json({ error: 'File not found' });
    }

    const file = rows[0];
    const fileName = (file.file_name || 'file').replace(/"/g, '');

    res.set({
        'Content-Type': file.mime_type,
        'Content-Length': file.file_data.length,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=86400'
    });
    res.send(file.file_data);
};

const fileController = {
    // Event gallery image
    getGalleryImage: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT file_name, mime_type, file_data FROM event_gallery WHERE id = ?',
                [req.params.id]
            );
            sendStoredFile(res, rows);
        } catch (error) {
            console.error('Get gallery image error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Event payment QR code
    getEventPaymentQr: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT file_name, mime_type, file_data FROM event_payment_qr WHERE event_id = ?',
                [req.params.eventId]
            );
            sendStoredFile(res, rows);
        } catch (error) {
            console.error('Get payment QR error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Participation file (payment screenshot / document)
    getParticipationFile: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT file_name, mime_type, file_data FROM participation_files WHERE id = ?',
                [req.params.id]
            );
            sendStoredFile(res, rows);
        } catch (error) {
            console.error('Get participation file error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Generated PDF report
    getReport: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT file_name, mime_type, file_data FROM event_reports WHERE id = ?',
                [req.params.id]
            );
            sendStoredFile(res, rows);
        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = fileController;
