// Dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();
const User = require('./models/user');
const Claim = require('./models/messClaim');
const RefundRequest = require('./models/refundRequest');
const { ServerSettings } = require('./models/superadmin_setting');
const { Fest, FestMember } = require('./models/fest'); // ← NEW

const app = express();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

const serializeUser = (user) => {
  const rawUser = user?.toObject ? user.toObject() : user;
  const nestedBankDetails = rawUser?.studentProfile?.bankDetails || {};
  const flatBankDetails = rawUser?.bankDetails || {};
  return {
    _id: rawUser._id,
    fullName: rawUser.fullName,
    studentId: rawUser.studentId,
    email: rawUser.email,
    isSuperAdmin: rawUser.isSuperAdmin || false,
    isSecretary: rawUser.isSecretary || false,
    department: rawUser.department || 'general',
    institution: rawUser.institution || '',
    phone: rawUser.phone || '',
    hostel: rawUser.hostel || '',
    block: rawUser.block || '',
    roomNumber: rawUser.roomNumber || '',
    admissionYear: rawUser.admissionYear || '',
    messName: rawUser.messName || '',
    profilePicUrl: rawUser.profilePicUrl || '',
    bankDetails: {
      accountHolderName: nestedBankDetails.accountHolderName || flatBankDetails.accountHolderName || '',
      bankName: nestedBankDetails.bankName || flatBankDetails.bankName || '',
      accountNumber: nestedBankDetails.accountNumber || flatBankDetails.accountNumber || '',
      ifscCode: nestedBankDetails.ifscCode || flatBankDetails.ifscCode || ''
    }
  };
};

const createClaimId = (prefix = 'CLM') => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${random}`;
};

const mapUploadedFilesToAttachments = (files = []) =>
  files.map((file) => ({
    filename: file.originalname || file.filename,
    url: file.secure_url || file.path || file.url,
    mimetype: file.mimetype,
    uploadedAt: new Date(),
  }));

const normalizeClaim = (claimDoc) => {
  const claim = claimDoc.toObject ? claimDoc.toObject() : claimDoc;
  const attachments = Array.isArray(claim.attachments) ? claim.attachments : [];
  return {
    ...claim,
    attachments,
    receiptUrls: attachments.map((attachment) => attachment.url).filter(Boolean),
  };
};

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is working 🚀",
    timestamp: new Date().toISOString()
  });
});

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Set up the Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, file) => ({
    folder: 'RefundHub_Receipts',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    public_id: `${Date.now()}-${(file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')}`,
  })
});

// 3. Create the upload middleware
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPG, JPEG, PNG, and PDF files are allowed.'));
    }
    cb(null, true);
  }
});

const getUploadErrorMessage = (err) => {
  if (!err) return 'File upload failed.';
  if (err.code === 'LIMIT_FILE_SIZE') return 'Each file must be 5MB or smaller.';
  if (err.code === 'LIMIT_FILE_COUNT') return 'You can upload at most 5 files.';
  if (err.message?.includes('aborted')) {
    return 'Upload was interrupted before the file finished reaching the server. Please retry with a stable connection or a smaller file.';
  }
  return `File upload failed: ${err.message}`;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async ({ email, fullName, token }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS.');
  }

  const backendBaseUrl = process.env.BACKEND_URL || process.env.VITE_BASE_URL || `http://127.0.0.1:${process.env.PORT || 8000}`;
  const verificationUrl = `${backendBaseUrl.replace(/\/$/, '')}/api/verify/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your Refund Hub account',
    text: `Hello ${fullName}, verify your account here: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="color: #166534;">Verify your Refund Hub account</h2>
        <p>Hello ${fullName},</p>
        <p>Please confirm your email address to activate your account.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      </div>
    `
  });
};

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer config error:', error.message);
    console.error('   → Check EMAIL_USER and EMAIL_PASS in your .env file');
  } else {
    console.log('✅ Nodemailer is ready to send emails');
  }
});

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  process.env.VITE_FRONTEND_URL,
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("🚀 Connected to MongoDB Atlas!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// ─── STUDENT REGISTRATION ROUTE ───────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const {
      fullName, studentId, email, phone, password,
      accountHolderName, bankName, accountNumber, ifscCode
    } = req.body;

    const rollRegex = /^[12][0-9][012][123](AI|CB|CE|CS|CT|EC|EE|ES|MC|ME|MM|PH|PR|CM|GT|MT|PC|ST|VL)[0-9]{2}$/i;
    if (!rollRegex.test(studentId)) {
      return res.status(400).json({ message: "Invalid roll number format!" });
    }
    if (!/^\d{11,16}$/.test(String(accountNumber || '').trim())) {
      return res.status(400).json({ message: "Account number must be 11 to 16 digits because bank formats vary." });
    }
    if (!/^[A-Z]{4}\d{7}$/i.test(String(ifscCode || '').trim())) {
      return res.status(400).json({ message: "Invalid IFSC code format." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { studentId: studentId.toUpperCase() }]
    });
    if (existingUser) {
      return res.status(400).json({ message: "A student with this Email or Roll Number already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      fullName,
      studentId: studentId.toUpperCase(),
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      verificationToken: token,
      isVerified: false,
      userType: 'STUDENT',
      role: 'STUDENT',
      department: "general",
      studentProfile: {
        bankDetails: { accountHolderName, bankName, accountNumber, ifscCode }
      }
    });

    await newUser.save();

    try {
      await sendVerificationEmail({
        email: newUser.email,
        fullName: newUser.fullName,
        token
      });
    } catch (mailError) {
      await User.deleteOne({ _id: newUser._id });
      throw mailError;
    }

    res.status(201).json({ message: "Registration successful! Check your email." });

  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: err.message || "Server error during registration." });
  }
});

// ─── LOGIN ROUTE ──────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    res.status(200).json({
      message: "Login successful",
      user: serializeUser(user)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ─── SUBMIT FEST CLAIM ROUTE ──────────────────────────────────────────────────
app.post('/api/claims/fest', async (req, res) => {
  const uploadMiddleware = upload.array('receiptFiles', 5);

  uploadMiddleware(req, res, async function (err) {
    if (err) {
      console.error("Multer/Cloudinary Error:", err);
      return res.status(400).json({ message: getUploadErrorMessage(err) });
    }

    try {
      const { studentId, festName, team, transactionId, expenseAmount, expenseDescription } = req.body;

      const user = await User.findOne({ studentId: String(studentId).toUpperCase() });
      if (!user) return res.status(404).json({ message: "User not found." });

      const attachments = mapUploadedFilesToAttachments(req.files);

      if (attachments.length === 0) {
        return res.status(400).json({ message: "At least one document is required for fest claims." });
      }

      const newClaim = new RefundRequest({
        claimId: createClaimId('FEST'),
        student: user._id,
        studentRoll: user.studentId,
        requestType: 'FEST_REIMBURSEMENT',
        festName: festName,
        teamName: team,
        title: `${festName} Reimbursement`,
        amount: expenseAmount,
        transactionId: transactionId,
        description: expenseDescription,
        attachments,
        status: 'PENDING_TEAM_COORD',
        history: [{ action: 'SUBMITTED', byUser: user._id, byName: user.fullName, comments: 'Claim applied' }]
      });

      await newClaim.save();
      res.status(201).json({ message: "Claim submitted!", claim: normalizeClaim(newClaim) });

    } catch (dbErr) {
      console.error("Database Error:", dbErr);
      if (dbErr.code === 11000 && dbErr.keyPattern && dbErr.keyPattern.transactionId) {
        return res.status(400).json({ message: "This Transaction ID has already been used for another claim." });
      }
      res.status(500).json({ message: "Server error while saving claim to database." });
    }
  });
});

app.post('/api/claims/mess', async (req, res) => {
  const uploadMiddleware = upload.array('receiptFiles', 5);

  uploadMiddleware(req, res, async function (err) {
    if (err) {
      console.error("Multer/Cloudinary Error:", err);
      return res.status(400).json({ message: getUploadErrorMessage(err) });
    }

    try {
      const { studentId, fromDate, toDate, reason } = req.body;

      const user = await User.findOne({ studentId: String(studentId).toUpperCase() });
      if (!user) return res.status(404).json({ message: "User not found." });

      const absenceFrom = fromDate ? new Date(fromDate) : null;
      const absenceTo = toDate ? new Date(toDate) : null;

      if (!absenceFrom || Number.isNaN(absenceFrom.getTime())) {
        return res.status(400).json({ message: "Valid from date is required." });
      }
      if (!absenceTo || Number.isNaN(absenceTo.getTime())) {
        return res.status(400).json({ message: "Valid to date is required." });
      }
      if (absenceFrom > absenceTo) {
        return res.status(400).json({ message: "To date must be after from date." });
      }

      const millisPerDay = 1000 * 60 * 60 * 24;
      const absenceDays = Math.floor((absenceTo - absenceFrom) / millisPerDay) + 1;
      if (absenceDays < 5) {
        return res.status(400).json({ message: "Mess rebate is allowed only for absences of 5 days or more." });
      }

      const settings = await ServerSettings.getSettings();
      const dailyRate = settings?.messRebateRateDaily || 150;
      const attachments = mapUploadedFilesToAttachments(req.files);

      const newClaim = new RefundRequest({
        claimId: createClaimId('MESS'),
        student: user._id,
        studentRoll: user.studentId,
        requestType: 'MESS_REBATE',
        title: 'Mess Rebate Application',
        description: reason,
        amount: absenceDays * dailyRate,
        attachments,
        status: 'PENDING_MESS_MANAGER',
        messAbsenceFrom: absenceFrom,
        messAbsenceTo: absenceTo,
        messAbsenceDays: absenceDays,
        history: [{ action: 'SUBMITTED', byUser: user._id, byName: user.fullName, comments: 'Claim applied' }]
      });

      await newClaim.save();
      res.status(201).json({ message: "Mess rebate submitted!", claim: normalizeClaim(newClaim) });
    } catch (dbErr) {
      console.error("Database Error:", dbErr);
      res.status(500).json({ message: "Server error while saving mess rebate." });
    }
  });
});

app.post('/api/claims/hospital', async (req, res) => {
  req.on('aborted', () => {
    console.error('Hospital claim upload aborted by client before completion.');
  });

  const uploadMiddleware = upload.array('receiptFiles', 5);

  uploadMiddleware(req, res, async function (err) {
    if (err) {
      console.error("Multer/Cloudinary Error:", err);
      return res.status(400).json({ message: getUploadErrorMessage(err) });
    }

    try {
      const { studentId, hospitalName, treatmentDate, amount, description } = req.body;

      const user = await User.findOne({ studentId: String(studentId).toUpperCase() });
      if (!user) return res.status(404).json({ message: "User not found." });

      const claimTreatmentDate = treatmentDate ? new Date(treatmentDate) : null;
      if (!hospitalName || !hospitalName.trim()) {
        return res.status(400).json({ message: "Hospital name is required." });
      }
      if (!claimTreatmentDate || Number.isNaN(claimTreatmentDate.getTime())) {
        return res.status(400).json({ message: "Valid treatment date is required." });
      }
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: "Valid amount is required." });
      }

      const attachments = mapUploadedFilesToAttachments(req.files);
      if (attachments.length === 0) {
        return res.status(400).json({ message: "At least one medical bill is required." });
      }

      const treatmentDateText = claimTreatmentDate.toISOString().split('T')[0];

      const newClaim = new RefundRequest({
        claimId: createClaimId('MED'),
        student: user._id,
        studentRoll: user.studentId,
        requestType: 'MEDICAL_REBATE',
        title: `Medical Rebate - ${hospitalName}`,
        description: description?.trim()
          ? `${hospitalName} | Treatment Date: ${treatmentDateText} | ${description.trim()}`
          : `${hospitalName} | Treatment Date: ${treatmentDateText}`,
        amount: Number(amount),
        attachments,
        status: 'PENDING_ACADEMIC',
        history: [{ action: 'SUBMITTED', byUser: user._id, byName: user.fullName, comments: 'Claim applied' }]
      });

      await newClaim.save();
      res.status(201).json({ message: "Medical rebate submitted!", claim: normalizeClaim(newClaim) });
    } catch (dbErr) {
      console.error("Database Error:", dbErr);
      res.status(500).json({ message: "Server error while saving medical rebate." });
    }
  });
});

// ─── EMAIL VERIFICATION ROUTE ─────────────────────────────────────────────────
app.get('/api/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token, isVerified: false });

    if (!user) {
      const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${FRONTEND_URL}/verify?status=invalid`);
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${FRONTEND_URL}/verify?status=success`);

  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).send("<h2>Server error during verification. Please try again later.</h2>");
  }
});

// ─── UNIFIED UPDATE ROUTE ─────────────────────────────────────────────────────
app.put('/api/user/update', async (req, res) => {
  try {
    const {
      _id, studentId, fullName, email, phone, institution,
      department, hostel, block, roomNumber, admissionYear, messName, profilePicUrl, bankDetails
    } = req.body;

    if (phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
      }
    }

    let query = {};
    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({
          message: `Invalid Database ID: "${_id}". You are likely still using the mock 'superadmin_001' in your React code instead of a real MongoDB ID!`
        });
      }
      query = { _id: _id };
    } else if (studentId) {
      query = { studentId: studentId.toUpperCase() };
    } else {
      return res.status(400).json({ message: "ID or Student ID is required." });
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found in the database." });

    const updateFields = {};

    if (typeof fullName === 'string') updateFields.fullName = fullName;
    if (typeof phone === 'string') updateFields.phone = phone;
    if (typeof institution === 'string') updateFields.institution = institution;
    if (typeof department === 'string') updateFields.department = department;
    if (typeof hostel === 'string') updateFields.hostel = hostel;
    if (typeof block === 'string') updateFields.block = block;
    if (typeof roomNumber === 'string') updateFields.roomNumber = roomNumber;
    if (typeof admissionYear === 'string') updateFields.admissionYear = admissionYear;
    if (typeof messName === 'string') updateFields.messName = messName;
    if (typeof profilePicUrl === 'string') updateFields.profilePicUrl = profilePicUrl;

    if (!user.isSuperAdmin && user.role !== 'SUPER_ADMIN') {
      if (email) updateFields.email = email.toLowerCase();
    }

    if (bankDetails && typeof bankDetails === 'object') {
      if (bankDetails.accountNumber != null && !/^\d{11,16}$/.test(String(bankDetails.accountNumber))) {
        return res.status(400).json({ message: "Account number must be 11 to 16 digits because bank formats vary." });
      }
      if (bankDetails.ifscCode != null && !/^[A-Z]{4}\d{7}$/i.test(String(bankDetails.ifscCode))) {
        return res.status(400).json({ message: "Invalid IFSC code format." });
      }
      if (typeof bankDetails.accountHolderName === 'string') {
        updateFields['studentProfile.bankDetails.accountHolderName'] = bankDetails.accountHolderName;
      }
      if (typeof bankDetails.bankName === 'string') {
        updateFields['studentProfile.bankDetails.bankName'] = bankDetails.bankName;
      }
      if (typeof bankDetails.accountNumber === 'string') {
        updateFields['studentProfile.bankDetails.accountNumber'] = bankDetails.accountNumber;
      }
      if (typeof bankDetails.ifscCode === 'string') {
        updateFields['studentProfile.bankDetails.ifscCode'] = bankDetails.ifscCode.toUpperCase();
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Profile updated successfully!",
      user: serializeUser(updatedUser)
    });

  } catch (err) {
    console.error("Update Error:", err.message);
    res.status(500).json({ message: "Server error during profile update." });
  }
});

app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const user = await User.findById(id).select('-password -verificationToken -resetPasswordToken');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(serializeUser(user));
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error while fetching user profile." });
  }
});

// ─── GET ADMIN PROFILE ROUTE ──────────────────────────────────────────────────
app.get('/api/users/admin/profile', async (req, res) => {
  try {
    const admin = await User.findOne({
      $or: [
        { role: 'superadmin' },
        { role: 'Super Administrator' },
        { isSuperAdmin: true }
      ]
    }).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Superadmin not found in database' });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ message: 'Server error while fetching admin profile' });
  }
});

// ─── SEARCH USER BY ROLL NUMBER OR EMAIL ─────────────────────────────────────
app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.toString().trim()) {
      return res.status(400).json({ message: "Search query is required." });
    }

    const q = query.toString().trim();

    const user = await User.findOne({
      $or: [
        { studentId: q.toUpperCase() },
        { email: q.toLowerCase() }
      ]
    }).select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({ message: "No user found with that roll number or email." });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ message: "Server error while searching user." });
  }
});

// ─── UPDATE USER ROLE ─────────────────────────────────────────────────────────
app.put('/api/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !role.toString().trim()) {
      return res.status(400).json({ message: "Role is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role: role.toString().trim() } },
      { new: true }
    ).select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: `Role updated to '${role}' successfully!`,
      user
    });

  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ message: "Server error while updating role." });
  }
});

// ─── GET STUDENT DASHBOARD DATA ───────────────────────────────────────────────
app.get('/api/dashboard/:studentId', async (req, res) => {
  try {
    const user = await User.findOne({ studentId: req.params.studentId.toUpperCase() });
    if (!user) return res.status(404).json({ message: "User not found." });

    const claimDocs = await RefundRequest.find({ student: user._id }).sort({ createdAt: -1 });
    const claims = claimDocs.map(normalizeClaim);

    let totalRefunded = 0;
    let pendingCount = 0;
    let approvedThisMonth = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    claims.forEach(claim => {
      if (claim.status === 'REFUNDED') {
        totalRefunded += claim.amount;
      }
      if (claim.status === 'APPROVED' || claim.status === 'REFUNDED') {
        const claimMonth = new Date(claim.updatedAt).getMonth();
        const claimYear = new Date(claim.updatedAt).getFullYear();
        if (claimMonth === currentMonth && claimYear === currentYear) {
          approvedThisMonth++;
        }
      }
      if (claim.status.includes('PENDING')) {
        pendingCount++;
      }
    });

    res.status(200).json({
      stats: { totalRefunded, pendingCount, approvedThisMonth },
      recentClaims: claims
    });

  } catch (err) {
    console.error("Dashboard Fetch Error:", err);
    res.status(500).json({ message: "Server error fetching dashboard data." });
  }
});

// ─── GET ALL FESTS ─────────────────────────────────────────────────────────────
// Returns all fests so frontend can build festName → ObjectId map
app.get('/api/fests', async (req, res) => {
  try {
    const fests = await Fest.find({}).sort({ name: 1 });
    res.status(200).json(fests);
  } catch (error) {
    console.error("Error fetching fests:", error);
    res.status(500).json({ message: "Server error while fetching fests." });
  }
});

// ─── GET ALL ACTIVE FCs (FEST_COORDINATOR position, current academic year) ────
// Used by AppointFCPage to populate FC list dynamically from FestMember collection
app.get('/api/fest-members/fcs', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    // Academic year logic: if month >= July, it's currentYear-nextYear, else prevYear-currentYear
    const month = new Date().getMonth(); // 0-indexed
    const academicYear = month >= 6
      ? `${currentYear}-${String(currentYear + 1).slice(2)}`
      : `${currentYear - 1}-${String(currentYear).slice(2)}`;

    const members = await FestMember.find({
      position: 'FEST_COORDINATOR',
      isActive: true,
      academicYear,
    })
      .populate('user', 'fullName studentId email phone department')
      .populate('fest', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching FCs:", error);
    res.status(500).json({ message: "Server error while fetching FCs." });
  }
});

// ─── ASSIGN FC ─────────────────────────────────────────────────────────────────
// Creates a FestMember document and updates the user's role field
app.post('/api/fest-members/assign-fc', async (req, res) => {
  try {
    const { userId, festId, festName, addedBy } = req.body;

    // Validate required fields
    if (!userId || !festId || !festName) {
      return res.status(400).json({ message: "userId, festId, and festName are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId." });
    }
    if (!mongoose.Types.ObjectId.isValid(festId)) {
      return res.status(400).json({ message: "Invalid festId." });
    }

    // Compute current academic year
    const currentYear = new Date().getFullYear();
    const month = new Date().getMonth();
    const academicYear = month >= 6
      ? `${currentYear}-${String(currentYear + 1).slice(2)}`
      : `${currentYear - 1}-${String(currentYear).slice(2)}`;

    // Check if user already assigned as FC for this fest this year
    const existing = await FestMember.findOne({
      user: userId,
      fest: festId,
      academicYear,
      isActive: true,
    });
    if (existing) {
      return res.status(400).json({ message: "This student is already an FC for this fest." });
    }

    // Enforce max 2 FCs per fest per academic year
    const count = await FestMember.countDocuments({
      fest: festId,
      position: 'FEST_COORDINATOR',
      academicYear,
      isActive: true,
    });
    if (count >= 2) {
      return res.status(400).json({ message: "Maximum 2 FCs already assigned for this fest." });
    }

    // Validate addedBy if provided
    const addedByValue = addedBy && mongoose.Types.ObjectId.isValid(addedBy) ? addedBy : null;

    // Create FestMember record
    const newMember = new FestMember({
      user: userId,
      fest: festId,
      position: 'FEST_COORDINATOR',
      academicYear,
      addedBy: addedByValue,
      isActive: true,
    });
    await newMember.save();

    // Update user role to e.g. "Celesta_FC"
    const roleName = `${festName}_FC`;
    await User.findByIdAndUpdate(userId, { $set: { role: roleName } });

    // Return populated member for frontend use
    const populated = await FestMember.findById(newMember._id)
      .populate('user', 'fullName studentId email phone department')
      .populate('fest', 'name');

    res.status(201).json({
      message: `${festName} FC assigned successfully!`,
      member: populated,
    });

  } catch (error) {
    console.error("Assign FC error:", error);
    // Duplicate key from the unique index on { user, fest, academicYear }
    if (error.code === 11000) {
      return res.status(400).json({ message: "This student is already assigned to this fest for the current year." });
    }
    res.status(500).json({ message: "Server error while assigning FC." });
  }
});

// ─── REMOVE FC ─────────────────────────────────────────────────────────────────
// Soft-deletes the FestMember record and reverts the user's role back to STUDENT
app.delete('/api/fest-members/:memberId/remove-fc', async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid member ID." });
    }

    const member = await FestMember.findById(memberId).populate('user', '_id fullName');
    if (!member) {
      return res.status(404).json({ message: "FC record not found." });
    }

    // Soft-delete: mark isActive false instead of deleting
    member.isActive = false;
    await member.save();

    // Revert user role back to STUDENT
    await User.findByIdAndUpdate(member.user._id, { $set: { role: 'STUDENT' } });

    res.status(200).json({
      message: `FC removed. ${member.user.fullName}'s role reverted to STUDENT.`,
    });

  } catch (error) {
    console.error("Remove FC error:", error);
    res.status(500).json({ message: "Server error while removing FC." });
  }
});

// Health Check
app.get('/', (req, res) => res.send("Refund Hub API is running! 🟢"));

app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: "Backend is fully operational! 🚀",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Server running on port ${PORT}`);
});

// ─── ADMIN: FETCH CLAIMS BY STATUS ───────────────────────────────────────────
app.get('/api/admin/claims/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const claims = await RefundRequest.find({ status }).sort({ createdAt: 1 });
    res.status(200).json(claims);
  } catch (error) {
    console.error("Error fetching admin claims:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── ADMIN: UPDATE CLAIM STATUS ───────────────────────────────────────────────
app.post('/api/admin/update-status', async (req, res) => {
  try {
    const { claimId, status, remarks } = req.body;

    const updatedClaim = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        status: status,
        $push: { history: { status, date: new Date(), remarks: remarks || 'Processed by Verifier' } }
      },
      { new: true }
    );

    if (!updatedClaim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    res.status(200).json({ message: `Claim status updated to ${status}`, claim: updatedClaim });
  } catch (error) {
    console.error("Error updating claim status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── CHANGE PASSWORD ROUTE ────────────────────────────────────────────────────
app.post('/api/users/:id/change-password', async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server error while changing password." });
  }
});

// ─── GET PORTAL SETTINGS ──────────────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await ServerSettings.getSettings();
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
});

// ─── UPDATE PORTAL SETTINGS ───────────────────────────────────────────────────
app.put('/api/settings', async (req, res) => {
  try {
    const updateData = req.body;

    const updatedSettings = await ServerSettings.findOneAndUpdate(
      { _singleton: 'GLOBAL' },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Settings deployed successfully!",
      settings: updatedSettings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Server error while updating settings." });
  }
});

// ─── CREATE SECRETARY ROUTE ───────────────────────────────────────────────────
app.post('/api/admin/secretaries', async (req, res) => {
  try {
    const {
      fullName, employeeId, email, phone, password,
      department, isVerified, isSecretary, isSuperAdmin
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { studentId: employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "A user with this Email or ID already exists!" });
    }

    let assignedRole = 'TEAM_COORD';
    if (isSuperAdmin) {
      assignedRole = 'VP';
    } else {
      if (department === 'mess') assignedRole = 'MESS_MANAGER';
      else if (department === 'fest') assignedRole = 'FEST_COORD';
      else if (department === 'hospital') assignedRole = 'ACADEMIC';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSecretary = new User({
      fullName,
      studentId: employeeId,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      department: department || "general",
      userType: isSuperAdmin ? 'ADMIN' : 'SECRETARY',
      role: assignedRole,
      isVerified: true,
      isSecretary: true,
      isSuperAdmin: isSuperAdmin || false
    });

    await newSecretary.save();
    res.status(201).json({ message: "Secretary created successfully!", secretary: newSecretary });

  } catch (error) {
    console.error("Create Secretary Error:", error);
    res.status(500).json({ message: "Server error while creating secretary." });
  }
});

// ─── GET ALL SECRETARIES ──────────────────────────────────────────────────────
app.get('/api/admin/secretaries', async (req, res) => {
  try {
    const secretaries = await User.find({ isSecretary: true })
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 });
    res.status(200).json(secretaries);
  } catch (error) {
    console.error("Error fetching secretaries:", error);
    res.status(500).json({ message: "Server error while fetching secretaries." });
  }
});

// ─── DELETE SECRETARY ─────────────────────────────────────────────────────────
app.delete('/api/admin/secretaries/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Secretary not found." });
    res.status(200).json({ message: "Secretary removed successfully." });
  } catch (error) {
    console.error("Delete Secretary Error:", error);
    res.status(500).json({ message: "Server error while deleting secretary." });
  }
});

// ─── ADMIN: GET ALL SECRETARIES (legacy route kept for compatibility) ──────────
app.get('/api/admin/claims/all_secretaries', async (req, res) => {
  try {
    const secretaries = await User.find({ isSecretary: true })
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 });
    res.status(200).json(secretaries);
  } catch (error) {
    console.error("Error fetching secretaries:", error);
    res.status(500).json({ message: "Server error while fetching secretaries." });
  }
});
