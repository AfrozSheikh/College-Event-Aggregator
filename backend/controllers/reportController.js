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
            
            // Create PDF with better styling
            const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
            const filename = `event-report-${eventId}-${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../uploads/reports', filename);
            
            // Ensure directory exists
            if (!fs.existsSync(path.dirname(filepath))) {
                fs.mkdirSync(path.dirname(filepath), { recursive: true });
            }
            
            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);
            
            // ===== HELPER FUNCTIONS FOR STYLING =====
            const drawSectionHeader = (text, color = '#2563eb') => {
                doc.moveDown();
                doc.rect(50, doc.y, 495, 30).fill(color);
                doc.fillColor('#ffffff').fontSize(16).text(text, 60, doc.y - 22, { 
                    width: 475
                });
                doc.fillColor('#000000');
                doc.moveDown(0.5);
            };
            
            const drawInfoBox = (label, value, x, y, width = 230) => {
                doc.rect(x, y, width, 45).fillAndStroke('#f8fafc', '#e2e8f0');
                doc.fillColor('#64748b').fontSize(9).text(label, x + 10, y + 8);
                doc.fillColor('#1e293b').fontSize(11).text(value || 'N/A', x + 10, y + 24, {
                    width: width - 20,
                    ellipsis: true
                });
                doc.fillColor('#000000');
            };
            
            const drawDivider = () => {
                doc.strokeColor('#e2e8f0').lineWidth(1);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
                doc.strokeColor('#000000');
                doc.moveDown(0.3);
            };
            
            // ===== COVER PAGE =====
            // Gradient-like header background
            doc.rect(0, 0, 595, 200).fill('#1e40af');
            doc.rect(0, 180, 595, 40).fill('#3b82f6');
            
            // Title
            doc.fillColor('#ffffff').fontSize(36).text('EVENT REPORT', 50, 60, { 
                align: 'center',
                characterSpacing: 2
            });
            
            // Event title
            doc.fontSize(22).text(event.title, 50, 110, { 
                align: 'center',
                width: 495
            });
            
            // Date badge
            const reportDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            doc.fontSize(12).text(`Generated: ${reportDate}`, 50, 190, { 
                align: 'center' 
            });
            
            doc.fillColor('#000000');
            doc.y = 250;
            
            // ===== QUICK STATS CARDS =====
            doc.fontSize(18).fillColor('#1e293b').text('Quick Overview', 50, doc.y);
            doc.moveDown(0.5);
            
            const statsY = doc.y;
            
            // Stats cards
            doc.rect(50, statsY, 155, 70).fillAndStroke('#ecfdf5', '#10b981');
            doc.fillColor('#065f46').fontSize(28).text(participations.length.toString(), 60, statsY + 10);
            doc.fontSize(10).text('Total Registrations', 60, statsY + 45);
            
            doc.rect(220, statsY, 155, 70).fillAndStroke('#fef3c7', '#f59e0b');
            doc.fillColor('#92400e').fontSize(28).text((oldFeedback.length + dynamicFeedback.length).toString(), 230, statsY + 10);
            doc.fontSize(10).text('Feedback Responses', 230, statsY + 45);
            
            if (oldFeedback.length > 0) {
                doc.rect(390, statsY, 155, 70).fillAndStroke('#fce7f3', '#ec4899');
                doc.fillColor('#9d174d').fontSize(28).text(`${avgRating.toFixed(1)}`, 400, statsY + 10);
                doc.fontSize(10).text('Average Rating / 5', 400, statsY + 45);
            } else {
                doc.rect(390, statsY, 155, 70).fillAndStroke('#f0f9ff', '#0ea5e9');
                doc.fillColor('#0369a1').fontSize(28).text(images.length.toString(), 400, statsY + 10);
                doc.fontSize(10).text('Event Photos', 400, statsY + 45);
            }
            
            doc.fillColor('#000000');
            doc.y = statsY + 90;
            
            // ===== EVENT DETAILS SECTION =====
            drawSectionHeader('Event Details', '#1e40af');
            doc.moveDown(0.5);
            
            const infoY = doc.y;
            drawInfoBox('Event Date', new Date(event.event_date).toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            }), 50, infoY);
            drawInfoBox('Event Time', event.event_time, 310, infoY);
            
            drawInfoBox('Location', event.location, 50, infoY + 55);
            drawInfoBox('Category', event.category?.toUpperCase(), 310, infoY + 55);
            
            drawInfoBox('Organized By', event.organizer_name || event.organized_by, 50, infoY + 110);
            drawInfoBox('Department', event.organizer_department || 'N/A', 310, infoY + 110);
            
            drawInfoBox('Max Participants', event.max_participants || 'Unlimited', 50, infoY + 165);
            drawInfoBox('Registration Fee', `₹${event.registration_fees || 0}`, 310, infoY + 165);
            
            doc.y = infoY + 225;
            
            // Description
            doc.moveDown(0.5);
            doc.fillColor('#475569').fontSize(12).text('Description:', { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#64748b').text(event.description || 'No description provided.', {
                align: 'justify',
                lineGap: 4
            });
            
            // ===== EVENT PHOTOS =====
            if (images.length > 0) {
                doc.addPage();
                drawSectionHeader('Event Gallery', '#059669');
                doc.moveDown();
                
                let imageCount = 0;
                let xPos = 50;
                let yPos = doc.y;
                
                for (let img of images) {
                    const imagePath = path.join(__dirname, '..', img.image_path);
                    
                    try {
                        if (fs.existsSync(imagePath)) {
                            if (imageCount > 0 && imageCount % 2 === 0) {
                                xPos = 50;
                                yPos += 200;
                                
                                if (yPos > 600) {
                                    doc.addPage();
                                    yPos = 80;
                                }
                            } else if (imageCount > 0) {
                                xPos = 310;
                            }
                            
                            // Image with border
                            doc.rect(xPos - 3, yPos - 3, 236, 176).fillAndStroke('#ffffff', '#e2e8f0');
                            doc.image(imagePath, xPos, yPos, {
                                width: 230,
                                height: 170,
                                fit: [230, 170]
                            });
                            
                            imageCount++;
                        }
                    } catch (imgError) {
                        console.error('Error adding image to PDF:', imgError);
                    }
                }
            }
            
            // ===== PARTICIPANTS LIST =====
            if (participations.length > 0) {
                doc.addPage();
                drawSectionHeader('Registered Participants', '#7c3aed');
                doc.moveDown();
                
                doc.fontSize(11).fillColor('#475569')
                    .text(`Total Registrations: ${participations.length}`, 50);
                doc.moveDown();
                
                participations.forEach((participation, index) => {
                    // Check if need new page
                    if (doc.y > 680) {
                        doc.addPage();
                        doc.y = 80;
                    }
                    
                    const cardY = doc.y;
                    
                    // Card background
                    doc.rect(50, cardY, 495, 65).fillAndStroke('#f8fafc', '#e2e8f0');
                    
                    // Number badge
                    doc.rect(50, cardY, 35, 65).fill('#7c3aed');
                    doc.fillColor('#ffffff').fontSize(14)
                        .text((index + 1).toString(), 50, cardY + 22, { width: 35, align: 'center' });
                    
                    // Student details
                    doc.fillColor('#1e293b').fontSize(11)
                        .text(participation.name || 'N/A', 95, cardY + 8);
                    
                    doc.fillColor('#64748b').fontSize(9)
                        .text(participation.email || 'N/A', 95, cardY + 24);
                    
                    doc.fillColor('#64748b').fontSize(8)
                        .text(`College: ${participation.college || participation.college_name || 'N/A'}`, 95, cardY + 40);
                    
                    doc.text(`Course: ${participation.course || 'N/A'} | Year: ${participation.year || 'N/A'}`, 95, cardY + 52);
                    
                    // Phone on right side
                    if (participation.phone || participation.student_phone) {
                        doc.fillColor('#64748b').fontSize(8)
                            .text(`Phone: ${participation.phone || participation.student_phone}`, 380, cardY + 8, { width: 155, align: 'right' });
                    }
                    
                    // Department if available
                    if (participation.student_department) {
                        doc.text(`Dept: ${participation.student_department}`, 380, cardY + 22, { width: 155, align: 'right' });
                    }
                    
                    // Registration date
                    doc.fillColor('#94a3b8').fontSize(7)
                        .text(`Registered: ${new Date(participation.registered_at).toLocaleDateString()}`, 380, cardY + 52, { width: 155, align: 'right' });
                    
                    doc.y = cardY + 72;
                });
            }
            
            // ===== FEEDBACK SECTION =====
            if (dynamicFeedback.length > 0 || oldFeedback.length > 0) {
                doc.addPage();
                drawSectionHeader('Feedback Summary', '#dc2626');
                doc.moveDown();
                
                doc.fontSize(11).fillColor('#475569')
                    .text(`Total Feedback: ${dynamicFeedback.length + oldFeedback.length} responses`, 50);
                doc.moveDown();
                
                // Dynamic feedback
                if (dynamicFeedback.length > 0) {
                    doc.fontSize(12).fillColor('#1e40af').text('Detailed Feedback Responses', 50);
                    doc.moveDown(0.5);
                    
                    dynamicFeedback.forEach((response, index) => {
                        // Check page space - estimate card height based on answers
                        const estimatedHeight = 80 + (response.answers?.length || 0) * 25;
                        if (doc.y + estimatedHeight > 720) {
                            doc.addPage();
                            doc.y = 80;
                        }
                        
                        const cardY = doc.y;
                        
                        // Calculate card height based on content
                        let cardHeight = 55 + (response.answers?.length || 0) * 22;
                        
                        // Card background
                        doc.rect(50, cardY, 495, cardHeight).fillAndStroke('#f0f9ff', '#3b82f6');
                        
                        // Header bar
                        doc.rect(50, cardY, 495, 20).fill('#3b82f6');
                        doc.fillColor('#ffffff').fontSize(10)
                            .text(`Response #${index + 1} - ${response.student_name}`, 58, cardY + 5);
                        
                        // Student email and date
                        doc.fillColor('#64748b').fontSize(8)
                            .text(response.student_email || '', 58, cardY + 26);
                        doc.text(`Submitted: ${new Date(response.submitted_at).toLocaleDateString()}`, 350, cardY + 26, { width: 185, align: 'right' });
                        
                        // Questions and answers
                        let answerY = cardY + 42;
                        if (response.answers) {
                            response.answers.forEach(answer => {
                                doc.fillColor('#475569').fontSize(8)
                                    .text(`Q: ${answer.question_text}`, 58, answerY, { width: 250 });
                                
                                if (answer.question_type === 'rating') {
                                    const ratingNum = parseInt(answer.answer_text) || 0;
                                    doc.fillColor('#f59e0b').fontSize(10)
                                        .text(`${'★'.repeat(ratingNum)}${'☆'.repeat(5 - ratingNum)}`, 320, answerY, { width: 100 });
                                    doc.fillColor('#64748b').fontSize(8)
                                        .text(`(${answer.answer_text}/5)`, 420, answerY);
                                } else {
                                    doc.fillColor('#1e293b').fontSize(8)
                                        .text(`A: ${answer.answer_text || 'No answer'}`, 320, answerY, { width: 215 });
                                }
                                answerY += 20;
                            });
                        }
                        
                        doc.y = cardY + cardHeight + 8;
                    });
                }
                
                // Legacy feedback
                if (oldFeedback.length > 0) {
                    doc.moveDown();
                    doc.fontSize(12).fillColor('#f59e0b').text('Rating-Based Feedback', 50);
                    doc.moveDown(0.5);
                    
                    oldFeedback.forEach((fb, index) => {
                        if (doc.y > 680) {
                            doc.addPage();
                            doc.y = 80;
                        }
                        
                        const cardY = doc.y;
                        const hasComment = fb.comment && fb.comment.length > 0;
                        const hasSuggestion = fb.suggestions && fb.suggestions.length > 0;
                        const cardHeight = 45 + (hasComment ? 20 : 0) + (hasSuggestion ? 18 : 0);
                        
                        // Card background
                        doc.rect(50, cardY, 495, cardHeight).fillAndStroke('#fffbeb', '#fbbf24');
                        
                        // Header bar
                        doc.rect(50, cardY, 495, 18).fill('#fbbf24');
                        doc.fillColor('#78350f').fontSize(10)
                            .text(fb.student_name || 'Anonymous', 58, cardY + 4);
                        
                        // Rating stars
                        doc.fillColor('#f59e0b').fontSize(14)
                            .text(`${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}`, 350, cardY + 2, { width: 100 });
                        doc.fillColor('#78350f').fontSize(9)
                            .text(`${fb.rating}/5`, 460, cardY + 5);
                        
                        let contentY = cardY + 24;
                        
                        if (hasComment) {
                            doc.fillColor('#475569').fontSize(8)
                                .text(`"${fb.comment}"`, 58, contentY, { width: 477 });
                            contentY += 18;
                        }
                        
                        if (hasSuggestion) {
                            doc.fillColor('#0891b2').fontSize(8)
                                .text(`Suggestion: ${fb.suggestions}`, 58, contentY, { width: 477 });
                        }
                        
                        doc.y = cardY + cardHeight + 8;
                    });
                }
            }
            
            // ===== FOOTER ON EACH PAGE =====
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(i);
                
                // Footer line
                doc.strokeColor('#e2e8f0').lineWidth(1);
                doc.moveTo(50, doc.page.height - 40).lineTo(545, doc.page.height - 40).stroke();
                
                // Footer text
                doc.fontSize(8).fillColor('#94a3b8')
                    .text(
                        `College Event Management System • Page ${i + 1} of ${range.count} • Generated: ${new Date().toLocaleString()}`,
                        50, 
                        doc.page.height - 30,
                        { align: 'center', width: 495 }
                    );
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