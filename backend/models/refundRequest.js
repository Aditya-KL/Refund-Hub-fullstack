const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
  // ── Core Identity ───────────────────────────────────────────
  claimId: { type: String, required: true, unique: true, index: true },
  
  // Link to the User model
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentRoll: { type: String, required: true, uppercase: true },
  
  // ── Categorization ──────────────────────────────────────────
  requestType: { 
    type: String, 
    enum: ['FEST_REIMBURSEMENT', 'MESS_REBATE', 'MEDICAL_REBATE'],
    required: true,
    index: true
  },
  
  // ── Mess-Specific Fields (Updated for capping logic) ────────
  messAbsenceFrom: { type: Date, default: null },
  messAbsenceTo:   { type: Date, default: null },
  messAbsenceDays: { type: Number, default: null }, // Actual days student was away
  
  // 🔥 NEW: These store the capped values based on semester limits
  effectiveMessDays: { type: Number, default: null }, // e.g., away for 20, but limit is 15
  effectiveAmount:   { type: Number, default: null }, // effectiveMessDays * rate

  // ── Fest-Specific Fields ────────────────────────────────────
  festId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Fest', default: null, index: true },
  festMember:   { type: mongoose.Schema.Types.ObjectId, ref: 'FestMember', default: null, index: true },
  festName:     { type: String, trim: true },
  committeeName: { type: String, trim: true, default: '' },
  teamName:     { type: String, trim: true },
  submitterFestPosition: { type: String, default: null },

  // ── Details & Financials ────────────────────────────────────
  title:       { type: String, required: true, trim: true }, 
  description: { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0 }, // The "Requested" amount
  
  transactionId: { 
    type: String, 
    unique: true, 
    sparse: true, 
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[A-Za-z0-9._/-]{6,30}$/.test(v);
      },
      message: props => `${props.value} is not a valid transaction reference.`
    }
  },

  // ── Supporting Documents ────────────────────────────────────
  attachments: [{
    filename:    { type: String },
    url:         { type: String, required: true }, 
    mimetype:    { type: String },
    uploadedAt:  { type: Date, default: Date.now },
  }],
  
  // ── Workflow Status ─────────────────────────────────────────
  status: { 
    type: String, 
    enum: [
      'PENDING_TEAM_COORD', 'PENDING_COORD', 'PENDING_FEST_COORD', 
      'PENDING_FC', 'PENDING_MESS_MANAGER', 'PENDING_VP', 'PENDING_ACADEMIC',
      'VERIFIED_MESS', 'VERIFIED_FEST', 'VERIFIED_MEDICAL',
      'APPROVED', 'PUSHED_TO_ACCOUNTS', 'UNDER_PROCESS', 'REJECTED', 'REFUNDED'
    ],
    required: true,
    index: true
  },

  // ── Verification & Approval Trail ──────────────────────────
  verifications: [{
    stage:        { type: String },
    verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifierName: { type: String },
    verifiedAt:   { type: Date },
    remarks:      { type: String, default: '' },
  }],

  verifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String },
  verifiedAt:     { type: Date },

  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName: { type: String },
  approvedAt:     { type: Date },

  rejectedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String, default: '' },

  // ── Final Refund Details ────────────────────────────────────
  disbursedAmount: { type: Number },
  disbursementRef: { type: String }, 
  refundedAt:      { type: Date },

  expiresAt: { type: Date },

  // ── Multi-step History ──────────────────────────────────────
  history: [{
    action:   { type: String, required: true },
    byUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName:   { type: String }, 
    date:     { type: Date, default: Date.now },
    comments: { type: String, trim: true } 
  }],

}, { timestamps: true });

// ── Compound Index for the Overlap Check ──────────────────────
refundRequestSchema.index({ student: 1, messAbsenceFrom: 1, messAbsenceTo: 1, status: 1 });

module.exports = mongoose.models.RefundRequest || mongoose.model('RefundRequest', refundRequestSchema);