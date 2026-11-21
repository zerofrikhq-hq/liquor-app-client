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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';

interface Props {
  visible: boolean;
  email: string;
  devOtp?: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<{ devOtp?: string }>;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const OtpModal: React.FC<Props> = ({
  visible,
  email,
  devOtp: initialDevOtp,
  onVerify,
  onResend,
  onClose,
  title = 'Verify Your Account',
  subtitle = 'Enter the 6-digit code sent to your email',
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState<string | undefined>(initialDevOtp);
  const [countdown, setCountdown] = useState<number>(45);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRefs = useRef<Array<any>>([]);

  useEffect(() => {
    if (visible) {
      setDigits(['', '', '', '', '', '']);
      setDevOtp(initialDevOtp);
      setCountdown(45);
      setErrorMessage('');
    }
  }, [visible, initialDevOtp]);

  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, countdown]);

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

  const handleVerify = async () => {
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits.');
      return;
    }
    setIsVerifying(true);
    setErrorMessage('');
    try {
      await onVerify(code);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code.');
    } finally {
      setIsVerifying(false);
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

  const fillDevCode = () => {
    if (devOtp && devOtp.length === 6) {
      setDigits(devOtp.split(''));
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={28} color={colors.gold.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.emailText}>{email}</Text>

          {/* Dev OTP Helper Pill */}
          {devOtp && (
            <TouchableOpacity style={styles.devPill} onPress={fillDevCode} activeOpacity={0.8}>
              <Ionicons name="key-outline" size={14} color={colors.gold.text} />
              <Text style={styles.devPillText}>
                Dev Code: <Text style={styles.devCode}>{devOtp}</Text> (Tap to autofill)
              </Text>
            </TouchableOpacity>
          )}

          {/* 6 Digit Inputs */}
          <View style={styles.digitsRow}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(r: any) => {
                  inputRefs.current[index] = r;
                }}
                style={[styles.digitInput, digit ? styles.digitInputFilled : null]}
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

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, code.length !== 6 || isVerifying ? styles.verifyButtonDisabled : null]}
            onPress={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            activeOpacity={0.8}
          >
            {isVerifying ? (
              <ActivityIndicator color={colors.dark.darkest} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
            )}
          </TouchableOpacity>

          {/* Resend Link */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.resendTimer}>Resend code in 00:{countdown < 10 ? `0${countdown}` : countdown}</Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 15, 18, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold.soft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gold.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.bg,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold.soft,
    borderColor: colors.gold.primary,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  devPillText: {
    fontSize: 12,
    color: colors.gold.dark,
    fontWeight: '600',
  },
  devCode: {
    fontWeight: '800',
    color: colors.dark.darkest,
    letterSpacing: 1,
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  digitInput: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    borderRadius: radii.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    backgroundColor: colors.surface.subtle,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  digitInputFilled: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.surface.white,
  },
  errorText: {
    color: colors.status.badgeDanger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.xs,
    shadowColor: colors.gold.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  verifyButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  verifyButtonText: {
    color: colors.dark.darkest,
    fontWeight: '700',
    fontSize: 15,
  },
  resendRow: {
    marginTop: spacing.md,
  },
  resendTimer: {
    fontSize: 13,
    color: colors.text.muted,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold.dark,
  },
});
