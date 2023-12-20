class indexController {
    static async index(req, res, next) {
        res.render('index', { title: 'Express' });
    }
}

module.exports = indexController;