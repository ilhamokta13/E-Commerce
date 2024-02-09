const User = require('../models/user-schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
            const { shopName } = req.body;
            const userID = req.user.id;
            const user = await User.findById(userID);
            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 401;
                throw error;
            }

            user.shopName = shopName;
            await user.save();

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

}

module.exports = UserController;