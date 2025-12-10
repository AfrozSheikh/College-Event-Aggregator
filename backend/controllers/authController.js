const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const authController = {
    // Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const [users] = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = users[0];
            
            // Check if faculty is approved
            if (user.role === 'faculty' && user.status !== 'approved') {
                return res.status(401).json({ error: 'Faculty account pending approval' });
            }
            
            // Compare passwords (for admin, use simple comparison)
            if (user.role === 'admin') {
                if (password !== user.password) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
            } else {
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
            }
            
            // Remove password from response
            const { password: _, ...userData } = user;
            res.json(userData);
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Signup
    signup: async (req, res) => {
        try {
            const { name, email, phone, password, role, ...roleData } = req.body;
            
            // Check if user exists
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Set status based on role
            const status = role === 'student' ? 'approved' : 'pending';
            
            // Prepare user data
            const userData = {
                name,
                email,
                phone,
                password: hashedPassword,
                role,
                status
            };
            
            // Add role-specific fields
            if (role === 'faculty') {
                userData.faculty_id = roleData.facultyId;
                userData.department = roleData.department;
            } else if (role === 'student') {
                userData.college_name = roleData.collegeName;
                userData.course = roleData.course;
                userData.year = roleData.year;
            }
            
            // Insert user
            const [result] = await pool.query('INSERT INTO users SET ?', userData);
            
            res.json({
                message: role === 'student' 
                    ? 'Registration successful! You can now login.'
                    : 'Registration submitted! Waiting for admin approval.'
            });
            
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get current user (simple session simulation)
    getCurrentUser: async (req, res) => {
        try {
            const { userId } = req.query;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }
            
            const [users] = await pool.query(
                'SELECT id, name, email, phone, role, status, faculty_id, department, college_name, course, year FROM users WHERE id = ?',
                [userId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json(users[0]);
            
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = authController;