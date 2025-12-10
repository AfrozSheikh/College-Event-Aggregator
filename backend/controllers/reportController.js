const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const reportController = {
    // Generate PDF report for event
    generateEventReport: async (req, res) => {
        try {
            const { eventId } = req.params;
            
            // Get event details
            const [events] = await pool.query(`
                SELECT e.*, u.name as organizer_name 
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
                WHERE e.id = ?
            `, [eventId]);
            
            if (events.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            const event = events[0];
            
            // Get participations
            const [participations] = await pool.query(
                `SELECT p.*, u.name as student_name 
                 FROM participations p 
                 LEFT JOIN users u ON p.student_id = u.id 
                 WHERE p.event_id = ?`,
                [eventId]
            );
            
            // Get feedback
            const [feedback] = await pool.query(
                `SELECT f.*, u.name as student_name 
                 FROM feedback f 
                 LEFT JOIN users u ON f.student_id = u.id 
                 WHERE f.event_id = ?`,
                [eventId]
            );
            
            // Get images
            const [images] = await pool.query(
                'SELECT * FROM event_gallery WHERE event_id = ?',
                [eventId]
            );
            
            // Calculate feedback stats
            const avgRating = feedback.length > 0 
                ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
                : 0;
            
            // Create PDF
            const doc = new PDFDocument({ margin: 50 });
            const filename = `event-report-${eventId}-${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../uploads/reports', filename);
            
            // Ensure directory exists
            if (!fs.existsSync(path.dirname(filepath))) {
                fs.mkdirSync(path.dirname(filepath), { recursive: true });
            }
            
            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);
            
            // Title
            doc.fontSize(24).text('Event Report', { align: 'center' });
            doc.moveDown();
            
            // Event Details
            doc.fontSize(18).text('Event Details', { underline: true });
            doc.moveDown();
            
            doc.fontSize(12)
                .text(`Title: ${event.title}`)
                .text(`Date: ${new Date(event.event_date).toLocaleDateString()}`)
                .text(`Time: ${event.event_time}`)
                .text(`Location: ${event.location}`)
                .text(`Category: ${event.category}`)
                .text(`Organizer: ${event.organizer_name || event.organized_by}`)
                .text(`Max Participants: ${event.max_participants || 'Unlimited'}`)
                .text(`Registration Fees: ₹${event.registration_fees || 0}`);
            
            doc.moveDown();
            
            // Description
            doc.fontSize(14).text('Description:', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).text(event.description || 'No description provided.');
            
            doc.moveDown();
            
            // Participation Statistics
            doc.fontSize(18).text('Participation Statistics', { underline: true });
            doc.moveDown();
            
            doc.fontSize(12)
                .text(`Total Registrations: ${participations.length}`)
                .text(`Total Feedback Received: ${feedback.length}`)
                .text(`Average Rating: ${avgRating.toFixed(1)}/5.0`);
            
            doc.moveDown();
            
            // Participants List
            if (participations.length > 0) {
                doc.fontSize(16).text('Participants List:', { underline: true });
                doc.moveDown();
                
                participations.forEach((participation, index) => {
                    doc.fontSize(10)
                        .text(`${index + 1}. ${participation.name} - ${participation.college} (${participation.course_year})`)
                        .text(`   Email: ${participation.email}, Phone: ${participation.phone || 'N/A'}`);
                    doc.moveDown(0.5);
                });
            }
            
            // Feedback Summary
            if (feedback.length > 0) {
                doc.addPage();
                doc.fontSize(18).text('Feedback Summary', { align: 'center', underline: true });
                doc.moveDown();
                
                feedback.forEach((fb, index) => {
                    doc.fontSize(12).text(`Feedback ${index + 1}:`);
                    doc.fontSize(10)
                        .text(`   Student: ${fb.student_name}`)
                        .text(`   Rating: ${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)} (${fb.rating}/5)`)
                        .text(`   Comment: ${fb.comment || 'No comment'}`);
                    
                    if (fb.suggestions) {
                        doc.text(`   Suggestions: ${fb.suggestions}`);
                    }
                    
                    doc.moveDown();
                });
            }
            
            doc.end();
            
            writeStream.on('finish', () => {
                res.json({
                    message: 'Report generated successfully',
                    downloadUrl: `/uploads/reports/${filename}`
                });
            });
            
        } catch (error) {
            console.error('Generate report error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = reportController;