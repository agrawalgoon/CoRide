import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { sendVerificationOtpEmail } from '../services/email.service.js';

/**
 * Get profile information for currently authenticated user.
 */
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
      user
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerificationOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0
      }
    });

    // Send the OTP via email service
    await sendVerificationOtpEmail({
      to: user.orgEmail,
      userName: user.name,
      otp,
      expiresInMinutes: 10
    });

    const responsePayload = {
      success: true,
      message: `Verification OTP sent to ${user.orgEmail}`,
      expiresInMinutes: 10
    };

    // Development only: expose devOtp for rapid automated testing
    if (ENV.NODE_ENV !== 'production') {
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
