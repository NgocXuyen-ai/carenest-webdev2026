import type { OnboardingSlide } from '../types';
import { CARENEST_LOGO_FULL, CARENEST_LOGO_HOUSE } from '../assets/branding';

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'ob-1',
    title: 'Quản lý sức khỏe\ngia đình toàn diện',
    description:
      'Lưu trữ hồ sơ y tế, theo dõi sức khỏe và chăm sóc từng thành viên trong gia đình.',
    imageSource: CARENEST_LOGO_FULL,
  },
  {
    id: 'ob-2',
    title: 'Nhắc nhở uống thuốc\nthông minh',
    description:
      'Không bao giờ quên uống thuốc với hệ thống nhắc nhở theo giờ, tên thuốc và liều dùng.',
    imageSource: CARENEST_LOGO_HOUSE,
  },
  {
    id: 'ob-3',
    title: 'Trợ lý AI hỗ trợ\nchăm sóc sức khỏe',
    description: 'Hỏi AI về sức khỏe gia đình bằng giọng nói hoặc văn bản, nhanh chóng và dễ dàng.',
    imageSource: CARENEST_LOGO_HOUSE,
  },
];
