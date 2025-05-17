const { Faqs } = require('../models');
const { validationResult } = require('express-validator');



const faqController = {
    // Create FAQ
    createFaq: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { question, answer } = req.body;
            const faq = await Faqs.create({ question, answer });

            return res.status(201).json({ message: 'FAQ created successfully', faq });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Get All FAQs
    getAllFaqs: async (req, res) => {
        try {

            const faqs = await Faqs.findAll();
            return res.status(200).json({ success: true, message: 'FAQs', data: faqs });

        } catch (error) {

            return res.status(500).json({ error: error.message });

        }
    },

    // Get Single FAQ
    getFaqById: async (req, res) => {
        try {
            const { id } = req.params;
            const faq = await Faqs.findByPk(id);
            if (!faq) {
                return res.status(404).json({ message: 'FAQ not found' });
            }
            return res.status(200).json({ success: true, message: 'FAQ', faq });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Update FAQ
    updateFaq: async (req, res) => {
        try {
            const { id } = req.params;
            const { question, answer } = req.body;

            const faq = await Faqs.findByPk(id);
            if (!faq) {
                return res.status(404).json({ message: 'FAQ not found' });
            }

            await faq.update({ question, answer });
            return res.status(200).json({ message: 'FAQ updated successfully', faq });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Delete FAQ
    deleteFaq: async (req, res) => {
        try {
            const { id } = req.params;
            const faq = await Faqs.findByPk(id);
            if (!faq) {
                return res.status(404).json({ message: 'FAQ not found' });
            }

            await faq.destroy();
            return res.status(200).json({ message: 'FAQ deleted successfully' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
};

module.exports = faqController;
