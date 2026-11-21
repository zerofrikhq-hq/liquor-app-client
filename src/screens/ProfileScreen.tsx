import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { ResetPasswordModal } from '../components/ResetPasswordModal';

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<Props> = ({ onBack, onLogout }) => {
  const { user, updateProfile, forgotPasswordRequest, verifyResetOtp, resetPasswordVerify } = useAuth();

  const [fullName, setFullName] = useState<string>(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone_number || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Password Reset Modal states
  const [resetModalVisible, setResetModalVisible] = useState<boolean>(false);
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [isResettingPass, setIsResettingPass] = useState<boolean>(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateProfile(fullName.trim(), phoneNumber.trim());
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerResetPassword = async () => {
    if (!user) return;
    setIsResettingPass(true);
    try {
      const res = await forgotPasswordRequest(user.email);
      setDevOtp(res.devOtp);
      setResetModalVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate reset code.');
    } finally {
      setIsResettingPass(false);
    }
  };

  const handleResetPasswordSubmit = async (code: string, newPass: string) => {
    if (!user) return;
    await resetPasswordVerify(user.email, code, newPass);
    setResetModalVisible(false);
    Alert.alert('Success', 'Your password has been updated successfully!');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile & Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.full_name?.slice(0, 2).toUpperCase() || 'CB'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || 'Chillbro Customer'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.gold.primary} />
              <Text style={styles.roleText}>{user?.role || 'Customer'}</Text>
            </View>
          </View>
        </View>

        {/* Edit Info Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Profile Information</Text>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={[styles.textInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={colors.text.muted}
          />

          <Text style={styles.inputLabel}>Mobile Number (+61)</Text>
          <TextInput
            style={[styles.textInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="0400 000 000"
            placeholderTextColor={colors.text.muted}
            keyboardType="phone-pad"
          />

          {saveMessage ? <Text style={styles.successMessage}>{saveMessage}</Text> : null}

          <TouchableOpacity
            style={[styles.saveBtn, isSaving ? styles.saveBtnDisabled : null]}
            onPress={handleSaveProfile}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.dark.darkest} />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security / Password Reset */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Security & Account</Text>

          <TouchableOpacity
            style={styles.securityRow}
            onPress={handleTriggerResetPassword}
            disabled={isResettingPass}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="key-outline" size={20} color={colors.gold.dark} />
              <View>
                <Text style={styles.securityLabel}>Reset Password</Text>
                <Text style={styles.securitySub}>Sends a 6-digit OTP to change your password</Text>
              </View>
            </View>
            {isResettingPass ? (
              <ActivityIndicator size="small" color={colors.gold.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.status.badgeDanger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password Reset Modal (Step 1: OTP, Step 2: New Password + Confirm Password) */}
      <ResetPasswordModal
        visible={resetModalVisible}
        email={user?.email || ''}
        devOtp={devOtp}
        onVerifyOtp={async (code: string) => {
          if (!user) return;
          await verifyResetOtp(user.email, code);
        }}
        onResetPassword={handleResetPasswordSubmit}
        onResend={async () => {
          if (!user) return {};
          return await forgotPasswordRequest(user.email);
        }}
        onClose={() => setResetModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.light,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dark.bg,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.dark.darkest,
    fontWeight: '900',
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    color: colors.gold.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  successMessage: {
    color: colors.status.success,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  saveBtnText: {
    color: colors.dark.darkest,
    fontWeight: '800',
    fontSize: 14,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  securityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  securitySub: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 13,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  logoutText: {
    color: colors.status.badgeDanger,
    fontWeight: '800',
    fontSize: 14,
  },
});
