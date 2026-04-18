import type { ChatMessage } from '../types';

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'ai',
    text: 'Xin chào! Tôi là trợ lý AI CareNest. Tôi có thể giúp bạn tra cứu thông tin sức khỏe, lịch uống thuốc, lịch tái khám của các thành viên trong gia đình. Hỏi tôi bất cứ điều gì nhé! 💊',
    timestamp: '2025-04-15T08:00:00',
  },
  {
    id: 'msg-2',
    role: 'user',
    text: 'Nhắc tôi về lịch uống thuốc chiều nay của bà An.',
    timestamp: '2025-04-15T08:01:00',
  },
  {
    id: 'msg-3',
    role: 'ai',
    text: 'Buổi chiều hôm nay bà An cần uống các thuốc sau:',
    timestamp: '2025-04-15T08:01:05',
    embeddedMedicines: [
      { name: 'Amlodipine 5mg', dosage: '1 viên', instruction: 'Sau ăn trưa' },
      { name: 'Vitamin B12', dosage: '1 viên', instruction: 'Sau ăn trưa' },
    ],
  },
];
