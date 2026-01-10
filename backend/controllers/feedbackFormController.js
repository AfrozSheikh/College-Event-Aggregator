const pool = require('../config/db');

const feedbackFormController = {
    // Create feedback form with questions
    createFeedbackForm: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { eventId, title, description, questions, createdBy } = req.body;
            
            await connection.beginTransaction();
            
            // Insert feedback form
            const [formResult] = await connection.query(
                `INSERT INTO feedback_forms (event_id, title, description, created_by) 
                 VALUES (?, ?, ?, ?)`,
                [eventId, title || 'Event Feedback Form', description || '', createdBy]
            );
            
            const formId = formResult.insertId;
            
            // Insert questions
            if (questions && questions.length > 0) {
                const questionPromises = questions.map((question, index) => {
                    return connection.query(
                        `INSERT INTO feedback_questions 
                         (form_id, question_text, question_type, options, is_required, order_index) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            formId,
                            question.questionText,
                            question.questionType || 'text',
                            question.options ? JSON.stringify(question.options) : null,
                            question.isRequired !== false,
                            question.orderIndex || index
                        ]
                    );
                });
                
                await Promise.all(questionPromises);
            }
            
            await connection.commit();
            
            res.json({ 
                message: 'Feedback form created successfully',
                formId 
            });
        } catch (error) {
            await connection.rollback();
            console.error('Create feedback form error:', error);
            res.status(500).json({ error: 'Failed to create feedback form' });
        } finally {
            connection.release();
        }
    },
    
    // Get feedback form by event ID
    getFeedbackForm: async (req, res) => {
        try {
            const { eventId } = req.params;
            
            // Get form details
            const [forms] = await pool.query(
                `SELECT * FROM feedback_forms WHERE event_id = ?`,
                [eventId]
            );
            
            if (forms.length === 0) {
                return res.status(404).json({ error: 'No feedback form found for this event' });
            }
            
            const form = forms[0];
            
            // Get questions
            const [questions] = await pool.query(
                `SELECT * FROM feedback_questions 
                 WHERE form_id = ? 
                 ORDER BY order_index ASC`,
                [form.id]
            );
            
            // Parse options for multiple choice questions
            const parsedQuestions = questions.map(q => ({
                ...q,
                options: q.options ? JSON.parse(q.options) : null
            }));
            
            res.json({
                ...form,
                questions: parsedQuestions
            });
        } catch (error) {
            console.error('Get feedback form error:', error);
            res.status(500).json({ error: 'Failed to get feedback form' });
        }
    },
    
    // Update feedback form
    updateFeedbackForm: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { id } = req.params;
            const { title, description, questions } = req.body;
            
            await connection.beginTransaction();
            
            // Update form
            await connection.query(
                `UPDATE feedback_forms SET title = ?, description = ? WHERE id = ?`,
                [title, description, id]
            );
            
            // Delete existing questions
            await connection.query(
                `DELETE FROM feedback_questions WHERE form_id = ?`,
                [id]
            );
            
            // Insert new questions
            if (questions && questions.length > 0) {
                const questionPromises = questions.map((question, index) => {
                    return connection.query(
                        `INSERT INTO feedback_questions 
                         (form_id, question_text, question_type, options, is_required, order_index) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            id,
                            question.questionText,
                            question.questionType || 'text',
                            question.options ? JSON.stringify(question.options) : null,
                            question.isRequired !== false,
                            question.orderIndex || index
                        ]
                    );
                });
                
                await Promise.all(questionPromises);
            }
            
            await connection.commit();
            
            res.json({ message: 'Feedback form updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Update feedback form error:', error);
            res.status(500).json({ error: 'Failed to update feedback form' });
        } finally {
            connection.release();
        }
    },
    
    // Delete feedback form
    deleteFeedbackForm: async (req, res) => {
        try {
            const { id } = req.params;
            
            await pool.query(
                `DELETE FROM feedback_forms WHERE id = ?`,
                [id]
            );
            
            res.json({ message: 'Feedback form deleted successfully' });
        } catch (error) {
            console.error('Delete feedback form error:', error);
            res.status(500).json({ error: 'Failed to delete feedback form' });
        }
    },
    
    // Submit feedback response
    submitFeedbackResponse: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { formId, eventId, studentId, answers } = req.body;
            
            await connection.beginTransaction();
            
            // Check if already submitted
            const [existing] = await connection.query(
                `SELECT id FROM feedback_responses 
                 WHERE form_id = ? AND student_id = ? AND event_id = ?`,
                [formId, studentId, eventId]
            );
            
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Feedback already submitted for this event' });
            }
            
            // Insert response
            const [responseResult] = await connection.query(
                `INSERT INTO feedback_responses (form_id, student_id, event_id) 
                 VALUES (?, ?, ?)`,
                [formId, studentId, eventId]
            );
            
            const responseId = responseResult.insertId;
            
            // Insert answers
            if (answers && answers.length > 0) {
                const answerPromises = answers.map(answer => {
                    return connection.query(
                        `INSERT INTO feedback_answers (response_id, question_id, answer_text) 
                         VALUES (?, ?, ?)`,
                        [responseId, answer.questionId, answer.answerText]
                    );
                });
                
                await Promise.all(answerPromises);
            }
            
            await connection.commit();
            
            res.json({ 
                message: 'Thank you for your feedback!',
                responseId 
            });
        } catch (error) {
            await connection.rollback();
            console.error('Submit feedback response error:', error);
            res.status(500).json({ error: 'Failed to submit feedback' });
        } finally {
            connection.release();
        }
    },
    
    // Get all responses for a form
    getFeedbackResponses: async (req, res) => {
        try {
            const { formId } = req.params;
            
            // Get all responses
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
            
            res.json(responses);
        } catch (error) {
            console.error('Get feedback responses error:', error);
            res.status(500).json({ error: 'Failed to get feedback responses' });
        }
    },
    
    // Check if student has submitted feedback for an event
    checkFeedbackStatus: async (req, res) => {
        try {
            const { eventId, studentId } = req.params;
            
            const [responses] = await pool.query(
                `SELECT id FROM feedback_responses 
                 WHERE event_id = ? AND student_id = ?`,
                [eventId, studentId]
            );
            
            res.json({ hasSubmitted: responses.length > 0 });
        } catch (error) {
            console.error('Check feedback status error:', error);
            res.status(500).json({ error: 'Failed to check feedback status' });
        }
    },

    // Get responses by event ID (for reports)
    getResponsesByEvent: async (req, res) => {
        try {
            const { eventId } = req.params;
            
            // First get the form for this event
            const [forms] = await pool.query(
                `SELECT id FROM feedback_forms WHERE event_id = ?`,
                [eventId]
            );
            
            if (forms.length === 0) {
                return res.json([]);
            }
            
            const formId = forms[0].id;
            
            // Get all responses with answers
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
            
            res.json(responses);
        } catch (error) {
            console.error('Get responses by event error:', error);
            res.status(500).json({ error: 'Failed to get responses' });
        }
    }
};

module.exports = feedbackFormController;
