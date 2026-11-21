import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';

interface Props {
  visible: boolean;
  email: string;
  devOtp?: string;
  onVerifyOtp: (code: string) => Promise<void>;
  onResetPassword: (code: string, newPass: string) => Promise<void>;
  onResend: () => Promise<{ devOtp?: string }>;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<Props> = ({
  visible,
  email,
  devOtp: initialDevOtp,
  onVerifyOtp,
  onResetPassword,
  onResend,
  onClose,
}) => {
  // Step 1: 'otp', Step 2: 'password'
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifiedCode, setVerifiedCode] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string | undefined>(initialDevOtp);
  const [countdown, setCountdown] = useState<number>(45);

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRefs = useRef<Array<any>>([]);

  useEffect(() => {
    if (visible) {
      setStep('otp');
      setDigits(['', '', '', '', '', '']);
      setVerifiedCode('');
      setDevOtp(initialDevOtp);
      setCountdown(45);
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrorMessage('');
    }
  }, [visible, initialDevOtp]);

  useEffect(() => {
    if (!visible || countdown <= 0 || step !== 'otp') return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, countdown, step]);

  const handleDigitChange = (val: string, index: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = clean.slice(-1);
    setDigits(newDigits);
    setErrorMessage('');

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const code = digits.join('');

  const handleFillDevCode = () => {
    if (devOtp && devOtp.length === 6) {
      setDigits(devOtp.split(''));
      setErrorMessage('');
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    try {
      const res = await onResend();
      setDevOtp(res.devOtp);
      setCountdown(45);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
    }
  };

  // Step 1: Verify 6-digit OTP
  const handleVerifyStep1 = async () => {
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    try {
      await onVerifyOtp(code);
      setVerifiedCode(code);
      setStep('password');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Step 2: Submit New Password
  const handleSubmitStep2 = async () => {
    setErrorMessage('');

    if (!hasMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!hasSpecialChar) {
      setErrorMessage('Password must contain at least one special character (!@#$%^&*).');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match. Please verify your confirmation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onResetPassword(verifiedCode, newPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Step Badge */}
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {step === 'otp' ? 'Step 1 of 2 • Code Verification' : 'Step 2 of 2 • Set New Password'}
              </Text>
            </View>

            <View style={styles.iconCircle}>
              <Ionicons
                name={step === 'otp' ? 'shield-checkmark' : 'lock-closed'}
                size={26}
                color={colors.gold.primary}
              />
            </View>

            {/* STEP 1: Enter & Verify OTP */}
            {step === 'otp' && (
              <>
                <Text style={styles.title}>Enter Verification Code</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit verification code to
                </Text>
                <Text style={styles.emailText}>{email}</Text>

                {/* Dev OTP Helper Pill */}
                {devOtp && (
                  <TouchableOpacity style={styles.devPill} onPress={handleFillDevCode} activeOpacity={0.8}>
                    <Ionicons name="flash" size={13} color={colors.gold.dark} />
                    <Text style={styles.devPillText}>
                      Dev Code: <Text style={styles.devCode}>{devOtp}</Text> (Tap to fill)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 6 Digit Inputs */}
                <Text style={styles.inputLabel}>6-Digit Code</Text>
                <View style={styles.digitsRow}>
                  {digits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(r: any) => {
                        inputRefs.current[index] = r;
                      }}
                      style={[
                        styles.digitInput,
                        digit ? styles.digitInputFilled : null,
                        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                {/* Verify Code Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    code.length !== 6 || isVerifying ? styles.primaryButtonDisabled : null,
                  ]}
                  onPress={handleVerifyStep1}
                  disabled={code.length !== 6 || isVerifying}
                  activeOpacity={0.85}
                >
                  {isVerifying ? (
                    <ActivityIndicator color={colors.dark.darkest} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify Code & Continue</Text>
                  )}
                </TouchableOpacity>

                {/* Resend Code Section */}
                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.resendTimer}>
                      Resend code in 00:{countdown < 10 ? `0${countdown}` : countdown}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendCode}>
                      <Text style={styles.resendLink}>Resend Code</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* STEP 2: Set New Password & Confirm Password */}
            {step === 'password' && (
              <>
                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  Code verified! Choose a strong password for your Chillbro account.
                </Text>

                <TouchableOpacity
                  style={styles.backToCodeRow}
                  onPress={() => {
                    setStep('otp');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={13} color={colors.gold.dark} />
                  <Text style={styles.backToCodeText}>Change verification code</Text>
                </TouchableOpacity>

                {/* New Password Input */}
                <Text style={styles.inputLabel}>New Password *</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.passwordInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                    placeholder="At least 8 characters & special symbol"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color={colors.text.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.passwordInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                    placeholder="Re-enter your new password"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color={colors.text.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Rules Checklist */}
                <View style={styles.rulesCard}>
                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={hasMinLength ? colors.status.success : colors.text.muted}
                    />
                    <Text style={[styles.ruleText, hasMinLength && styles.ruleTextMet]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={hasSpecialChar ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={hasSpecialChar ? colors.status.success : colors.text.muted}
                    />
                    <Text style={[styles.ruleText, hasSpecialChar && styles.ruleTextMet]}>
                      Contains a special character (!@#$%^&*)
                    </Text>
                  </View>
                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={passwordsMatch ? colors.status.success : colors.text.muted}
                    />
                    <Text style={[styles.ruleText, passwordsMatch && styles.ruleTextMet]}>
                      Passwords match
                    </Text>
                  </View>
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                {/* Submit New Password Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !hasMinLength || !hasSpecialChar || !passwordsMatch || isSubmitting
                      ? styles.primaryButtonDisabled
                      : null,
                  ]}
                  onPress={handleSubmitStep2}
                  disabled={!hasMinLength || !hasSpecialChar || !passwordsMatch || isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.dark.darkest} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 15, 18, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }
      : {
          elevation: 10,
        }),
  },
  stepBadge: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold.soft,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3E8C9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emailText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold.dark,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  backToCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  backToCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold.dark,
    textDecorationLine: 'underline',
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  devPillText: {
    fontSize: 11.5,
    color: '#92400E',
    fontWeight: '600',
  },
  devCode: {
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
    marginTop: 8,
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  digitInput: {
    width: 44,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.subtle,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  digitInputFilled: {
    borderColor: colors.gold.primary,
    backgroundColor: '#FEFCE8',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: 12,
    height: 44,
  },
  passwordInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  eyeBtn: {
    padding: 6,
  },
  rulesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    padding: 8,
    marginTop: 8,
    marginBottom: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleText: {
    fontSize: 11,
    color: colors.text.muted,
  },
  ruleTextMet: {
    color: colors.status.success,
    fontWeight: '600',
  },
  errorText: {
    color: colors.status.badgeDanger,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.dark.darkest,
  },
  resendRow: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingBottom: 4,
  },
  resendTimer: {
    fontSize: 12,
    color: colors.text.muted,
  },
  resendLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.gold.dark,
    textDecorationLine: 'underline',
  },
});
