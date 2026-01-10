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
                SELECT e.*, u.name as organizer_name, u.department as organizer_department
                FROM events e 
                LEFT JOIN users u ON e.created_by = u.id 
                WHERE e.id = ?
            `, [eventId]);
            
            if (events.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            const event = events[0];
            
            // Get participations with full student details
            const [participations] = await pool.query(
                `SELECT p.*, u.name as student_name, u.email as student_email, 
                        u.phone as student_phone, u.department as student_department,
                        u.college_name, u.course, u.year
                 FROM participations p 
                 LEFT JOIN users u ON p.student_id = u.id 
                 WHERE p.event_id = ?
                 ORDER BY p.registered_at DESC`,
                [eventId]
            );
            
            // Get legacy feedback
            const [oldFeedback] = await pool.query(
                `SELECT f.*, u.name as student_name 
                 FROM feedback f 
                 LEFT JOIN users u ON f.student_id = u.id 
                 WHERE f.event_id = ?`,
                [eventId]
            );
            
            // Get new dynamic feedback responses
            const [feedbackForm] = await pool.query(
                `SELECT * FROM feedback_forms WHERE event_id = ?`,
                [eventId]
            );
            
            let dynamicFeedback = [];
            if (feedbackForm.length > 0) {
                const formId = feedbackForm[0].id;
                
                // Get questions
                const [questions] = await pool.query(
                    `SELECT * FROM feedback_questions WHERE form_id = ? ORDER BY order_index ASC`,
                    [formId]
                );
                
                // Get responses
                const [responses] = await pool.query(
                    `SELECT fr.*, u.name as student_name, u.email as student_email
                     FROM feedback_responses fr
                     LEFT JOIN users u ON fr.student_id = u.id
                     WHERE fr.form_id = ?
                     ORDER BY fr.submitted_at DESC`,
                    [formId]
                );
                
                // Get answers for each response
                for (let response of responses) {
                    const [answers] = await pool.query(
                        `SELECT fa.*, fq.question_text, fq.question_type
                         FROM feedback_answers fa
                         LEFT JOIN feedback_questions fq ON fa.question_id = fq.id
                         WHERE fa.response_id = ?
                         ORDER BY fq.order_index ASC`,
                        [response.id]
                    );
                    response.answers = answers;
                }
                
                dynamicFeedback = responses;
            }
            
            // Get images
            const [images] = await pool.query(
                'SELECT * FROM event_gallery WHERE event_id = ?',
                [eventId]
            );
            
            // Calculate legacy feedback stats
            const avgRating = oldFeedback.length > 0 
                ? oldFeedback.reduce((sum, item) => sum + item.rating, 0) / oldFeedback.length
                : 0;
            
            // Create PDF
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const filename = `event-report-${eventId}-${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../uploads/reports', filename);
            
            // Ensure directory exists
            if (!fs.existsSync(path.dirname(filepath))) {
                fs.mkdirSync(path.dirname(filepath), { recursive: true });
            }
            
            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);
            
            // ===== TITLE PAGE =====
            doc.fontSize(28).fillColor('#2563eb').text('Event Report', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(14).fillColor('#6b7280').text(new Date().toLocaleDateString(), { align: 'center' });
            doc.moveDown(2);
            
            // ===== EVENT DETAILS =====
            doc.fontSize(20).fillColor('#000').text('Event Overview', { underline: true });
            doc.moveDown();
            
            doc.fontSize(12)
                .fillColor('#000')
                .text(`Title: `, { continued: true })
                .fillColor('#1f2937')
                .text(event.title);
            
            doc.fillColor('#000').text(`Date: `, { continued: true })
                .fillColor('#1f2937')
                .text(new Date(event.event_date).toLocaleDateString());
            
            doc.fillColor('#000').text(`Time: `, { continued: true })
                .fillColor('#1f2937')
                .text(event.event_time);
            
            doc.fillColor('#000').text(`Location: `, { continued: true })
                .fillColor('#1f2937')
                .text(event.location);
            
            doc.fillColor('#000').text(`Category: `, { continued: true })
                .fillColor('#1f2937')
                .text(event.category);
            
            doc.fillColor('#000').text(`Organized By: `, { continued: true })
                .fillColor('#1f2937')
                .text(event.organizer_name || event.organized_by);
            
            if (event.organizer_department) {
                doc.fillColor('#000').text(`Department: `, { continued: true })
                    .fillColor('#1f2937')
                    .text(event.organizer_department);
            }
            
            doc.fillColor('#000').text(`Max Participants: `, { continued: true })
                .fillColor('#1f2937')
                .text(event.max_participants || 'Unlimited');
            
            doc.fillColor('#000').text(`Registration Fees: `, { continued: true })
                .fillColor('#1f2937')
                .text(`₹${event.registration_fees || 0}`);
            
            doc.moveDown();
            
            // Description
            doc.fontSize(14).fillColor('#000').text('Description:', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#374151').text(event.description || 'No description provided.', {
                align: 'justify'
            });
            
            doc.moveDown();
            
            // ===== EVENT PHOTOS =====
            if (images.length > 0) {
                doc.addPage();
                doc.fontSize(20).fillColor('#000').text('Event Gallery', { underline: true });
                doc.moveDown();
                
                let imageCount = 0;
                let xPos = 50;
                let yPos = doc.y;
                
                for (let img of images) {
                    const imagePath = path.join(__dirname, '..', img.image_path);
                    
                    try {
                        if (fs.existsSync(imagePath)) {
                            // Add 2 images per row
                            if (imageCount > 0 && imageCount % 2 === 0) {
                                xPos = 50;
                                yPos += 230; // Move to next row
                                
                                // Check if need new page
                                if (yPos > 600) {
                                    doc.addPage();
                                    yPos = 50;
                                }
                            } else if (imageCount > 0) {
                                xPos = 310; // Second image in row
                            }
                            
                            doc.image(imagePath, xPos, yPos, {
                                width: 230,
                                height: 200,
                                fit: [230, 200]
                            });
                            
                            imageCount++;
                        }
                    } catch (imgError) {
                        console.error('Error adding image to PDF:', imgError);
                    }
                }
            }
            
            // ===== PARTICIPATION STATISTICS =====
            doc.addPage();
            doc.fontSize(20).fillColor('#000').text('Participation Statistics', { underline: true });
            doc.moveDown();
            
            doc.fontSize(12)
                .fillColor('#000').text(`Total Registrations: `, { continued: true })
                .fillColor('#059669').fontSize(14).text(participations.length);
            
            doc.fontSize(12).fillColor('#000')
                .text(`Total Feedback Received: `, { continued: true })
                .fillColor('#059669').fontSize(14).text(oldFeedback.length + dynamicFeedback.length);
            
            if (oldFeedback.length > 0) {
                doc.fontSize(12).fillColor('#000')
                    .text(`Average Rating: `, { continued: true })
                    .fillColor('#f59e0b').fontSize(14).text(`${avgRating.toFixed(1)}/5.0`);
            }
            
            doc.moveDown(2);
            
            // ===== PARTICIPANTS LIST =====
            if (participations.length > 0) {
                doc.fontSize(18).fillColor('#000').text('Registered Participants', { underline: true });
                doc.moveDown();
                
                participations.forEach((participation, index) => {
                    // Check if need new page
                    if (doc.y > 650) {
                        doc.addPage();
                    }
                    
                    doc.fontSize(11).fillColor('#1f2937')
                        .text(`${index + 1}. ${participation.name}`, { bold: true });
                    
                    doc.fontSize(9).fillColor('#6b7280')
                        .text(`   Email: ${participation.email}`)
                        .text(`   Phone: ${participation.phone || 'N/A'}`)
                        .text(`   College: ${participation.college || participation.college_name || 'N/A'}`)
                        .text(`   Course/Year: ${participation.course_year || `${participation.course} - ${participation.year}` || 'N/A'}`);
                    
                    if (participation.student_department) {
                        doc.text(`   Department: ${participation.student_department}`);
                    }
                    
                    if (participation.team_members) {
                        doc.text(`   Team Members: ${participation.team_members}`);
                    }
                    
                    doc.text(`   Registered: ${new Date(participation.registered_at).toLocaleString()}`);
                    doc.moveDown(0.5);
                });
            }
            
            // ===== FEEDBACK SECTION =====
            if (dynamicFeedback.length > 0 || oldFeedback.length >0) {
                doc.addPage();
                doc.fontSize(20).fillColor('#000').text('Feedback Summary', { align: 'center', underline: true });
                doc.moveDown();
                
                // Dynamic feedback
                if (dynamicFeedback.length > 0) {
                    doc.fontSize(16).fillColor('#2563eb').text('Detailed Feedback Responses');
                    doc.moveDown();
                    
                    dynamicFeedback.forEach((response, index) => {
                        if (doc.y > 650) {
                            doc.addPage();
                        }
                        
                        doc.fontSize(12).fillColor('#1f2937')
                            .text(`Response ${index + 1}: ${response.student_name}`, { bold: true });
                        doc.fontSize(9).fillColor('#6b7280')
                            .text(`Submitted: ${new Date(response.submitted_at).toLocaleString()}`);
                        doc.moveDown(0.5);
                        
                        response.answers.forEach(answer => {
                            doc.fontSize(10).fillColor('#000')
                                .text(`Q: ${answer.question_text}`, { bold: true });
                            doc.fontSize(9).fillColor('#374151')
                                .text(`A: ${answer.answer_text || 'No answer provided'}`);
                            doc.moveDown(0.3);
                        });
                        
                        doc.moveDown(0.5);
                    });
                }
                
                // Legacy feedback
                if (oldFeedback.length > 0) {
                    doc.fontSize(16).fillColor('#2563eb').text('Rating-Based Feedback');
                    doc.moveDown();
                    
                    oldFeedback.forEach((fb, index) => {
                        if (doc.y > 650) {
                            doc.addPage();
                        }
                        
                        doc.fontSize(11).fillColor('#1f2937').text(`Feedback ${index + 1}:`);
                        doc.fontSize(9)
                            .fillColor('#6b7280').text(`   Student: ${fb.student_name}`)
                            .text(`   Rating: ${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)} (${fb.rating}/5)`)
                            .fillColor('#374151').text(`   Comment: ${fb.comment || 'No comment'}`);
                        
                        if (fb.suggestions) {
                            doc.text(`   Suggestions: ${fb.suggestions}`);
                        }
                        
                        doc.moveDown(0.5);
                    });
                }
            }
            
            // Footer
            doc.fontSize(8).fillColor('#9ca3af')
                .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
                    align: 'center'
                });
            
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