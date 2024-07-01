const User = require('../models/user-schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const crypto = require('crypto'); // Add crypto for generating reset tokens

const ejs = require('ejs');

const admin = require('firebase-admin');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ilhamok8@gmail.com',
        pass: 'Aku$ayangibu123'
    }
})

class UserController {
    //req: Objek permintaan dari Express.js yang berisi data pengguna yang akan didaftarkan.
    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    //next: Fungsi middleware berikutnya dalam Express.js (tidak digunakan dalam fungsi ini tetapi bisa digunakan untuk penanganan kesalahan).
    static async register(req, res, next) {
        try {
            //try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses pendaftaran.
            //Destrukturisasi: Mengambil fullName, email, password, telp, dan role dari body permintaan (req.body).
            //bcrypt.hash: Menggunakan bcrypt untuk mengenkripsi kata sandi dengan tingkat kesulitan (salt rounds) 12.
            const { userId, fullName, email, password, telp, role } = req.body;
            const hash = await bcrypt.hash(password, 12);
            //User: Membuat instance baru dari model User dengan data pengguna yang telah diambil dari permintaan, termasuk kata sandi yang sudah dienkripsi (hash).
            //user.save(): Menyimpan instance pengguna baru ke dalam database.
            const user = new User({
                userId,
                fullName,
                email,
                password: hash,
                telp,
                role
            });
            await user.save();
            //res.status(201).json(...): Mengirimkan respons dengan status 201 (Created) dan objek JSON yang berisi pesan sukses dan data pengguna yang baru saja didaftarkan.    
            res.status(201).json({
                message: 'Register success',
                data: user
            });
            //catch: Menangkap kesalahan yang terjadi selama proses pendaftaran dan mengirimkan respons dengan status 500 (Internal Server Error) serta pesan kesalahan.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    //Mengautentikasi pengguna dengan memeriksa kredensial (email dan kata sandi) dan mengirimkan token JWT jika berhasil.
    //req: Objek permintaan dari Express.js yang berisi data login pengguna.
    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    //next: Fungsi middleware berikutnya dalam Express.js (tidak digunakan dalam fungsi ini tetapi bisa digunakan untuk penanganan kesalahan).
    static async login(req, res, next) {
        //try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses login.
        //Destrukturisasi: Mengambil email dan password dari body permintaan (req.body).
        //User.findOne({ email }): Mencari pengguna di database berdasarkan email.
        //if (!user): Jika pengguna tidak ditemukan, buat kesalahan dengan pesan "Email not found" dan status 401 (Unauthorized), kemudian lempar kesalahan tersebut.
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                const error = new Error('Email not found');
                error.statusCode = 401;
                throw error;
            }
            //bcrypt.compare(password, user.password): Memeriksa apakah kata sandi yang diberikan cocok dengan kata sandi yang dienkripsi di database.
            //if (!isValid): Jika kata sandi tidak cocok, buat kesalahan dengan pesan "Wrong password" dan status 401 (Unauthorized), kemudian lempar kesalahan tersebut.
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }
            //secretKey: Mengambil kunci rahasia dari variabel lingkungan (process.env.SECRET_KEY).
            //payload: Membuat payload token yang berisi informasi pengguna.
            //options: Menetapkan opsi token, termasuk waktu kedaluwarsa (1 jam).
            //jwt.sign(payload, secretKey, options): Membuat token JWT dengan payload, kunci rahasia, dan opsi yang ditentukan.
            //res.cookie('accessToken', token, {...}): Menyimpan token dalam cookie HTTP-only dengan waktu kedaluwarsa 1 jam.
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

            //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses dan token JWT.

            res.status(200).json({
                error: false,
                message: 'Success',
                token: token
            });

            //catch: Menangkap kesalahan yang terjadi selama proses login dan mengirimkan respons dengan status 500 (Internal Server Error) serta pesan kesalahan.
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    //Memperbarui atau melengkapi profil pengguna dengan informasi seperti fullName, email, telp, role, dan shopName.
    
    static async completeProfile(req, res, next) {
        //try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses lengkapkan profil.
        //Destrukturisasi: Mengambil fullName, email, telp, role, dan shopName dari body permintaan (req.body).
        //req.user.id: Mengambil ID pengguna dari objek user yang ada di dalam req (biasanya disediakan oleh mekanisme autentikasi sebelumnya).
        //User.findByIdAndUpdate(userID, { ... }): Mencari pengguna berdasarkan userID dan mengupdate dokumen pengguna dengan data baru yang diberikan.
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

            //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses serta data pengguna yang sudah diperbarui.

            res.status(200).json({
                error: false,
                message: 'Success',
                data: user
            });
        }
        //catch: Menangkap kesalahan yang terjadi selama proses melengkapi profil dan mengirimkan respons dengan status 500 (Internal Server Error) serta pesan kesalahan.
        catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

   
    // Mengambil dan mengirimkan data profil pengguna yang sedang terautentikasi.
    //req: Objek permintaan dari Express.js yang berisi informasi permintaan, termasuk data pengguna yang terautentikasi.//res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    //next: Fungsi middleware berikutnya dalam Express.js (tidak digunakan dalam fungsi ini tetapi bisa digunakan untuk penanganan kesalahan).

    static async getUserProfile(req, res, next) {
        //try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses mengambil profil pengguna.
        //req.user.id: Mengambil ID pengguna dari objek user yang ada di dalam req (biasanya disediakan oleh mekanisme autentikasi sebelumnya).
        //User.findById(userID): Mencari pengguna berdasarkan userID yang terautentikasi.
        try {
            const userID = req.user.id;
            const user = await User.findById(userID);

            //Jika tidak ada pengguna yang ditemukan berdasarkan ID yang diberikan, sebuah kesalahan dibuat dengan pesan "User not found" dan status 404 (Not Found), kemudian kesalahan dilempar.
            
            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

            //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses serta data profil pengguna yang ditemukan.
    
            res.status(200).json({
                error: false,
                message: 'Success',
                data: user
            });
            //catch: Menangkap kesalahan yang terjadi selama proses mengambil profil pengguna dan mengirimkan respons dengan status kesalahan yang sesuai (dapat berasal dari error.statusCode jika ada atau default 500) serta pesan kesalahan yang sesuai (dapat berasal dari error.message jika ada atau pesan default "Internal Server Error").
        } catch (error) {
            res.status(error.statusCode || 500).json({
                error: true,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    //Mengambil semua profil pengguna yang ada dalam database.
    //req: Objek permintaan dari Express.js (tidak digunakan secara langsung dalam fungsi ini).
    //res: Objek respons dari Express.js untuk mengirimkan respons HTTP.
    //next: Fungsi middleware berikutnya dalam Express.js (tidak digunakan dalam fungsi ini tetapi bisa digunakan untuk penanganan kesalahan).
    static async getAllUserProfiles(req, res, next) {
        //try-catch: Digunakan untuk menangkap dan menangani kesalahan yang mungkin terjadi selama proses mengambil data profil pengguna.
        //User.find({}): Mengambil semua dokumen pengguna dari koleksi pengguna (User) dalam database.
        try {
            const users = await User.find({});
            //res.status(200).json(...): Mengirimkan respons dengan status 200 (OK) dan objek JSON yang berisi pesan sukses serta array users yang berisi semua profil pengguna yang ditemukan.
            res.status(200).json({
                error: false,
                message: 'Success',
                data: users
            });
            //Menangkap kesalahan yang terjadi selama proses mengambil data profil pengguna dan mengirimkan respons dengan status 500 (Internal Server Error) serta pesan kesalahan yang sesuai (error.message jika ada atau pesan default "Internal Server Error").
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    static async resetPassword(req, res, next) {
        try {
            //Mengambil oldPassword dan newPassword dari req.body.
            const { oldPassword, newPassword } = req.body;
            console.log(req.body);
            //Mengambil ID pengguna dari req.user.
            const userID = req.user.id;
            //Mengambil data pengguna dari database berdasarkan ID menggunakan User.findById(userID).
            const user = await
                User.findById(userID);
            //Memeriksa apakah oldPassword yang dimasukkan benar dengan menggunakan bcrypt.compare.
            //Jika oldPassword tidak benar, fungsi akan melempar error dengan status 401 (Unauthorized).
            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }
            //Meng-hash newPassword dengan menggunakan bcrypt.hash.
            const hash = await bcrypt.hash(newPassword, 12);
            //Meng-update password pengguna dengan password baru yang sudah di-hash dan menyimpannya ke database menggunakan user.save().
            user.password = hash;
            await user.save();
            //Mengirim respons dengan status 200 (OK) dan pesan sukses jika operasi berhasil, atau menangkap kesalahan dan mengirim respons dengan status 500 (Internal Server Error) jika terjadi masalah.
            res.status(200).json({
                error: false,
                message: 'Success update password'
            });g
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
            //Mengambil email dari req.body
            const { email } = req.body;
            console.log(req.body);
            //Mencari pengguna berdasarkan email di database menggunakan User.findOne({ email }).
            const user = await User.findOne({ email });
            //Jika pengguna tidak ditemukan, fungsi akan melempar error dengan status 404 (Not Found).
            if (!user) {
                const error = new Error('Email not found');
                error.statusCode = 404;
                throw error;
            }

            //Meng-generate token acak untuk reset password menggunakan crypto.randomBytes.
            //crypto. rantomBytes =  enkiripsi password (biar pengguna aja yang tahu)
            //hex = konvert token agar tidak terlalu panjang

            // Generate a reset token and expiration time
            const resetToken = crypto.randomBytes(3).toString('hex');
            //Menetapkan waktu kedaluwarsa token (1 jam dari saat ini) dalam variabel resetTokenExpiration.
            const resetTokenExpiration = Date.now() + 6000000; // 1 jam
            console.log(resetToken);
            //Menyimpan resetToken dan resetTokenExpiration ke dalam database pengguna.
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
            //Mengirim email notifikasi menggunakan nodemailer yang berisi resetToken sebagai bagian dari template email yang di-render menggunakan ejs.
            const emailTemplate = await ejs.renderFile('./views/resetPasswordEmail.ejs', { fullName: user.fullName, resetToken: resetToken });
            console.log(emailTemplate);
            const mailOptions = {
                to: user.email,
                from: process.env.EMAIL_USER,
                subject: 'Password Reset',
                html: emailTemplate
            };

            await transporter.sendMail(mailOptions);
            //Mengirim respons dengan status 200 (OK) dan pesan sukses jika email berhasil dikirim, atau menangkap kesalahan dan mengirim respons dengan status 500 (Internal Server Error) jika terjadi masalah.

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
    //Mengambil token dan newPassword dari req.body
    static async newPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            //Mencari pengguna berdasarkan resetPasswordToken yang sesuai dengan token yang diberikan, 
            //dan memastikan bahwa resetPasswordExpires masih berlaku menggunakan { $gt: Date.now() }
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() } // Ensure the token is still valid
            });

            if (!user) {
                const error = new Error('Password reset token is invalid or has expired');
                //Jika token tidak valid atau sudah kedaluwarsa, fungsi akan melempar error dengan status 400 (Bad Request).
                error.statusCode = 400;
                throw error;
            }
            //Meng-hash newPassword menggunakan bcrypt.hash.
            const hash = await bcrypt.hash(newPassword, 12);
            //Meng-update password pengguna dengan password baru yang sudah di-hash.
            user.password = hash;
            //Menghapus token reset password (resetPasswordToken dan resetPasswordExpires) dari database pengguna.
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

    // Mendapatkan semua pengguna dengan peran Customer
    static async getCustomers(req, res, next) {
        try {
            const customers = await User.find({ role: 'Customer' });
            res.status(200).json({
                error: false,
                message: 'Success',
                data: customers
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    // Mendapatkan semua pengguna dengan peran Seller
    static async getSellers(req, res, next) {
        try {
            const sellers = await User.find({ role: 'Seller' });
            res.status(200).json({
                error: false,
                message: 'Success',
                data: sellers
            });
        } catch (error) {
            res.status(500).json({
                error: true,
                message: error.message
            });
        }
    }

    
    }

module.exports = UserController;