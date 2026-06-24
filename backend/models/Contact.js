const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
    match: [/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    index: true // For faster queries
  },
  
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty phone numbers, but validate if provided
        return !v || /^[\+]?[1-9][\d\s\-\(\)]{7,20}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  
  company: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: {
      values: ['patents', 'trademarks', 'copyrights', 'ip-litigation', 'licensing', 'consultation'],
      message: 'Please select a valid service type'
    }
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'responded', 'closed'],
    default: 'pending'
  },
  
  // Metadata for tracking and security
  ipAddress: {
    type: String,
    required: false
  },
  
  userAgent: {
    type: String,
    required: false
  },
  
  // Admin notes (for internal use)
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  
  // Response tracking
  respondedAt: {
    type: Date
  },
  
  respondedBy: {
    type: String // Could be admin username or ID
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'contacts'
});

// Index for efficient queries
contactSchema.index({ submittedAt: -1 });
contactSchema.index({ email: 1, submittedAt: -1 });
contactSchema.index({ status: 1, submittedAt: -1 });

// Virtual for formatted submission date
contactSchema.virtual('formattedSubmissionDate').get(function() {
  return this.submittedAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for service type display name
contactSchema.virtual('serviceTypeDisplay').get(function() {
  const serviceMap = {
    'patents': 'Patents',
    'trademarks': 'Trademarks',
    'copyrights': 'Copyrights',
    'ip-litigation': 'IP Litigation',
    'licensing': 'Licensing',
    'consultation': 'General Consultation'
  };
  return serviceMap[this.serviceType] || this.serviceType;
});

// Static method to get contacts by service type
contactSchema.statics.findByServiceType = function(serviceType) {
  return this.find({ serviceType }).sort({ submittedAt: -1 });
};

// Static method to get recent contacts
contactSchema.statics.findRecent = function(days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.find({ 
    submittedAt: { $gte: dateThreshold } 
  }).sort({ submittedAt: -1 });
};

// Instance method to mark as responded
contactSchema.methods.markAsResponded = function(respondedBy) {
  this.status = 'responded';
  this.respondedAt = new Date();
  this.respondedBy = respondedBy;
  return this.save();
};

// Pre-save middleware
contactSchema.pre('save', async function() {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  // Clean up phone number formatting
  if (this.phone) {
    this.phone = this.phone.replace(/\s+/g, ' ').trim();
  }
});

// Export the model
const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact; 