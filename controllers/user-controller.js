const User = require('../models/user-schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const crypto = require('crypto'); // Add crypto for generating reset tokens

const ejs = require('ejs');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ilhamok8@gmail.com',
        pass: 'Aku$ayangibu123'
    }
})

class UserController {
    static async register(req, res, next) {
        try {
            const { fullName, email, password, telp, role } = req.body;
            const hash = await bcrypt.hash(password, 12);
            const user = new User({
                fullName,
                email,
                password: hash,
                telp,
                role
            });
            await user.save();

            res.status(201).json({
                message: 'Register success',
                data: user
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                const error = new Error('Email not found');
                error.statusCode = 401;
                throw error;
            }
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }
            const secretKey = process.env.SECRET_KEY;
            const payload = {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            };

            const options = {
                expiresIn: '1h'
            };
            const token = jwt.sign(payload, secretKey, options);

            res.cookie('accessToken', token, {
                maxAge: 3600000, // Waktu kedaluwarsa dalam milidetik (1 jam dalam contoh ini)
                httpOnly: true, // Token hanya dapat diakses melalui HTTP dan tidak dari JavaScript
            })

            res.status(200).json({
                error: false,
                message: 'Success',
                token: token
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async completeProfile(req, res, next) {
        try {
            const { fullName, email, telp, role, shopName } = req.body;
            const userID = req.user.id;
            const user = await User.findByIdAndUpdate(userID, {
                fullName,
                email,
                telp,
                role,
                shopName
            });

            res.status(200).json({
                error: false,
                message: 'Success',
                data: user
            });
        }
        catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

   

    static async getUserProfile(req, res, next) {
        try {
            const userID = req.user.id;
            const user = await User.findById(userID);
            
            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }
    
            res.status(200).json({
                error: false,
                message: 'Success',
                data: user
            });
        } catch (error) {
            res.status(error.statusCode || 500).json({
                error: true,
                message: error.message || 'Internal Server Error'
            });
        }
    }


    static async getAllUserProfiles(req, res, next) {
        try {
            const users = await User.find({});
            
            res.status(200).json({
                error: false,
                message: 'Success',
                data: users
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    static async resetPassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            console.log(req.body);
            const userID = req.user.id;
            const user = await
                User.findById(userID);
            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }
            const hash = await bcrypt.hash(newPassword, 12);
            user.password = hash;
            await user.save();
            res.status(200).json({
                error: false,
                message: 'Success update password'
            });
        }
        catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            console.log(req.body);
            const user = await User.findOne({ email });
            if (!user) {
                const error = new Error('Email not found');
                error.statusCode = 404;
                throw error;
            }

            // Generate a reset token and expiration time
            const resetToken = crypto.randomBytes(3).toString('hex');
            const resetTokenExpiration = Date.now() + 6000000; // 1 jam
            console.log(resetToken);

            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = resetTokenExpiration;
            await user.save();

            // Set up nodemailer
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            const emailTemplate = await ejs.renderFile('./views/resetPasswordEmail.ejs', { fullName: user.fullName, resetToken: resetToken });
            console.log(emailTemplate);
            const mailOptions = {
                to: user.email,
                from: process.env.EMAIL_USER,
                subject: 'Password Reset',
                html: emailTemplate
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                error: false,
                message: 'An email has been sent to ' + user.email + ' with further instructions.'
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    // Reset password method
    static async newPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() } // Ensure the token is still valid
            });

            if (!user) {
                const error = new Error('Password reset token is invalid or has expired');
                error.statusCode = 400;
                throw error;
            }

            const hash = await bcrypt.hash(newPassword, 12);
            user.password = hash;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.status(200).json({
                error: false,
                message: 'Password has been reset successfully'
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    static async logout(req, res, next) {
        try {
            res.clearCookie('accessToken');
            res.status(200).json({
                error: false,
                message: 'Logout success'
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }


//     // Fungsi untuk mengirim email reset password
// static async sendResetPasswordEmail(email, token) {
//     // Konfigurasi transporter nodemailer
//     const transporter = nodemailer.createTransport({
//         // Konfigurasi SMTP atau layanan email lainnya
//     });

//     // Kirim email
//     await transporter.sendMail({
//         to: email,
//         subject: 'Reset Password',
//         html: `<p>Anda menerima email ini karena Anda (atau seseorang) telah meminta reset password untuk akun Anda.</p>
//                <p>Klik <a href="http://localhost:3000/reset-password/${token}">tautan ini</a> untuk mereset password Anda.</p>
//                <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`
//     });
// }

// // Endpoint untuk memulai proses reset password
// static async initiateResetPassword(req, res, next) {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             const error = new Error('Validation failed');
//             error.statusCode = 422;
//             error.data = errors.array();
//             throw error;
//         }

//         const { email } = req.body;
//         const user = await User.findOne({ email });
//         if (!user) {
//             const error = new Error('User not found');
//             error.statusCode = 404;
//             throw error;
//         }

//         const secretKey = process.env.SECRET_KEY;
//             const payload = {
//                 id: user._id,
//                 email: user.email,
//                 username: user.username,
//                 role: user.role
//             };

//             const options = {
//                 expiresIn: '1h'
//             };
//             const token = jwt.sign(payload, secretKey, options);

//             res.cookie('accessToken', token, {
//                 maxAge: 3600000, // Waktu kedaluwarsa dalam milidetik (1 jam dalam contoh ini)
//                 httpOnly: true, // Token hanya dapat diakses melalui HTTP dan tidak dari JavaScript
//             })

//         // Kirim email reset password
//         await sendResetPasswordEmail(email, token);

//         res.status(200).json({
//             error: false,
//             message: 'Reset password link sent to email'
//         });
//     } catch (error) {
//         res.status(error.statusCode || 500).json({
//             error: true,
//             message: error.message,
//             data: error.data || {}
//         });
//     }
// }

// // Endpoint untuk mereset password berdasarkan token
// static async z(req, res, next) {
//     try {
//         const { token, newPassword } = req.body;

//         // Verifikasi token
//         const decodedToken = jwt.verify(token, 'your-secret-key');
//         if (!decodedToken) {
//             const error = new Error('Invalid or expired token');
//             error.statusCode = 401;
//             throw error;
//         }

//         const user = await User.findOne({ email: decodedToken.email });
//         if (!user) {
//             const error = new Error('User not found');
//             error.statusCode = 404;
//             throw error;
//         }

//         // Hash password baru
//         const hash = await bcrypt.hash(newPassword, 12);
//         user.password = hash;
//         await user.save();

//         res.status(200).json({
//             error: false,
//             message: 'Password reset successfully'
//         });
//     } catch (error) {
//         res.status(error.statusCode || 500).json({
//             error: true,
//             message: error.message
//         });
//     }
// }




   

    
    }


   
    
    
  

        
    

    // static async logout(req, res, next) {
    //     try {
    //         res.clearCookie('accessToken');
    //         res.status(200).json({
    //             error: false,
    //             message: 'Logout success'
    //         });
    //     } catch (error) {
    //         res.status(500).json({
    //             error: true,
    //             message: error.message
    //         });
    //     }
    // }


    



module.exports = UserController;