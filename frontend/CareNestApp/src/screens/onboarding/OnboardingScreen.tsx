import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { onboardingSlides } from '../../data/onboardingSlides';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  function handleNext() {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 32 }]}>
      {/* Decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, { top: insets.top + 16 }]}
        onPress={completeOnboarding}
      >
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>🏥</Text>
              </View>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.description}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {onboardingSlides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* CTA button */}
      <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.85}>
        <Text style={styles.ctaText}>
          {currentIndex < onboardingSlides.length - 1 ? 'Tiếp theo' : 'Bắt đầu'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  blobTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryFixed,
    opacity: 0.3,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.tertiaryFixed,
    opacity: 0.2,
  },
  skipBtn: { position: 'absolute', right: 24, zIndex: 10 },
  skipText: { fontSize: 14, fontFamily: 'Inter', fontWeight: '600', color: colors.outline },
  slide: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 120 },
  imageContainer: { marginBottom: 48 },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: { fontSize: 80 },
  slideTitle: {
    fontSize: 28,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  slideDesc: {
    fontSize: 15,
    fontFamily: 'Inter',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: colors.primary },
  dotInactive: { width: 8, backgroundColor: colors.outlineVariant },
  cta: {
    width: width - 48,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
