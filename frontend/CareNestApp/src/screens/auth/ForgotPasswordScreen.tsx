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
import { colors } from '../../theme/colors';
import Input from '../../components/common/Input';
import Icon from '../../components/common/Icon';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successSection}>
            <View style={styles.successIcon}>
              <Icon name="check_circle" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Email đã được gửi!</Text>
            <Text style={styles.subtitle}>
              Kiểm tra hộp thư {email} và làm theo hướng dẫn để đặt lại mật khẩu.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Icon name="lock" size={32} color={colors.primary} />
              </View>
              <Text style={styles.title}>Quên mật khẩu?</Text>
              <Text style={styles.subtitle}>
                Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
              </Text>
            </View>

            <View style={styles.card}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="email@vi-du.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Icon name="mail" size={20} color={colors.outline} />}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, !email && styles.disabled]}
                disabled={!email}
                onPress={() => setSent(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Gửi email khôi phục</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
              <Icon name="arrow_back" size={16} color={colors.primary} />
              <Text style={styles.backLinkText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: 24 },
  header: { marginBottom: 32 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontFamily: 'Manrope', fontWeight: '800', color: colors.onBackground, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Inter', color: colors.onSurfaceVariant, lineHeight: 22 },
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
  primaryBtn: {
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
  disabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  backLinkText: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.primary },
  successSection: { alignItems: 'center', paddingTop: 40, gap: 16 },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
