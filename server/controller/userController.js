const User = require('../models/userModel')
const OTP = require('../models/otpModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const signup = async (req, res) => {
  try {

    const { name, email,phoneNumber, password, role, otp } = req.body;
    if (!name || !email || !password || !otp) {
      return res.status(403).json({
        success: false,
        message: 'All fields are required',
      })
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      })
    }

    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)
    if (response.length === 0 || otp !== response[0].otp) {
      return res.status(400).json({
        success: false,
        message: 'The OTP is not valid',
      })
    }

    let hashedPassword
    try {
      hashedPassword = await bcrypt.hash(password, 10)
    } 
    catch (error) {
      return res.status(500).json({
        success: false,
        message: `Hashing password error for ${password}: ` + error.message,
      })
    }

    console.log('Hashed Password: ', hashedPassword)

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
    })

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: user,
    })

  } catch (error) {
    res.status(500).json({
      status: 'failed',
      message:
        'OOPss!!, there was some problem with user registration.... Please try again',
    })
  }
}
const totalUsers = async (req, res) => {
  try {
  
      const users = await User.find();
      const totalUsersCount = users.length;
      res.json({ totalUsers: totalUsersCount });
  } catch (err) {
      console.error("Error while fetching total users based on phone number:", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
};
const signinwithEmail = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(500)
      throw new Error('All fields are mandatory!')
    }
    const user = await User.findOne({ email })
    //compare password with hashedpassword

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign(
        {
          user: {
            username: user.username,
            email: user.email,
            id: user.id,
          },
        },
        process.env.ACCESS_TOKEN_SECERT,
        { expiresIn: '1h' }
      )
      res.status(200).json({ accessToken })
    } else {
      res.status(401)
      throw new Error('Email or password is not valid')
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}


const signinwithPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      res.status(500);
      throw new Error("All fields are mandatory!");
    }
    const user = await User.findOne({ phoneNumber });
    //compare password with hashedpassword

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign(
        {
          user: {
            username: user.username,
            phoneNumber: user.phoneNumber,
            id: user.id,
          },
        },
        process.env.ACCESS_TOKEN_SECERT,
        { expiresIn: "15m" }
      );
      res.status(200).json({ accessToken });
    } else {
      res.status(401);
      throw new Error("phoneNumber or password is not valid");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { signup, signinwithEmail, signinwithPhoneNumber ,totalUsers};
