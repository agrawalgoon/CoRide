import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { sendVerificationOtpEmail } from '../services/email.service.js';

/**
 * Get profile information for currently authenticated user.
 */
export const maskLicenseNumber = (dl) => {
  if (!dl || dl.length <= 4) return dl || '';
  const clean = dl.trim();
  if (clean.length <= 8) {
    return clean.slice(0, 2) + '*'.repeat(clean.length - 4) + clean.slice(-2);
  }
  const visiblePrefix = clean.slice(0, 4);
  const visibleSuffix = clean.slice(-4);
  const maskedMiddle = '*'.repeat(clean.length - 8);
  return `${visiblePrefix}${maskedMiddle}${visibleSuffix}`;
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        organizationId: true,
        orgEmail: true,
        isOrgVerified: true,
        verificationStatus: true,
        isVerified: true,
        avatarUrl: true,
        dlNumber: true,
        isDlVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User profile not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        dlNumber: user.dlNumber ? maskLicenseNumber(user.dlNumber) : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link the authenticated user to an organization
 * after validating their organization email domain.
 */
export const linkOrganization = async (req, res, next) => {
  try {
    const { organizationId, orgEmail } = req.body;

    if (!organizationId || !orgEmail) {
      return res.status(400).json({
        success: false,
        message: 'organizationId and orgEmail are required'
      });
    }

    const normalizedEmail = orgEmail.trim().toLowerCase();

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId
      }
    });

    if (!organization || !organization.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const emailParts = normalizedEmail.split('@');

    if (emailParts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization email address'
      });
    }

    const emailDomain = emailParts[1];

    const allowedDomains = Array.isArray(organization.domainList)
      ? organization.domainList.map((domain) =>
          String(domain).trim().toLowerCase().replace(/^@/, '')
        )
      : [];

    if (!allowedDomains.includes(emailDomain)) {
      return res.status(400).json({
        success: false,
        message: 'This email domain is not associated with the selected organization'
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.userId
      },
      data: {
        organizationId: organization.id,
        orgEmail: normalizedEmail,
        verificationStatus: 'PENDING_EMAIL',
        isOrgVerified: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        orgEmail: true,
        isOrgVerified: true,
        verificationStatus: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Organization linked successfully. Email verification is pending.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request an email verification OTP for the linked organization email.
 */
export const requestOrganizationOtp = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        orgEmail: true,
        organizationId: true,
        isOrgVerified: true,
        verificationStatus: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    if (!user.organizationId || !user.orgEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please link your organization and campus email before requesting an OTP',
        error: {
          message: 'Please link your organization and campus email before requesting an OTP',
          code: 'ORGANIZATION_NOT_LINKED'
        }
      });
    }

    if (user.isOrgVerified) {
      return res.status(400).json({
        success: false,
        message: 'Organization email is already verified',
        error: {
          message: 'Organization email is already verified',
          code: 'EMAIL_ALREADY_VERIFIED'
        }
      });
    }

    const now = new Date();

    // 1. Resend cooldown enforcement (60 seconds)
    const RESEND_COOLDOWN_SECONDS = 60;
    const recentOtp = await prisma.emailVerificationOtp.findFirst({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (recentOtp) {
      const elapsedSeconds = Math.floor((now.getTime() - new Date(recentOtp.createdAt).getTime()) / 1000);
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting a new verification code`,
          error: {
            message: `Please wait ${waitSeconds} seconds before requesting a new verification code`,
            code: 'RESEND_COOLDOWN',
            retryAfterSeconds: waitSeconds
          }
        });
      }
    }

    // 2. Hourly rate limit check (max 5 OTP requests in 1 hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyRequestCount = await prisma.emailVerificationOtp.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (hourlyRequestCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification code requests. Please try again after an hour.',
        error: {
          message: 'Too many verification code requests. Please try again after an hour.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
    }

    // Invalidate any previously active/unverified OTPs for this user
    await prisma.emailVerificationOtp.updateMany({
      where: {
        userId: user.id,
        verifiedAt: null,
        expiresAt: { gt: now }
      },
      data: {
        expiresAt: now
      }
    });

    // Generate secure 6-digit OTP (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP with bcryptjs before saving
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // OTP expires after 10 minutes
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Persist OTP record in database
    await prisma.emailVerificationOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0
      }
    });

    // Send the OTP via email service
    try {
      await sendVerificationOtpEmail({
        to: user.orgEmail,
        userName: user.name,
        otp,
        expiresInMinutes
      });
    } catch (emailError) {
      // Invalidate the generated OTP if email delivery failed so it cannot be used
      await prisma.emailVerificationOtp.updateMany({
        where: {
          userId: user.id,
          expiresAt: { gt: now },
          verifiedAt: null
        },
        data: { expiresAt: now }
      });

      console.error('[EmailService] Failed to deliver OTP email:', emailError.message);

      return res.status(emailError.statusCode || 502).json({
        success: false,
        message: 'Failed to deliver verification code. Please verify your email address or try again later.',
        error: {
          message: 'Failed to deliver verification code to the specified email address.',
          code: emailError.code || 'EMAIL_DELIVERY_FAILED'
        }
      });
    }

    const responsePayload = {
      success: true,
      message: `Verification OTP sent to ${user.orgEmail}`,
      expiresInMinutes
    };

    // Expose devOtp for testing or when using simulated console email provider
    if (ENV.NODE_ENV !== 'production' || (ENV.EMAIL_PROVIDER || 'console').toLowerCase() === 'console') {
      responsePayload.devOtp = otp;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify the submitted 6-digit OTP against the user's active OTP record.
 */
export const verifyOrganizationOtp = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        orgEmail: true,
        organizationId: true,
        isOrgVerified: true,
        verificationStatus: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    if (user.isOrgVerified) {
      return res.status(400).json({
        success: false,
        message: 'Organization email is already verified',
        error: {
          message: 'Organization email is already verified',
          code: 'EMAIL_ALREADY_VERIFIED'
        }
      });
    }

    if (!user.orgEmail || !user.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'No organization email linked to verify',
        error: {
          message: 'No organization email linked to verify',
          code: 'ORGANIZATION_NOT_LINKED'
        }
      });
    }

    // Find the latest unverified OTP for this user
    const otpRecord = await prisma.emailVerificationOtp.findFirst({
      where: {
        userId: user.id,
        verifiedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active verification OTP found. Please request a new OTP.',
        error: {
          message: 'No active verification OTP found. Please request a new OTP.',
          code: 'OTP_NOT_FOUND'
        }
      });
    }

    const now = new Date();

    // Check expiration
    if (now > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification OTP has expired. Please request a new OTP.',
        error: {
          message: 'Verification OTP has expired. Please request a new OTP.',
          code: 'OTP_EXPIRED'
        }
      });
    }

    // Attempt limit: 5 attempts
    const MAX_ATTEMPTS = 5;
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      // Invalidate exhausted OTP
      await prisma.emailVerificationOtp.update({
        where: { id: otpRecord.id },
        data: { expiresAt: now }
      });

      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        error: {
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        }
      });
    }

    // Compare submitted OTP against the stored bcrypt hash
    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isMatch) {
      const updatedOtp = await prisma.emailVerificationOtp.update({
        where: { id: otpRecord.id },
        data: {
          attempts: { increment: 1 }
        }
      });

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - updatedOtp.attempts);

      if (remainingAttempts === 0) {
        // Invalidate exhausted OTP
        await prisma.emailVerificationOtp.update({
          where: { id: otpRecord.id },
          data: { expiresAt: now }
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid OTP. Maximum attempts reached. Please request a new OTP.',
          error: {
            message: 'Invalid OTP. Maximum attempts reached. Please request a new OTP.',
            code: 'MAX_ATTEMPTS_EXCEEDED'
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid verification OTP. ${remainingAttempts} attempt(s) remaining.`,
        error: {
          message: `Invalid verification OTP. ${remainingAttempts} attempt(s) remaining.`,
          code: 'INVALID_OTP'
        }
      });
    }

    // On successful verification:
    // 1. set User.isOrgVerified = true
    // 2. set User.verificationStatus = EMAIL_VERIFIED (Do not mark FULLY_VERIFIED)
    // 3. set verifiedAt on the OTP
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          isOrgVerified: true,
          verificationStatus: 'EMAIL_VERIFIED'
        },
        select: {
          id: true,
          name: true,
          email: true,
          orgEmail: true,
          organizationId: true,
          isOrgVerified: true,
          verificationStatus: true,
          role: true,
          phone: true,
          isVerified: true
        }
      }),
      prisma.emailVerificationOtp.update({
        where: { id: otpRecord.id },
        data: {
          verifiedAt: now
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Organization email verified successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Driving License information (securely masked) for authenticated user.
 * GET /api/users/license
 */
export const getDrivingLicense = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        dlNumber: true,
        dlPhotoUrl: true,
        isDlVerified: true,
        verificationStatus: true,
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const preferences = (typeof user.preferences === 'object' && user.preferences !== null)
      ? user.preferences
      : {};

    return res.status(200).json({
      success: true,
      license: {
        licenseNumber: user.dlNumber ? maskLicenseNumber(user.dlNumber) : '',
        holderName: preferences.dlHolderName || '',
        expiryDate: preferences.dlExpiryDate || '',
        dlPhotoUrl: user.dlPhotoUrl || '',
        isVerified: user.isDlVerified,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update and securely record driving license details.
 * PUT /api/users/license
 */
export const updateDrivingLicense = async (req, res, next) => {
  try {
    const { licenseNumber, holderName, expiryDate, dlPhotoUrl } = req.body;

    const normalizedDlNumber = licenseNumber.trim().toUpperCase().replace(/\s+/g, ' ');

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, isOrgVerified: true, preferences: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentPreferences = (typeof user.preferences === 'object' && user.preferences !== null)
      ? user.preferences
      : {};

    const updatedPreferences = {
      ...currentPreferences,
      dlHolderName: holderName.trim(),
      dlExpiryDate: expiryDate,
      dlSubmittedAt: new Date().toISOString()
    };

    const nextVerificationStatus = user.isOrgVerified ? 'FULLY_VERIFIED' : 'DOCS_SUBMITTED';

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        dlNumber: normalizedDlNumber,
        dlPhotoUrl: dlPhotoUrl ? dlPhotoUrl.trim() : null,
        isDlVerified: true,
        verificationStatus: nextVerificationStatus,
        preferences: updatedPreferences
      },
      select: {
        id: true,
        name: true,
        dlNumber: true,
        dlPhotoUrl: true,
        isDlVerified: true,
        verificationStatus: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Driving license details verified and securely saved',
      license: {
        licenseNumber: maskLicenseNumber(updatedUser.dlNumber),
        holderName: holderName.trim(),
        expiryDate,
        dlPhotoUrl: updatedUser.dlPhotoUrl,
        isVerified: updatedUser.isDlVerified,
        verificationStatus: updatedUser.verificationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
