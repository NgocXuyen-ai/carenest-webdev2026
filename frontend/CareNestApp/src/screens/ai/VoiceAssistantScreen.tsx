import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import Icon from '../../components/common/Icon';

const EXAMPLE_Q = 'Nhắc tôi cho bà uống thuốc tim lúc 8 giờ tối nay...';
const EXAMPLE_A = 'Đã hiểu. Tôi sẽ đặt lịch nhắc nhở cho bà uống thuốc tim vào lúc 20:00 tối nay. Bạn có muốn thêm ghi chú gì khác không?';

export default function VoiceAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [voiceState, setVoiceState] = useState<'listening' | 'processing' | 'speaking'>('listening');
  const [transcript, setTranscript] = useState(EXAMPLE_Q);
  const [response, setResponse] = useState('');

  // Animations
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulsing animations
    const createPulse = (val: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 2.2,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createPulse(pulse1, 0);
    createPulse(pulse2, 600);
    createPulse(pulse3, 1200);

    // Mock flow
    const timer = setTimeout(() => {
      setVoiceState('processing');
      setTimeout(() => {
        setResponse(EXAMPLE_A);
        setVoiceState('speaking');
      }, 1500);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const opacity1 = pulse1.interpolate({ inputRange: [1, 2.2], outputRange: [0.4, 0] });
  const opacity2 = pulse2.interpolate({ inputRange: [1, 2.2], outputRange: [0.3, 0] });
  const opacity3 = pulse3.interpolate({ inputRange: [1, 2.2], outputRange: [0.2, 0] });

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header - Close Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Animated Mic Section */}
        <View style={styles.micContainer}>
          <Animated.View style={[styles.ring, { transform: [{ scale: pulse1 }], opacity: opacity1 }]} />
          <Animated.View style={[styles.ring, { transform: [{ scale: pulse2 }], opacity: opacity2 }]} />
          <Animated.View style={[styles.ring, { transform: [{ scale: pulse3 }], opacity: opacity3 }]} />
          <View style={styles.mainMic}>
            <Icon name="mic" size={40} color="#fff" />
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {voiceState === 'listening' ? 'ĐANG NGHE...' : voiceState === 'processing' ? 'ĐANG XỬ LÝ...' : 'ĐANG NÓI...'}
            </Text>
          </View>
          
          <Text style={styles.transcript}>{transcript}</Text>
        </View>

        {/* AI Response Card */}
        {response ? (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiAvatar}>
                <Icon name="smart_toy" size={20} color="#fff" />
              </View>
              <Text style={styles.aiName}>AI Care Assistant</Text>
              <TouchableOpacity>
                <Icon name="volume_up" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.aiText}>{response}</Text>
          </View>
        ) : <View style={{ height: 160 }} />}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.waveBarContainer}>
          <View style={styles.waveBarActive} />
          <View style={styles.waveBarInactive} />
        </View>
        <Text style={styles.footerText}>GÕ PHÍM ĐỂ NHẬP VĂN BẢN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f131a' },
  header: {
    height: 60,
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  micContainer: {
    marginTop: 40,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db',
  },
  mainMic: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  statusSection: {
    marginTop: 60,
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  transcript: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },
  aiCard: {
    marginTop: 40,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  aiText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  waveBarContainer: {
    flexDirection: 'row',
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  waveBarActive: {
    width: '60%',
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  waveBarInactive: {
    width: '40%',
    height: '100%',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
