import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useUserStore } from '../store/userStore';

type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthScreenProps {
  onClose?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onClose }) => {
  const { colors, scaleFont } = useAppTheme();
  const { signIn, signUp, resetPassword, isAuthLoading, closeAuthModal } = useUserStore();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      closeAuthModal();
    }
  };

  const validate = (): boolean => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    if (mode === 'forgot') {
      return true;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setErrorMessage('Please enter your full name or clinical title.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (mode === 'signin') {
      const res = await signIn(email, password);
      if (res.success) {
        handleDismiss();
      } else {
        setErrorMessage(res.error || 'Invalid credentials.');
      }
    } else if (mode === 'signup') {
      const res = await signUp(email, password, displayName);
      if (res.success) {
        if (res.message) {
          setSuccessMessage(res.message);
          setMode('signin');
        } else {
          handleDismiss();
        }
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } else if (mode === 'forgot') {
      const res = await resetPassword(email);
      if (res.success) {
        setSuccessMessage('Password reset link sent! Please check your email.');
      } else {
        setErrorMessage(res.error || 'Failed to send password reset email.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Dismiss Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceContainerLow }]}
            onPress={handleDismiss}
            accessibilityLabel="Close authentication and continue as guest"
            accessibilityRole="button"
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primaryContainer }]}>
            <ShieldCheck size={32} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text, fontSize: scaleFont(22) }]}>
            AccessOne Clinical AI
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            {mode === 'signin' && 'Sign in to sync your accessibility preferences & emergency contacts.'}
            {mode === 'signup' && 'Create your verified patient or clinician accessibility profile.'}
            {mode === 'forgot' && 'Enter your email to receive a secure password reset link.'}
          </Text>
        </View>

        {/* Mode Selector Tabs */}
        <View
          style={[styles.tabSelector, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
          accessible={true}
          accessibilityRole="tablist"
        >
          <TouchableOpacity
            style={[
              styles.tabBtn,
              mode === 'signin' && { backgroundColor: colors.surface, shadowColor: '#000', elevation: 2 },
            ]}
            onPress={() => {
              setMode('signin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'signin' }}
            accessibilityLabel="Sign In tab"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: mode === 'signin' ? colors.primary : colors.textSecondary,
                  fontSize: scaleFont(13),
                  fontWeight: mode === 'signin' ? '700' : '500',
                },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              mode === 'signup' && { backgroundColor: colors.surface, shadowColor: '#000', elevation: 2 },
            ]}
            onPress={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'signup' }}
            accessibilityLabel="Register tab"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: mode === 'signup' ? colors.primary : colors.textSecondary,
                  fontSize: scaleFont(13),
                  fontWeight: mode === 'signup' ? '700' : '500',
                },
              ]}
            >
              Register
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              mode === 'forgot' && { backgroundColor: colors.surface, shadowColor: '#000', elevation: 2 },
            ]}
            onPress={() => {
              setMode('forgot');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'forgot' }}
            accessibilityLabel="Reset tab"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: mode === 'forgot' ? colors.primary : colors.textSecondary,
                  fontSize: scaleFont(13),
                  fontWeight: mode === 'forgot' ? '700' : '500',
                },
              ]}
            >
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error / Success Feedback Banners */}
        {errorMessage && (
          <View style={[styles.feedbackBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={[styles.feedbackText, { color: '#B91C1C', fontSize: scaleFont(12) }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {successMessage && (
          <View style={[styles.feedbackBanner, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
            <CheckCircle2 size={18} color="#15803D" />
            <Text style={[styles.feedbackText, { color: '#166534', fontSize: scaleFont(12) }]}>
              {successMessage}
            </Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          {/* Display Name (Only in Register mode) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: scaleFont(13) }]}>
                Full Name or Patient Alias
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text, fontSize: scaleFont(14) }]}
                  placeholder="e.g. Alex Morgan"
                  placeholderTextColor={colors.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  accessibilityLabel="Full name or patient alias input"
                />
              </View>
            </View>
          )}

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text, fontSize: scaleFont(13) }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text, fontSize: scaleFont(14) }]}
                placeholder="name@healthcare.org"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email address input"
              />
            </View>
          </View>

          {/* Password (Sign In & Sign Up) */}
          {mode !== 'forgot' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: scaleFont(13) }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text, fontSize: scaleFont(14) }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Confirm Password (Only in Register) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: scaleFont(13) }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text, fontSize: scaleFont(14) }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  accessibilityLabel="Confirm password input"
                />
              </View>
            </View>
          )}

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              isAuthLoading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={isAuthLoading}
            accessibilityLabel={
              mode === 'signin'
                ? 'Sign in to AccessOne'
                : mode === 'signup'
                ? 'Create new clinical account'
                : 'Send password reset instructions'
            }
            accessibilityRole="button"
          >
            {isAuthLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <View style={styles.submitBtnRow}>
                <Text
                  style={[
                    styles.submitBtnText,
                    { color: colors.onPrimary, fontSize: scaleFont(15) },
                  ]}
                >
                  {mode === 'signin' && 'Sign In to AccessOne'}
                  {mode === 'signup' && 'Create Clinical Account'}
                  {mode === 'forgot' && 'Send Reset Instructions'}
                </Text>
                <ArrowRight size={18} color={colors.onPrimary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Guest / Bypass Button */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleDismiss}
            accessibilityLabel="Continue in offline guest mode"
            accessibilityRole="button"
          >
            <Text style={[styles.guestBtnText, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
              Continue in Offline Guest Mode
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  brandSubtitle: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabText: {
    letterSpacing: 0.1,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  feedbackText: {
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  submitBtn: {
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  guestBtnText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
