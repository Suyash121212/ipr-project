const Patent = require('../models/Patent');
const uploadUtils = require('../middleware/upload');
const fs = require('fs');
const uploadPatentFile = require("../utils/uploadPatentToCloudinary");
const axios = require("axios");
// ============================================
// STATS & ADMIN
// ============================================

const getStats = async (req, res) => {
    try {
        const [
            totalPatents,
            draftPatents,
            submittedPatents,
            underExaminationPatents,
            grantedPatents,
            publishedPatents,
            patentTypeStats
        ] = await Promise.all([
            Patent.countDocuments(),
            Patent.countDocuments({ status: 'draft' }),
            Patent.countDocuments({ status: 'submitted' }),
            Patent.countDocuments({ status: 'under-examination' }),
            Patent.countDocuments({ status: 'granted' }),
            Patent.countDocuments({ status: 'published' }),
            Patent.aggregate([{ $group: { _id: '$patentType', count: { $sum: 1 } } }])
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPatents = await Patent.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        res.json({
            success: true,
            data: {
                total: totalPatents,
                draft: draftPatents,
                submitted: submittedPatents,
                underExamination: underExaminationPatents,
                granted: grantedPatents,
                published: publishedPatents,
                recent: recentPatents,
                patentTypeBreakdown: patentTypeStats
            }
        });
    } catch (error) {
        console.error('Error fetching patent stats:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while fetching statistics' });
    }
};

// ============================================
// ALL PATENTS (Admin)
// ============================================

const getAllPatents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.patentType) filter.patentType = req.query.patentType;
        if (req.query.clerkUserId) filter.clerkUserId = req.query.clerkUserId;

        const [patents, total] = await Promise.all([
            Patent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Patent.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: patents,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error fetching patents:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while fetching patent applications' });
    }
};

// ============================================
// USER-SCOPED QUERIES
// ============================================

const getUserPatentCount = async (req, res) => {
    try {
        const { clerkUserId } = req.params;

        const [total, draft, submitted, underExamination, granted, published, rejected] = await Promise.all([
            Patent.countDocuments({ clerkUserId }),
            Patent.countDocuments({ clerkUserId, status: 'draft' }),
            Patent.countDocuments({ clerkUserId, status: 'submitted' }),
            Patent.countDocuments({ clerkUserId, status: 'under-examination' }),
            Patent.countDocuments({ clerkUserId, status: 'granted' }),
            Patent.countDocuments({ clerkUserId, status: 'published' }),
            Patent.countDocuments({ clerkUserId, status: 'rejected' })
        ]);

        res.json({ success: true, data: { total, draft, submitted, underExamination, granted, published, rejected } });
    } catch (error) {
        console.error('Error fetching patent count:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while fetching patent count' });
    }
};

const getUserPatents = async (req, res) => {
    try {
        const { clerkUserId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [patents, total] = await Promise.all([
            Patent.find({ clerkUserId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Patent.countDocuments({ clerkUserId })
        ]);

        res.json({
            success: true,
            data: patents,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error fetching user patents:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while fetching patent applications' });
    }
};

const getUserPatentById = async (req, res) => {
    try {
        const { clerkUserId, patentId } = req.params;

        const patent = await Patent.findOne({
            clerkUserId,
            $or: [{ _id: patentId }, { applicationNumber: patentId }]
        });

        if (!patent) {
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        res.json({ success: true, data: patent });
    } catch (error) {
        console.error('Error fetching patent details:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while fetching patent details' });
    }
};

// ============================================
// CRUD
// ============================================

const createPatent = async (req, res) => {
    try {
        const payload = req.body;

        if (!payload.inventionTitle) {
            return res.status(400).json({ success: false, error: 'Invention title is required' });
        }
        if (!payload.clerkUserId) {
            return res.status(400).json({ success: false, error: 'User authentication required' });
        }

        const patent = new Patent(payload);
        const savedPatent = await patent.save();

        res.status(201).json({
            success: true,
            message: 'Patent application created successfully',
            data: savedPatent
        });
    } catch (error) {
        console.error('Error creating patent:', error);

        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ success: false, message: 'Validation error', errors });
        }

        res.status(400).json({ success: false, error: 'Failed to create patent application', details: error.message });
    }
};

const getPatentById = async (req, res) => {
    try {
        const patent = await Patent.findOne({
            $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }]
        });

        if (!patent) {
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        res.json({ success: true, data: patent });
    } catch (error) {
        console.error('Error fetching patent:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while fetching patent application' });
    }
};

const updatePatent = async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['status', 'currentStep', 'currentStage', 'applicationNumber', 'filingDate'];

        const filteredUpdates = {};
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
        });

        if (filteredUpdates.currentStage !== undefined) {
            filteredUpdates.currentStage = Number(filteredUpdates.currentStage);
        }

        const patent = await Patent.findOneAndUpdate(
            { $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }] },
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        );

        if (!patent) {
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        res.json({ success: true, message: 'Patent application updated successfully', data: patent });
    } catch (error) {
        console.error('Error updating patent:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while updating patent application' });
    }
};

const deletePatent = async (req, res) => {
    try {
        const { clerkUserId, isAdmin } = req.body;

        const patent = await Patent.findOne({
            $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }]
        });

        if (!patent) {
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        if (!isAdmin && clerkUserId && patent.clerkUserId !== clerkUserId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own applications.'
            });
        }

        const allFiles = [...(patent.technicalDrawings || []), ...(patent.supportingDocuments || [])];
        allFiles.forEach(file => {
            try {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            } catch (fileError) {
                console.error(`Error deleting file ${file.path}:`, fileError);
            }
        });

        await Patent.findByIdAndDelete(patent._id);

        res.json({ success: true, message: 'Patent application deleted successfully' });
    } catch (error) {
        console.error('Error deleting patent:', error);
        res.status(500).json({ success: false, message: 'Server error occurred while deleting patent application' });
    }
};

// ============================================
// FILE UPLOADS
// ============================================

const uploadTechnicalDrawings = async (req, res) => {
    try {
        const patent = await Patent.findById(req.params.id);
        if (!patent) {
            req.files?.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        const drawings = await Promise.all(
            req.files.map(async (file) => {

                const result = await uploadPatentFile(
                    file,
                    "technical-drawings"
                );
                return {
                    originalName: file.originalname,
                    cloudinaryUrl: result.secure_url,
                    download_url: result.secure_url.replace("/upload/", "/upload/fl_attachment/"),
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadDate: new Date()
                };

            })
        );

        patent.technicalDrawings.push(...drawings);
        await patent.save();

        res.json({ success: true, message: 'Technical drawings uploaded successfully', data: drawings });
    } catch (error) {
        console.error('Error uploading technical drawings:', error);
        req.files?.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
        res.status(500).json({ success: false, message: 'Failed to upload technical drawings', details: error.message });
    }
};

const uploadSupportingDocuments = async (req, res) => {
    try {
        const patent = await Patent.findById(req.params.id);
        if (!patent) {
            req.files?.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        const documents = await Promise.all(
            req.files.map(async (file) => {

                const result = await uploadPatentFile(
                    file,
                    "supporting-documents"
                );

                return {
                    originalName: file.originalname,
                    cloudinaryUrl: result.secure_url,
                    download_url: result.secure_url.replace("/upload/", "/upload/fl_attachment/"),
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadDate: new Date()
                };

            })
        );

        patent.supportingDocuments.push(...documents);
        await patent.save();

        res.json({ success: true, message: 'Supporting documents uploaded successfully', data: documents });
    } catch (error) {
        console.error('Error uploading supporting documents:', error);
        req.files?.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
        res.status(500).json({ success: false, message: 'Failed to upload supporting documents', details: error.message });
    }
};

// ============================================
// PATCH HELPERS
// ============================================

const updateCompletedDocuments = async (req, res) => {
    try {
        const patent = await Patent.findById(req.params.id);
        if (!patent) {
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        patent.completedDocuments = req.body.documentIds || [];
        await patent.save();

        res.json({ success: true, message: 'Completed documents updated successfully', data: patent });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update completed documents', details: error.message });
    }
};

const updateStep = async (req, res) => {
    try {
        const { step } = req.body;
        if (typeof step !== 'number' || step < 1 || step > 6) {
            return res.status(400).json({ success: false, message: 'Invalid step value' });
        }

        const patent = await Patent.findByIdAndUpdate(
            req.params.id,
            { currentStep: step },
            { new: true }
        );

        if (!patent) {
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        res.json({ success: true, message: 'Step updated successfully', data: patent });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update step', details: error.message });
    }
};

// ============================================
// FILE DOWNLOAD & CERTIFICATE
// ============================================

const downloadFile = async (req, res) => {
  try {
    const Patent = require("../models/Patent");
    const patent = await Patent.findById(req.params.id);
 
    if (!patent) {
      return res.status(404).json({ success: false, message: "Patent application not found" });
    }
 
    const file = [
      ...(patent.technicalDrawings || []),
      ...(patent.supportingDocuments || []),
    ].find((f) => f._id?.toString() === req.params.fileId);
 
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
 
    // Prefer the explicit download_url we stored; fall back to secure_url
    // const cloudinaryUrl = file.download_url || file.secure_url || file.url;
    const cloudinaryUrl = file.download_url || file.cloudinaryUrl;
 
    if (!cloudinaryUrl) {
      return res.status(404).json({ success: false, message: "No download URL on file record" });
    }
 
    // Ensure fl_attachment is in the URL so Cloudinary sends the right headers
    const downloadUrl = cloudinaryUrl.includes("fl_attachment")
      ? cloudinaryUrl
      : cloudinaryUrl.replace("/upload/", "/upload/fl_attachment/");
 
    // Proxy the file through your server so the browser sees your domain
    const response = await axios.get(downloadUrl, { responseType: "stream" });
 
    const filename = file.originalName || file.original_filename || file.filename || "download";
    const contentType = response.headers["content-type"] || "application/octet-stream";
 
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Content-Type", contentType);
 
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }
 
    response.data.pipe(res);
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ success: false, message: "Failed to download file", details: error.message });
  }
};

const getCertificate = async (req, res) => {
    try {
        const patent = await Patent.findById(req.params.id);
        if (!patent) {
            return res.status(404).json({ success: false, message: 'Patent application not found' });
        }

        if (!['granted', 'published', 'approved'].includes(patent.status)) {
            return res.json({
                success: false,
                message: 'Certificate not yet issued',
                status: patent.status,
                currentStep: patent.currentStep
            });
        }

        res.json({
            success: true,
            message: 'Certificate available',
            applicationNumber: patent.applicationNumber,
            grantedOn: patent.updatedAt
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch certificate', details: error.message });
    }
};

module.exports = {
    getStats,
    getAllPatents,
    getUserPatentCount,
    getUserPatents,
    getUserPatentById,
    createPatent,
    getPatentById,
    updatePatent,
    deletePatent,
    uploadTechnicalDrawings,
    uploadSupportingDocuments,
    updateCompletedDocuments,
    updateStep,
    downloadFile,
    getCertificate
};  