import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../../components/common/Icon';
import { formatBloodType } from '../../utils/healthOptions';

type EmergencyProps = {
  bloodType?: string | null;
  allergy?: string | null;
  medicalHistory?: string | null;
  emergencyContactPhone?: string | null;
  fullName?: string | null;
};

function normalizeList(value?: string | null): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function callNumber(phone: string) {
  return Linking.openURL(`tel:${phone}`);
}

export default function Emergency({
  bloodType,
  allergy,
  medicalHistory,
  emergencyContactPhone,
  fullName,
}: EmergencyProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const allergyItems = normalizeList(allergy);
  const conditionItems = normalizeList(medicalHistory);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.sosContainer}>
        <Animated.View
          style={[
            styles.pulseCircle,
            { transform: [{ scale: pulseAnim }], opacity: 0.3 },
          ]}
        />
        <TouchableOpacity
          style={styles.sosButton}
          activeOpacity={0.8}
          onPress={() => void callNumber('115')}
        >
          <View style={styles.sosInner}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubText}>GỌI 115</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.sosHint}>Nhấn để gọi cấp cứu ngay lập tức</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>THÔNG TIN KHẨN CẤP</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.infoGrid}>
        <InfoCard
          icon="bloodtype"
          title="Nhóm máu"
          value={formatBloodType(bloodType)}
          color="#EF4444"
        />
        <InfoCard
          icon="warning"
          title="Dị ứng"
          value={allergyItems.length > 0 ? allergyItems.join(', ') : 'Chưa cập nhật'}
          color="#F59E0B"
        />
        <InfoCard
          icon="history_edu"
          title="Tiền sử bệnh"
          value={conditionItems.length > 0 ? conditionItems.join(', ') : 'Chưa cập nhật'}
          color="#1E3A8A"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>LIÊN HỆ KHẨN CẤP</Text>
        <View style={styles.line} />
      </View>

      {emergencyContactPhone ? (
        <View style={styles.contactsList}>
          <ContactItem
            name={fullName || 'Liên hệ khẩn cấp'}
            role="Số điện thoại khẩn cấp"
            phone={emergencyContactPhone}
          />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Icon name="info" size={18} color="#64748B" />
          <Text style={styles.emptyCardText}>
            Hồ sơ này chưa có số điện thoại liên hệ khẩn cấp.
          </Text>
        </View>
      )}

    </ScrollView>
  );
}

function InfoCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={[styles.infoValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function ContactItem({
  name,
  role,
  phone,
}: {
  name: string;
  role: string;
  phone: string;
}) {
  return (
    <View style={styles.contactItem}>
      <View style={styles.contactLeft}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarChar}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.contactMeta}>
          <Text style={styles.contactName}>{name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
          <Text style={styles.phoneText}>{phone}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.callButton}
        onPress={() => void callNumber(phone)}
        activeOpacity={0.8}
      >
        <Icon name="call" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: 44,
    backgroundColor: '#FFF1F2',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 30,
  },
  pulseCircle: {
    position: 'absolute',
    top: 44,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EF4444',
  },
  sosButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  sosInner: { alignItems: 'center' },
  sosText: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  sosSubText: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  sosHint: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginTop: 20 },
  sectionHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  infoGrid: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '800', lineHeight: 22 },
  contactsList: { paddingHorizontal: 20, gap: 12 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 15 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: { fontSize: 18, fontWeight: '800', color: '#64748B' },
  contactMeta: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  roleBadge: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: { color: '#3B82F6', fontSize: 11, fontWeight: '700' },
  phoneText: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 6 },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  emptyCardText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    fontWeight: '500',
  },
});
