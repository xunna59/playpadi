

const dashboardController = {

    renderDashboard: async (req, res, next) => {

        try {



            return res.render('dashboard', {
                title: 'Dashboard',

                admin: req.admin,


            });


        } catch (error) {
            next(error);
        }





    }
};

module.exports = dashboardController;
