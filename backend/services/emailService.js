const nodemailer = require('nodemailer');

// ⚠️ IMPORTANT: Replace these with your actual Gmail credentials
const EMAIL_USER = 'afrozsheikh1112@gmail.com'; // Replace with your Gmail address
const EMAIL_PASSWORD = 'abcdefghijklmnop';    // Replace with your Gmail App Password



// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ Email service configuration error:', error);
    } else {
        console.log('✅ Email service is ready to send messages');
    }
});

// Email service functions
const emailService = {
    // Send event creation notification to all students
    sendEventCreatedEmail: async (eventDetails, recipientEmail, recipientName) => {
        try {
            const mailOptions = {
                from: `College Events <${EMAIL_USER}>`,
                to: recipientEmail,
                subject: `🎉 New Event: ${eventDetails.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">New Event Alert!</h2>
                        <p>Hi ${recipientName},</p>
                        <p>A new event has been posted!</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1f2937;">${eventDetails.title}</h3>
                            <p><strong>📅 Date:</strong> ${new Date(eventDetails.event_date).toLocaleDateString()}</p>
                            <p><strong>🕐 Time:</strong> ${eventDetails.event_time}</p>
                            <p><strong>📍 Location:</strong> ${eventDetails.location}</p>
                            <p><strong>📂 Category:</strong> ${eventDetails.category}</p>
                            ${eventDetails.registration_fees > 0 ? `<p><strong>💰 Registration Fee:</strong> ₹${eventDetails.registration_fees}</p>` : ''}
                        </div>
                        
                        <p>${eventDetails.description}</p>
                        
                        <p style="margin-top: 30px;">
                            <a href="http://localhost:5173/events/${eventDetails.id}" 
                               style="background: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                View Event Details & Register
                            </a>
                        </p>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            This is an automated email from College Event Management System.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Event notification email sent to ${recipientEmail}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error sending event notification email:', error);
            return { success: false, error };
        }
    },

    // Send registration confirmation to student
    sendRegistrationConfirmation: async (eventDetails, studentDetails) => {
        try {
            const mailOptions = {
                from: `College Events <${EMAIL_USER}>`,
                to: studentDetails.email,
                subject: `✅ Registration Confirmed: ${eventDetails.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">Registration Confirmed!</h2>
                        <p>Hi ${studentDetails.name},</p>
                        <p>Your registration for the following event has been confirmed:</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1f2937;">${eventDetails.title}</h3>
                            <p><strong>📅 Date:</strong> ${new Date(eventDetails.event_date).toLocaleDateString()}</p>
                            <p><strong>🕐 Time:</strong> ${eventDetails.event_time}</p>
                            <p><strong>📍 Location:</strong> ${eventDetails.location}</p>
                        </div>
                        
                        <div style="background: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                            <p style="margin: 0;"><strong>📝 Don't forget to submit your feedback after the event!</strong></p>
                            <p style="margin: 10px 0 0 0; font-size: 14px;">
                                Your feedback helps us improve future events.
                            </p>
                        </div>
                        
                        <p>We look forward to seeing you at the event!</p>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            This is an automated email from College Event Management System.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Registration confirmation email sent to ${studentDetails.email}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error sending registration confirmation:', error);
            return { success: false, error };
        }
    },

    // Send feedback reminder to student
    sendFeedbackReminder: async (eventDetails, studentDetails) => {
        try {
            const mailOptions = {
                from: `College Events <${EMAIL_USER}>`,
                to: studentDetails.email,
                subject: `📝 Feedback Reminder: ${eventDetails.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #f59e0b;">Feedback Reminder</h2>
                        <p>Hi ${studentDetails.name},</p>
                        <p>We noticed you haven't submitted feedback for:</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1f2937;">${eventDetails.title}</h3>
                            <p><strong>📅 Date:</strong> ${new Date(eventDetails.event_date).toLocaleDateString()}</p>
                        </div>
                        
                        <p>Your feedback is valuable and helps us improve future events!</p>
                        
                        <p style="margin-top: 30px;">
                            <a href="http://localhost:5173/events/${eventDetails.id}/feedback" 
                               style="background: #f59e0b; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                Submit Feedback Now
                            </a>
                        </p>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            This is an automated email from College Event Management System.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Feedback reminder sent to ${studentDetails.email}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error sending feedback reminder:', error);
            return { success: false, error };
        }
    },

    // Send user approval notification
    sendUserApprovalEmail: async (userDetails) => {
        try {
            const mailOptions = {
                from: `College Events <${EMAIL_USER}>`,
                to: userDetails.email,
                subject: '✅ Account Approved - College Event System',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">Account Approved!</h2>
                        <p>Hi ${userDetails.name},</p>
                        <p>Great news! Your account has been approved.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Role:</strong> ${userDetails.role}</p>
                            <p><strong>Email:</strong> ${userDetails.email}</p>
                        </div>
                        
                        <p>You can now log in and start using the College Event Management System.</p>
                        
                        <p style="margin-top: 30px;">
                            <a href="http://localhost:5173/login" 
                               style="background: #10b981; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                Login Now
                            </a>
                        </p>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            This is an automated email from College Event Management System.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Approval email sent to ${userDetails.email}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error sending approval email:', error);
            return { success: false, error };
        }
    }
};

module.exports = emailService;
