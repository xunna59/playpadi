const axios = require('axios');
const crypto = require('crypto');
const { User, PaymentAuthorizationToken } = require('../models');
const { validationResult } = require('express-validator');




const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const saveAuthorizationToken = async ({
    userId,
    token,
    last_four,
    cardType,
    expMonth,
    expYear,
}) => {
    try {
        await PaymentAuthorizationToken.upsert(
            {
                user_id: userId,
                token,
                last_four,
                cardType,
                expMonth,
                expYear,
            },
            {
                where: { user_id: userId },
            }
        );
        return true;
    } catch (error) {
        console.error('Error saving authorization token:', error);
        return false;
    }
};




const paymentController = {

    initializePayment: async (req, res, next) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false, errors: errors.array().map(err => ({
                    msg: err.msg,
                    key: err.path,
                })),
            });
        }

        try {
            const userId = req.user.id;


            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ success: false, error: 'authentication required' });
            }



            const email = user.email;


            const amount = 100;


            const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY


            const amountInKobo = Math.round(amount * 100);

            const callbackUrl = `${process.env.CLIENT_URL}/payment/paystack/verify`;

            const response = await axios.post(

                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                {
                    email,
                    amount: amountInKobo,
                    callback_url: callbackUrl,
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            // await Transaction.create({
            //     invoice_id: invoice.id, // Store the invoice ID for reference
            //     method: 'e-deposit',
            //     reference: response.data.data.reference,
            //     amount,
            //     transaction_status: 'pending',
            //     transaction_type: payment_reason,
            // });

            res.status(200).json({
                success: true,
                authorization_url: response.data.data.authorization_url,
            });
        } catch (error) {
            next(error);
        }
    },


    chargePayment: async (req, res, next) => {

        try {
            const userId = req.user.id;
            const email = req.user.email;
            const { amount } = req.body;

            // Fetch the authorization token for the user
            const tokenRecord = await PaymentAuthorizationToken.findOne({
                where: { user_id: userId },
            });

            if (!tokenRecord) {
                return res.status(404).json({ error: 'No saved payment method found' });
            }

            const { token: authorization_code } = tokenRecord;

            // Proceed to charge the stored card
            const response = await axios.post(
                `${PAYSTACK_BASE_URL}/transaction/charge_authorization`,
                {
                    email,
                    amount,
                    authorization_code,
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data.data;
            res.status(200).json(data);
        } catch (error) {
            console.error(error.response?.data || error.message);
            res.status(500).json({ error: 'Fast charge failed' });
        }
    },





    // Verify Payment
    verifyPayment: async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    msg: err.msg,
                    key: err.path,
                })),
            });
        }
        try {
            //  const { reference } = req.query;
            const { reference } = req.params;

            if (!reference) {
                return res.status(400).json({ success: false, message: 'Reference is required' });
            }

            // Fetch the Paystack secret key from the database
            const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

            // Proceed with verifying the payment using the reference
            const response = await axios.get(
                `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            const data = response.data.data;

            if (data.status === "success") {
                const authorization = data.authorization;

                const reusableToken = authorization.authorization_code; // e.g. AUTH_8dfhjjdt
                const last4 = authorization.last4;
                const cardType = authorization.card_type;
                const expMonth = authorization.exp_month;
                const expYear = authorization.exp_year;

                // Save reusableToken to DB (with userId)
                const saved = await saveAuthorizationToken({
                    userId: req.user.id,
                    token: reusableToken,
                    last_four: last4,
                    cardType,
                    expMonth,
                    expYear,
                });

                if (!saved) {
                    return res.status(500).json({ success: false, message: 'Failed to store card details' });
                }

                return res.json({ status: "success", reusableToken });
            }

        } catch (error) {
            next(error);
        }
    },


    // Handle Webhook
    handleWebhook: async (req, res, next) => {
        try {
            // Fetch the Paystack secret key from the database
            const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;;

            const secret = PAYSTACK_SECRET_KEY; // Use the secret key for signature validation
            const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

            if (hash === req.headers['x-paystack-signature']) {
                const event = req.body;

                if (event.event === 'charge.success') {
                    const { reference, amount } = event.data;

                    // Update or create transaction in the database
                    await Transaction.upsert({
                        reference,
                        amount: amount / 100, // Convert from kobo
                        transaction_status: 'successful',
                    });

                    return res.sendStatus(200); // Acknowledge receipt
                }

                return res.sendStatus(400); // Event not handled
            }

            res.sendStatus(401); // Unauthorized
        } catch (error) {
            next(error);
        }
    },

    getSavedCards: async (req, res, next) => {
        try {
            const userId = req.user.id;

            const cards = await PaymentAuthorizationToken.findAll({
                where: { user_id: userId },
                attributes: ['id', 'last4', 'cardType', 'expMonth', 'expYear', 'created_at'],
                order: [['created_at', 'DESC']],
            });

            res.status(200).json({
                success: true,
                count: cards.length,
                cards,
            });
        } catch (error) {
            console.error('Error fetching saved cards:', error);
            res.status(500).json({ success: false, message: 'Unable to retrieve cards' });
        }
    }




};

module.exports = paymentController;