const Contact = require('../models/Contact');

// POST /api/contact
const submitContact = async (req, res) => {
  try {
    const { fullName, email, phone, company, serviceType, message } = req.body;

    const newContact = new Contact({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      company: company ? company.trim() : undefined,
      serviceType,
      message: message.trim(),
      submittedAt: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    });

    const savedContact = await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: savedContact._id,
        submittedAt: savedContact.submittedAt,
      },
    });

    console.log(`New contact submission: ${savedContact._id} from ${email}`);
  } catch (error) {
    console.error('Contact form submission error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A submission with this email already exists',
        details: ['Email address already used'],
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.',
      details: ['Server error occurred'],
    });
  }
};

// GET /api/contacts
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-ipAddress -userAgent');

    const total = await Contact.countDocuments();

    if (req.query.simple === 'true') {
      return res.json(contacts);
    }

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts',
    });
  }
};

// GET /api/contact/:id
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact',
    });
  }
};

// PATCH /api/contacts/:id
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, respondedAt, respondedBy, adminNotes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'responded', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        details: [`Status must be one of: ${validStatuses.join(', ')}`],
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (respondedAt) updateData.respondedAt = new Date(respondedAt);
    if (respondedBy) updateData.respondedBy = respondedBy;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updatedContact = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact,
    });

    console.log(`Contact ${id} updated by ${respondedBy || 'admin'}. Status: ${status}`);
  } catch (error) {
    console.error('Error updating contact:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid contact ID',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update contact',
    });
  }
};

// DELETE /api/contacts/:id
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    await Contact.findByIdAndDelete(id);

    res.json({ success: true, message: 'Contact deleted successfully' });

    console.log(`Contact ${id} deleted by admin`);
  } catch (error) {
    console.error('Error deleting contact:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid contact ID',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete contact',
    });
  }
};

// GET /api/contacts/stats
const getContactStats = async (req, res) => {
  try {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const [total, pending, reviewed, responded, closed, recent, serviceBreakdown] =
      await Promise.all([
        Contact.countDocuments(),
        Contact.countDocuments({ status: 'pending' }),
        Contact.countDocuments({ status: 'reviewed' }),
        Contact.countDocuments({ status: 'responded' }),
        Contact.countDocuments({ status: 'closed' }),
        Contact.countDocuments({ submittedAt: { $gte: recentDate } }),
        Contact.aggregate([
          { $group: { _id: '$serviceType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

    res.json({
      success: true,
      data: { total, pending, reviewed, responded, closed, recent, serviceBreakdown },
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
};