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
            
            // ── Server-side validation ──
            const validationErrors = [];

            // Name
            if (!name || !name.trim()) {
                validationErrors.push('Full name is required');
            } else if (name.trim().length < 2 || name.trim().length > 100) {
                validationErrors.push('Name must be between 2 and 100 characters');
            } else if (!/^[a-zA-Z\s.'\-]+$/.test(name.trim())) {
                validationErrors.push('Name can only contain letters, spaces, dots, hyphens, and apostrophes');
            }

            // Email
            if (!email || !email.trim()) {
                validationErrors.push('Email address is required');
            } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
                validationErrors.push('Please enter a valid email address');
            }

            // Phone
            if (!phone || !phone.trim()) {
                validationErrors.push('Phone number is required');
            } else {
                const cleanPhone = phone.replace(/[\s\-+]/g, '');
                if (!/^(91)?[6-9]\d{9}$/.test(cleanPhone) && !/^\d{10}$/.test(cleanPhone)) {
                    validationErrors.push('Please enter a valid 10-digit Indian phone number');
                }
            }

            // Password
            if (!password) {
                validationErrors.push('Password is required');
            } else if (password.length < 8) {
                validationErrors.push('Password must be at least 8 characters long');
            } else {
                if (!/[A-Z]/.test(password)) validationErrors.push('Password must contain at least one uppercase letter');
                if (!/[a-z]/.test(password)) validationErrors.push('Password must contain at least one lowercase letter');
                if (!/[0-9]/.test(password)) validationErrors.push('Password must contain at least one digit');
                if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) validationErrors.push('Password must contain at least one special character');
            }

            // Role
            if (!role || !['student', 'faculty'].includes(role)) {
                validationErrors.push('Please select a valid role (student or faculty)');
            }

            // Role-specific validations
            if (role === 'student') {
                if (!roleData.collegeName || !roleData.collegeName.trim()) {
                    validationErrors.push('College name is required');
                } else if (roleData.collegeName.trim().length < 3) {
                    validationErrors.push('College name must be at least 3 characters');
                }
                if (!roleData.course || !roleData.course.trim()) {
                    validationErrors.push('Course is required');
                } else if (roleData.course.trim().length < 2) {
                    validationErrors.push('Course must be at least 2 characters');
                }
                if (!roleData.year) {
                    validationErrors.push('Year is required');
                }
            } else if (role === 'faculty') {
                if (!roleData.facultyId || !roleData.facultyId.trim()) {
                    validationErrors.push('Faculty ID is required');
                } else if (roleData.facultyId.trim().length < 3) {
                    validationErrors.push('Faculty ID must be at least 3 characters');
                }
                if (!roleData.department || !roleData.department.trim()) {
                    validationErrors.push('Department is required');
                } else if (roleData.department.trim().length < 2) {
                    validationErrors.push('Department must be at least 2 characters');
                }
            }

            if (validationErrors.length > 0) {
                return res.status(400).json({ error: validationErrors.join('. ') });
            }
            // ── End validation ──
            
            // Check if user exists
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE email = ?',
                [email.trim().toLowerCase()]
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
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                password: hashedPassword,
                role,
                status
            };
            
            // Add role-specific fields
            if (role === 'faculty') {
                userData.faculty_id = roleData.facultyId.trim();
                userData.department = roleData.department.trim();
            } else if (role === 'student') {
                userData.college_name = roleData.collegeName.trim();
                userData.course = roleData.course.trim();
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
 // Update getCurrentUser function
getCurrentUser: async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      
      const [users] = await pool.query(
        `SELECT id, name, email, phone, role, status, 
                faculty_id, department, college_name, course, year 
         FROM users WHERE id = ?`,
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = users[0];
      
      // For faculty, check if still approved
      if (user.role === 'faculty' && user.status !== 'approved') {
        return res.status(401).json({ error: 'Faculty account not approved' });
      }
      
      res.json(user);
      
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = authController;