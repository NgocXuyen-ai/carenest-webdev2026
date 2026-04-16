import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import Input from '../../components/common/Input';
import Icon from '../../components/common/Icon';
import type { AuthStackParamList } from '../../navigation/navigationTypes';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow_back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Icon name="nest_eco_leaf" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>CareNest</Text>
          </View>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>Bắt đầu hành trình chăm sóc sức khỏe gia đình</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Input
            label="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nguyễn Văn A"
            leftIcon={<Icon name="person" size={20} color={colors.outline} />}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="email@vi-du.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Icon name="mail" size={20} color={colors.outline} />}
          />
          <Input
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="Tối thiểu 8 ký tự"
            secureTextEntry={!showPassword}
            leftIcon={<Icon name="lock" size={20} color={colors.outline} />}
            rightIcon={
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} color={colors.outline} />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Terms checkbox */}
          <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Icon name="check" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              Tôi đồng ý với{' '}
              <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
              {' '}và{' '}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerBtn, !agreed && styles.registerBtnDisabled]}
            disabled={!agreed}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>Đăng ký</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Tiếp tục với Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}> Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24 },
  header: { marginBottom: 28 },
  backBtn: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 22, fontFamily: 'Manrope', fontWeight: '800', color: colors.onBackground },
  title: { fontSize: 26, fontFamily: 'Manrope', fontWeight: '800', color: colors.onBackground, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { flex: 1, fontSize: 13, fontFamily: 'Inter', color: colors.onSurfaceVariant, lineHeight: 20 },
  termsLink: { color: colors.primary, fontWeight: '600' },
  registerBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  registerBtnDisabled: { opacity: 0.5 },
  registerBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant + '40' },
  dividerText: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 1.5 },
  googleBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant + '50',
    backgroundColor: colors.surfaceContainerLowest,
    gap: 10,
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4', fontFamily: 'Inter' },
  googleText: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  footerLink: { fontSize: 14, fontFamily: 'Inter', fontWeight: '700', color: colors.primary },
});
