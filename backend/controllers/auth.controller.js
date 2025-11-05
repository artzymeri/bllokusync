const bcrypt = require('bcrypt');
const db = require('../models');
const { generateToken } = require('../utils/jwt');

// Register - adds to register_requests table
exports.register = async (req, res) => {
  try {
    const { name, surname, email, password, number, role } = req.body;

    // Validate required fields
    if (!name || !surname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, surname, email, and password are required'
      });
    }

    // Check if email already exists in register_requests
    const existingRequest = await db.RegisterRequest.findOne({ where: { email } });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Email is already used'
      });
    }

    // Check if email already exists in users
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already used'
      });
    }

    // Check if phone number already exists in register_requests (if provided)
    if (number) {
      const existingRequestByPhone = await db.RegisterRequest.findOne({ where: { number } });
      if (existingRequestByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }

      // Check if phone number already exists in users
      const existingUserByPhone = await db.User.findOne({ where: { number } });
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already used'
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create register request
    const registerRequest = await db.RegisterRequest.create({
      name,
      surname,
      email,
      password: hashedPassword,
      number: number || null,
      role: role || 'tenant',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully. Awaiting approval.',
      data: {
        id: registerRequest.id,
        name: registerRequest.name,
        surname: registerRequest.surname,
        email: registerRequest.email,
        status: registerRequest.status
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating registration request',
      error: error.message
    });
  }
};

// Login - checks users table
exports.login = async (req, res) => {
  try {
    const { identifier, password, loginMethod } = req.body;

    // Validate required fields
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and password are required'
      });
    }

    // Validate phone number format if using phone login
    if (loginMethod === 'phone') {
      const phoneRegex = /^\+3834\d{7}$/;
      if (!phoneRegex.test(identifier)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Must start with +383 and be in format +3834911122'
        });
      }
    }

    // Find user by email or phone number
    let user;
    if (loginMethod === 'phone') {
      user = await db.User.findOne({ where: { number: identifier } });
    } else {
      user = await db.User.findOne({ where: { email: identifier } });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: loginMethod === 'phone'
          ? 'Invalid phone number or password'
          : 'Invalid email or password'
      });
    }

    // Check if property_manager user account has expired
    if (user.role === 'property_manager' && user.expiry_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(user.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        return res.status(403).json({
          success: false,
          message: 'Your account has expired. Please contact an administrator.'
        });
      }
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: loginMethod === 'phone'
          ? 'Invalid phone number or password'
          : 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // 'none' for cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('token', token, cookieOptions);

    // Return user data with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      data: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        number: user.number,
        role: user.role,
        apartment_label: user.apartment_label
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Logout - clear token
exports.logout = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      expires: new Date(0)
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// Get current user from token
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Verify token endpoint
exports.verifyToken = async (req, res) => {
  try {
    // If we reach here, token is valid (middleware already verified)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: req.user
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message
    });
  }
};
