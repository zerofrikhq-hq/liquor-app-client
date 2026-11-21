import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { OtpModal } from '../components/OtpModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';

interface Props {
  onSuccess: () => void;
  onBack?: () => void;
}

export const AuthScreen: React.FC<Props> = ({ onSuccess, onBack }) => {
  const { login, registerRequest, verifyRegistrationOtp, forgotPasswordRequest, verifyResetOtp, resetPasswordVerify } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Registration OTP Modal state
  const [regOtpVisible, setRegOtpVisible] = useState<boolean>(false);
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);

  // Reset Password Modal state (OTP + New Password + Confirm Password)
  const [resetModalVisible, setResetModalVisible] = useState<boolean>(false);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async () => {
    setError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }

      // Password rules: at least 8 chars and 1 special char
      if (trimmedPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(trimmedPassword);
      if (!hasSpecialChar) {
        setError('Password must contain at least one special character (!@#$%^&*).');
        return;
      }

      if (trimmedPassword !== confirmPassword.trim()) {
        setError('Passwords do not match. Please verify your confirm password.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await login(trimmedEmail, trimmedPassword);
        onSuccess();
      } else {
        const res = await registerRequest({
          email: trimmedEmail,
          password: trimmedPassword,
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
        });
        setDevOtp(res.devOtp);
        setRegOtpVisible(true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async (code: string) => {
    await verifyRegistrationOtp(email.trim(), code);
    setRegOtpVisible(false);
    onSuccess();
  };

  const handleResendRegistrationOtp = async () => {
    return await registerRequest({
      email: email.trim(),
      password: password.trim(),
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
    });
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Email Required', 'Please enter your email address in the field above to reset password.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await forgotPasswordRequest(trimmedEmail);
      setDevOtp(res.devOtp);
      setResetModalVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (code: string, newPass: string) => {
    await resetPasswordVerify(email.trim(), code, newPass);
    setResetModalVisible(false);
    Alert.alert('Success', 'Password has been updated! Please sign in with your new password.');
    setMode('signin');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color={colors.gold.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.crownDot} />
          <Text style={styles.brandTitle}>Chillbro</Text>
          <Text style={styles.brandSub}>ON-DEMAND LIQUOR DELIVERY</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Sign In / Sign Up Segmented Control */}
          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'signin' ? styles.segmentBtnActive : null]}
              onPress={() => {
                setMode('signin');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, mode === 'signin' ? styles.segmentTextActive : null]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'signup' ? styles.segmentBtnActive : null]}
              onPress={() => {
                setMode('signup');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, mode === 'signup' ? styles.segmentTextActive : null]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Form Fields */}
          {mode === 'signup' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={colors.text.muted} style={styles.icon} />
                  <TextInput
                    style={[styles.input, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                    placeholder="e.g. Alexander Mitchell"
                    placeholderTextColor={colors.text.muted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Australian Mobile (+61)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="call-outline" size={18} color={colors.text.muted} style={styles.icon} />
                  <TextInput
                    style={[styles.input, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                    placeholder="0400 000 000"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.text.muted} style={styles.icon} />
              <TextInput
                style={[styles.input, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                placeholder="you@chillbro.com"
                placeholderTextColor={colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input with Eye Visibility Toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text.muted} style={styles.icon} />
              <TextInput
                style={[styles.inputWithEye, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                placeholder="••••••••"
                placeholderTextColor={colors.text.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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
          </View>

          {/* Confirm Password (shown on Create Account mode) */}
          {mode === 'signup' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.text.muted} style={styles.icon} />
                  <TextInput
                    style={[styles.inputWithEye, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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
              </View>

              {/* Live Password Rules Checklist */}
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
            </>
          )}

          {/* Forgot Password Link (Sign In mode only) */}
          {mode === 'signin' && (
            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading ? styles.submitBtnDisabled : null]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.dark.darkest} />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Continue to OTP Verification'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.legalBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#94A3B8" />
          <Text style={styles.legalText}>
            Under the Liquor Act, it is an offence to supply alcohol to persons under 18. ID verification required at delivery.
          </Text>
        </View>
      </ScrollView>

      {/* 1. Registration Account Verification OTP Modal */}
      <OtpModal
        visible={regOtpVisible}
        email={email}
        devOtp={devOtp}
        onVerify={handleVerifyRegistrationOtp}
        onResend={handleResendRegistrationOtp}
        onClose={() => setRegOtpVisible(false)}
        title="Verify Your Account"
        subtitle={`Enter the 6-digit code sent to ${email}`}
      />

      {/* 2. Password Reset Modal (Step 1: OTP, Step 2: New Password + Confirm Password) */}
      <ResetPasswordModal
        visible={resetModalVisible}
        email={email}
        devOtp={devOtp}
        onVerifyOtp={async (code: string) => {
          await verifyResetOtp(email.trim(), code);
        }}
        onResetPassword={handleResetPasswordSubmit}
        onResend={async () => forgotPasswordRequest(email.trim())}
        onClose={() => setResetModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    justifyContent: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  backBtnText: {
    color: colors.gold.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  crownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold.primary,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.gold.primary,
    letterSpacing: 2,
    marginTop: 3,
  },
  card: {
    backgroundColor: colors.surface.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  segmentBtnActive: {
    backgroundColor: colors.dark.bg,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.gold.primary,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: 12,
    height: 46,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  inputWithEye: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  eyeBtn: {
    padding: 4,
  },
  rulesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    padding: 10,
    marginTop: 6,
    marginBottom: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ruleText: {
    fontSize: 11.5,
    color: colors.text.muted,
  },
  ruleTextMet: {
    color: colors.status.success,
    fontWeight: '600',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12,
    color: colors.gold.dark,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    color: colors.dark.darkest,
    fontWeight: '800',
    fontSize: 14,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  legalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  legalText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 15,
  },
});
