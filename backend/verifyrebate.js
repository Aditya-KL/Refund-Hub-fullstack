// ============================================================
//  verifyrebate.js  —  Refund Hub: Verification / Approval / Refund
// ============================================================

const mongoose = require('mongoose');
const { AuditLog, ServerSettings } = require('./models/superadmin_setting');
const RefundRequest = require('./models/refundRequest');
const User = require('./models/user');
const { FestMember, Fest } = require('./models/fest');

// ─── Helpers ──────────────────────────────────────────────────

function requireFields(obj, fields) {
  for (const f of fields) {
    if (!obj[f] && obj[f] !== 0) return `Missing required field: ${f}`;
  }
  return null;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function createAccountsBatchId() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ACB-${stamp}-${random}`;
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function excelText(value) {
  const str = String(value ?? '');
  if (!str) return '';
  return `="${str.replace(/"/g, '""')}"`;
}

function buildAccountsBatchCsv(rows) {
  const header = [
    'Batch ID',
    'Student Name',
    'Roll No',
    'Email',
    'Account Number',
    'IFSC Code',
    'Total Amount',
    'Claim Count',
    'Claim IDs',
  ];
  const body = rows.map((row) => ([
    row.batchId,
    row.studentName,
    row.studentRoll,
    row.studentEmail,
    excelText(row.accountNumber),
    excelText(row.ifscCode),
    row.totalAmount,
    row.claimCount,
    row.claimIds.join('; '),
  ].map(csvEscape).join(',')));

  return [header.map(csvEscape).join(','), ...body].join('\n');
}

function getUserBankDetails(user) {
  const nestedBank = user?.studentProfile?.bankDetails || {};
  const flatBank = user?.bankDetails || {};

  return {
    accountHolderName: nestedBank.accountHolderName || flatBank.accountHolderName || '',
    accountNumber: nestedBank.accountNumber || flatBank.accountNumber || '',
    ifscCode: nestedBank.ifscCode || flatBank.ifscCode || '',
  };
}

function normalizeCommittee(value) {
  return String(value || '').trim().toLowerCase();
}

async function getFestMembershipForClaim(claim) {
  if (claim.festMember && isValidObjectId(claim.festMember)) {
    const byMemberId = await FestMember.findById(claim.festMember);
    if (byMemberId) return byMemberId;
  }

  if (claim.student && claim.festId) {
    return FestMember.findOne({
      user: claim.student,
      fest: claim.festId,
      position: claim.submitterFestPosition || undefined,
      committee: claim.committeeName || undefined,
      isActive: true,
    });
  }

  return null;
}

async function getActorFestMemberships(actorId, positions = []) {
  const filter = { user: actorId, isActive: true };
  if (positions.length) filter.position = { $in: positions };
  return FestMember.find(filter).populate('fest');
}

async function createAuditLog({
  secretaryId,
  secretaryName,
  action,
  targetCollection,
  targetId,
  details,
  status = 'success',
}) {
  if (!secretaryId || !secretaryName) return;
  try {
    await AuditLog.create({
      secretaryId,
      secretaryName,
      action,
      targetCollection,
      targetId: targetId || null,
      details,
      status,
    });
  } catch (err) {
    console.error('createAuditLog error:', err.message);
  }
}

// ─── Guard: portal active / maintenance ───────────────────────
async function checkPortalGuard() {
  const settings = await ServerSettings.getSettings();
  if (settings.maintenanceMode) {
    return { blocked: true, message: settings.maintenanceMessage || 'System is under maintenance.' };
  }
  if (!settings.portalActive) {
    return { blocked: true, message: 'The claims portal is currently inactive.' };
  }
  return { blocked: false, settings };
}

// ─── Fest claim: fetch all claims visible to an FC or Coordinator ──────────
async function getFestClaimsForActor(req, res) {
  try {
    const { actorId } = req.query;
    if (!actorId || !isValidObjectId(actorId))
      return res.status(400).json({ message: 'Valid actorId is required.' });

    const memberships = await getActorFestMemberships(actorId, ['FEST_COORDINATOR', 'COORDINATOR']);
    if (!memberships.length) return res.status(200).json([]);

    const results = [];

    for (const membership of memberships) {
      const festId = membership.fest._id;
      const position = membership.position;
      const actorCommittee = normalizeCommittee(membership.committee);

      let visiblePositions = [];
      let visibleStatuses = [];

      if (position === 'FEST_COORDINATOR') {
        visiblePositions = ['COORDINATOR', 'SUB_COORDINATOR'];
        // FROM CODE 2: Hide REJECTED/REFUNDED
        visibleStatuses = ['PENDING_TEAM_COORD', 'PENDING_COORD', 'PENDING_FC', 'VERIFIED_FEST', 'APPROVED', 'PUSHED_TO_ACCOUNTS'];
      } else if (position === 'COORDINATOR') {
        visiblePositions = ['SUB_COORDINATOR'];
        // FROM CODE 2: Hide REJECTED
        visibleStatuses = ['PENDING_TEAM_COORD', 'PENDING_COORD', 'VERIFIED_FEST', 'APPROVED', 'PUSHED_TO_ACCOUNTS'];
      } else {
        continue;
      }

      const claims = await RefundRequest.find({
        requestType: 'FEST_REIMBURSEMENT',
        festId,
        status: { $in: visibleStatuses },
        submitterFestPosition: { $in: visiblePositions },
      })
        .populate('student', 'fullName email studentId')
        .sort({ createdAt: 1 }); // FROM CODE 2: Oldest First

      for (const claim of claims) {
        const claimCommittee = normalizeCommittee(claim.committeeName);
        
        // FROM CODE 2: Check if Coord has already verified it
        const hasCoordinatorVerification = Array.isArray(claim.verifications)
          && claim.verifications.some((v) => v?.stage === 'COORDINATOR');
          
        if (
          position === 'COORDINATOR' &&
          actorCommittee &&
          claimCommittee &&
          claimCommittee !== actorCommittee
        ) continue;
        
        // FROM CODE 2: Hide from FC if Coord already verified and it's pending
        if (position === 'FEST_COORDINATOR' && hasCoordinatorVerification && ['PENDING', 'PENDING_TEAM_COORD', 'PENDING_COORD', 'PENDING_FC'].includes(claim.status)) {
          continue;
        }
        
        if (String(claim.student?._id) === String(actorId)) continue;

        results.push({
          ...claim.toObject(),
          claimantPosition: claim.submitterFestPosition || 'SUB_COORDINATOR',
          claimantCommittee: claim.committeeName || '',
          festId,
          festName: membership.fest.name || membership.fest.festName || '',
          actorFestMemberId: String(membership._id),
          actorPosition: position,
        });
      }
    }

    res.status(200).json(results);
  } catch (err) {
    console.error('getFestClaimsForActor error:', err);
    res.status(500).json({ message: 'Server error fetching fest claims.' });
  }
}

// ─── Fest claim: VERIFY by Coordinator ────────────────────────
async function verifyFestClaimByCoord(req, res) {
  try {
    const { claimId } = req.params;
    const { verifierId, verifierName, remarks } = req.body;

    const missing = requireFields(req.body, ['verifierId', 'verifierName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId))   return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(verifierId)) return res.status(400).json({ message: 'Invalid verifierId.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.requestType !== 'FEST_REIMBURSEMENT')
      return res.status(400).json({ message: 'Not a fest claim.' });
      
    // FROM CODE 2
    if (!['PENDING', 'PENDING_TEAM_COORD', 'PENDING_COORD'].includes(claim.status))
      return res.status(400).json({ message: `Cannot verify: claim is in status '${claim.status}'.` });

    const claimMembership = await getFestMembershipForClaim(claim);
    if (!claimMembership)
      return res.status(400).json({ message: 'Claim is missing fest membership metadata.' });

    const festMember = await FestMember.findOne({
      user: verifierId,
      fest: claim.festId,
      position: 'COORDINATOR',
      isActive: true,
    });
    if (!festMember)
      return res.status(403).json({ message: 'Only active Coordinators can verify at this stage.' });

    const verifierCommittee = normalizeCommittee(festMember.committee);
    const claimCommittee = normalizeCommittee(claim.committeeName);
    if (verifierCommittee && claimCommittee && verifierCommittee !== claimCommittee) {
      return res.status(403).json({ message: 'Coordinator verification is only allowed for claims in the same committee.' });
    }

    if (String(claim.student) === String(verifierId))
      return res.status(403).json({ message: 'You cannot verify your own claim.' });

    if (claimMembership.position !== 'SUB_COORDINATOR')
      return res.status(403).json({ message: 'Coordinator verification is only allowed for sub-coordinator claims in the same committee.' });

    // FROM CODE 2: Skip FC, go straight to VERIFIED_FEST
    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: { status: 'VERIFIED_FEST' },
        $push: {
          verifications: {
            stage: 'COORDINATOR',
            verifiedBy: verifierId,
            verifierName,
            verifiedAt: new Date(),
            remarks: remarks || '',
          },
          history: {
            action: 'VERIFIED_BY_COORD',
            byUser: verifierId,
            byName: verifierName,
            comments: remarks || 'Verified by Coordinator — marked as fest verified.',
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: verifierId,
      secretaryName: verifierName,
      action: 'APPROVE_CLAIM',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `Coordinator verified fest claim ${populated.claimId} for ${populated.student?.fullName || 'student'}.`,
    });

    res.status(200).json({ message: 'Claim verified by Coordinator.', claim: populated });
  } catch (err) {
    console.error('verifyFestClaimByCoord error:', err);
    res.status(500).json({ message: 'Server error during coordinator verification.' });
  }
}

// ─── Fest claim: VERIFY by Fest Coordinator ───────────────────
async function verifyFestClaimByFC(req, res) {
  try {
    const { claimId } = req.params;
    const { verifierId, verifierName, remarks } = req.body;

    const missing = requireFields(req.body, ['verifierId', 'verifierName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId))   return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(verifierId)) return res.status(400).json({ message: 'Invalid verifierId.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.requestType !== 'FEST_REIMBURSEMENT')
      return res.status(400).json({ message: 'Not a fest claim.' });

    // FROM CODE 2
    const allowedStatuses = ['PENDING', 'PENDING_FC', 'PENDING_COORD', 'PENDING_TEAM_COORD'];
    if (!allowedStatuses.includes(claim.status))
      return res.status(400).json({ message: `Cannot verify: claim is in status '${claim.status}'.` });

    const claimMembership = await getFestMembershipForClaim(claim);
    if (!claimMembership)
      return res.status(400).json({ message: 'Claim is missing fest membership metadata.' });

    const festMember = await FestMember.findOne({
      user: verifierId,
      fest: claim.festId,
      position: 'FEST_COORDINATOR',
      isActive: true,
    });
    if (!festMember)
      return res.status(403).json({ message: 'Only active Fest Coordinators can verify at this stage.' });

    if (String(claim.student) === String(verifierId))
      return res.status(403).json({ message: 'You cannot verify your own claim.' });

    if (!['COORDINATOR', 'SUB_COORDINATOR'].includes(claimMembership.position))
      return res.status(403).json({ message: 'Fest Coordinators can only verify coordinator or sub-coordinator claims in the same fest.' });

    // FROM CODE 2: Prevent FC from verifying if Coord already verified
    const hasCoordinatorVerification = Array.isArray(claim.verifications)
      && claim.verifications.some((v) => v?.stage === 'COORDINATOR');
    if (hasCoordinatorVerification) {
      return res.status(400).json({ message: 'This claim is already coordinator-verified and has been forwarded for Fest Secretary approval.' });
    }

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: { status: 'VERIFIED_FEST' },
        $push: {
          verifications: {
            stage: 'FEST_COORDINATOR',
            verifiedBy: verifierId,
            verifierName,
            verifiedAt: new Date(),
            remarks: remarks || '',
          },
          history: {
            action: 'VERIFIED_BY_FC',
            byUser: verifierId,
            byName: verifierName,
            comments: remarks || 'Verified by Fest Coordinator — ready for admin approval.',
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: verifierId,
      secretaryName: verifierName,
      action: 'APPROVE_CLAIM',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `Fest Coordinator verified fest claim ${populated.claimId} for ${populated.student?.fullName || 'student'}.`,
    });

    res.status(200).json({ message: 'Claim verified by Fest Coordinator.', claim: populated });
  } catch (err) {
    console.error('verifyFestClaimByFC error:', err);
    res.status(500).json({ message: 'Server error during FC verification.' });
  }
}

// ─── Mess claim: VERIFY by Mess Manager / Secretary ──────────
async function verifyMessClaim(req, res) {
  try {
    const { claimId } = req.params;
    const { verifierId, verifierName, remarks } = req.body;

    const missing = requireFields(req.body, ['verifierId', 'verifierName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId)) return res.status(400).json({ message: 'Invalid claimId.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.requestType !== 'MESS_REBATE')
      return res.status(400).json({ message: 'Not a mess claim.' });
    if (claim.status !== 'PENDING_MESS_MANAGER')
      return res.status(400).json({ message: `Cannot verify: claim is in status '${claim.status}'.` });

    const verifier = await User.findById(verifierId);
    if (!verifier || (!verifier.isSecretary && !verifier.isSuperAdmin) || verifier.department !== 'mess')
      return res.status(403).json({ message: 'Only Mess department secretaries can verify mess claims.' });

    const settings = await ServerSettings.getSettings();
    const requestedDays = claim.messAbsenceDays || 0;
    const effectiveDays = Math.min(requestedDays, settings.maxMessRebateDays);
    const effectiveAmount = effectiveDays * settings.messRebateRateDaily;

    const autoComment = `Verified. Requested ${requestedDays} days; effective refund days: ${effectiveDays} (max allowed: ${settings.maxMessRebateDays}). Effective amount: ₹${effectiveAmount}.`;

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: {
          status: 'APPROVED',
          verifiedBy: verifierId,
          verifiedByName: verifierName,
          verifiedAt: new Date(),
          verifierRemarks: remarks || '',
          approvedBy: verifierId,
          approvedByName: verifierName,
          approvedAt: new Date(),
          approverRemarks: remarks || 'Directly approved by Mess secretary.',
          effectiveMessDays: effectiveDays,
          effectiveAmount,
        },
        $push: {
          history: {
            action: 'DIRECT_APPROVED_BY_MESS_MANAGER',
            byUser: verifierId,
            byName: verifierName,
            comments: remarks || `${autoComment} Directly approved for refund.`,
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: verifierId,
      secretaryName: verifierName,
      action: 'APPROVE_CLAIM',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `Mess secretary verified claim ${populated.claimId} for ${populated.student?.fullName || 'student'} with effective amount ₹${effectiveAmount}.`,
    });

    res.status(200).json({ message: 'Mess claim approved.', claim: populated });
  } catch (err) {
    console.error('verifyMessClaim error:', err);
    res.status(500).json({ message: 'Server error during mess verification.' });
  }
}

// ─── Medical claim: VERIFY by Medical / Academic Secretary ────
async function verifyMedicalClaim(req, res) {
  try {
    const { claimId } = req.params;
    const { verifierId, verifierName, remarks } = req.body;

    const missing = requireFields(req.body, ['verifierId', 'verifierName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId)) return res.status(400).json({ message: 'Invalid claimId.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.requestType !== 'MEDICAL_REBATE')
      return res.status(400).json({ message: 'Not a medical claim.' });
    if (claim.status !== 'PENDING_ACADEMIC')
      return res.status(400).json({ message: `Cannot verify: claim is in status '${claim.status}'.` });

    const verifier = await User.findById(verifierId);
    if (!verifier || (!verifier.isSecretary && !verifier.isSuperAdmin) || verifier.department !== 'hospital')
      return res.status(403).json({ message: 'Only Medical / Hospital department secretaries can verify medical claims.' });

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: {
          status: 'APPROVED',
          verifiedBy: verifierId,
          verifiedByName: verifierName,
          verifiedAt: new Date(),
          verifierRemarks: remarks || '',
          approvedBy: verifierId,
          approvedByName: verifierName,
          approvedAt: new Date(),
          approverRemarks: remarks || 'Directly approved by Medical secretary.',
        },
        $push: {
          history: {
            action: 'DIRECT_APPROVED_BY_ACADEMIC',
            byUser: verifierId,
            byName: verifierName,
            comments: remarks || 'Verified and directly approved by Medical Department.',
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: verifierId,
      secretaryName: verifierName,
      action: 'APPROVE_CLAIM',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `Medical secretary verified claim ${populated.claimId} for ${populated.student?.fullName || 'student'}.`,
    });

    res.status(200).json({ message: 'Medical claim approved.', claim: populated });
  } catch (err) {
    console.error('verifyMedicalClaim error:', err);
    res.status(500).json({ message: 'Server error during medical verification.' });
  }
}

// ─── REJECT a claim at any stage ──────────────────────────────
async function rejectClaim(req, res) {
  try {
    const { claimId } = req.params;
    const { rejectedBy, rejectedByName, rejectionReason, stage } = req.body;

    if (!rejectionReason?.trim())
      return res.status(400).json({ message: 'Rejection reason is required.' });

    const missing = requireFields(req.body, ['rejectedBy', 'rejectedByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId))   return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(rejectedBy)) return res.status(400).json({ message: 'Invalid rejectedBy.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });

    if (['REJECTED', 'REFUNDED'].includes(claim.status))
      return res.status(400).json({ message: `Claim is already ${claim.status.toLowerCase()}.` });

    // FROM CODE 1: Proper clearing of Accounts logic on reject
    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: {
          status: 'REJECTED',
          rejectedBy,
          rejectedByName,
          rejectedAt: new Date(),
          rejectionReason: rejectionReason.trim(),
          rejectedAtStage: stage || claim.status,
          accountsBatchStatus: '',
          accountsHoldFlaggedAt: null,
          accountsHoldFlaggedBy: null,
          accountsHoldFlaggedByName: '',
          accountsHoldReason: '',
        },
        $push: {
          history: {
            action: 'REJECTED',
            byUser: rejectedBy,
            byName: rejectedByName,
            comments: `Rejected at stage '${stage || 'unknown'}': ${rejectionReason.trim()}`,
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: rejectedBy,
      secretaryName: rejectedByName,
      action: 'REJECT_CLAIM',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `Rejected claim ${populated.claimId} for ${populated.student?.fullName || 'student'} at stage ${stage || claim.status}: ${rejectionReason.trim()}`,
      status: 'warning',
    });

    res.status(200).json({ message: 'Claim rejected.', claim: populated });
  } catch (err) {
    console.error('rejectClaim error:', err);
    res.status(500).json({ message: 'Server error during rejection.' });
  }
}

async function flagAccountsClaimHold(req, res) {
  try {
    const { claimId } = req.params;
    const { flaggedBy, flaggedByName, reason } = req.body;

    const missing = requireFields(req.body, ['flaggedBy', 'flaggedByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId)) return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(flaggedBy)) return res.status(400).json({ message: 'Invalid flaggedBy.' });

    const actor = await User.findById(flaggedBy);
    if (!actor || actor.department !== 'account') {
      return res.status(403).json({ message: 'Only Accounts department can flag holds.' });
    }

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.status !== 'UNDER_PROCESS') {
      return res.status(400).json({ message: `Only under-process claims can be held. Current: '${claim.status}'.` });
    }

    const holdReason = reason?.trim() || 'Held by accounts.';

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: {
          accountsBatchStatus: 'ON_HOLD',
          accountsHoldFlaggedAt: new Date(),
          accountsHoldFlaggedBy: flaggedBy,
          accountsHoldFlaggedByName: flaggedByName,
          accountsHoldReason: holdReason,
        },
        $push: {
          history: {
            action: 'ACCOUNTS_HOLD',
            byUser: flaggedBy,
            byName: flaggedByName,
            comments: `Flagged on hold by accounts: ${holdReason}`,
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    res.status(200).json({ message: 'Claim flagged on hold.', claim: populated });
  } catch (err) {
    console.error('flagAccountsClaimHold error:', err);
    res.status(500).json({ message: 'Server error flagging claim on hold.' });
  }
}

async function clearAccountsClaimHold(req, res) {
  try {
    const { claimId } = req.params;
    const { clearedBy, clearedByName } = req.body;

    const missing = requireFields(req.body, ['clearedBy', 'clearedByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId)) return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(clearedBy)) return res.status(400).json({ message: 'Invalid clearedBy.' });

    const actor = await User.findById(clearedBy);
    if (!actor || actor.department !== 'account') {
      return res.status(403).json({ message: 'Only Accounts department can clear holds.' });
    }

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.status !== 'UNDER_PROCESS') {
      return res.status(400).json({ message: `Only under-process claims can be updated. Current: '${claim.status}'.` });
    }

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: {
          accountsBatchStatus: 'UNDER_PROCESS',
          accountsHoldFlaggedAt: null,
          accountsHoldFlaggedBy: null,
          accountsHoldFlaggedByName: '',
          accountsHoldReason: '',
        },
        $push: {
          history: {
            action: 'ACCOUNTS_HOLD_CLEARED',
            byUser: clearedBy,
            byName: clearedByName,
            comments: 'Cleared accounts hold flag.',
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    res.status(200).json({ message: 'Hold removed.', claim: populated });
  } catch (err) {
    console.error('clearAccountsClaimHold error:', err);
    res.status(500).json({ message: 'Server error clearing claim hold.' });
  }
}

// ─── APPROVE a verified claim (superadmin / dept head) ────────
async function approveClaim(req, res) {
  try {
    const { claimId } = req.params;
    const { approvedBy, approvedByName, remarks } = req.body;

    const missing = requireFields(req.body, ['approvedBy', 'approvedByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId))  return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(approvedBy)) return res.status(400).json({ message: 'Invalid approvedBy.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });

    const verifiedStatuses = ['VERIFIED_MESS', 'VERIFIED_FEST', 'VERIFIED_MEDICAL'];
    if (!verifiedStatuses.includes(claim.status))
      return res.status(400).json({
        message: `Claim must be in a verified state to approve. Current: '${claim.status}'.`,
      });

    // FROM CODE 2: Label dynamic actor
    const approver = await User.findById(approvedBy);
    if (!approver)
      return res.status(403).json({ message: 'Insufficient permissions to approve claims.' });

    let actorLabel = 'secretary/admin';
    let canApprove = !!(approver.isSuperAdmin || approver.isSecretary);

    if (!canApprove)
      return res.status(403).json({ message: 'Insufficient permissions to approve claims.' });

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: {
          status: 'APPROVED',
          approvedBy,
          approvedByName,
          approvedAt: new Date(),
          approverRemarks: remarks || '',
        },
        $push: {
          history: {
            action: 'APPROVED',
            byUser: approvedBy,
            byName: approvedByName,
            comments: remarks || 'Approved for refund.',
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: approvedBy,
      secretaryName: approvedByName,
      action: 'APPROVE_CLAIM',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `${actorLabel} approved claim ${populated.claimId} for ${populated.student?.fullName || 'student'}.`,
    });

    res.status(200).json({ message: 'Claim approved.', claim: populated });
  } catch (err) {
    console.error('approveClaim error:', err);
    res.status(500).json({ message: 'Server error during approval.' });
  }
}

// ─── UNDO approval for mess/medical secretary (approved -> pending) ───────────
async function undoClaimApproval(req, res) {
  try {
    const { claimId } = req.params;
    const { undoBy, undoByName, remarks } = req.body;

    const missing = requireFields(req.body, ['undoBy', 'undoByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId)) return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(undoBy)) return res.status(400).json({ message: 'Invalid undoBy.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (!['MESS_REBATE', 'MEDICAL_REBATE'].includes(claim.requestType))
      return res.status(400).json({ message: 'Undo approval is only supported for Mess/Medical claims.' });
    if (claim.status !== 'APPROVED')
      return res.status(400).json({ message: `Only approved claims can be undone. Current status: '${claim.status}'.` });

    const actor = await User.findById(undoBy);
    if (!actor || (!actor.isSecretary && !actor.isSuperAdmin))
      return res.status(403).json({ message: 'Insufficient permissions to undo approval.' });

    const requiredDept = claim.requestType === 'MESS_REBATE' ? 'mess' : 'hospital';
    if (!actor.isSuperAdmin && actor.department !== requiredDept)
      return res.status(403).json({ message: 'You can only undo approvals for your own department.' });

    const pendingStatus = claim.requestType === 'MESS_REBATE' ? 'PENDING_MESS_MANAGER' : 'PENDING_ACADEMIC';

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: { status: pendingStatus },
        $unset: {
          verifiedBy: '',
          verifiedByName: '',
          verifiedAt: '',
          verifierRemarks: '',
          approvedBy: '',
          approvedByName: '',
          approvedAt: '',
          approverRemarks: '',
        },
        $push: {
          history: {
            action: 'APPROVAL_UNDONE',
            byUser: undoBy,
            byName: undoByName,
            comments: remarks || `Approval undone by ${undoByName}; claim moved back to pending review.`,
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: undoBy,
      secretaryName: undoByName,
      action: 'UNDO_APPROVAL',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `Approval undone for claim ${populated.claimId}; moved back to ${pendingStatus}.`,
      status: 'warning',
    });

    res.status(200).json({ message: 'Claim approval undone.', claim: populated });
  } catch (err) {
    console.error('undoClaimApproval error:', err);
    res.status(500).json({ message: 'Server error undoing claim approval.' });
  }
}

// ─── PUSH approved claims to Accounts (superadmin) ────────────
async function pushClaimsToAccounts(req, res) {
  try {
    const { pushedBy, pushedByName, requestType } = req.body;

    const missing = requireFields(req.body, ['pushedBy', 'pushedByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(pushedBy)) return res.status(400).json({ message: 'Invalid pushedBy.' });

    const pusher = await User.findById(pushedBy);
    if (!pusher?.isSuperAdmin)
      return res.status(403).json({ message: 'Only superadmins can push claims to Accounts.' });

    const filter = { status: 'APPROVED' };
    if (requestType) filter.requestType = requestType;

    const claims = await RefundRequest.find(filter);
    if (!claims.length)
      return res.status(200).json({ message: 'No approved claims to push.', count: 0 });

    await RefundRequest.updateMany(
      { _id: { $in: claims.map(c => c._id) } },
      {
        $set: { status: 'PUSHED_TO_ACCOUNTS' },
        $push: {
          history: {
            action: 'PUSHED_TO_ACCOUNTS',
            byUser: pushedBy,
            byName: pushedByName,
            comments: `Pushed ${claims.length} claim(s) to Accounts department.`,
          },
        },
      },
    );

    await createAuditLog({
      secretaryId: pushedBy,
      secretaryName: pushedByName,
      action: 'BULK_UPDATE',
      targetCollection: 'claims',
      details: `Pushed ${claims.length} approved ${requestType || 'claims'} to Accounts.`,
    });

    res.status(200).json({ message: `${claims.length} claim(s) pushed to Accounts.`, count: claims.length });
  } catch (err) {
    console.error('pushClaimsToAccounts error:', err);
    res.status(500).json({ message: 'Server error pushing to accounts.' });
  }
}

// ─── REFUND a claim (accounts department) ─────────────────────
async function refundClaim(req, res) {
  try {
    const { claimId } = req.params;
    const { refundedBy, refundedByName, transactionRef, refundedAmount, notes } = req.body;

    const missing = requireFields(req.body, ['refundedBy', 'refundedByName', 'transactionRef', 'refundedAmount']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(claimId))  return res.status(400).json({ message: 'Invalid claimId.' });
    if (!isValidObjectId(refundedBy)) return res.status(400).json({ message: 'Invalid refundedBy.' });

    const parsedAmount = parseFloat(refundedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ message: 'Valid refundedAmount is required.' });

    const claim = await RefundRequest.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.status !== 'PUSHED_TO_ACCOUNTS')
      return res.status(400).json({ message: `Claim must be PUSHED_TO_ACCOUNTS to refund. Current: '${claim.status}'.` });

    const refunder = await User.findById(refundedBy);
    if (!refunder || refunder.department !== 'account')
      return res.status(403).json({ message: 'Only Accounts department can process refunds.' });

    const populated = await RefundRequest.findByIdAndUpdate(
      claimId,
      {
        $set: {
          status: 'REFUNDED',
          refundedBy,
          refundedByName,
          refundedAt: new Date(),
          disbursedAmount: parsedAmount,
          disbursementRef: transactionRef,
          disbursementNotes: notes || '',
        },
        $push: {
          history: {
            action: 'REFUNDED',
            byUser: refundedBy,
            byName: refundedByName,
            comments: `Refunded ₹${parsedAmount} via ${transactionRef}. ${notes || ''}`.trim(),
          },
        },
      },
      { returnDocument: 'after' },
    ).populate('student', 'fullName email studentId');

    await createAuditLog({
      secretaryId: refundedBy,
      secretaryName: refundedByName,
      action: 'APPROVE_CLAIM',
      targetCollection: 'claims',
      targetId: populated.claimId,
      details: `Accounts refunded claim ${populated.claimId} for ${populated.student?.fullName || 'student'} via ${transactionRef}.`,
    });

    res.status(200).json({ message: 'Claim refunded successfully.', claim: populated });
  } catch (err) {
    console.error('refundClaim error:', err);
    res.status(500).json({ message: 'Server error during refund.' });
  }
}

async function exportAccountsBatch(req, res) {
  try {
    const { exportedBy, exportedByName } = req.body;

    const missing = requireFields(req.body, ['exportedBy', 'exportedByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(exportedBy)) return res.status(400).json({ message: 'Invalid exportedBy.' });

    const exporter = await User.findById(exportedBy);
    if (!exporter || exporter.department !== 'account')
      return res.status(403).json({ message: 'Only Accounts department can export payment batches.' });

    const claims = await RefundRequest.find({ status: 'PUSHED_TO_ACCOUNTS' })
      .populate('student', 'fullName email studentId studentProfile bankDetails');

    if (!claims.length) {
      return res.status(200).json({ message: 'No claims available for export.', batchId: '', rows: [], csv: '' });
    }

    const batchId = createAccountsBatchId();
    const grouped = new Map();

    for (const claim of claims) {
      const student = claim.student;
      if (!student?._id) continue;

      const key = String(student._id);
      const bank = getUserBankDetails(student); // FROM CODE 1: Using the robust bank details helper
      const existing = grouped.get(key) || {
        batchId,
        studentId: key,
        studentName: student.fullName || '',
        studentRoll: student.studentId || '',
        studentEmail: student.email || '',
        accountNumber: bank.accountNumber || '',
        ifscCode: bank.ifscCode || '',
        totalAmount: 0,
        claimCount: 0,
        claimIds: [],
      };

      existing.totalAmount += Number(claim.disbursedAmount || claim.effectiveAmount || claim.amount || 0);
      existing.claimCount += 1;
      existing.claimIds.push(claim.claimId || String(claim._id));
      grouped.set(key, existing);
    }

    const rows = Array.from(grouped.values()).sort((a, b) => a.studentRoll.localeCompare(b.studentRoll));
    const csv = buildAccountsBatchCsv(rows);

    await RefundRequest.updateMany(
      { _id: { $in: claims.map((claim) => claim._id) } },
      {
        $set: {
          status: 'UNDER_PROCESS',
          accountsBatchId: batchId,
          accountsBatchStatus: 'UNDER_PROCESS',
          accountsExportedAt: new Date(),
          accountsExportedBy: exportedBy,
          accountsExportedByName: exportedByName,
        },
        $push: {
          history: {
            action: 'EXPORTED_TO_BANK_BATCH',
            byUser: exportedBy,
            byName: exportedByName,
            comments: `Exported to accounts batch ${batchId} and marked under process.`,
          },
        },
      },
    );

    await createAuditLog({
      secretaryId: exportedBy,
      secretaryName: exportedByName,
      action: 'EXPORT_REPORT',
      targetCollection: 'claims',
      targetId: batchId,
      details: `Exported accounts batch ${batchId} with ${claims.length} claims for bank processing.`,
    });

    res.status(200).json({
      message: `Batch ${batchId} exported successfully.`,
      batchId,
      rows,
      csv,
      claimCount: claims.length,
    });
  } catch (err) {
    console.error('exportAccountsBatch error:', err);
    res.status(500).json({ message: 'Server error exporting accounts batch.' });
  }
}

async function refundAccountsBatch(req, res) {
  try {
    const { batchId } = req.params;
    const { refundedBy, refundedByName, notes, holdClaimIds } = req.body;

    if (!batchId?.trim()) return res.status(400).json({ message: 'Valid batchId is required.' });
    const missing = requireFields(req.body, ['refundedBy', 'refundedByName']);
    if (missing) return res.status(400).json({ message: missing });
    if (!isValidObjectId(refundedBy)) return res.status(400).json({ message: 'Invalid refundedBy.' });

    const refunder = await User.findById(refundedBy);
    if (!refunder || refunder.department !== 'account')
      return res.status(403).json({ message: 'Only Accounts department can close refund batches.' });

    const claims = await RefundRequest.find({ accountsBatchId: batchId, status: 'UNDER_PROCESS' });
    if (!claims.length) return res.status(404).json({ message: 'No under-process claims found for this batch.' });

    // FROM CODE 1: Logic to hold claims during batch refund
    const validClaimIds = new Set(claims.map((claim) => String(claim._id)));
    const heldIds = Array.isArray(holdClaimIds)
      ? [...new Set(holdClaimIds.map((id) => String(id)).filter((id) => validClaimIds.has(id)))]
      : [];
    const refundedClaims = claims.filter((claim) => !heldIds.includes(String(claim._id)));
    const heldClaims = claims.filter((claim) => heldIds.includes(String(claim._id)));

    if (!refundedClaims.length) {
      return res.status(400).json({ message: 'At least one claim must be refunded. Remove one hold or refund individually.' });
    }

    if (heldClaims.length) {
      await RefundRequest.bulkWrite(
        heldClaims.map((claim) => ({
          updateOne: {
            filter: { _id: claim._id },
            update: {
              $set: {
                status: 'UNDER_PROCESS',
                accountsBatchStatus: 'ON_HOLD',
                accountsHoldFlaggedAt: claim.accountsHoldFlaggedAt || new Date(),
                accountsHoldFlaggedBy: claim.accountsHoldFlaggedBy || refundedBy,
                accountsHoldFlaggedByName: claim.accountsHoldFlaggedByName || refundedByName,
                accountsHoldReason: claim.accountsHoldReason || 'Held during batch refund due to payment issue.',
              },
              $push: {
                history: {
                  action: 'ACCOUNTS_HOLD',
                  byUser: refundedBy,
                  byName: refundedByName,
                  comments: `Kept on hold while refunding accounts batch ${batchId}.`,
                },
              },
            },
          },
        })),
      );
    }

    await RefundRequest.updateMany(
      { _id: { $in: refundedClaims.map((claim) => claim._id) } },
      {
        $set: {
          status: 'REFUNDED',
          refundedBy,
          refundedByName,
          refundedAt: new Date(),
          accountsBatchStatus: 'REFUNDED',
          accountsHoldFlaggedAt: null,
          accountsHoldFlaggedBy: null,
          accountsHoldFlaggedByName: '',
          accountsHoldReason: '',
          disbursedAmount: null,
          disbursementRef: batchId,
          disbursementNotes: notes || '',
        },
        $push: {
          history: {
            action: 'REFUNDED',
            byUser: refundedBy,
            byName: refundedByName,
            comments: `Marked refunded for accounts batch ${batchId}.${notes ? ` ${notes}` : ''}`.trim(),
          },
        },
      },
    );

    await createAuditLog({
      secretaryId: refundedBy,
      secretaryName: refundedByName,
      action: 'BULK_UPDATE',
      targetCollection: 'claims',
      targetId: batchId,
      details: `Marked ${refundedClaims.length} claims in accounts batch ${batchId} as refunded${heldClaims.length ? ` and kept ${heldClaims.length} on hold` : ''}.`,
    });

    res.status(200).json({
      message: `Batch ${batchId} updated. Refunded ${refundedClaims.length} claim(s)${heldClaims.length ? `, kept ${heldClaims.length} on hold` : ''}.`,
      batchId,
      refundedCount: refundedClaims.length,
      heldCount: heldClaims.length,
    });
  } catch (err) {
    console.error('refundAccountsBatch error:', err);
    res.status(500).json({ message: 'Server error refunding accounts batch.' });
  }
}

// ─── GET claims by department ──────────────────────────────────
async function getClaimsByDepartment(req, res) {
  try {
    const { type, status } = req.query;

    const filter = {};
    if (type) filter.requestType = type;
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      filter.status = { $in: statuses };
    }

    const claims = await RefundRequest.find(filter)
      .populate('student', 'fullName email studentId phone hostel block roomNumber')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (err) {
    console.error('getClaimsByDepartment error:', err);
    res.status(500).json({ message: 'Server error fetching claims.' });
  }
}

// ─── GET claims pushed to accounts ────────────────────────────
async function getAccountsClaims(req, res) {
  try {
    const { status } = req.query;
    const statuses = status
      ? status.split(',').map(s => s.trim())
      : ['PUSHED_TO_ACCOUNTS', 'UNDER_PROCESS', 'REFUNDED'];

    const claims = await RefundRequest.find({ status: { $in: statuses } })
      .populate('student', 'fullName email studentId phone studentProfile bankDetails')
      .sort({ updatedAt: -1 });

    res.status(200).json(claims);
  } catch (err) {
    console.error('getAccountsClaims error:', err);
    res.status(500).json({ message: 'Server error fetching accounts claims.' });
  }
}

// ─── GET single claim detail ──────────────────────────────────
async function getClaimDetail(req, res) {
  try {
    const { claimId } = req.params;
    if (!isValidObjectId(claimId)) return res.status(400).json({ message: 'Invalid claimId.' });

    const claim = await RefundRequest.findById(claimId)
      .populate('student', 'fullName email studentId phone hostel block roomNumber admissionYear messName');

    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    res.status(200).json(claim);
  } catch (err) {
    console.error('getClaimDetail error:', err);
    res.status(500).json({ message: 'Server error fetching claim.' });
  }
}

// ─── DELETE claim (only pending claims) ───────────────────────
async function deleteClaim(req, res) {
  try {
    const { claimId } = req.params;
    const { userId } = req.body || {};

    // Validate claimId format
    if (!isValidObjectId(claimId)) {
      return res.status(400).json({ message: 'Invalid claim ID format.' });
    }

    // Find the claim
    const claim = await RefundRequest.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    // Only allow deletion of pending claims
    const pendingStatuses = [
      'PENDING_TEAM_COORD',
      'PENDING_FEST_COORD',
      'PENDING_COORD',
      'PENDING_FC',
      'PENDING_MESS_MANAGER',
      'PENDING_VP',
      'PENDING_ACADEMIC'
    ];

    if (!pendingStatuses.includes(claim.status)) {
      return res.status(403).json({ 
        message: `Cannot delete claim with status '${claim.status}'. Only pending claims can be deleted.` 
      });
    }

    // Verify ownership (optional: if userId is provided, ensure it matches)
    if (userId && claim.student.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this claim.' });
    }

    // Delete the claim
    await RefundRequest.findByIdAndDelete(claimId);

    res.status(200).json({ 
      message: 'Claim deleted successfully.',
      claimId: claimId 
    });
  } catch (err) {
    console.error('deleteClaim error:', err);
    res.status(500).json({ message: 'Server error deleting claim.' });
  }
}

// ─── Register all verification routes ─────────────────────────
function registerVerifyRoutes(app) {
  app.get('/api/verify/fest/claims',                          getFestClaimsForActor);
  app.post('/api/verify/fest/claims/:claimId/verify-coord',   verifyFestClaimByCoord);
  app.post('/api/verify/fest/claims/:claimId/verify-fc',      verifyFestClaimByFC);
  app.post('/api/verify/mess/claims/:claimId/verify',         verifyMessClaim);
  app.post('/api/verify/medical/claims/:claimId/verify',      verifyMedicalClaim);
  app.post('/api/verify/claims/:claimId/reject',              rejectClaim);
  app.post('/api/verify/claims/:claimId/approve',             approveClaim);
  app.post('/api/verify/claims/:claimId/undo-approval',       undoClaimApproval);
  app.post('/api/verify/push-to-accounts',                    pushClaimsToAccounts);
  app.post('/api/verify/accounts/export-batch',               exportAccountsBatch);
  app.post('/api/verify/accounts/batches/:batchId/refund',    refundAccountsBatch);
  app.post('/api/verify/claims/:claimId/accounts-hold',       flagAccountsClaimHold);
  app.post('/api/verify/claims/:claimId/accounts-unhold',     clearAccountsClaimHold);
  app.post('/api/verify/claims/:claimId/refund',              refundClaim);
  app.delete('/api/refund-claims/:claimId',                   deleteClaim);
  app.get('/api/verify/claims',                               getClaimsByDepartment);
  app.get('/api/verify/claims/:claimId',                      getClaimDetail);
  app.get('/api/verify/accounts/claims',                      getAccountsClaims);
}

module.exports = {
  registerVerifyRoutes,
  getFestClaimsForActor,
  verifyFestClaimByCoord,
  verifyFestClaimByFC,
  verifyMessClaim,
  verifyMedicalClaim,
  rejectClaim,
  approveClaim,
  undoClaimApproval,
  pushClaimsToAccounts,
  exportAccountsBatch,
  refundAccountsBatch,
  flagAccountsClaimHold,
  clearAccountsClaimHold,
  refundClaim,
  deleteClaim,
  getClaimsByDepartment,
  getAccountsClaims,
  getClaimDetail,
};
