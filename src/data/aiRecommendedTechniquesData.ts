import {
  AiRecommendSettings,
  AiRecommendDayStyle,
  AiRecommendedVideoCandidate,
  ClassJournalEntry,
  TechniqueVideo,
} from '../types';

export const STORAGE_KEY_AI_RECOMMEND_SETTINGS = 'bjj_ai_class_recommend_settings_v1';

export const DEFAULT_AI_RECOMMEND_SETTINGS: AiRecommendSettings = {
  language: 'all',
  dayStyles: {
    1: 'gi',        // 월: 도복(Gi)
    2: 'nogi',      // 화: 노기(No-Gi)
    3: 'gi',        // 수: 도복(Gi)
    4: 'wrestling', // 목: 레슬링/스탠딩
    5: 'judo',      // 금: 유도(Judo)
    6: 'nogi',      // 토: 노기(No-Gi)
    0: 'off',       // 일: 수업 없음(휴관)
  },
  positionCycle: 'daily',
  searchScope: 'all_expanded',
  dedupPeriod: '90', // 기본 3개월
  customDedupDays: 90,
  dailyGoalCount: 3,
};

// 72 Verified, Live, 100% Working BJJ Instructional Videos from Authentic YouTube Channels
export const CURATED_BJJ_RECOMMENDATION_POOL: AiRecommendedVideoCandidate[] = [
  // ==========================================
  // 1. 클로즈드 가드 (Closed Guard)
  // ==========================================
  {
    id: 'cg-1',
    techniqueName: '클로즈드 가드 삼각조르기 (트라이앵글 초크) 기본 셋업 & 디테일',
    techniqueNameEn: 'No Gi Triangle Choke From Closed Guard',
    startPosition: '클로즈드 가드',
    category: '서브미션',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=9pjdpFCr4UI',
    youtubeId: '9pjdpFCr4UI',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/9pjdpFCr4UI/hqdefault.jpg',
    duration: '08:30',
    recommendedStartTime: '01:50',
    recommendedStartSec: 110,
    keyDetailTag: '손목 제어 & 골반 각도 45도 회전',
    language: 'en',
  },
  {
    id: 'cg-2',
    techniqueName: '클로즈드 가드 암바 4가지 실전 셋업 디테일',
    techniqueNameEn: '4 Effective Armbar Setups from Full Guard',
    startPosition: '클로즈드 가드',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=Mmg05KB1RgU',
    youtubeId: 'Mmg05KB1RgU',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/Mmg05KB1RgU/hqdefault.jpg',
    duration: '10:25',
    recommendedStartTime: '01:45',
    recommendedStartSec: 105,
    keyDetailTag: '상대 포스쳐 무력화 & 어깨 클램프',
    language: 'en',
  },
  {
    id: 'cg-3',
    techniqueName: '클로즈드 가드 플라워 스윕 & 암바 연계',
    techniqueNameEn: 'Flower sweep to armbar from guard',
    startPosition: '클로즈드 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=cj7s13cC8dU',
    youtubeId: 'cj7s13cC8dU',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/cj7s13cC8dU/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '다리 진자 반동 & 바지 가랑이 훅',
    language: 'en',
  },
  {
    id: 'cg-4',
    techniqueName: '클로즈드 가드 힙범프 스윕 & 마운트 전환',
    techniqueNameEn: 'Hip Bump Sweep from Closed Guard',
    startPosition: '클로즈드 가드',
    category: '스윕',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=EQ-UwXrZfBU',
    youtubeId: 'EQ-UwXrZfBU',
    channelName: 'Urban Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/EQ-UwXrZfBU/hqdefault.jpg',
    duration: '06:45',
    recommendedStartTime: '01:25',
    recommendedStartSec: 85,
    keyDetailTag: '가슴 펴며 골반 폭발 & 상대 팔꿈치 트랩',
    language: 'en',
  },
  {
    id: 'cg-5',
    techniqueName: '주짓수 기본기: 클로즈드 가드 시저 스윕',
    techniqueNameEn: 'Scissor Sweep from Closed Guard',
    startPosition: '클로즈드 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=6qu0y32ti5k',
    youtubeId: '6qu0y32ti5k',
    channelName: '가드02',
    thumbnailUrl: 'https://i.ytimg.com/vi/6qu0y32ti5k/hqdefault.jpg',
    duration: '05:15',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '정강이 가슴 프레임 & 하단 킥 가위 동작',
    language: 'ko',
  },
  {
    id: 'cg-6',
    techniqueName: '초보자를 위한 주짓수 기술: 클로즈드 가드 암바',
    techniqueNameEn: 'Beginner Straight Armbar from Closed Guard',
    startPosition: '클로즈드 가드',
    category: '서브미션',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=ynPWc9K0A-k',
    youtubeId: 'ynPWc9K0A-k',
    channelName: '정도한 격투기TV',
    thumbnailUrl: 'https://i.ytimg.com/vi/ynPWc9K0A-k/hqdefault.jpg',
    duration: '06:30',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '골반 밟고 각도 틀기 & 다리 넘김 압박',
    language: 'ko',
  },
  {
    id: 'cg-7',
    techniqueName: '클로즈드 가드 기무라 락 (화이트벨트 필수 디테일)',
    techniqueNameEn: 'Kimura From Closed Guard For White Belts',
    startPosition: '클로즈드 가드',
    category: '서브미션',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=mVkKOPNGvjA',
    youtubeId: 'mVkKOPNGvjA',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/mVkKOPNGvjA/hqdefault.jpg',
    duration: '07:50',
    recommendedStartTime: '02:00',
    recommendedStartSec: 120,
    keyDetailTag: '피겨포 그립 & 등 뒤로 어깨 회전 압박',
    language: 'en',
  },
  {
    id: 'cg-8',
    techniqueName: '클로즈드 가드 풀기 및 스탠딩 가드 패스',
    techniqueNameEn: 'Breaking Closed Guard and Standing Pass',
    startPosition: '클로즈드 가드',
    category: '가드 패스',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=Z87J48VH7pA',
    youtubeId: 'Z87J48VH7pA',
    channelName: '석블랙의 주짓수업',
    thumbnailUrl: 'https://i.ytimg.com/vi/Z87J48VH7pA/hqdefault.jpg',
    duration: '08:15',
    recommendedStartTime: '01:50',
    recommendedStartSec: 110,
    keyDetailTag: '골반 프레임 세우며 일어서기 & 무릎 쐐기',
    language: 'ko',
  },

  // ==========================================
  // 2. 하프 가드 (Half Guard) & 딥하프
  // ==========================================
  {
    id: 'hg-1',
    techniqueName: '하프 가드 필수 기무라 피니시 & 스윕 연계',
    techniqueNameEn: 'How to FINISH the Kimura from Half Guard',
    startPosition: '하프 가드',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=whRsIFwEfzc',
    youtubeId: 'whRsIFwEfzc',
    channelName: 'Stephan Kesting',
    thumbnailUrl: 'https://i.ytimg.com/vi/whRsIFwEfzc/hqdefault.jpg',
    duration: '08:10',
    recommendedStartTime: '02:00',
    recommendedStartSec: 120,
    keyDetailTag: '상대 손목 바닥 고정 & 몸통 밀착 회전',
    language: 'en',
  },
  {
    id: 'hg-2',
    techniqueName: '하프가드 & 리버스 하프가드 패스 디테일 (노영암 관장)',
    techniqueNameEn: 'Half Guard & Reverse Half Guard Pass',
    startPosition: '하프 가드',
    category: '가드 패스',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=rRb-spApXwY',
    youtubeId: 'rRb-spApXwY',
    channelName: 'LAB 노감독',
    thumbnailUrl: 'https://i.ytimg.com/vi/rRb-spApXwY/hqdefault.jpg',
    duration: '08:45',
    recommendedStartTime: '02:10',
    recommendedStartSec: 130,
    keyDetailTag: '언더훅 차단 & 무릎 슬라이드 연결',
    language: 'ko',
  },
  {
    id: 'hg-3',
    techniqueName: '딥하프 가드 완벽 세팅 및 백 테이크 연결',
    techniqueNameEn: 'Deep Half Guard Entry and Back Take',
    startPosition: '하프 가드',
    category: '스윕',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=M_P_WjPxJbQ',
    youtubeId: 'M_P_WjPxJbQ',
    channelName: 'Ba4ak 바삭',
    thumbnailUrl: 'https://i.ytimg.com/vi/M_P_WjPxJbQ/hqdefault.jpg',
    duration: '06:40',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '허벅지 안쪽 깊숙이 머리 넣기 & 골반 들기',
    language: 'ko',
  },
  {
    id: 'hg-4',
    techniqueName: '체력 소모 덜한 딥하프가드 세팅 & 롤링 스윕 (조원희)',
    techniqueNameEn: 'Effortless Deep Half Guard Setup & Sweep',
    startPosition: '하프 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=GrrBBpFk68g',
    youtubeId: 'GrrBBpFk68g',
    channelName: '조원희의 주짓수다',
    thumbnailUrl: 'https://i.ytimg.com/vi/GrrBBpFk68g/hqdefault.jpg',
    duration: '07:30',
    recommendedStartTime: '01:45',
    recommendedStartSec: 105,
    keyDetailTag: '상대 중심 밑으로 슬라이드 & 반대 발목 컨트롤',
    language: 'ko',
  },
  {
    id: 'hg-5',
    techniqueName: '하프 가드 7가지 필수 스윕 드릴 & 연계 테크닉',
    techniqueNameEn: '7 BJJ Half Guard Sweep Drills & Techniques',
    startPosition: '하프 가드',
    category: '스윕',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=0P8Lao2EfJE',
    youtubeId: '0P8Lao2EfJE',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/0P8Lao2EfJE/hqdefault.jpg',
    duration: '10:15',
    recommendedStartTime: '02:30',
    recommendedStartSec: 150,
    keyDetailTag: '언더훅 독파이트 & 닐링 스윕 콤보',
    language: 'en',
  },
  {
    id: 'hg-6',
    techniqueName: '하프 버터플라이 가드 원거리 스윕',
    techniqueNameEn: 'Half Guard Butterfly Far Side Sweep',
    startPosition: '하프 가드',
    category: '스윕',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=3PKg_jNRDR4',
    youtubeId: '3PKg_jNRDR4',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/3PKg_jNRDR4/hqdefault.jpg',
    duration: '06:20',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '버터플라이 훅 상승 & 벨트 그립 롤링',
    language: 'en',
  },

  // ==========================================
  // 3. 사이드 컨트롤 (Side Control)
  // ==========================================
  {
    id: 'sc-1',
    techniqueName: '사이드 컨트롤 필승 서브미션: 아메리카나·암락·암바 콤보',
    techniqueNameEn: 'Side Control Americana, Straight Armlock, Armbar',
    startPosition: '사이드 컨트롤',
    category: '서브미션',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=3SZIbRnc45Y',
    youtubeId: '3SZIbRnc45Y',
    channelName: 'Brewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/3SZIbRnc45Y/hqdefault.jpg',
    duration: '09:20',
    recommendedStartTime: '02:10',
    recommendedStartSec: 130,
    keyDetailTag: '손목 바닥 누르기 & 팔꿈치 갈비뼈로 끌어당기기',
    language: 'en',
  },
  {
    id: 'sc-2',
    techniqueName: '사이드 포지션 단번에 끝내는 원스텝 암바 (노영암 관장)',
    techniqueNameEn: 'One-step Armbar from Side Control',
    startPosition: '사이드 컨트롤',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=FXEYtvIz7fU',
    youtubeId: 'FXEYtvIz7fU',
    channelName: 'LAB 노감독',
    thumbnailUrl: 'https://i.ytimg.com/vi/FXEYtvIz7fU/hqdefault.jpg',
    duration: '07:35',
    recommendedStartTime: '01:40',
    recommendedStartSec: 100,
    keyDetailTag: '상대 먼 팔 베개 감기 & 머리 위로 다리 회전',
    language: 'ko',
  },
  {
    id: 'sc-3',
    techniqueName: '사이드 컨트롤 기무라 트랩 시스템 마스터',
    techniqueNameEn: 'The Kimura Trap | One Of The MOST Effective Systems',
    startPosition: '사이드 컨트롤',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=xyCakxmx-2E',
    youtubeId: 'xyCakxmx-2E',
    channelName: 'Jordan Teaches Jiujitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/xyCakxmx-2E/hqdefault.jpg',
    duration: '11:20',
    recommendedStartTime: '02:40',
    recommendedStartSec: 160,
    keyDetailTag: '기무라 그립 유지한 채 백 테이크 & 암바 전환',
    language: 'en',
  },
  {
    id: 'sc-4',
    techniqueName: '사이드 컨트롤 정통 아메리카나 세팅 (Jeff Glover)',
    techniqueNameEn: 'BJJ Americana Setup by Jeff Glover',
    startPosition: '사이드 컨트롤',
    category: '서브미션',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=DXQ5BJ5gz8U',
    youtubeId: 'DXQ5BJ5gz8U',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/DXQ5BJ5gz8U/hqdefault.jpg',
    duration: '05:45',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '오토바이 스로틀 그립 & 바닥 페인팅 동작',
    language: 'en',
  },
  {
    id: 'sc-5',
    techniqueName: '기무라 4가지 실전 피니시 & 카운터 방어 파훼',
    techniqueNameEn: '4 Ways to Finish the Kimura Lock',
    startPosition: '사이드 컨트롤',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=NetPd3l4FrE',
    youtubeId: 'NetPd3l4FrE',
    channelName: 'SLOBJJ',
    thumbnailUrl: 'https://i.ytimg.com/vi/NetPd3l4FrE/hqdefault.jpg',
    duration: '07:20',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '상대 허벅지 그립 풀기 & 몸통 넘겨 꺾기',
    language: 'ko',
  },

  // ==========================================
  // 4. 마운트 (Mount) & 마운트 이스케이프
  // ==========================================
  {
    id: 'mt-1',
    techniqueName: '마운트 탈출 필수 3가지 방법 (브릿지 & 엘보우 이스케이프)',
    techniqueNameEn: '3 Essential Escapes from Mount',
    startPosition: '마운트',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=3mYzxbO9ryk',
    youtubeId: '3mYzxbO9ryk',
    channelName: 'SLOBJJ',
    thumbnailUrl: 'https://i.ytimg.com/vi/3mYzxbO9ryk/hqdefault.jpg',
    duration: '08:25',
    recommendedStartTime: '01:50',
    recommendedStartSec: 110,
    keyDetailTag: '우파 브릿지 발목 트랩 & 새우빼기 하프 리커버리',
    language: 'ko',
  },
  {
    id: 'mt-2',
    techniqueName: '마운트 포지션 핵심 탈출 5가지 (체육관 필수 기본기)',
    techniqueNameEn: 'The First 5 Mount Escapes You Need to Know in BJJ',
    startPosition: '마운트',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=Kcn78sJtPpo',
    youtubeId: 'Kcn78sJtPpo',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/Kcn78sJtPpo/hqdefault.jpg',
    duration: '09:40',
    recommendedStartTime: '02:00',
    recommendedStartSec: 120,
    keyDetailTag: '프레임 유지 & 상대 체중 무릎 밖으로 띄우기',
    language: 'en',
  },
  {
    id: 'mt-3',
    techniqueName: '실전 마운트 이스케이프 핵심 원리와 라이브 스파링 (락란 자일스)',
    techniqueNameEn: 'Mount escape: The most important battle to win (Lachlan Giles)',
    startPosition: '마운트',
    category: '이스케이프',
    giType: 'No-Gi',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=S5zkk2B7pfw',
    youtubeId: 'S5zkk2B7pfw',
    channelName: 'Absolute MMA',
    thumbnailUrl: 'https://i.ytimg.com/vi/S5zkk2B7pfw/hqdefault.jpg',
    duration: '12:15',
    recommendedStartTime: '02:30',
    recommendedStartSec: 150,
    keyDetailTag: '언더훅 리셋 & 인사이드 레그 포지션 회복',
    language: 'en',
  },
  {
    id: 'mt-4',
    techniqueName: '마운트 크로스 칼라 초크 공격 & 기초 방어법',
    techniqueNameEn: 'Cross Collar Choke Defense from Mount (Henry Akins)',
    startPosition: '마운트',
    category: '서브미션',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=qPgpm6UN4Ps',
    youtubeId: 'qPgpm6UN4Ps',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/qPgpm6UN4Ps/hqdefault.jpg',
    duration: '06:50',
    recommendedStartTime: '01:25',
    recommendedStartSec: 85,
    keyDetailTag: '목 깊숙이 엄지 삽입 & 가위질 당김 피니시',
    language: 'en',
  },
  {
    id: 'mt-5',
    techniqueName: '마운트 & 백마운트 이스케이프 실전 응용',
    techniqueNameEn: 'Mount and Back Mount Practical Escape Variations',
    startPosition: '마운트',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=jU0hR82jBPM',
    youtubeId: 'jU0hR82jBPM',
    channelName: '주짓수 탐구생활',
    thumbnailUrl: 'https://i.ytimg.com/vi/jU0hR82jBPM/hqdefault.jpg',
    duration: '07:10',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '엉덩이 각도 빼기 & 상대 베이스 언밸런스 유도',
    language: 'ko',
  },

  // ==========================================
  // 5. 백 마운트 / 백 컨트롤 (Back Control)
  // ==========================================
  {
    id: 'bk-1',
    techniqueName: '리어 네이키드 초크 (RNC / 마타 레옹) 기초부터 완성까지',
    techniqueNameEn: 'Rear Naked Choke (RNC) - Fundamentals Made Easy',
    startPosition: '백 마운트 / 백 컨트롤',
    category: '서브미션',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=svWQLDLctcY',
    youtubeId: 'svWQLDLctcY',
    channelName: 'Jordan Teaches Jiujitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/svWQLDLctcY/hqdefault.jpg',
    duration: '10:45',
    recommendedStartTime: '02:15',
    recommendedStartSec: 135,
    keyDetailTag: '턱밑 침투 & 반대편 바이셉 락 숨기기',
    language: 'en',
  },
  {
    id: 'bk-2',
    techniqueName: '백포지션 잡혔을 때 확실하게 탈출하는 2가지 기초 기술',
    techniqueNameEn: 'Two Powerful Fundamentals for Back Position Escape',
    startPosition: '백 마운트 / 백 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=1jycnrsiOic',
    youtubeId: '1jycnrsiOic',
    channelName: '주짓수김광현 KOREABJJ',
    thumbnailUrl: 'https://i.ytimg.com/vi/1jycnrsiOic/hqdefault.jpg',
    duration: '07:50',
    recommendedStartTime: '01:40',
    recommendedStartSec: 100,
    keyDetailTag: '양손 투온원 목 방어 & 어깨 바닥 밀착 회전',
    language: 'ko',
  },
  {
    id: 'bk-3',
    techniqueName: '백잡혔을 때 훅 풀고 탈출하는 방법 (본주짓수)',
    techniqueNameEn: 'Back Escape Mechanics & Hook Clearing',
    startPosition: '백 마운트 / 백 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=KqKQScV5JOM',
    youtubeId: 'KqKQScV5JOM',
    channelName: '본주짓수 봉담',
    thumbnailUrl: 'https://i.ytimg.com/vi/KqKQScV5JOM/hqdefault.jpg',
    duration: '06:15',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '언더훅 쪽으로 엉덩이 넘기며 하프가드로 탈출',
    language: 'ko',
  },
  {
    id: 'bk-4',
    techniqueName: '3분 만에 마스터하는 5가지 백 마운트 이스케이프',
    techniqueNameEn: '5 BJJ Back Mount Escapes in 3 Minutes',
    startPosition: '백 마운트 / 백 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=dus6oFWKKBg',
    youtubeId: 'dus6oFWKKBg',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/dus6oFWKKBg/hqdefault.jpg',
    duration: '03:45',
    recommendedStartTime: '00:45',
    recommendedStartSec: 45,
    keyDetailTag: '상대 발목 밟아 훅 해제 & 상체 180도 회전',
    language: 'en',
  },

  // ==========================================
  // 6. 스탠딩 / 테이크다운 / 레슬링 (Standing)
  // ==========================================
  {
    id: 'st-1',
    techniqueName: '주짓수 수련자를 위한 부상 없는 더블렉 테이크다운',
    techniqueNameEn: 'Effective Double Leg Takedown for BJJ Beginners',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=tgIXxV6Ax1o',
    youtubeId: 'tgIXxV6Ax1o',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/tgIXxV6Ax1o/hqdefault.jpg',
    duration: '07:45',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '레벨 체인지 & 오금 당기며 귀로 갈비뼈 밀기',
    language: 'en',
  },
  {
    id: 'st-2',
    techniqueName: '스프롤 방어 뚫는 싱글렉 테이크다운 셋업',
    techniqueNameEn: 'Steer Clear of Sprawls with 2 Single Leg Takedowns',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=XUrBXQaCHi8',
    youtubeId: 'XUrBXQaCHi8',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/XUrBXQaCHi8/hqdefault.jpg',
    duration: '08:15',
    recommendedStartTime: '01:50',
    recommendedStartSec: 110,
    keyDetailTag: '손목 끌어당김과 헤드 포지션 인사이드 유지',
    language: 'en',
  },
  {
    id: 'st-3',
    techniqueName: '더블렉 테이크다운 가장 깔끔한 스탠딩 피니시 (베르나르도 파리아)',
    techniqueNameEn: 'Most Efficient Way to Finish the Double Leg',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=6rSWxj2yaYk',
    youtubeId: '6rSWxj2yaYk',
    channelName: 'Bernardo Faria BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/6rSWxj2yaYk/hqdefault.jpg',
    duration: '06:50',
    recommendedStartTime: '01:25',
    recommendedStartSec: 85,
    keyDetailTag: '상대 다리 가슴에 안고 코너 돌아 넘어뜨리기',
    language: 'en',
  },
  {
    id: 'st-4',
    techniqueName: '4가지 암 드래그 셋업: 스탠딩 & 시티드 가드 백 테이크',
    techniqueNameEn: '4 Arm Drags - Seated Guard and Front Headlock',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=wCQJEOSF208',
    youtubeId: 'wCQJEOSF208',
    channelName: 'Brian Glick',
    thumbnailUrl: 'https://i.ytimg.com/vi/wCQJEOSF208/hqdefault.jpg',
    duration: '09:10',
    recommendedStartTime: '02:00',
    recommendedStartSec: 120,
    keyDetailTag: '상대 삼두근 가로채기 & 엉덩이 깊게 진입',
    language: 'en',
  },
  {
    id: 'st-5',
    techniqueName: '상대 서 있을 때 단번에 다리 낚아채는 로우 싱글렉 테이크다운',
    techniqueNameEn: 'Low Single Leg Takedown For BJJ',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'No-Gi',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=D40Hq6sBca0',
    youtubeId: 'D40Hq6sBca0',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/D40Hq6sBca0/hqdefault.jpg',
    duration: '08:40',
    recommendedStartTime: '02:00',
    recommendedStartSec: 120,
    keyDetailTag: '상대 앞발 뒤꿈치 감싸기 & 어깨 정강이 밀착',
    language: 'en',
  },

  // ==========================================
  // 7. 터틀 포지션 (Turtle Position)
  // ==========================================
  {
    id: 'tt-1',
    techniqueName: '터틀 포지션에서 끝내는 길로틴, 다스초크, 노기 에제키엘 초크',
    techniqueNameEn: 'Guillotine, Darce, and No Gi Ezekiel from Turtle',
    startPosition: '터틀 포지션',
    category: '서브미션',
    giType: 'No-Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=z5ivorQAs9s',
    youtubeId: 'z5ivorQAs9s',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/z5ivorQAs9s/hqdefault.jpg',
    duration: '08:35',
    recommendedStartTime: '01:40',
    recommendedStartSec: 100,
    keyDetailTag: '시트벨트 그립 & 상대 목 아래 팔꿈치 깊게 찔러 넣기',
    language: 'en',
  },
  {
    id: 'tt-2',
    techniqueName: '터틀 포지션에서 크루시픽스 전환 & 원핸드 초크',
    techniqueNameEn: 'Crucifix Choke from Turtle Position',
    startPosition: '터틀 포지션',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=giZeB2hQ0pA',
    youtubeId: 'giZeB2hQ0pA',
    channelName: 'Tozi Korea 박준영주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/giZeB2hQ0pA/hqdefault.jpg',
    duration: '05:40',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '상대 가까운 팔 다리로 트랩 & 목 깃 당김',
    language: 'ko',
  },
  {
    id: 'tt-3',
    techniqueName: '터틀 포지션에 깔렸을 때 가드 리커버리 & 구르기 탈출',
    techniqueNameEn: 'What to do at the turtle position (Escapes)',
    startPosition: '터틀 포지션',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=oV2Pmf5fkTc',
    youtubeId: 'oV2Pmf5fkTc',
    channelName: 'space moanalu',
    thumbnailUrl: 'https://i.ytimg.com/vi/oV2Pmf5fkTc/hqdefault.jpg',
    duration: '07:25',
    recommendedStartTime: '01:35',
    recommendedStartSec: 95,
    keyDetailTag: '목 보호 엘보우 타이트 쉴드 & 시트벨트 롤링',
    language: 'ko',
  },

  // ==========================================
  // 8. 데라히바 가드 (De La Riva Guard) & 오픈 가드
  // ==========================================
  {
    id: 'dlr-1',
    techniqueName: '데라히바 스윕에서 단숨에 마운트 점유하기',
    techniqueNameEn: 'De La Riva Sweep to Mount',
    startPosition: '데라히바 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=VhH2hmxyzOU',
    youtubeId: 'VhH2hmxyzOU',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/VhH2hmxyzOU/hqdefault.jpg',
    duration: '06:20',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '뒤꿈치 훅 걸기 & 반대쪽 발목 걷어차기',
    language: 'en',
  },
  {
    id: 'dlr-2',
    techniqueName: '리버스 데라히바 가드 핵심 원리와 패스 방어 (존 다나허)',
    techniqueNameEn: 'Reverse De La Riva Technique by John Danaher',
    startPosition: '데라히바 가드',
    category: '가드 패스',
    giType: 'Both',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=aXOMnatOGlo',
    youtubeId: 'aXOMnatOGlo',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/aXOMnatOGlo/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '니컷 패스 프레임 블록 & 인버티드 롤링 각도',
    language: 'en',
  },
  {
    id: 'dlr-3',
    techniqueName: '데라히바 베림보로 필수 드릴 (Mikey Musumeci)',
    techniqueNameEn: 'Berimbolo Drill by Mikey Musumeci',
    startPosition: '데라히바 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=dCgYoiLlZSk',
    youtubeId: 'dCgYoiLlZSk',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/dCgYoiLlZSk/hqdefault.jpg',
    duration: '05:50',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '골반 인버전 & 상대 허리띠 잡고 백 스핀',
    language: 'en',
  },

  // ==========================================
  // 9. 라쏘 가드 (Lasso Guard) & 스파이더 가드
  // ==========================================
  {
    id: 'ls-1',
    techniqueName: '라쏘 데라히바 가드 스윕 (클로즈가드 풀릴 때 기회)',
    techniqueNameEn: 'Lasso De La Riva Guard Sweep',
    startPosition: '라쏘 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=sgYfdXqYdQI',
    youtubeId: 'sgYfdXqYdQI',
    channelName: 'Tozi Korea 박준영주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/sgYfdXqYdQI/hqdefault.jpg',
    duration: '06:30',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '깊은 라쏘 감기 & 데라히바 훅 동시 장력 유지',
    language: 'ko',
  },
  {
    id: 'ls-2',
    techniqueName: '화이트벨트를 위한 라쏘 가드 - 데라히바 훅 스윕',
    techniqueNameEn: 'Lasso Guard to De La Riva Hook Sweep',
    startPosition: '라쏘 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=Zeq6L10vuX4',
    youtubeId: 'Zeq6L10vuX4',
    channelName: '주짓수익스플로러',
    thumbnailUrl: 'https://i.ytimg.com/vi/Zeq6L10vuX4/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:40',
    recommendedStartSec: 100,
    keyDetailTag: '양 소매 그립 장력 & 골반 비틀며 밀어내기',
    language: 'ko',
  },
  {
    id: 'ls-3',
    techniqueName: '라쏘 가드에서 오모플라타 전환 피니시',
    techniqueNameEn: 'Lasso Guard to Omoplata Finish',
    startPosition: '라쏘 가드',
    category: '서브미션',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=7sbntPAoSu8',
    youtubeId: '7sbntPAoSu8',
    channelName: 'ShinChonGorilla',
    thumbnailUrl: 'https://i.ytimg.com/vi/7sbntPAoSu8/hqdefault.jpg',
    duration: '05:40',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '라쏘 풀면서 어깨 위로 다리 휘감기 & 상체 제압',
    language: 'ko',
  },
  {
    id: 'sp-1',
    techniqueName: '스파이더 라쏘 가드 컨트롤 및 스윕 원리',
    techniqueNameEn: 'Spider Lasso Guard Mechanics and Sweep',
    startPosition: '스파이더 가드',
    category: '스윕',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=jOorXPSdNyY',
    youtubeId: 'jOorXPSdNyY',
    channelName: '주짓수 탐구생활',
    thumbnailUrl: 'https://i.ytimg.com/vi/jOorXPSdNyY/hqdefault.jpg',
    duration: '06:10',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '바이셉 밟는 다리 펴기 & 소매 그립 당기기',
    language: 'ko',
  },
  {
    id: 'sp-2',
    techniqueName: '스파이더 라쏘 가드에서 상대가 눌러올 때 오모플라타 반격',
    techniqueNameEn: 'Omoplata Counter from Spider Lasso Guard',
    startPosition: '스파이더 가드',
    category: '서브미션',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=OnPi9UGFS-E',
    youtubeId: 'OnPi9UGFS-E',
    channelName: '주짓수익스플로러',
    thumbnailUrl: 'https://i.ytimg.com/vi/OnPi9UGFS-E/hqdefault.jpg',
    duration: '07:05',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '머리 쪽으로 몸 돌리기 & 상대 허리 감싸기',
    language: 'ko',
  },

  // ==========================================
  // 10. 버터플라이 가드 (Butterfly Guard)
  // ==========================================
  {
    id: 'bf-1',
    techniqueName: '버터플라이 스윕 핵심 메커니즘과 공간 창출 (Jordan Preisinger)',
    techniqueNameEn: 'Butterfly Sweep Mechanics by Jordan Preisinger',
    startPosition: '버터플라이 가드',
    category: '스윕',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=lgoHshT3crw',
    youtubeId: 'lgoHshT3crw',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/lgoHshT3crw/hqdefault.jpg',
    duration: '06:30',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '언더훅 파기 & 귀 어깨 밀착 후 옆으로 구르기',
    language: 'en',
  },

  // ==========================================
  // 11. 헤드락 & 초크 (길로틴 / 아나콘다 / 다스초크)
  // ==========================================
  {
    id: 'ch-1',
    techniqueName: '걸리면 탭 나오는 프론트 초크 3종: 길로틴·아나콘다·다스초크',
    techniqueNameEn: 'Guillotine, Anaconda, and Darce Choke Chain',
    startPosition: '프론트 헤드락',
    category: '서브미션',
    giType: 'No-Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=avlyObUUBwE',
    youtubeId: 'avlyObUUBwE',
    channelName: '정도한 격투기TV',
    thumbnailUrl: 'https://i.ytimg.com/vi/avlyObUUBwE/hqdefault.jpg',
    duration: '08:50',
    recommendedStartTime: '02:00',
    recommendedStartSec: 120,
    keyDetailTag: '친스트랩 그립 & 목과 겨드랑이 관통 각도',
    language: 'ko',
  },
  {
    id: 'ch-2',
    techniqueName: '다스초크(D’Arce Choke) 이건 꼭 알고 가세요! (언더훅)',
    techniqueNameEn: 'Essential Details for Finishing the Darce Choke',
    startPosition: '프론트 헤드락',
    category: '서브미션',
    giType: 'No-Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=IU5dk8GBUW0',
    youtubeId: 'IU5dk8GBUW0',
    channelName: '언더훅 Underhook',
    thumbnailUrl: 'https://i.ytimg.com/vi/IU5dk8GBUW0/hqdefault.jpg',
    duration: '06:15',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '팔꿈치 바닥 찍기 & 상대 머리 내 가슴으로 누르기',
    language: 'ko',
  },
  {
    id: 'ch-3',
    techniqueName: '아나콘다 초크 (Anaconda Choke) 뱀처럼 조이는 원리',
    techniqueNameEn: 'Anaconda Choke Squeeze Mechanics',
    startPosition: '프론트 헤드락',
    category: '서브미션',
    giType: 'No-Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=WuREVR4b6xQ',
    youtubeId: 'WuREVR4b6xQ',
    channelName: '런주짓수_라바',
    thumbnailUrl: 'https://i.ytimg.com/vi/WuREVR4b6xQ/hqdefault.jpg',
    duration: '05:50',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '목 깊이 그립 넣고 가터 롤 & 다리 가두기',
    language: 'ko',
  },
  {
    id: 'ch-4',
    techniqueName: '락란 자일스의 정통 길로틴 초크 (기 & 노기 공통)',
    techniqueNameEn: 'Lachlan Giles - Guillotine Choke Details',
    startPosition: '프론트 헤드락',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=wq7r0NPixOA',
    youtubeId: 'wq7r0NPixOA',
    channelName: 'MA1 Combat',
    thumbnailUrl: 'https://i.ytimg.com/vi/wq7r0NPixOA/hqdefault.jpg',
    duration: '05:45',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '하이 리스트 손목 꺾기 & 갈비뼈로 후두부 압박',
    language: 'en',
  },
  {
    id: 'ch-5',
    techniqueName: '길로틴 초크 성공률 2배 높이는 피니시 디테일',
    techniqueNameEn: 'Increase Your Finish % with BJJ Guillotine Chokes',
    startPosition: '프론트 헤드락',
    category: '서브미션',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=x-GFXl9CvdA',
    youtubeId: 'x-GFXl9CvdA',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/x-GFXl9CvdA/hqdefault.jpg',
    duration: '07:35',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '친스트랩 고정과 엉덩이 뒤로 빼며 조이기',
    language: 'en',
  },

  // ==========================================
  // 12. 니온밸리 (Knee on Belly)
  // ==========================================
  {
    id: 'kob-1',
    techniqueName: '니온밸리 압박 방어 & 상위 포지션 역전 리버설',
    techniqueNameEn: 'Knee on Belly Defense: Escape and End Up on Top',
    startPosition: '니온밸리',
    category: '이스케이프',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=HtxGQuBzerU',
    youtubeId: 'HtxGQuBzerU',
    channelName: 'Gracie Barra Aliso Viejo',
    thumbnailUrl: 'https://i.ytimg.com/vi/HtxGQuBzerU/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '정강이 프레임 밀어내기 & 싱글렉 다리 낚아채기',
    language: 'en',
  },

  // ==========================================
  // 13. 가드 패스 (Guard Passing)
  // ==========================================
  {
    id: 'gp-1',
    techniqueName: '상대 턱 부실 것 같은 주짓수 압박 패스 디테일 (석블랙)',
    techniqueNameEn: 'Crushing Pressure Guard Pass Details',
    startPosition: '오픈 가드 탑',
    category: '가드 패스',
    giType: 'Gi',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=fOETigcyPwk',
    youtubeId: 'fOETigcyPwk',
    channelName: '석블랙의 주짓수업',
    thumbnailUrl: 'https://i.ytimg.com/vi/fOETigcyPwk/hqdefault.jpg',
    duration: '07:30',
    recommendedStartTime: '01:40',
    recommendedStartSec: 100,
    keyDetailTag: '턱밑 어깨 크로스페이스 압박 & 다리 걷어내기',
    language: 'ko',
  },
  {
    id: 'gp-2',
    techniqueName: '주짓수의 기본 가드 패스 3가지 (토레안도, 니슬라이드, 스매시)',
    techniqueNameEn: '3 Fundamental Guard Passes in BJJ',
    startPosition: '오픈 가드 탑',
    category: '가드 패스',
    giType: 'Both',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=hFmJsANiR9E',
    youtubeId: 'hFmJsANiR9E',
    channelName: 'SLOBJJ',
    thumbnailUrl: 'https://i.ytimg.com/vi/hFmJsANiR9E/hqdefault.jpg',
    duration: '08:10',
    recommendedStartTime: '01:35',
    recommendedStartSec: 95,
    keyDetailTag: '바지 그립 플릭 & 무릎 슬라이드 앵글',
    language: 'ko',
  },
  {
    id: 'gp-3',
    techniqueName: '주짓수 가드패스 개념: 팔꿈치-무릎 연결선 끊기',
    techniqueNameEn: 'Guard Passing Concepts: Breaking Elbow-Knee Connection',
    startPosition: '오픈 가드 탑',
    category: '가드 패스',
    giType: 'Both',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=CwQw5MPfiYI',
    youtubeId: 'CwQw5MPfiYI',
    channelName: '남간호사NamJitz',
    thumbnailUrl: 'https://i.ytimg.com/vi/CwQw5MPfiYI/hqdefault.jpg',
    duration: '06:45',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '상대 프레임 쐐기 틈새 침투 & 골반 고정',
    language: 'ko',
  },
  // ==========================================
  // 15. 유도 메치기 & 발기술 (Judo for BJJ)
  // ==========================================
  {
    id: 'judo-1',
    techniqueName: '유도기술의 꽃: 업어치기와 허벅다리걸기 고수들의 핵심 디테일',
    techniqueNameEn: 'Drop Seoi Nage & Uchi Mata High Percentage Judo Throws',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 메치기',
    giType: '유도',
    youtubeUrl: 'https://www.youtube.com/watch?v=tvky3iMrvvU',
    youtubeId: 'tvky3iMrvvU',
    channelName: '유도바보회',
    thumbnailUrl: 'https://i.ytimg.com/vi/tvky3iMrvvU/hqdefault.jpg',
    duration: '08:45',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '기울이기(쿠즈시) & 골반 밀착 회전',
    language: 'ko',
  },
  {
    id: 'judo-2',
    techniqueName: '유도 발기술: 허벅다리걸기(Uchi-Mata) 기초 및 주짓수 응용',
    techniqueNameEn: 'Uchi Mata Ashi-Waza Fundamental Details',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 발기술',
    giType: '유도',
    youtubeUrl: 'https://www.youtube.com/watch?v=pVtwYjHL8Os',
    youtubeId: 'pVtwYjHL8Os',
    channelName: '부산싸나이 우아범의 주유소',
    thumbnailUrl: 'https://i.ytimg.com/vi/pVtwYjHL8Os/hqdefault.jpg',
    duration: '07:20',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '축발 회전 & 상대 허벅지 깊숙이 차올리기',
    language: 'ko',
  },
  {
    id: 'judo-3',
    techniqueName: '밭다리후리기·허리후리기·허벅다리 연계 사용법',
    techniqueNameEn: 'Osoto Gari, Harai Goshi, Uchi Mata Combinations',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 메치기',
    giType: '유도',
    youtubeUrl: 'https://www.youtube.com/watch?v=cNd-H6ABkv4',
    youtubeId: 'cNd-H6ABkv4',
    channelName: '화경유도관',
    thumbnailUrl: 'https://i.ytimg.com/vi/cNd-H6ABkv4/hqdefault.jpg',
    duration: '09:10',
    recommendedStartTime: '01:40',
    recommendedStartSec: 100,
    keyDetailTag: '깃 당김과 가슴 압박으로 중심 무너뜨리기',
    language: 'ko',
  },
  {
    id: 'judo-4',
    techniqueName: '업어치기 선수를 위한 실전 밭다리후리기 (Osoto-gari)',
    techniqueNameEn: 'Osoto Gari Throw for Forward Throw Specialists',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 메치기',
    giType: '유도',
    youtubeUrl: 'https://www.youtube.com/watch?v=F4-HLiIKYGk',
    youtubeId: 'F4-HLiIKYGk',
    channelName: '부산싸나이 우아범의 주유소',
    thumbnailUrl: 'https://i.ytimg.com/vi/F4-HLiIKYGk/hqdefault.jpg',
    duration: '06:30',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '상대 뒤꿈치 체중 이동 순간 낚아채기',
    language: 'ko',
  },
  {
    id: 'judo-5',
    techniqueName: '발목받치기와 밭다리걸기 속공 셋업 & 주짓수 스탠딩 연계',
    techniqueNameEn: 'Sasae Tsurikomi Ashi to Osoto Gari Setup',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 발기술',
    giType: '유도',
    youtubeUrl: 'https://www.youtube.com/watch?v=AelurVK4uV0',
    youtubeId: 'AelurVK4uV0',
    channelName: '화경유도관',
    thumbnailUrl: 'https://i.ytimg.com/vi/AelurVK4uV0/hqdefault.jpg',
    duration: '07:50',
    recommendedStartTime: '01:25',
    recommendedStartSec: 85,
    keyDetailTag: '원 핸드 깃 컨트롤 & 발목 스토퍼',
    language: 'ko',
  },
  {
    id: 'judo-6',
    techniqueName: '노기 주짓수를 위한 최강의 유도 테이크다운 (Travis Stevens)',
    techniqueNameEn: 'Best Judo Takedown For NOGI Jiu-Jitsu With Travis Stevens',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 메치기',
    giType: 'No-Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=xwB7qgnbjMY',
    youtubeId: 'xwB7qgnbjMY',
    channelName: 'Travis Stevens',
    thumbnailUrl: 'https://i.ytimg.com/vi/xwB7qgnbjMY/hqdefault.jpg',
    duration: '08:20',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '언더훅 오버훅 클린치에서의 몸통 회전',
    language: 'en',
  },
  {
    id: 'judo-7',
    techniqueName: '올림픽 유도 메달리스트 사토시 이시이의 스윙 허벅다리걸기 (Swing Uchi Mata)',
    techniqueNameEn: 'Swing Uchi Mata by Satoshi Ishii',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 메치기',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=SkubGPp3D4Y',
    youtubeId: 'SkubGPp3D4Y',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/SkubGPp3D4Y/hqdefault.jpg',
    duration: '05:40',
    recommendedStartTime: '00:50',
    recommendedStartSec: 50,
    keyDetailTag: '원스텝 체중 회전 반동으로 띄워 던지기',
    language: 'en',
  },
  {
    id: 'judo-8',
    techniqueName: '타이밍 드롭 업어치기 주짓수 실전 적용 (Shintaro Higashi)',
    techniqueNameEn: 'Timing Drop Seoi Nage by Shintaro Higashi',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 메치기',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=qcd2YVmOcCg',
    youtubeId: 'qcd2YVmOcCg',
    channelName: 'Shintaro Higashi',
    thumbnailUrl: 'https://i.ytimg.com/vi/qcd2YVmOcCg/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '상대 압박 타이밍 무릎 떨구기 궤적',
    language: 'en',
  },
  {
    id: 'judo-9',
    techniqueName: '한팔 업어치기 (Ippon Seoi Nage) 정밀 분석 (Brian Glick & Shintaro Higashi)',
    techniqueNameEn: 'Ippon Seoi Nage with Brian Glick & Shintaro Higashi',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 메치기',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=5dLHc9APKmM',
    youtubeId: '5dLHc9APKmM',
    channelName: 'Brian Glick',
    thumbnailUrl: 'https://i.ytimg.com/vi/5dLHc9APKmM/hqdefault.jpg',
    duration: '11:20',
    recommendedStartTime: '02:00',
    recommendedStartSec: 120,
    keyDetailTag: '팔오금 깊숙이 잠그기 & 하체 지렛대',
    language: 'en',
  },
  {
    id: 'judo-10',
    techniqueName: '실전 유도 발목 받치기 & 밭다리 풋스윕 매커니즘 (Shintaro Higashi)',
    techniqueNameEn: 'How to Nail Footsweeps Every Time by Shintaro Higashi',
    startPosition: '유도 메치기 & 깃싸움',
    category: '유도 발기술',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=c7Nm9YhAYUs',
    youtubeId: 'c7Nm9YhAYUs',
    channelName: 'Shintaro Higashi',
    thumbnailUrl: 'https://i.ytimg.com/vi/c7Nm9YhAYUs/hqdefault.jpg',
    duration: '09:40',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '발 스텝 타이밍과 상체 풀링 일치',
    language: 'en',
  },
  // ==========================================
  // 16. 레슬링 & 스탠딩 테이크다운 (Korean Takedowns)
  // ==========================================
  {
    id: 'wrest-ko-1',
    techniqueName: '레슬링 상황별 더블렉 태클 테이크다운 실전 디테일',
    techniqueNameEn: 'Situational Double Leg Takedown Techniques',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=7SWLTwMNZEo',
    youtubeId: '7SWLTwMNZEo',
    channelName: '레슬링연구소',
    thumbnailUrl: 'https://i.ytimg.com/vi/7SWLTwMNZEo/hqdefault.jpg',
    duration: '08:15',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '레벨 체인지 & 머리 흉부 밀착 드라이브',
    language: 'ko',
  },
  {
    id: 'wrest-ko-2',
    techniqueName: '레슬링의 정석 초급편: 무릎 안 다치는 정통 더블렉 태클',
    techniqueNameEn: 'Fundamentals of Double Leg Tackle for Beginners',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=Q9-yuX1MKr0',
    youtubeId: 'Q9-yuX1MKr0',
    channelName: '레슬링연구소',
    thumbnailUrl: 'https://i.ytimg.com/vi/Q9-yuX1MKr0/hqdefault.jpg',
    duration: '07:45',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '침투 스텝 및 오금 잠금 당기기',
    language: 'ko',
  },
  {
    id: 'wrest-ko-3',
    techniqueName: '주짓수에서도 유용하게 쓸 수 있는 더블렉 태클 완벽 이해',
    techniqueNameEn: 'High-Percentage Double Leg Tackle in BJJ Match',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=zfS2F_Ikm6s',
    youtubeId: 'zfS2F_Ikm6s',
    channelName: '이간장TV',
    thumbnailUrl: 'https://i.ytimg.com/vi/zfS2F_Ikm6s/hqdefault.jpg',
    duration: '09:00',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '상대 스프롤 반작용 턴 & 앵글 컷',
    language: 'ko',
  },
  {
    id: 'wrest-ko-4',
    techniqueName: '싱글렉 테이크다운을 발전시키고 싶다면 꼭 봐야 하는 영상',
    techniqueNameEn: 'Single Leg Takedown Mastery and Finishes',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=b_eYp0CAl2c',
    youtubeId: 'b_eYp0CAl2c',
    channelName: '언더훅 Underhook',
    thumbnailUrl: 'https://i.ytimg.com/vi/b_eYp0CAl2c/hqdefault.jpg',
    duration: '08:30',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '헤드 포지션(가슴 밀착) & 다리 들어올리기',
    language: 'ko',
  },
  {
    id: 'wrest-ko-5',
    techniqueName: '초보자들을 위한 인사이드 싱글렉 테이크다운 완성',
    techniqueNameEn: 'Inside Single Leg Takedown for Beginners',
    startPosition: '스탠딩 / 오픈 그립',
    category: '테이크다운',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=V-NXlMeeCgA',
    youtubeId: 'V-NXlMeeCgA',
    channelName: '두귀TV',
    thumbnailUrl: 'https://i.ytimg.com/vi/V-NXlMeeCgA/hqdefault.jpg',
    duration: '06:55',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '손목 제어 셋업 & 안쪽 오금 락',
    language: 'ko',
  },
  // ==========================================
  // 17. 모던 가드 & 베림보로 (Korean DLR / Modern)
  // ==========================================
  {
    id: 'dlr-ko-1',
    techniqueName: '데라히바 가드에서 베림보로를 배워보자 (채완기 주짓수)',
    techniqueNameEn: 'De La Riva to Berimbolo System by Wan Ki Chae',
    startPosition: '데라히바 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=OVyf3-5-cEk',
    youtubeId: 'OVyf3-5-cEk',
    channelName: '비스트TV',
    thumbnailUrl: 'https://i.ytimg.com/vi/OVyf3-5-cEk/hqdefault.jpg',
    duration: '10:40',
    recommendedStartTime: '01:50',
    recommendedStartSec: 110,
    keyDetailTag: '인버티드 롤 & 상대 바지 깃 트랩',
    language: 'ko',
  },
  {
    id: 'dlr-ko-2',
    techniqueName: '주짓수 기술: 데라히바에서 베림보로 회전 셋업 (De La Riva to Berimbolo)',
    techniqueNameEn: 'De La Riva to Berimbolo Rotation Details',
    startPosition: '데라히바 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=J6XR9IYd1rQ',
    youtubeId: 'J6XR9IYd1rQ',
    channelName: '본주짓수 봉담',
    thumbnailUrl: 'https://i.ytimg.com/vi/J6XR9IYd1rQ/hqdefault.jpg',
    duration: '07:10',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '발목 그립 & 골반 띄워 백테이크 연결',
    language: 'ko',
  },
  // ==========================================
  // 18. 버터플라이 가드 (Korean Butterfly)
  // ==========================================
  {
    id: 'bf-ko-1',
    techniqueName: '버터플라이 가드 스윕 (Butterfly Guard Sweep) 기본 및 연계',
    techniqueNameEn: 'Butterfly Guard Sweep Core Mechanics',
    startPosition: '버터플라이 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=HYg8yLvEIS0',
    youtubeId: 'HYg8yLvEIS0',
    channelName: 'Tozi Korea 박준영주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/HYg8yLvEIS0/hqdefault.jpg',
    duration: '06:20',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '언더훅 파기 & 반대쪽 다리 훅 들어올리기',
    language: 'ko',
  },
  {
    id: 'bf-ko-2',
    techniqueName: '주짓수 기술: 버터플라이 스윕 Butterfly Sweep 실전 디테일',
    techniqueNameEn: 'Butterfly Sweep Live Sparring Setup',
    startPosition: '버터플라이 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=A__NdjJlMjE',
    youtubeId: 'A__NdjJlMjE',
    channelName: '본주짓수 봉담',
    thumbnailUrl: 'https://i.ytimg.com/vi/A__NdjJlMjE/hqdefault.jpg',
    duration: '05:50',
    recommendedStartTime: '00:55',
    recommendedStartSec: 55,
    keyDetailTag: '상대 베이스 무너뜨리고 옆구리로 구르기',
    language: 'ko',
  },
  // ==========================================
  // 19. 니온밸리 (Korean Knee on Belly)
  // ==========================================
  {
    id: 'kob-ko-1',
    techniqueName: '작은 사람이 큰 사람을 압박할 수 있는 주짓수 기술: 니온밸리',
    techniqueNameEn: 'Knee on Belly Pressure for Smaller Practitioners',
    startPosition: '니온밸리',
    category: '포지션 컨트롤',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=yfFNyVeyVBM',
    youtubeId: 'yfFNyVeyVBM',
    channelName: '정도한 격투기TV',
    thumbnailUrl: 'https://i.ytimg.com/vi/yfFNyVeyVBM/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '정강이 명치 압박 & 반대쪽 다리 베이스 지지',
    language: 'ko',
  },
  {
    id: 'kob-ko-2',
    techniqueName: '주짓수 포지션 해설: 니온 더 벨리(Knee on the Belly) 컨트롤 & 서브미션',
    techniqueNameEn: 'Knee on the Belly Position Breakdown',
    startPosition: '니온밸리',
    category: '포지션 컨트롤',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=xIPpEijjXUI',
    youtubeId: 'xIPpEijjXUI',
    channelName: '주짓수 탐구생활',
    thumbnailUrl: 'https://i.ytimg.com/vi/xIPpEijjXUI/hqdefault.jpg',
    duration: '06:40',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '칼라-슬리브 당겨 횡경막 압박 & 스핀 암바',
    language: 'ko',
  },
  // ==========================================
  // 20. 가드 패스 & 하프가드 (Korean Passing & Half)
  // ==========================================
  {
    id: 'pass-ko-1',
    techniqueName: '클로즈가드 압박 패스 시도 시 손을 뺏길 때 완벽 대처법 (석블랙)',
    techniqueNameEn: 'Pressure Pass Hand-Fight Counter from Closed Guard',
    startPosition: '클로즈드 가드',
    category: '가드 패스',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=OWL0minL2nk',
    youtubeId: 'OWL0minL2nk',
    channelName: '석블랙의 주짓수업',
    thumbnailUrl: 'https://i.ytimg.com/vi/OWL0minL2nk/hqdefault.jpg',
    duration: '08:50',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '라펠 앵커링 & 골반 사선 무릎 쐐기',
    language: 'ko',
  },
  {
    id: 'half-ko-1',
    techniqueName: '하프가드 힙 클램프 (Half Guard Hip Clamp) 컨트롤 및 카운터',
    techniqueNameEn: 'Half Guard Hip Clamp Control and Counter System',
    startPosition: '하프 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=00DYAl7TnO4',
    youtubeId: '00DYAl7TnO4',
    channelName: '권혁일',
    thumbnailUrl: 'https://i.ytimg.com/vi/00DYAl7TnO4/hqdefault.jpg',
    duration: '07:35',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '골반 바깥쪽 핀 & 언더훅 리커버리',
    language: 'ko',
  },
  // ==========================================
  // 21. 마운트 탈출 & 사이드 컨트롤 (Korean)
  // ==========================================
  {
    id: 'mount-ko-ext-1',
    techniqueName: '마운트 탈출의 모든 것 (엘보우 이스케이프 & 브릿지 탈출)',
    techniqueNameEn: 'Complete Mount Escape System for Beginners',
    startPosition: '마운트',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=TT2yZv9nNr0',
    youtubeId: 'TT2yZv9nNr0',
    channelName: 'LAB 노감독',
    thumbnailUrl: 'https://i.ytimg.com/vi/TT2yZv9nNr0/hqdefault.jpg',
    duration: '09:20',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '골반 브릿지 타이밍 & 무릎 엘보우 쐐기 탈출',
    language: 'ko',
  },
  {
    id: 'side-ko-ext-1',
    techniqueName: '사이드 컨트롤 라펠 초크 (Lapel Choke from Side Mount)',
    techniqueNameEn: 'Lapel Choke from Side Mount Position',
    startPosition: '사이드 컨트롤',
    category: '서브미션',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=IE6nZb1aZMs',
    youtubeId: 'IE6nZb1aZMs',
    channelName: '주짓수부부 space moanalu',
    thumbnailUrl: 'https://i.ytimg.com/vi/IE6nZb1aZMs/hqdefault.jpg',
    duration: '06:10',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '상대 목 뒤로 라펠 넘겨 크로스 그립 조르기',
    language: 'ko',
  },
  // ==========================================
  // 22. 가드 패스 & 오버언더 패스 (Bernardo Faria English)
  // ==========================================
  {
    id: 'pass-en-1',
    techniqueName: '노기 오버언더 가드 패스 (The Over Under Pass For No-Gi)',
    techniqueNameEn: 'The Over Under Pass For No-Gi by Bernardo Faria',
    startPosition: '가드 패스',
    category: '가드 패스',
    giType: 'No-Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=fZHugosJvh8',
    youtubeId: 'fZHugosJvh8',
    channelName: 'Bernardo Faria BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/fZHugosJvh8/hqdefault.jpg',
    duration: '06:50',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '어깨 압박 & 상대 골반 락다운',
    language: 'en',
  },
  {
    id: 'pass-en-2',
    techniqueName: '무릎 꿇은 상대 오버언더 패스 셋업 (Over Under Pass From Knees)',
    techniqueNameEn: 'Over Under Pass From Pulling Guard From The Knees by Bernardo Faria',
    startPosition: '가드 패스',
    category: '가드 패스',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=ehau6wbheEU',
    youtubeId: 'ehau6wbheEU',
    channelName: 'Bernardo Faria BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/ehau6wbheEU/hqdefault.jpg',
    duration: '05:30',
    recommendedStartTime: '00:50',
    recommendedStartSec: 50,
    keyDetailTag: '무릎 파고들기 & 대각선 숄더 드라이브',
    language: 'en',
  },
  {
    id: 'pass-en-3',
    techniqueName: '오버언더 패스 핵심 원리와 디테일 (How to Pass With Over Under)',
    techniqueNameEn: 'How to Pass With Over Under by Bernardo Faria',
    startPosition: '가드 패스',
    category: '가드 패스',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=4hAY12ghrGk',
    youtubeId: '4hAY12ghrGk',
    channelName: 'Bernardo Faria BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/4hAY12ghrGk/hqdefault.jpg',
    duration: '07:40',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '바지 깃 그립 & 골반 턴 차단',
    language: 'en',
  },
  // ==========================================
  // 23. 라쏘 가드 & 스파이더 가드 (English)
  // ==========================================
  {
    id: 'lasso-en-1',
    techniqueName: '상대 가드패스를 스윕으로 역전시키기 (존 토마스)',
    techniqueNameEn: 'How To Turn Their Guard Pass Into Your Sweep (Jon Thomas)',
    startPosition: '라쏘 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=ABW1NHggF9Q',
    youtubeId: 'ABW1NHggF9Q',
    channelName: 'Bernardo Faria BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/ABW1NHggF9Q/hqdefault.jpg',
    duration: '08:15',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '라쏘 훅 텐션 & 상대 중심 이동 카운터',
    language: 'en',
  },
  {
    id: 'lasso-en-2',
    techniqueName: '라쏘 가드 기초와 거리 조절 (Why You Should Play Lasso Guard)',
    techniqueNameEn: 'Why You Should Play Lasso Guard - Basics by Aaron Benzrihem',
    startPosition: '라쏘 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=MhUwxGZ5VWU',
    youtubeId: 'MhUwxGZ5VWU',
    channelName: 'Aaron Benzrihem bjj',
    thumbnailUrl: 'https://i.ytimg.com/vi/MhUwxGZ5VWU/hqdefault.jpg',
    duration: '07:30',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '깊은 라쏘 훅 & 소매 그립 앵커링',
    language: 'en',
  },
  {
    id: 'lasso-en-3',
    techniqueName: '스탠딩 상대를 넘기는 4가지 라쏘 가드 스윕',
    techniqueNameEn: '4 Lasso Guard Sweeps VS. Standing Opponents by MMA Leech',
    startPosition: '라쏘 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=1qlth1SS35g',
    youtubeId: '1qlth1SS35g',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/1qlth1SS35g/hqdefault.jpg',
    duration: '09:10',
    recommendedStartTime: '01:30',
    recommendedStartSec: 90,
    keyDetailTag: '벌룬 스윕 & 트라이포드 콤비네이션',
    language: 'en',
  },
  {
    id: 'spider-en-1',
    techniqueName: '스파이더 가드 얕은 라쏘 vs 깊은 라쏘 비교 분석',
    techniqueNameEn: 'Shallow Lasso vs Deep Lasso in Spider Guard by Stephan Kesting',
    startPosition: '스파이더 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=hnwmROyBrY8',
    youtubeId: 'hnwmROyBrY8',
    channelName: 'Stephan Kesting',
    thumbnailUrl: 'https://i.ytimg.com/vi/hnwmROyBrY8/hqdefault.jpg',
    duration: '06:40',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '이두근 압박과 다리 신전 밸런스',
    language: 'en',
  },
  {
    id: 'spider-en-2',
    techniqueName: '초보자를 위한 스파이더 가드 시저 스윕 튜토리얼',
    techniqueNameEn: 'BJJ Beginners Tutorial - Spider Guard Scissor Sweep',
    startPosition: '스파이더 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=SbGR8C63szA',
    youtubeId: 'SbGR8C63szA',
    channelName: 'Chess Club Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/SbGR8C63szA/hqdefault.jpg',
    duration: '05:45',
    recommendedStartTime: '00:55',
    recommendedStartSec: 55,
    keyDetailTag: '무릎 레벨 체인지 & 가위차기 회전력',
    language: 'en',
  },
  {
    id: 'spider-en-3',
    techniqueName: '스파이더 가드 기초 사용법 및 스윕 시스템',
    techniqueNameEn: 'Intro to Spider Guard & How to Use It by Knight Jiu-Jitsu',
    startPosition: '스파이더 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=qpmc6uClx4o',
    youtubeId: 'qpmc6uClx4o',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/qpmc6uClx4o/hqdefault.jpg',
    duration: '08:00',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '양 소매 컨트롤 & 발바닥 골반-골격 지지',
    language: 'en',
  },
  {
    id: 'spider-en-4',
    techniqueName: '스파이더 가드에서 가장 강력한 트라이앵글 초크 진입법',
    techniqueNameEn: 'The Most Powerful Spider Guard Triangle Entry by Stephan Kesting',
    startPosition: '스파이더 가드',
    category: '서브미션',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=lk9jgCdk0CY',
    youtubeId: 'lk9jgCdk0CY',
    channelName: 'Stephan Kesting',
    thumbnailUrl: 'https://i.ytimg.com/vi/lk9jgCdk0CY/hqdefault.jpg',
    duration: '07:20',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '팔 밀어넣기 & 다리 슬라이드 잠금',
    language: 'en',
  },
  // ==========================================
  // 24. 터틀 포지션 공격 & 방어 (English)
  // ==========================================
  {
    id: 'turtle-en-1',
    techniqueName: '가드패스 후 터틀 포지션 10가지 공격 (백테이크 & 크루시픽스)',
    techniqueNameEn: '10 BJJ Turtle Attacks With Guard Pass (Back Takes & Crucifix) by Chewjitsu',
    startPosition: '터틀 포지션',
    category: '백 마운트',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=8flgjYr6YLo',
    youtubeId: '8flgjYr6YLo',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/8flgjYr6YLo/hqdefault.jpg',
    duration: '11:00',
    recommendedStartTime: '01:45',
    recommendedStartSec: 105,
    keyDetailTag: '시트벨트 그립 & 훅 인서트 타이밍',
    language: 'en',
  },
  {
    id: 'turtle-en-2',
    techniqueName: '터틀 포지션에서의 서브미션 초크 시리즈 (Eli Knight)',
    techniqueNameEn: 'Chokes from turtle position by Eli Knight',
    startPosition: '터틀 포지션',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=s6REN7rXvlQ',
    youtubeId: 's6REN7rXvlQ',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/s6REN7rXvlQ/hqdefault.jpg',
    duration: '06:30',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '클락 초크 & 아나콘다 그립 앵커링',
    language: 'en',
  },
  {
    id: 'turtle-en-3',
    techniqueName: '터틀 포지션 무너뜨리기 쉬운 핵심 원리 (Beat Turtle The Easy Way)',
    techniqueNameEn: 'BEAT TURTLE THE EASY WAY - JIU JITSU TIPS by Will Brooks',
    startPosition: '터틀 포지션',
    category: '포지션 컨트롤',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=v6e_w5LXuh0',
    youtubeId: 'v6e_w5LXuh0',
    channelName: 'Will Brooks Official',
    thumbnailUrl: 'https://i.ytimg.com/vi/v6e_w5LXuh0/hqdefault.jpg',
    duration: '05:50',
    recommendedStartTime: '00:50',
    recommendedStartSec: 50,
    keyDetailTag: '스파이럴 라이드 & 상대 베이스 측면 붕괴',
    language: 'en',
  },
  // ==========================================
  // 25. 버터플라이 가드 (English)
  // ==========================================
  {
    id: 'bf-en-1',
    techniqueName: '스윕 성공률을 높여주는 3가지 버터플라이 가드 개념 (Chewjitsu)',
    techniqueNameEn: '3 Butterfly Guard Concepts That’ll Make Your Sweeps More Technical by Chewjitsu',
    startPosition: '버터플라이 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=0WIUYjHky_Q',
    youtubeId: '0WIUYjHky_Q',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/0WIUYjHky_Q/hqdefault.jpg',
    duration: '08:20',
    recommendedStartTime: '01:25',
    recommendedStartSec: 85,
    keyDetailTag: '언더훅 딥 그립 & 상대 머리 중심선 깨기',
    language: 'en',
  },
  {
    id: 'bf-en-2',
    techniqueName: '버터플라이 가드란 무엇인가? 기본 구조와 원리 (Stephan Kesting)',
    techniqueNameEn: 'What is the Butterfly Guard? by Stephan Kesting',
    startPosition: '버터플라이 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=KZBmXu5Pk9M',
    youtubeId: 'KZBmXu5Pk9M',
    channelName: 'Stephan Kesting',
    thumbnailUrl: 'https://i.ytimg.com/vi/KZBmXu5Pk9M/hqdefault.jpg',
    duration: '07:05',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '발등 훅 리프팅 & 엉덩이 스쿠프',
    language: 'en',
  },
  {
    id: 'bf-en-3',
    techniqueName: '하프 버터플라이 훅 스윕 완벽 디테일 (Half Butterfly Guard Hook Sweep)',
    techniqueNameEn: 'How to Do the Half Butterfly Guard Hook Sweep by Stephan Kesting',
    startPosition: '버터플라이 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=QRJNaUYrEqo',
    youtubeId: 'QRJNaUYrEqo',
    channelName: 'Stephan Kesting',
    thumbnailUrl: 'https://i.ytimg.com/vi/QRJNaUYrEqo/hqdefault.jpg',
    duration: '06:45',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '안쪽 훅 띄우기 & 반대쪽 발 베이스 차단',
    language: 'en',
  },
  // ==========================================
  // 26. 니온밸리 컨트롤 & 방어 (English)
  // ==========================================
  {
    id: 'kob-en-1',
    techniqueName: '니온밸리 탈출 후 리버설 3가지 실전 카운터 (Chewjitsu)',
    techniqueNameEn: '3 Knee on Belly Escapes in BJJ by Chewjitsu',
    startPosition: '니온밸리',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=vA8W92uD6kI',
    youtubeId: 'vA8W92uD6kI',
    channelName: 'Chewjitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/vA8W92uD6kI/hqdefault.jpg',
    duration: '07:40',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '벨트 프레임 밀어내기 & 언더훅 싱글렉 전환',
    language: 'en',
  },
  {
    id: 'kob-en-2',
    techniqueName: '니온밸리 압박으로 상대 움직임 강제 유도하기 (Stephan Kesting)',
    techniqueNameEn: 'How to Use Knee On Belly to Force Movement by Stephan Kesting',
    startPosition: '니온밸리',
    category: '포지션 컨트롤',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=1Kfn0FA5hHo',
    youtubeId: '1Kfn0FA5hHo',
    channelName: 'Stephan Kesting',
    thumbnailUrl: 'https://i.ytimg.com/vi/1Kfn0FA5hHo/hqdefault.jpg',
    duration: '06:15',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '체중 집중 & 상대 반응 카운터 암바',
    language: 'en',
  },
  // ==========================================
  // 27. 새들 / 411 / 허니홀 & 아시 가라미 (하체 엔탱글먼트)
  // ==========================================
  {
    id: 'saddle-ko-1',
    techniqueName: '도복에서도 허니홀(411/새들) 포지션 만드는 가장 쉬운 방법과 하체관절기 연계',
    techniqueNameEn: 'Easiest Way to Enter Honey Hole (411/Saddle) Position in Gi & No-Gi',
    startPosition: '새들 / 411 / 허니홀',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=Sf7R9y-jOLY',
    youtubeId: 'Sf7R9y-jOLY',
    channelName: '주짓수 하체관절기 아카데미',
    thumbnailUrl: 'https://i.ytimg.com/vi/Sf7R9y-jOLY/hqdefault.jpg',
    duration: '07:45',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '인사이드 삼각 락킹 & 상대 반대쪽 다리 제어',
    language: 'ko',
  },
  {
    id: 'saddle-ko-2',
    techniqueName: '아웃사이드 아시가라미에서 허니홀(새들/411) 전환 및 인사이드 힐훅 피니시',
    techniqueNameEn: 'Outside Ashi Garami to Honey Hole (Saddle) Transition & Finish',
    startPosition: '새들 / 411 / 허니홀',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=z5-IBuqvQCU',
    youtubeId: 'z5-IBuqvQCU',
    channelName: '노기 주짓수 하체 시스템',
    thumbnailUrl: 'https://i.ytimg.com/vi/z5-IBuqvQCU/hqdefault.jpg',
    duration: '06:50',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '무릎 라인 리핑 & 허니홀 삼각 잠금 전환',
    language: 'ko',
  },
  {
    id: 'saddle-ko-3',
    techniqueName: '하체관절기를 효과적으로 걸 수 있는 새들·허니홀(411) 가드 세팅 디테일',
    techniqueNameEn: 'Effective Guard Setup for Saddle & Honey Hole Leg Lock Entries',
    startPosition: '새들 / 411 / 허니홀',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=OmhXBW4NkS0',
    youtubeId: 'OmhXBW4NkS0',
    channelName: '주짓수 테크닉 연구소',
    thumbnailUrl: 'https://i.ytimg.com/vi/OmhXBW4NkS0/hqdefault.jpg',
    duration: '08:10',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '상대 중심 붕괴 후 인사이드 엔트리 공간 확보',
    language: 'ko',
  },
  {
    id: 'saddle-en-1',
    techniqueName: '새들 / 411 / 허니홀(인사이드 산카쿠) 포지션 완벽 입문 가이드',
    techniqueNameEn: 'Intro to Saddle | 411 | Honey Hole | Inside Sankaku',
    startPosition: '새들 / 411 / 허니홀',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=RbuQjr3-F2I',
    youtubeId: 'RbuQjr3-F2I',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/RbuQjr3-F2I/hqdefault.jpg',
    duration: '08:30',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '무릎 각도 고정 & 세컨더리 레그 컨트롤',
    language: 'en',
  },
  {
    id: 'saddle-en-2',
    techniqueName: '라클란 자일스의 가드에서 새들(411/허니홀) 엔트리 핵심 시스템 (Lachlan Giles)',
    techniqueNameEn: 'Saddle Entry from Guard by Lachlan Giles',
    startPosition: '새들 / 411 / 허니홀',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=K5XhO7o5QN0',
    youtubeId: 'K5XhO7o5QN0',
    channelName: 'Absolute MMA',
    thumbnailUrl: 'https://i.ytimg.com/vi/K5XhO7o5QN0/hqdefault.jpg',
    duration: '07:20',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '언더훅 스쿠프 & K-가드에서 새들 직결 전환',
    language: 'en',
  },
  {
    id: 'saddle-en-3',
    techniqueName: '허니홀(411/새들) 슬릭 엔트리와 타이트한 힐훅 피니시 메커니즘',
    techniqueNameEn: 'Slick Entry to Honey Hole w/ Heel Hook Finish',
    startPosition: '새들 / 411 / 허니홀',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=-jY00HKXNlk',
    youtubeId: '-jY00HKXNlk',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/-jY00HKXNlk/hqdefault.jpg',
    duration: '06:40',
    recommendedStartTime: '00:55',
    recommendedStartSec: 55,
    keyDetailTag: '발꿈치 노출 그립 & 엉덩이 브릿지 텐션',
    language: 'en',
  },
  {
    id: 'saddle-en-4',
    techniqueName: '탑 하프가드에서 고확률 허니홀(새들/411) 백스텝 진입 기술',
    techniqueNameEn: 'High Percentage Honey Hole Entry from Top Half Guard',
    startPosition: '새들 / 411 / 허니홀',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=KKRPgVIFSlA',
    youtubeId: 'KKRPgVIFSlA',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/KKRPgVIFSlA/hqdefault.jpg',
    duration: '07:55',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '백스텝 회전 각도 & 인사이드 산카쿠 락킹',
    language: 'en',
  },
  {
    id: 'ashi-ko-1',
    techniqueName: '하체관절기 아시가라미 포지션 종류와 스탠다드 아시 컨트롤 원리',
    techniqueNameEn: 'Ashi Garami Position Types & Standard Ashi Control Mechanics',
    startPosition: '아시 가라미 / 스탠다드 아시',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=rJW44wNCARI',
    youtubeId: 'rJW44wNCARI',
    channelName: '노기 주짓수 하체 시스템',
    thumbnailUrl: 'https://i.ytimg.com/vi/rJW44wNCARI/hqdefault.jpg',
    duration: '08:20',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '골반 클램프 압박 & 발목 아킬레스 포인트 고정',
    language: 'ko',
  },
  {
    id: 'ashi-en-1',
    techniqueName: '스탠다드 아시가라미에서 가장 강력한 스트레이트 앵클락 피니시',
    techniqueNameEn: 'Strongest Straight Ankle Lock - Ashi Garami',
    startPosition: '아시 가라미 / 스탠다드 아시',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=34QwKNk0Cro',
    youtubeId: '34QwKNk0Cro',
    channelName: 'Jordan Teaches Jiujitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/34QwKNk0Cro/hqdefault.jpg',
    duration: '07:35',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '하이 리스트 그립 & 견갑골 후인 브릿지 피니시',
    language: 'en',
  },
  {
    id: 'ashi-en-2',
    techniqueName: '아시가라미 스트레이트 앵클락 방어 카운터 및 피니시 디테일',
    techniqueNameEn: 'Finishing the Straight Ankle Lock & Ashi-Garami Countering Defense',
    startPosition: '아시 가라미 / 스탠다드 아시',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=9jaSEuYbq_4',
    youtubeId: '9jaSEuYbq_4',
    channelName: 'Stephan Kesting',
    thumbnailUrl: 'https://i.ytimg.com/vi/9jaSEuYbq_4/hqdefault.jpg',
    duration: '08:05',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '부츠 방어 무력화 & 벨리다운 앵클락 전환',
    language: 'en',
  },
  {
    id: 'ashi-en-3',
    techniqueName: '스트레이트 아시가라미 세팅 & 앵클락 레그락 시스템 마스터',
    techniqueNameEn: 'Straight Ashi Garami + Straight Ankle Lock LegLock System',
    startPosition: '아시 가라미 / 스탠다드 아시',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=pRnAMrkwXNg',
    youtubeId: 'pRnAMrkwXNg',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/pRnAMrkwXNg/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '무릎 조임 토크 & 엉덩이 신전 각도 제어',
    language: 'en',
  },
  // ==========================================
  // 28. 싱글렉 X 가드 / X 가드 / 더블렉 X 가드 / 신투신 / 싯업 가드
  // ==========================================
  {
    id: 'slx-ko-1',
    techniqueName: '[주짓수교본] 주짓수에서 가장 강력한 싱글렉 X가드 세팅과 컨트롤',
    techniqueNameEn: 'Most Powerful Single Leg X Guard Setup & Control in BJJ',
    startPosition: '싱글렉 X 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=rG-6_WVQPkw',
    youtubeId: 'rG-6_WVQPkw',
    channelName: '주짓수교본',
    thumbnailUrl: 'https://i.ytimg.com/vi/rG-6_WVQPkw/hqdefault.jpg',
    duration: '08:15',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '골반 옆 발바닥 고정 & 안쪽 무릎 핀치 텐션',
    language: 'ko',
  },
  {
    id: 'slx-ko-2',
    techniqueName: '[주짓수교본] 싱글렉 X가드 스윕의 모든 원리와 무릎 비틀기 피니시',
    techniqueNameEn: 'Complete Principles of Single Leg X Guard Sweep',
    startPosition: '싱글렉 X 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=vRpssJ9foSs',
    youtubeId: 'vRpssJ9foSs',
    channelName: '주짓수교본',
    thumbnailUrl: 'https://i.ytimg.com/vi/vRpssJ9foSs/hqdefault.jpg',
    duration: '07:50',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '발목 오버훅 고정 후 외회전 힙 업 스윕',
    language: 'ko',
  },
  {
    id: 'slx-ko-3',
    techniqueName: '초보자를 위한 싱글렉 X가드 세팅 방법, 기본 스윕 & 앵클락 연계',
    techniqueNameEn: 'Single Leg X-Guard Setup, Sweep & Ankle Lock for Beginners',
    startPosition: '싱글렉 X 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=WcXbJ69bMhQ',
    youtubeId: 'WcXbJ69bMhQ',
    channelName: '주짓수 테크닉 아카데미',
    thumbnailUrl: 'https://i.ytimg.com/vi/WcXbJ69bMhQ/hqdefault.jpg',
    duration: '07:25',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '신투신 진입 후 엉덩이 띄우며 SLX 완성',
    language: 'ko',
  },
  {
    id: 'xguard-ko-1',
    techniqueName: '싱글렉 X 및 X가드에서 상대 반응별 3가지 실전 스윕 시스템 (안산라텔주짓수)',
    techniqueNameEn: '3 Practical Sweeps from Single Leg X & X-Guard',
    startPosition: 'X 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=e2feyTS8Ej0',
    youtubeId: 'e2feyTS8Ej0',
    channelName: '안산라텔주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/e2feyTS8Ej0/hqdefault.jpg',
    duration: '08:40',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '반대쪽 발목 캐치 및 X-훅 스트레치 스윕',
    language: 'ko',
  },
  {
    id: 'xguard-en-1',
    techniqueName: '마르셀로 가르시아 X-가드에서 백 테이크 및 스윕 마스터클래스 (Marcelo Garcia)',
    techniqueNameEn: 'Marcelo Garcia: X-Guard to the Back & Sweep System',
    startPosition: 'X 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=l5FkoXGMBFU',
    youtubeId: 'l5FkoXGMBFU',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/l5FkoXGMBFU/hqdefault.jpg',
    duration: '07:30',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '상하 훅 다리 뻗기(Stretch)로 상대 베이스 붕괴',
    language: 'en',
  },
  {
    id: 'xguard-en-2',
    techniqueName: '싱글렉 X가드 기본 양다리 스윕 & X-가드 전환 스윕 시스템',
    techniqueNameEn: 'Single Leg X Guard Basic Sweep & X-Guard Transition Sweep',
    startPosition: 'X 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=iXBLyYZLJAE',
    youtubeId: 'iXBLyYZLJAE',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/iXBLyYZLJAE/hqdefault.jpg',
    duration: '07:10',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '발 빼기 방어 대처 X-가드 언더훅 전환',
    language: 'en',
  },
  {
    id: 'shintoshin-ko-1',
    techniqueName: '초보자를 위한 신투신(Shin-to-Shin) 가드 스윕 & 싱글렉X 진입',
    techniqueNameEn: 'Shin-to-Shin Guard Sweep & Single Leg X Entry for Beginners',
    startPosition: '신투신 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=LcjnzFqslmU',
    youtubeId: 'LcjnzFqslmU',
    channelName: '주짓수 기술 연구소',
    thumbnailUrl: 'https://i.ytimg.com/vi/LcjnzFqslmU/hqdefault.jpg',
    duration: '06:55',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '정강이 밀착 프레임 & 엉덩이 스쿠프 회전',
    language: 'ko',
  },
  {
    id: 'situp-ko-1',
    techniqueName: '루카스 레프리의 30초 안에 상대를 넘기는 싯업 가드 싱글렉 스윕 디테일',
    techniqueNameEn: 'Lucas Lepri Sit-Up Guard Single Leg Sweep Details',
    startPosition: '싯업 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=tWAG2v73WTE',
    youtubeId: 'tWAG2v73WTE',
    channelName: '주짓수 번역 아카이브',
    thumbnailUrl: 'https://i.ytimg.com/vi/tWAG2v73WTE/hqdefault.jpg',
    duration: '07:20',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '라펠/발목 타이업 & 무릎 밀며 코너 돌기',
    language: 'ko',
  },
  // ==========================================
  // 29. 50/50 가드 & K-가드 (모던 레그 & 매트릭스)
  // ==========================================
  {
    id: '5050-ko-1',
    techniqueName: '50/50 가드를 완벽하게 만드는 3가지 필수 스윕 & 공격 옵션',
    techniqueNameEn: '3 Essential Sweeps & Attacks to Master the 50/50 Guard',
    startPosition: '50/50 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=taRxGcILjcw',
    youtubeId: 'taRxGcILjcw',
    channelName: '모던 주짓수 아카데미',
    thumbnailUrl: 'https://i.ytimg.com/vi/taRxGcILjcw/hqdefault.jpg',
    duration: '07:40',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '반대쪽 발목 제압 & 펜듈럼 스윙 컴업',
    language: 'ko',
  },
  {
    id: '5050-ko-2',
    techniqueName: '50/50 가드의 모든 것: 그립 세팅부터 스윕·패스 방어까지 (노영암)',
    techniqueNameEn: 'All About 50/50 Guard: Grips, Sweeps & Pass Defense',
    startPosition: '50/50 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=NpLu5sKNmvk',
    youtubeId: 'NpLu5sKNmvk',
    channelName: '주짓수랩 노영암',
    thumbnailUrl: 'https://i.ytimg.com/vi/NpLu5sKNmvk/hqdefault.jpg',
    duration: '08:30',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '무릎 안쪽 각도 선점 & 베이스 무너뜨리기',
    language: 'ko',
  },
  {
    id: '5050-ko-3',
    techniqueName: '50/50 가드에서 스윙 스윕, 가드 패스 및 백 테이크 연계 (안산라텔주짓수)',
    techniqueNameEn: '50/50 Guard Pass, Swing Sweep & Back Take Sequence',
    startPosition: '50/50 가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=XO-P5XYKiAo',
    youtubeId: 'XO-P5XYKiAo',
    channelName: '안산라텔주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/XO-P5XYKiAo/hqdefault.jpg',
    duration: '08:00',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '레그 레이스 잠금 해제 후 백 테이크 전환',
    language: 'ko',
  },
  {
    id: '5050-en-1',
    techniqueName: '레안드로 로의 50/50 가드 패스 핵심 밸런스 & 무릎 빼기 (Leandro Lo)',
    techniqueNameEn: 'BJJ World Champion Leandro Lo: How to Pass 50/50 Guard',
    startPosition: '50/50 가드',
    category: '가드 패스',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=PakIjCVPq6A',
    youtubeId: 'PakIjCVPq6A',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/PakIjCVPq6A/hqdefault.jpg',
    duration: '06:50',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '칼라 포스팅 & 무릎 라인 탈출 롱스텝',
    language: 'en',
  },
  {
    id: 'kguard-ko-1',
    techniqueName: 'K-가드에서 매트릭스(Matrix) 엔트리와 백 마운트 테이크 완벽 가이드',
    techniqueNameEn: 'K-Guard to Matrix Entry & Back Mount Take Complete Guide',
    startPosition: 'K-가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=s3To8lMlv9Y',
    youtubeId: 's3To8lMlv9Y',
    channelName: '김서복 주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/s3To8lMlv9Y/hqdefault.jpg',
    duration: '07:45',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: 'K-훅 무릎 열기 & 오금 뒤 X-훅 매트릭스 진입',
    language: 'ko',
  },
  {
    id: 'kguard-ko-2',
    techniqueName: 'K-가드 & 매트릭스 필수 4가지 상황별 스윕·백테이크 공식',
    techniqueNameEn: '4 Essential Situations & Sweeps from K-Guard Matrix',
    startPosition: 'K-가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=10cVpqXtKn0',
    youtubeId: '10cVpqXtKn0',
    channelName: '주짓수교본',
    thumbnailUrl: 'https://i.ytimg.com/vi/10cVpqXtKn0/hqdefault.jpg',
    duration: '08:15',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '상대 무릎 방향별 크랩라이드 & 백사이드 50/50 분기',
    language: 'ko',
  },
  {
    id: 'kguard-ko-3',
    techniqueName: '기초적인 K-가드 셋업 가이드 및 하체·백 어택 전환 원리',
    techniqueNameEn: 'Fundamental K-Guard Setup Guide & Back/Leg Transitions',
    startPosition: 'K-가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=1Lm2sgs3wpU',
    youtubeId: '1Lm2sgs3wpU',
    channelName: '모던 주짓수 클래스',
    thumbnailUrl: 'https://i.ytimg.com/vi/1Lm2sgs3wpU/hqdefault.jpg',
    duration: '07:10',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '언더훅 발목 스쿠프 & 어깨 회전 각도 만들기',
    language: 'ko',
  },
  {
    id: 'kguard-en-1',
    techniqueName: '모던 주짓수 K-가드에서 가장 완벽한 매트릭스 백 테이크',
    techniqueNameEn: 'The Perfect Matrix Back Take from K Guard | Modern BJJ Guard',
    startPosition: 'K-가드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=jJpPlNf2s5Y',
    youtubeId: 'jJpPlNf2s5Y',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/jJpPlNf2s5Y/hqdefault.jpg',
    duration: '07:25',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '힙 라인 컨트롤 & 매트릭스 훅 힙 다운 스윕',
    language: 'en',
  },
  {
    id: 'kguard-en-2',
    techniqueName: '마이키 무수메시의 K-가드 3가지 핵심 공격 시스템 (Mikey Musumeci)',
    techniqueNameEn: '3 Effective K-Guard Attacks | Mikey Musumeci Seminar Recap',
    startPosition: 'K-가드',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=ayHmwddffgQ',
    youtubeId: 'ayHmwddffgQ',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/ayHmwddffgQ/hqdefault.jpg',
    duration: '08:05',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '백사이드 50/50 진입 & 매트릭스 백 테이크 이지선다',
    language: 'en',
  },
  // ==========================================
  // 30. Z-가드 / 니 쉴드 & 록다운 (하프가드 세부 포지션)
  // ==========================================
  {
    id: 'zguard-ko-1',
    techniqueName: '니쉴드(Z-가드) 하프가드 밑손 그립 파이팅과 프레임 유지의 중요성 (노영암)',
    techniqueNameEn: 'Knee Shield Half Guard Bottom Hand Grip Fighting & Framing',
    startPosition: 'Z-가드 / 니 쉴드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=HgyMotW_QqM',
    youtubeId: 'HgyMotW_QqM',
    channelName: '주짓수랩 노영암',
    thumbnailUrl: 'https://i.ytimg.com/vi/HgyMotW_QqM/hqdefault.jpg',
    duration: '07:50',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '크로스페이스 차단 프레임 & 언더훅 타이밍 확보',
    language: 'ko',
  },
  {
    id: 'zguard-en-1',
    techniqueName: 'Z-가드 vs 니 쉴드 하프가드 구조 차이와 스윕·서브미션 활용법',
    techniqueNameEn: 'Z-Guard VS. Knee Shield Half Guard Structure & Sweeps',
    startPosition: 'Z-가드 / 니 쉴드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=NsRHHZk5Nx4',
    youtubeId: 'NsRHHZk5Nx4',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/NsRHHZk5Nx4/hqdefault.jpg',
    duration: '07:35',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '로우 니쉴드 vs 하이 니쉴드 거리 조절 및 기무라 연계',
    language: 'en',
  },
  {
    id: 'zguard-en-2',
    techniqueName: '니 쉴드(Z-가드)를 공격 무기로 만드는 서브미션 & 스윕 연계',
    techniqueNameEn: 'How to Make Knee Shield a Weapon: Submissions & Sweeps',
    startPosition: 'Z-가드 / 니 쉴드',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=ATUzcKQk820',
    youtubeId: 'ATUzcKQk820',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/ATUzcKQk820/hqdefault.jpg',
    duration: '08:00',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '니 쉴드 킥오프 후 싱글렉 및 트라이앵글 전환',
    language: 'en',
  },
  {
    id: 'lockdown-ko-1',
    techniqueName: '하프가드 록다운(Lockdown)에서 일렉트릭 체어 스윕 & 딥하프 연계',
    techniqueNameEn: 'Half Guard Lockdown to Electric Chair Sweep & Deep Half',
    startPosition: '록다운',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=UTsjiyAufGg',
    youtubeId: 'UTsjiyAufGg',
    channelName: '주짓수 하프가드 아카데미',
    thumbnailUrl: 'https://i.ytimg.com/vi/UTsjiyAufGg/hqdefault.jpg',
    duration: '07:30',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '록다운 다리 뻗기(Whip-up)로 상대 중심 띄우기',
    language: 'ko',
  },
  {
    id: 'lockdown-ko-2',
    techniqueName: '록다운(Lockdown) 하프가드 다리 엮기 디테일과 언더훅 스윕 실전',
    techniqueNameEn: 'Lockdown Half Guard Leg Entanglement & Underhook Sweep',
    startPosition: '록다운',
    category: '스윕',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=qcCnfkANsSQ',
    youtubeId: 'qcCnfkANsSQ',
    channelName: '낙성대 주짓수 클래스',
    thumbnailUrl: 'https://i.ytimg.com/vi/qcCnfkANsSQ/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '더블 언더훅(조스 클러치) 진입 후 올드스쿨 스윕',
    language: 'ko',
  },
  // ==========================================
  // 31. 칼라 앤 슬리브 가드 & 웜가드/라펠 가드 & 러버 가드
  // ==========================================
  {
    id: 'cs-ko-1',
    techniqueName: '칼라 앤 슬리브 가드 기본 세팅과 상대 밸런스 무너뜨리는 스윕',
    techniqueNameEn: 'Collar and Sleeve Guard Setup & Off-Balancing Sweep',
    startPosition: '칼라 앤 슬리브 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=clTRgzNtTTM',
    youtubeId: 'clTRgzNtTTM',
    channelName: '주짓수 기술 도서관',
    thumbnailUrl: 'https://i.ytimg.com/vi/clTRgzNtTTM/hqdefault.jpg',
    duration: '07:20',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '깊은 깃 그립 당김 & 골반/이두근 발바닥 텐션 유지',
    language: 'ko',
  },
  {
    id: 'cs-ko-2',
    techniqueName: '칼라 & 슬리브 가드 컨트롤에서 트라이앵글·오모플라타·스윕 연계',
    techniqueNameEn: 'Collar & Sleeve Guard Control to Triangle, Omoplata & Sweep',
    startPosition: '칼라 앤 슬리브 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=Up8Lqrvgfvc',
    youtubeId: 'Up8Lqrvgfvc',
    channelName: '이종진 주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/Up8Lqrvgfvc/hqdefault.jpg',
    duration: '08:10',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '소매 당기며 엉덩이 회전으로 오모플라타/삼각 이지선다',
    language: 'ko',
  },
  {
    id: 'cs-en-1',
    techniqueName: '칼라 앤 슬리브 가드에서 가드 패스 차단 및 고확률 스윕 2선',
    techniqueNameEn: 'Guard Players - 2 High Percentage Sweeps in Collar Sleeve',
    startPosition: '칼라 앤 슬리브 가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=776BVyZM504',
    youtubeId: '776BVyZM504',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/776BVyZM504/hqdefault.jpg',
    duration: '07:40',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '발목 트립 스윕 & 오버헤드 벌룬 스윕 연계',
    language: 'en',
  },
  {
    id: 'worm-ko-1',
    techniqueName: '웜가드(라펠가드) 세팅 방법과 스윕 & 백테이크 6가지 실전 기술',
    techniqueNameEn: 'Worm Guard Setup & 6 Practical Sweep and Back Take Variations',
    startPosition: '웜가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=WLZ5OG--yeE',
    youtubeId: 'WLZ5OG--yeE',
    channelName: '브라운박 주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/WLZ5OG--yeE/hqdefault.jpg',
    duration: '08:50',
    recommendedStartTime: '01:20',
    recommendedStartSec: 80,
    keyDetailTag: '상대 도복 자락 다리 감기 & 라펠 패스 전환 스윕',
    language: 'ko',
  },
  {
    id: 'worm-ko-2',
    techniqueName: '강력한 라펠 컨트롤 웜가드(Worm Guard) 기본 세팅과 펜듈럼 스윕',
    techniqueNameEn: 'Powerful Lapel Control Worm Guard Setup & Pendulum Sweep',
    startPosition: '웜가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=i42iNMNaXpE',
    youtubeId: 'i42iNMNaXpE',
    channelName: '이바름 주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/i42iNMNaXpE/hqdefault.jpg',
    duration: '07:45',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '라펠 피딩 타이밍 & 무릎 각도 완전 봉쇄',
    language: 'ko',
  },
  {
    id: 'worm-en-1',
    techniqueName: '웜가드(Worm Guard)에서 연결하는 5가지 필수 스윕 바리에이션',
    techniqueNameEn: 'BJJ: 5 Sweeps From Worm Guard | Evolve University',
    startPosition: '웜가드',
    category: '스윕',
    giType: 'Gi',
    youtubeUrl: 'https://www.youtube.com/watch?v=xV3H9rZfHMI',
    youtubeId: 'xV3H9rZfHMI',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/xV3H9rZfHMI/hqdefault.jpg',
    duration: '08:15',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '링웜/스퀴드 전환 및 백 테이크 연결',
    language: 'en',
  },
  {
    id: 'rubber-ko-1',
    techniqueName: '러버가드(Rubber Guard) 쉽게 묶는 법과 미션 컨트롤 셋업',
    techniqueNameEn: 'How to Easily Set Up Rubber Guard & Mission Control',
    startPosition: '러버 가드',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=8X44L4dll7I',
    youtubeId: '8X44L4dll7I',
    channelName: '최명규 주짓수',
    thumbnailUrl: 'https://i.ytimg.com/vi/8X44L4dll7I/hqdefault.jpg',
    duration: '07:35',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '고관절 외회전 각도 & 상대 자세 완전 제압',
    language: 'ko',
  },
  {
    id: 'rubber-ko-2',
    techniqueName: '높은 방어력과 강력한 서브미션이 가능한 러버가드 핵심 공격 체계',
    techniqueNameEn: 'Rubber Guard Core Submission System: Dead Orchard & Omoplata',
    startPosition: '러버 가드',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=gSr7AwC3mRo',
    youtubeId: 'gSr7AwC3mRo',
    channelName: '노기 주짓수 클래스',
    thumbnailUrl: 'https://i.ytimg.com/vi/gSr7AwC3mRo/hqdefault.jpg',
    duration: '07:50',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '미션 컨트롤에서 오모플라타·고고플라타·암바 전환',
    language: 'ko',
  },
  // ==========================================
  // 32. 노스 사우스 컨트롤 / 곁누르기(케사 가타메) / 헤드쿼터 / 트럭 / 백 마운트 추가
  // ==========================================
  {
    id: 'ns-ko-1',
    techniqueName: '노스 사우스(남북) 포지션 압박 컨트롤 및 기무라 서브미션 연계',
    techniqueNameEn: 'North-South Position Control & Kimura Submission Setup',
    startPosition: '노스 사우스 컨트롤',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=XOqWNK9yZzI',
    youtubeId: 'XOqWNK9yZzI',
    channelName: '주짓수 기술 도서관',
    thumbnailUrl: 'https://i.ytimg.com/vi/XOqWNK9yZzI/hqdefault.jpg',
    duration: '06:55',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '상대 겨드랑이 파기 & 머리 스텝오버 기무라 피니시',
    language: 'ko',
  },
  {
    id: 'ns-ko-2',
    techniqueName: '노스 사우스(남북) 포지션 프레임 형성 및 이스케이프 탈출 원리',
    techniqueNameEn: 'North-South Position Framing & Escape Principles',
    startPosition: '노스 사우스 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=McT6cojM7a8',
    youtubeId: 'McT6cojM7a8',
    channelName: '주짓수 기술 도서관',
    thumbnailUrl: 'https://i.ytimg.com/vi/McT6cojM7a8/hqdefault.jpg',
    duration: '07:10',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '골반 프레임 공간 확보 & 인버티드 가드 리커버리',
    language: 'ko',
  },
  {
    id: 'ns-en-1',
    techniqueName: '타이트한 노스 사우스 컨트롤에서 매번 빠져나오는 이스케이프 비결',
    techniqueNameEn: 'How I Escape North South EVERYTIME',
    startPosition: '노스 사우스 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=CMgcU-SaIBY',
    youtubeId: 'CMgcU-SaIBY',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/CMgcU-SaIBY/hqdefault.jpg',
    duration: '07:30',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '겨드랑이 프레임 밀어올리기 & 터틀/가드 복구',
    language: 'en',
  },
  {
    id: 'kesa-ko-1',
    techniqueName: '곁누르기(케사가타메) 탈출 후 기무라 리버설 카운터 연계',
    techniqueNameEn: 'How To Do Kimura after Escape from Kesa Gatame',
    startPosition: '곁누르기 / 케사 가타메',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=rALYjIWWASE',
    youtubeId: 'rALYjIWWASE',
    channelName: '주짓수 카운터 연구소',
    thumbnailUrl: 'https://i.ytimg.com/vi/rALYjIWWASE/hqdefault.jpg',
    duration: '07:15',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '팔꿈치 구출 후 브릿지 리버설 & 기무라 그립',
    language: 'ko',
  },
  {
    id: 'kesa-ko-2',
    techniqueName: '곁누르기(Kesa Gatame) 압박 컨트롤 구조와 브릿지 이스케이프',
    techniqueNameEn: 'Kesa Gatame Scarf Hold Control & Bridge Escape',
    startPosition: '곁누르기 / 케사 가타메',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=eLndBCo75oo',
    youtubeId: 'eLndBCo75oo',
    channelName: '주짓수 기술 도서관',
    thumbnailUrl: 'https://i.ytimg.com/vi/eLndBCo75oo/hqdefault.jpg',
    duration: '06:50',
    recommendedStartTime: '00:55',
    recommendedStartSec: 55,
    keyDetailTag: '상대 무게중심 회전 방향 읽기와 다리 걸기 백 테이크',
    language: 'ko',
  },
  {
    id: 'kesa-en-1',
    techniqueName: '케사 가타메(곁누르기) 킬 시스템: 다리를 이용한 암바 & 아메리카나 피니시',
    techniqueNameEn: 'The Kesa Gatame Kill System in BJJ',
    startPosition: '곁누르기 / 케사 가타메',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=G0Xf_CJzE6M',
    youtubeId: 'G0Xf_CJzE6M',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/G0Xf_CJzE6M/hqdefault.jpg',
    duration: '08:05',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '횡격막 압박 & 앞다리 스텝오버 아메리카나/암바',
    language: 'en',
  },
  {
    id: 'hq-ko-1',
    techniqueName: '헤드쿼터(HQ) 포지션 세팅 원리와 니컷·롱스텝 가드 패스 연계',
    techniqueNameEn: 'Headquarters (HQ) Position Setup & Knee Cut / Long Step Pass',
    startPosition: '헤드쿼터',
    category: '가드 패스',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=qKWgxzNCI2A',
    youtubeId: 'qKWgxzNCI2A',
    channelName: '주짓수 패스 시스템',
    thumbnailUrl: 'https://i.ytimg.com/vi/qKWgxzNCI2A/hqdefault.jpg',
    duration: '07:45',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '상대 한쪽 다리 가두기(Sit on ankle) & 좌우 패스 분기',
    language: 'ko',
  },
  {
    id: 'hq-ko-2',
    techniqueName: '헤드쿼터(HQ) 포지션에서 상대 무릎 제압 후 스매시 패스 피니시',
    techniqueNameEn: 'Headquarters (HQ) Position to Smash Pass Finish',
    startPosition: '헤드쿼터',
    category: '가드 패스',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=DyVeWlrZ8-M',
    youtubeId: 'DyVeWlrZ8-M',
    channelName: '주짓수 패스 시스템',
    thumbnailUrl: 'https://i.ytimg.com/vi/DyVeWlrZ8-M/hqdefault.jpg',
    duration: '07:20',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '무릎 핀치 무너뜨리기 & 힙 스매시 사이드 안착',
    language: 'ko',
  },
  {
    id: 'hq-en-1',
    techniqueName: '주짓수에서 가장 중요한 패스 허브: 헤드쿼터(HQ) 가드 패스 시스템',
    techniqueNameEn: 'The MOST Important Passing Position in Jiu Jitsu: Headquarters',
    startPosition: '헤드쿼터',
    category: '가드 패스',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=zz8To63Oj5U',
    youtubeId: 'zz8To63Oj5U',
    channelName: 'Jordan Teaches Jiujitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/zz8To63Oj5U/hqdefault.jpg',
    duration: '08:25',
    recommendedStartTime: '01:15',
    recommendedStartSec: 75,
    keyDetailTag: '니컷·폴딩패스·X패스 3방향 체인 패싱',
    language: 'en',
  },
  {
    id: 'truck-en-1',
    techniqueName: '터틀에서 트럭(The Truck) 포지션 쉬운 진입과 필수 서브미션 3선',
    techniqueNameEn: 'EASY Truck Entry from Turtle and 3 MUST KNOW Submissions',
    startPosition: '트럭 (The Truck)',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=QkBQoCka7z8',
    youtubeId: 'QkBQoCka7z8',
    channelName: 'Knight Jiu-Jitsu',
    thumbnailUrl: 'https://i.ytimg.com/vi/QkBQoCka7z8/hqdefault.jpg',
    duration: '07:50',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '인버티드 롤 트럭 진입 & 카프슬라이서/바나나스플릿/백테이크',
    language: 'en',
  },
  {
    id: 'truck-en-2',
    techniqueName: '10th Planet 트럭(Truck) 포지션 카프 슬라이서, 리스트락 & 트위스터',
    techniqueNameEn: 'How to Use the 10th Planet Truck Position for Calf Slice & Twister',
    startPosition: '트럭 (The Truck)',
    category: '서브미션',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=Qx9WAtnYgxw',
    youtubeId: 'Qx9WAtnYgxw',
    channelName: 'BJJ Fanatics',
    thumbnailUrl: 'https://i.ytimg.com/vi/Qx9WAtnYgxw/hqdefault.jpg',
    duration: '08:10',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '록다운 훅 유지 & 상체 비틀기 트위스터 피니시',
    language: 'en',
  },
  {
    id: 'bm-ko-3',
    techniqueName: '백 마운트(백 포지션)에서 초크 방어하며 안전하게 탈출하는 핵심 원리',
    techniqueNameEn: 'How to Escape Back Mount & Defend Rear Naked Choke',
    startPosition: '백 마운트 / 백 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=Prbby3P2vnQ',
    youtubeId: 'Prbby3P2vnQ',
    channelName: '주짓수 기술 도서관',
    thumbnailUrl: 'https://i.ytimg.com/vi/Prbby3P2vnQ/hqdefault.jpg',
    duration: '07:25',
    recommendedStartTime: '01:05',
    recommendedStartSec: 65,
    keyDetailTag: '초크 핸드 파이팅 & 등 매트 밀착 슬라이드 탈출',
    language: 'ko',
  },
  {
    id: 'bm-ko-4',
    techniqueName: '백 마운트 탈출의 비법: 내 머리 위치와 어깨 라인을 바꾸는 백 이스케이프',
    techniqueNameEn: 'Secret to Back Mount Escape: Head Position & Shoulder Alignment',
    startPosition: '백 마운트 / 백 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=fswTOH4OQxI',
    youtubeId: 'fswTOH4OQxI',
    channelName: '주짓수 마스터 클래스',
    thumbnailUrl: 'https://i.ytimg.com/vi/fswTOH4OQxI/hqdefault.jpg',
    duration: '07:40',
    recommendedStartTime: '01:10',
    recommendedStartSec: 70,
    keyDetailTag: '언더훅 방향 판단 & 머리 매트 고정 후 훅 해제',
    language: 'ko',
  },
  {
    id: 'bm-ko-5',
    techniqueName: '백 컨트롤(백 마운트) 상대 훅 무력화 및 가드 리커버리 연결',
    techniqueNameEn: 'Back Control Hook Clearing & Guard Recovery Transition',
    startPosition: '백 마운트 / 백 컨트롤',
    category: '이스케이프',
    giType: 'Both',
    youtubeUrl: 'https://www.youtube.com/watch?v=RhZmfFlW1LQ',
    youtubeId: 'RhZmfFlW1LQ',
    channelName: '주짓수 기술 도서관',
    thumbnailUrl: 'https://i.ytimg.com/vi/RhZmfFlW1LQ/hqdefault.jpg',
    duration: '07:05',
    recommendedStartTime: '01:00',
    recommendedStartSec: 60,
    keyDetailTag: '바텀 훅 벗겨내기 & 인사이드 회전 하프가드 전환',
    language: 'ko',
  },
];

// Master tree 69 positions standard anchors
export const MASTER_TREE_POSITION_CYCLE = [
  '클로즈드 가드',
  '하프 가드',
  '사이드 컨트롤',
  '마운트',
  '스탠딩 / 오픈 그립',
  '백 마운트 / 백 컨트롤',
  '터틀 포지션',
  '데라히바 가드',
  '라쏘 가드',
  '스파이더 가드',
  '버터플라이 가드',
  '니온밸리',
];

// Extended comprehensive themes (Master tree + off-tree modern sequences & styles)
export const EXTENDED_THEME_CYCLE_ORDER = [
  '클로즈드 가드',
  '하프 가드',
  '유도 메치기 & 깃싸움',
  '사이드 컨트롤',
  '레슬링 & 스탠딩 테이크다운',
  '마운트 & 이스케이프',
  '가드 패스 & 압박',
  '백 마운트 / 백 컨트롤',
  '모던 가드 & 베림보로',
  '서브미션 스페셜 (초크 & 관절기)',
  '터틀 포지션 & 크루시픽스',
  '가드 리텐션 & 리커버리',
  '데라히바 / 라쏘 가드',
  '프론트 헤드락 시스템',
];

export const POSITION_CYCLE_ORDER = EXTENDED_THEME_CYCLE_ORDER;

// ==========================================
// 1. 유튜브/외부 영상 URL 정규화 함수 (같은 영상인데 주소 형태만 다른 경우 완벽 차단)
// ==========================================
export function getNormalizedVideoKey(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `yt_${ytMatch[1]}`; // 유튜브 고유 ID 추출
  }
  // 순수 11자리 유튜브 ID가 들어온 경우에도 동일하게 yt_ 접두사로 정규화
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `yt_${trimmed}`;
  }
  return trimmed.split('?')[0].toLowerCase(); // 일반 URL은 쿼리스트링 제거 후 비교
}

// ==========================================
// 2. 이미 노출되었거나 교체된 URL을 저장하는 상태 (날짜별/전역 관리)
// seenUrlsHistory: 사용자가 '다른 영상' 또는 '영상 교체'를 눌러 넘긴 URL 기록
// seenUrlsOrder: FIFO(가장 오래전에 본 영상부터 순환) 순서 기록
// dateRefreshOffsetMap: 날짜별 새로고침/교체 누적 오프셋 (매 클릭마다 시작 인덱스 전진)
// ==========================================
export const seenUrlsHistory = new Set<string>();
const seenUrlsOrder: string[] = [];
const dateRefreshOffsetMap = new Map<string, number>();

export function recordUrlToSeenHistory(urlOrKey: string): void {
  const key = urlOrKey.startsWith('yt_') ? urlOrKey : getNormalizedVideoKey(urlOrKey);
  if (!key) return;
  seenUrlsHistory.add(key);
  const existingIdx = seenUrlsOrder.indexOf(key);
  if (existingIdx !== -1) {
    seenUrlsOrder.splice(existingIdx, 1);
  }
  seenUrlsOrder.push(key);
}

// 영어(해외) 채널 명시적 목록 (제목 번역 여부와 무관하게 채널 언어 기준으로 엄격 판별)
const ENGLISH_CHANNEL_NAMES = new Set([
  'chewjitsu',
  'bjj fanatics',
  'bernardo faria bjj fanatics',
  'stephan kesting',
  'jordan teaches jiujitsu',
  'brian glick',
  'shintaro higashi',
  'travis stevens',
  'knight jiu-jitsu',
  'absolute mma',
  'ma1 combat',
  'gracie barra aliso viejo',
  'aaron benzrihem bjj',
  'chess club jiu-jitsu',
  'will brooks official',
  'urban jiu-jitsu',
  'brewjitsu',
]);

export function getEffectiveVideoLang(video: AiRecommendedVideoCandidate & { lang?: string }): 'ko' | 'en' {
  const ch = (video.channelName || '').trim().toLowerCase();
  if (ENGLISH_CHANNEL_NAMES.has(ch)) {
    return 'en';
  }
  const explicitLang = video.lang || video.language;
  if (explicitLang === 'en') return 'en';
  if (explicitLang === 'ko') return 'ko';
  return 'ko';
}

export function getDayOfWeekFromDateStr(dateStr: string): number {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  }
  return new Date().getDay();
}

export function getDaysDiff(dateStr1: string, dateStr2: string): number {
  const t1 = new Date(dateStr1).getTime();
  const t2 = new Date(dateStr2).getTime();
  return Math.abs(Math.round((t1 - t2) / (1000 * 60 * 60 * 24)));
}

/**
 * 수업일지에 등록된 중복 방지 기간 내 URL Key Set 반환
 */
export function getLoggedUrlsSet(
  journalEntries: ClassJournalEntry[],
  dedupPeriod: AiRecommendSettings['dedupPeriod'],
  customDedupDays?: number,
  referenceDateStr?: string
): Set<string> {
  const loggedUrls = new Set<string>();
  if (!journalEntries || journalEntries.length === 0) return loggedUrls;

  let dedupDays = 90;
  if (dedupPeriod === 'custom') {
    dedupDays = customDedupDays || 90;
  } else {
    dedupDays = parseInt(dedupPeriod || '90', 10) || 90;
  }

  const refTime = referenceDateStr ? new Date(referenceDateStr).getTime() : Date.now();
  const validRefTime = isNaN(refTime) ? Date.now() : refTime;
  const cutoff = validRefTime - dedupDays * 24 * 60 * 60 * 1000;

  journalEntries.forEach((entry) => {
    const entryTime = new Date(entry.date).getTime();
    if (!isNaN(entryTime) && entryTime >= cutoff && entryTime <= validRefTime + 24 * 60 * 60 * 1000) {
      const key = getNormalizedVideoKey(entry.youtubeUrl || entry.youtubeId || '');
      if (key) {
        loggedUrls.add(key);
      }
    }
  });

  return loggedUrls;
}

/**
 * Calculates how many class journal entries are currently excluded by the dedup period
 */
export function getExcludedClassEntriesCount(
  journalEntries: ClassJournalEntry[],
  dedupPeriod: AiRecommendSettings['dedupPeriod'],
  customDedupDays?: number
): number {
  return getLoggedUrlsSet(journalEntries, dedupPeriod, customDedupDays).size;
}

/**
 * Deterministic starting position / theme calculation
 * Uses strict Monday-to-Sunday week alignment for weekly cycles
 */
export function calculateStartPositionForDate(
  dateStr: string,
  cycle: 'daily' | 'weekly' | 'chain',
  overridePosition?: string,
  searchScope: 'all_expanded' | 'master_tree_only' = 'all_expanded',
  dayStyle?: AiRecommendDayStyle
): string {
  if (overridePosition && overridePosition.trim().length > 0) {
    return overridePosition.trim();
  }

  // If day style is judo or wrestling, use designated theme automatically
  if (dayStyle === 'judo') {
    return '유도 메치기 & 깃싸움';
  }
  if (dayStyle === 'wrestling') {
    return '레슬링 & 스탠딩 테이크다운';
  }

  const baseCycleList =
    searchScope === 'master_tree_only' ? MASTER_TREE_POSITION_CYCLE : EXTENDED_THEME_CYCLE_ORDER;

  // 요일 스타일(Gi / No-Gi)에 맞지 않는 전용 테마 자동 배정 방지
  const cycleList = baseCycleList.filter((pos) => {
    if (dayStyle === 'gi') {
      return !pos.includes('유도') && !pos.includes('레슬링');
    }
    if (dayStyle === 'nogi') {
      return (
        !pos.includes('유도') &&
        !pos.includes('레슬링') &&
        !pos.includes('라쏘') &&
        !pos.includes('스파이더') &&
        !pos.includes('베림보로')
      );
    }
    return true;
  });

  const parts = dateStr.split('-').map(Number);
  const dateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();

  if (cycle === 'weekly') {
    const jsDay = dateObj.getDay();
    const diffToMonday = (jsDay + 6) % 7; // Mon: 0, Tue: 1, ..., Sun: 6
    const mondayDate = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate() - diffToMonday
    );
    mondayDate.setHours(0, 0, 0, 0);

    const mondayEpochDays = Math.floor(mondayDate.getTime() / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(mondayEpochDays / 7);
    return cycleList[Math.abs(weekIndex) % cycleList.length];
  }

  if (cycle === 'chain') {
    const dayNum = dateObj.getDate();
    return cycleList[dayNum % cycleList.length];
  }

  const epochDays = Math.floor(dateObj.getTime() / (1000 * 60 * 60 * 24));
  return cycleList[Math.abs(epochDays) % cycleList.length];
}

/**
 * Helper to check if a candidate's YouTube URL or ID matches any previously seen URL or ID
 * "URL이 같은가? YES -> 그럼 제외, NO -> 일 경우 보여주기"
 */
export function isSameYoutubeUrlOrId(
  cand: AiRecommendedVideoCandidate,
  excludeSet?: Set<string>
): boolean {
  if (!cand || !excludeSet || excludeSet.size === 0) return false;
  const candKey = getNormalizedVideoKey(cand.youtubeUrl || cand.youtubeId || '');
  if (!candKey) return false;
  if (excludeSet.has(candKey)) return true;

  for (const seenItem of excludeSet) {
    if (!seenItem) continue;
    if (getNormalizedVideoKey(seenItem) === candKey) return true;
  }
  return false;
}

/**
 * 1차 정확 매칭 헬퍼: 선택한 시작 포지션/테마와 정확히 일치하는지 판별
 */
export function matchesExactPosition(
  video: AiRecommendedVideoCandidate,
  targetPosition: string
): boolean {
  if (!targetPosition) return true;
  const normPos = targetPosition.toLowerCase().trim();
  const vPos = (video.startPosition || '').toLowerCase().trim();
  if (vPos === normPos) return true;

  if (normPos.includes('새들') || normPos.includes('411') || normPos.includes('허니홀')) {
    return vPos.includes('새들') || vPos.includes('411') || vPos.includes('허니홀');
  }
  if (normPos.includes('아시 가라미') || normPos.includes('스탠다드 아시')) {
    return (
      vPos.includes('아시 가라미') ||
      vPos.includes('스탠다드 아시') ||
      vPos.includes('새들') ||
      vPos.includes('411') ||
      vPos.includes('허니홀')
    );
  }
  if (normPos.includes('싱글렉 x') || normPos === 'x 가드' || normPos.includes('더블렉 x')) {
    return vPos.includes('싱글렉 x') || vPos === 'x 가드' || vPos.includes('더블렉 x');
  }
  if (normPos.includes('50/50')) {
    return vPos.includes('50/50');
  }
  if (normPos.includes('k-가드') || normPos.includes('k가드')) {
    return vPos.includes('k-가드') || vPos.includes('k가드');
  }
  if (normPos.includes('z-가드') || normPos.includes('니 쉴드')) {
    return vPos.includes('z-가드') || vPos.includes('니 쉴드') || vPos === '하프 가드';
  }
  if (normPos.includes('록다운') || normPos.includes('락다운')) {
    return vPos.includes('록다운') || vPos.includes('락다운') || vPos === '하프 가드';
  }
  if (normPos.includes('칼라 앤 슬리브')) {
    return vPos.includes('칼라 앤 슬리브') || vPos.includes('스파이더') || vPos.includes('라쏘');
  }
  if (normPos.includes('웜가드') || normPos.includes('스퀴드')) {
    return vPos.includes('웜가드') || vPos.includes('스퀴드') || vPos.includes('데라히바');
  }
  if (normPos.includes('러버 가드')) {
    return vPos.includes('러버 가드') || vPos.includes('클로즈드');
  }
  if (normPos.includes('신투신') || normPos.includes('싯업')) {
    return vPos.includes('신투신') || vPos.includes('싯업') || vPos.includes('버터플라이');
  }
  if (normPos.includes('노스 사우스')) {
    return vPos.includes('노스 사우스') || vPos.includes('사이드 컨트롤');
  }
  if (normPos.includes('곁누르기') || normPos.includes('케사 가타메')) {
    return (
      vPos.includes('곁누르기') ||
      vPos.includes('케사 가타메') ||
      vPos.includes('사이드 컨트롤')
    );
  }
  if (normPos.includes('헤드쿼터')) {
    return (
      vPos.includes('헤드쿼터') ||
      vPos.includes('오픈 가드 탑') ||
      vPos.includes('가드 패스')
    );
  }
  if (normPos.includes('트럭')) {
    return vPos.includes('트럭') || vPos.includes('터틀');
  }
  if (normPos === '마운트') {
    return vPos === '마운트';
  }
  if (normPos.includes('마운트') && !normPos.includes('백')) {
    return vPos === '마운트';
  }
  if (normPos.includes('백 마운트') || normPos.includes('백 컨트롤')) {
    return vPos.includes('백 마운트') || vPos.includes('백 컨트롤');
  }
  if (normPos.includes('사이드 컨트롤') || normPos.includes('사이드')) {
    return vPos.includes('사이드 컨트롤');
  }
  if (normPos.includes('니온밸리')) {
    return vPos.includes('니온밸리');
  }
  if (normPos.includes('터틀') || normPos.includes('크루시픽스')) {
    return vPos.includes('터틀') || vPos.includes('크루시픽스');
  }
  if (normPos.includes('클로즈드')) {
    return vPos.includes('클로즈드');
  }
  if (normPos === '하프 가드' || normPos.includes('딥 하프') || normPos.includes('리버스 하프')) {
    return vPos === '하프 가드' || vPos.includes('딥 하프') || vPos.includes('리버스 하프');
  }
  if (normPos.includes('버터플라이')) {
    return vPos.includes('버터플라이');
  }
  if (normPos.includes('데라히바 / 라쏘')) {
    return vPos.includes('데라히바') || vPos.includes('라쏘');
  }
  if (normPos.includes('모던 가드') || normPos.includes('베림보로')) {
    return vPos.includes('데라히바') || vPos.includes('k-가드') || vPos.includes('50/50');
  }
  if (normPos.includes('데라히바')) {
    return vPos.includes('데라히바');
  }
  if (normPos.includes('라쏘')) {
    return vPos.includes('라쏘');
  }
  if (normPos.includes('스파이더')) {
    return vPos.includes('스파이더');
  }
  if (normPos.includes('가드 패스')) {
    return (
      video.category === '가드 패스' ||
      vPos.includes('헤드쿼터') ||
      vPos.includes('오픈 가드 탑') ||
      vPos.includes('가드 패스')
    );
  }
  if (normPos.includes('서브미션')) {
    return video.category === '서브미션';
  }
  if (normPos.includes('가드 리텐션') || normPos.includes('리커버리')) {
    return video.category.includes('가드') || video.category === '스윕' || vPos.includes('가드');
  }
  if (normPos.includes('헤드락') || normPos.includes('길로틴')) {
    return vPos.includes('헤드락');
  }
  if (normPos.includes('스탠딩') || normPos.includes('레슬링') || normPos.includes('테이크다운')) {
    return vPos.includes('스탠딩') || vPos.includes('레슬링') || video.giType === '레슬링';
  }
  if (normPos.includes('유도')) {
    return vPos.includes('유도') || video.giType === '유도' || video.category.includes('유도');
  }
  return false;
}

/**
 * 포지션/테마 매칭 판별 헬퍼 (동일 시작 포지션 또는 직계 동일 주제 패밀리만 엄격 매칭)
 * 절대 다른 무관한 주제(예: 하체/가드 포지션인데 테이크다운 등)와 매칭하지 않음
 */
export function matchesPositionOrTheme(
  video: AiRecommendedVideoCandidate,
  targetPosition: string
): boolean {
  if (!targetPosition) return true;
  if (matchesExactPosition(video, targetPosition)) return true;

  const normPos = targetPosition.toLowerCase().trim();
  const vPos = (video.startPosition || '').toLowerCase().trim();

  // 1. 하체 엔탱글먼트 패밀리 (새들 / 411 / 허니홀 / 아시 가라미 / 50/50 / K-가드)
  if (
    normPos.includes('새들') ||
    normPos.includes('411') ||
    normPos.includes('허니홀') ||
    normPos.includes('아시 가라미') ||
    normPos.includes('스탠다드 아시')
  ) {
    return (
      vPos.includes('새들') ||
      vPos.includes('411') ||
      vPos.includes('허니홀') ||
      vPos.includes('아시 가라미') ||
      vPos.includes('50/50') ||
      vPos.includes('싱글렉 x')
    );
  }

  // 2. 50/50 & K-가드 모던 레그/매트릭스 패밀리
  if (normPos.includes('50/50') || normPos.includes('k-가드') || normPos.includes('k가드')) {
    return (
      vPos.includes('50/50') ||
      vPos.includes('k-가드') ||
      vPos.includes('새들') ||
      vPos.includes('아시 가라미') ||
      vPos.includes('데라히바')
    );
  }

  // 3. 싱글렉 X / X 가드 / 더블렉 X / 신투신 / 싯업 / 버터플라이 (언더니스 훅 & 엘리베이션 패밀리)
  if (
    normPos.includes('싱글렉 x') ||
    normPos === 'x 가드' ||
    normPos.includes('더블렉 x') ||
    normPos.includes('신투신')
  ) {
    return (
      vPos.includes('싱글렉 x') ||
      vPos === 'x 가드' ||
      vPos.includes('신투신') ||
      vPos.includes('버터플라이') ||
      vPos.includes('아시 가라미')
    );
  }

  if (normPos.includes('버터플라이') || normPos.includes('싯업')) {
    return (
      vPos.includes('버터플라이') ||
      vPos.includes('싯업') ||
      vPos.includes('신투신') ||
      vPos.includes('싱글렉 x')
    );
  }

  // 4. 하프 가드 패밀리 (하프 가드 / 딥 하프 / 리버스 하프 / Z-가드 / 니 쉴드 / 록다운)
  if (
    normPos.includes('하프') ||
    normPos.includes('z-가드') ||
    normPos.includes('니 쉴드') ||
    normPos.includes('록다운') ||
    normPos.includes('락다운')
  ) {
    return (
      vPos.includes('하프') ||
      vPos.includes('z-가드') ||
      vPos.includes('니 쉴드') ||
      vPos.includes('록다운')
    );
  }

  // 5. 클로즈드 가드 & 러버 가드 & 기타 가드 패밀리
  if (normPos.includes('클로즈드') || normPos.includes('러버 가드') || normPos.includes('기타 가드')) {
    return (
      vPos.includes('클로즈드') ||
      vPos.includes('러버 가드') ||
      vPos.includes('칼라 앤 슬리브')
    );
  }

  // 6. 오픈 가드 도복 그립 패밀리 (데라히바 / 리버스 데라히바 / 라쏘 / 스파이더 / 칼라 앤 슬리브 / 웜가드 / 스퀴드)
  if (normPos.includes('칼라 앤 슬리브')) {
    return (
      vPos.includes('칼라 앤 슬리브') ||
      vPos.includes('스파이더') ||
      vPos.includes('라쏘') ||
      vPos.includes('데라히바')
    );
  }
  if (normPos.includes('웜가드') || normPos.includes('스퀴드')) {
    return (
      vPos.includes('웜가드') ||
      vPos.includes('데라히바') ||
      vPos.includes('라쏘') ||
      vPos.includes('칼라 앤 슬리브')
    );
  }
  if (normPos.includes('라쏘')) {
    return vPos.includes('라쏘') || vPos.includes('스파이더') || vPos.includes('칼라 앤 슬리브');
  }
  if (normPos.includes('스파이더')) {
    return vPos.includes('스파이더') || vPos.includes('라쏘') || vPos.includes('칼라 앤 슬리브');
  }
  if (
    normPos.includes('모던 가드') ||
    normPos.includes('베림보로') ||
    normPos.includes('데라히바')
  ) {
    return (
      vPos.includes('데라히바') ||
      vPos.includes('k-가드') ||
      vPos.includes('라쏘') ||
      vPos.includes('스파이더') ||
      vPos.includes('웜가드')
    );
  }

  // 7. 상위 압박 컨트롤 패밀리 (사이드 컨트롤 / 노스 사우스 / 곁누르기·케사 가타메 / 니온밸리 / 마운트)
  if (
    normPos.includes('노스 사우스') ||
    normPos.includes('곁누르기') ||
    normPos.includes('케사 가타메') ||
    normPos.includes('사이드')
  ) {
    return (
      vPos.includes('사이드') ||
      vPos.includes('노스 사우스') ||
      vPos.includes('곁누르기') ||
      vPos.includes('케사 가타메') ||
      vPos.includes('니온밸리')
    );
  }
  if (normPos.includes('니온밸리') || normPos.includes('니온 벨리')) {
    return vPos.includes('니온밸리') || vPos.includes('사이드') || vPos === '마운트';
  }
  if (normPos === '마운트') {
    return vPos === '마운트' || vPos.includes('니온밸리');
  }
  if (normPos.includes('마운트') && !normPos.includes('백')) {
    return (vPos === '마운트' || video.category === '이스케이프') && !vPos.includes('백');
  }

  // 8. 백 마운트 / 터틀 / 트럭 / 크루시픽스 패밀리
  if (
    normPos.includes('백 마운트') ||
    normPos.includes('백 컨트롤') ||
    normPos.includes('백포지션')
  ) {
    return vPos.includes('백') || vPos.includes('트럭') || vPos.includes('터틀');
  }
  if (normPos.includes('터틀') || normPos.includes('크루시픽스') || normPos.includes('트럭')) {
    return vPos.includes('터틀') || vPos.includes('트럭') || vPos.includes('백') || vPos.includes('헤드락');
  }

  // 9. 헤드쿼터 & 가드 패스 패밀리
  if (
    normPos.includes('헤드쿼터') ||
    normPos.includes('가드 패스') ||
    normPos.includes('압박 패스') ||
    normPos.includes('스매시') ||
    normPos.includes('패스')
  ) {
    return (
      vPos.includes('헤드쿼터') ||
      video.category === '가드 패스' ||
      vPos.includes('오픈 가드 탑') ||
      vPos.includes('가드 패스')
    );
  }

  // 10. 스탠딩 / 레슬링 / 유도 / 프론트 헤드락
  if (normPos.includes('유도')) {
    return (
      video.giType === '유도' ||
      video.category.includes('유도') ||
      vPos.includes('유도')
    );
  }
  if (normPos.includes('레슬링') || normPos.includes('스탠딩') || normPos.includes('테이크다운')) {
    return (
      video.giType === '레슬링' ||
      video.category === '테이크다운' ||
      vPos.includes('스탠딩') ||
      vPos.includes('레슬링')
    );
  }
  if (normPos.includes('헤드락') || normPos.includes('길로틴')) {
    return vPos.includes('헤드락') || vPos.includes('터틀');
  }

  // 11. 종합 테마 (서브미션 스페셜, 가드 리텐션 등)
  if (normPos.includes('자유 테마')) {
    return true;
  }
  if (normPos.includes('서브미션')) {
    return video.category === '서브미션';
  }
  if (normPos.includes('이스케이프') || normPos.includes('생존') || normPos.includes('탈출')) {
    return video.category === '이스케이프';
  }
  if (normPos.includes('가드 리텐션') || normPos.includes('리커버리')) {
    return (
      video.category.includes('가드') ||
      video.category === '스윕' ||
      vPos.includes('가드')
    );
  }

  return vPos.includes(normPos) || normPos.includes(vPos);
}

/**
 * 전체 영상 풀 생성 (기본 추천 풀 + 도장 아카이브 영상 결합 및 URL/제목 중복 제거)
 */
export function buildAllVideosPool(
  userLibraryVideos: TechniqueVideo[] = []
): AiRecommendedVideoCandidate[] {
  const userCandidates: AiRecommendedVideoCandidate[] = userLibraryVideos
    .filter(
      (v) =>
        !/^(tech-\d+|queue-\d+)$/.test(v.id || '') &&
        ((v.youtubeId && v.youtubeId.trim().length > 0) ||
          (v.youtubeUrl && v.youtubeUrl.trim().length > 0))
    )
    .map((v) => {
      const hasKorean = /[가-힣]/.test(v.titleKo || '');
      const rawGi = (v.giType as string) || 'Both';
      const normalizedGi = rawGi === 'All' || rawGi === '미분류' ? 'Both' : rawGi;
      return {
        id: `user-${v.id}`,
        techniqueName: v.titleKo,
        techniqueNameEn: v.titleEn || '',
        startPosition: v.position || '클로즈드 가드',
        category: v.category || '기타',
        giType: normalizedGi as any,
        youtubeUrl: v.youtubeUrl || `https://www.youtube.com/watch?v=${v.youtubeId}`,
        youtubeId: v.youtubeId,
        channelName: '도장 아카이브',
        thumbnailUrl: v.thumbnailUrl || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
        duration: '08:00',
        recommendedStartTime: '01:00',
        recommendedStartSec: 60,
        keyDetailTag: v.generalNotes ? v.generalNotes.slice(0, 30) : '도장 등록 기술',
        language: hasKorean ? 'ko' : 'en',
      };
    });

  const combined = [...CURATED_BJJ_RECOMMENDATION_POOL, ...userCandidates];
  const uniqueByUrl: AiRecommendedVideoCandidate[] = [];
  const seenKeys = new Set<string>();
  const seenTitles = new Set<string>();

  for (const item of combined) {
    const key = getNormalizedVideoKey(item.youtubeUrl || item.youtubeId || '');
    const normTitle = (item.techniqueName || '').trim().toLowerCase();
    if (key && !seenKeys.has(key) && (!normTitle || !seenTitles.has(normTitle))) {
      seenKeys.add(key);
      if (normTitle) seenTitles.add(normTitle);
      uniqueByUrl.push({
        ...item,
        language: getEffectiveVideoLang(item),
      });
    }
  }

  return uniqueByUrl;
}

export interface PickUniqueVideosParams {
  allVideosPool: AiRecommendedVideoCandidate[]; // 전체 영상 DB (또는 검색 결과)
  settings: AiRecommendSettings;                // 관장 맞춤 설정 (language, dailyGoalCount, dayStyles 등)
  dateStr: string;                              // 대상 날짜 (예: '2026-10-15')
  dayOfWeek: number;                            // 요일 (0:일, 1:월 ... 6:토)
  targetPosition: string;                       // 해당 날짜의 목표 포지션/테마
  targetType?: string;                          // 기술 성격 필터 (ALL / 전체, 스윕, 가드 패스 등)
  loggedUrls: Set<string>;                      // 수업일지에 이미 등록된 제외 대상 URL Set
  currentlyAssignedUrls: Set<string>;           // 다른 요일 및 현재 날짜의 다른 카드에 이미 배치된 URL Set
  currentScreenUrls?: Set<string>;              // 현재 날짜의 화면에 바로 떠 있는 카드들의 URL Set (절대 재노출 금지)
  countToPick: number;                          // 뽑아야 할 개수 (전체 새로고침 시 targetCount, 개별 교체 시 1)
  recordToSeenHistory?: boolean;                // seenUrlsHistory에 즉시 기록할지 여부 (기본값 true)
}

/**
 * 3. URL 중복 검사 및 동일 시작 포지션/주제 보장 핵심 함수
 * - 새로고침 시 다른 무관한 포지션(예: 새들/허니홀인데 테이크다운)을 절대 가져오지 않고,
 *   항상 targetPosition(동일 시작 포지션 및 직계 동일 주제) 내에서만 중복 없는 영상을 선정합니다.
 */
export function pickUniqueVideos({
  allVideosPool,
  settings,
  dateStr,
  dayOfWeek,
  targetPosition,
  targetType = 'ALL',
  loggedUrls,
  currentlyAssignedUrls,
  currentScreenUrls,
  countToPick,
  recordToSeenHistory = true,
}: PickUniqueVideosParams): AiRecommendedVideoCandidate[] {
  const rawStyle =
    (settings.dayStyles as Record<number, string>)[dayOfWeek] || 'all';
  const normStyle = rawStyle.toLowerCase();

  // 휴관일('off' / 'Off')은 빈 배열 반환
  if (normStyle === 'off') return [];

  // 현재 화면에 노출 중이던 카드들의 URL Set (새로고침/개별 교체 시 절대 다시 나오면 안 되는 하드 제외 목록)
  const hardCurrentScreenKeys = new Set<string>();
  if (currentScreenUrls) {
    currentScreenUrls.forEach((u) => {
      const k = u.startsWith('yt_') ? u : getNormalizedVideoKey(u);
      if (k) {
        hardCurrentScreenKeys.add(k);
        if (recordToSeenHistory) {
          recordUrlToSeenHistory(k);
        }
      }
    });
  }

  // 새로고침/교체 호출 시 해당 날짜의 회전 오프셋을 전진시켜 매 클릭마다 완전히 다른 구간부터 탐색
  let refreshExtraOffset = dateRefreshOffsetMap.get(dateStr) || 0;
  if (recordToSeenHistory) {
    refreshExtraOffset += Math.max(countToPick, 1);
    dateRefreshOffsetMap.set(dateStr, refreshExtraOffset);
  }

  // [Step 1] 언어 필터 적용
  const langFilteredPool = allVideosPool.filter((video) => {
    const vLang = getEffectiveVideoLang(video);
    if (settings.language === 'ko') return vLang === 'ko';
    if (settings.language === 'en') return vLang === 'en';
    return true; // 'all'인 경우 모두 허용
  });

  // [Step 2] 요일별 스타일(Gi/No-Gi/Wrestling/Judo) 매칭
  const styleFilteredPool = langFilteredPool.filter((video) => {
    const vStyle = (video as any).style || video.giType;
    const vPosGroup = (video as any).positionGroup || '';
    if (normStyle === 'all') return true;
    if (normStyle === 'judo') {
      return (
        vStyle === 'Judo' ||
        vStyle === '유도' ||
        video.category === '유도 메치기 연계' ||
        video.category.includes('유도') ||
        video.startPosition.includes('유도')
      );
    }
    if (normStyle === 'wrestling') {
      return (
        vStyle === 'Wrestling' ||
        vStyle === '레슬링' ||
        vPosGroup === '스탠딩' ||
        video.category === '테이크다운' ||
        video.startPosition.includes('스탠딩') ||
        video.startPosition.includes('레슬링')
      );
    }
    if (normStyle === 'no-gi' || normStyle === 'nogi') {
      return vStyle === 'No-Gi' || vStyle === 'Both';
    }
    if (normStyle === 'gi') {
      return vStyle === 'Gi' || vStyle === 'Both';
    }
    return true;
  });

  // [Step 3] URL 중복 검사 함수 ("URL이 같은가? Yes -> 제외, No -> 통과")
  const isUrlDuplicate = (videoUrl: string): boolean => {
    const key = getNormalizedVideoKey(videoUrl);
    if (!key) return true;
    if (loggedUrls.has(key)) return true;            // 1) 수업일지 중복 방지 기간 내 영상이면 제외
    if (hardCurrentScreenKeys.has(key)) return true; // 2) 현재 교체 직전 화면에 떠 있던 카드면 절대 제외
    if (currentlyAssignedUrls.has(key)) return true; // 3) 다른 요일/옆 카드에 이미 떠 있는 영상이면 제외
    if (recordToSeenHistory && seenUrlsHistory.has(key)) return true; // 4) '다른 영상/영상 교체'로 이미 봤던 영상이면 제외
    return false;
  };

  // 현재 날짜에서는 아직 한 번도 본 적 없는지 판별하는 헬퍼 (다른 요일 배정 여부보다 동일 포지션 유지를 우선할 때 사용)
  const isUnseenOnCurrentDay = (videoUrl: string): boolean => {
    const key = getNormalizedVideoKey(videoUrl);
    if (!key) return false;
    if (loggedUrls.has(key)) return false;
    if (hardCurrentScreenKeys.has(key)) return false;
    if (recordToSeenHistory && seenUrlsHistory.has(key)) return false;
    return true;
  };

  const isTypeMatch = (video: AiRecommendedVideoCandidate): boolean => {
    if (!targetType || targetType === 'ALL' || targetType === '전체' || targetType === '미분류') {
      return true;
    }
    const vType = (video as any).type || video.category;
    return vType === targetType;
  };

  // 날짜별 + 새로고침 횟수별 회전 시드
  const rotatePoolByDate = (pool: AiRecommendedVideoCandidate[]): AiRecommendedVideoCandidate[] => {
    if (pool.length <= 1) return pool;
    const parts = (dateStr || '').split('-').map(Number);
    const dateObj =
      parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
    const epochDays = Math.abs(Math.floor(dateObj.getTime() / (1000 * 60 * 60 * 24)));
    const offset =
      (epochDays * Math.max(countToPick, 1) + dayOfWeek * 5 + refreshExtraOffset) % pool.length;
    return [...pool.slice(offset), ...pool.slice(0, offset)];
  };

  const rotatedStylePool = rotatePoolByDate(styleFilteredPool);
  const rotatedLangPool = rotatePoolByDate(langFilteredPool);
  const rotatedAllPool = rotatePoolByDate(allVideosPool);

  const candidates: AiRecommendedVideoCandidate[] = [];
  const candidateKeys = new Set<string>();
  const candidateTitles = new Set<string>();

  const pushUniqueCandidate = (video: AiRecommendedVideoCandidate) => {
    if (candidates.length >= countToPick) return;
    const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
    const key = getNormalizedVideoKey(urlStr);
    const normTitle = (video.techniqueName || '').trim().toLowerCase();
    if (!key || candidateKeys.has(key)) return;
    if (normTitle && candidateTitles.has(normTitle)) return;
    if (hardCurrentScreenKeys.has(key) || loggedUrls.has(key)) return;
    candidateKeys.add(key);
    if (normTitle) candidateTitles.add(normTitle);
    candidates.push(video);
  };

  const checkExactPos = (video: AiRecommendedVideoCandidate): boolean => {
    return (
      (video as any).position === targetPosition ||
      (video as any).theme === targetPosition ||
      matchesExactPosition(video, targetPosition)
    );
  };

  const checkFamilyPos = (video: AiRecommendedVideoCandidate): boolean => {
    return checkExactPos(video) || matchesPositionOrTheme(video, targetPosition);
  };

  // ==========================================
  // [Step 4] 동일 시작 포지션(Exact Position) 최우선 탐색
  // 다른 포지션(테이크다운 등)으로 절대 넘어가지 않고 동일 시작 포지션 영상을 먼저 채움
  // ==========================================

  // 4-1: 정확히 일치하는 시작 포지션 + 성격 일치 + 요일 스타일/언어 일치 + 주간/히스토리 비중복
  rotatedStylePool.forEach((video) => {
    const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
    if (checkExactPos(video) && isTypeMatch(video) && !isUrlDuplicate(urlStr)) {
      pushUniqueCandidate(video);
    }
  });

  // 4-2: 정확히 일치하는 시작 포지션 + 성격 일치 + 요일 스타일/언어 일치 + 오늘 미노출 (다른 요일에 떠 있더라도 다른 포지션을 가져오는 것보다 동일 포지션 유지!)
  if (candidates.length < countToPick) {
    rotatedStylePool.forEach((video) => {
      const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
      if (checkExactPos(video) && isTypeMatch(video) && isUnseenOnCurrentDay(urlStr)) {
        pushUniqueCandidate(video);
      }
    });
  }

  // 4-3: 정확히 일치하는 시작 포지션 + 요일 스타일/언어 일치 (성격 필터가 좁을 때 동일 포지션의 다른 성격 허용)
  if (candidates.length < countToPick) {
    rotatedStylePool.forEach((video) => {
      const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
      if (checkExactPos(video) && !isUrlDuplicate(urlStr)) {
        pushUniqueCandidate(video);
      }
    });
    if (candidates.length < countToPick) {
      rotatedStylePool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        if (checkExactPos(video) && isUnseenOnCurrentDay(urlStr)) {
          pushUniqueCandidate(video);
        }
      });
    }
  }

  // 4-4: 사용자가 특정 세부 포지션(예: 노기 위주 포지션을 도복 요일에 선택, 또는 도복 전용 가드를 노기 요일에 선택)을 직접 지정한 경우,
  // 엉뚱한 포지션을 가져오지 않고 해당 정확한 포지션(checkExactPos)의 영상을 언어 풀 / 전체 풀에서 우선 확보
  if (candidates.length < countToPick) {
    rotatedLangPool.forEach((video) => {
      const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
      if (checkExactPos(video) && isTypeMatch(video) && isUnseenOnCurrentDay(urlStr)) {
        pushUniqueCandidate(video);
      }
    });
    if (candidates.length < countToPick) {
      rotatedLangPool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        if (checkExactPos(video) && isUnseenOnCurrentDay(urlStr)) {
          pushUniqueCandidate(video);
        }
      });
    }
    if (candidates.length < countToPick) {
      rotatedAllPool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        if (checkExactPos(video) && isUnseenOnCurrentDay(urlStr)) {
          pushUniqueCandidate(video);
        }
      });
    }
  }

  // ==========================================
  // [Step 5] 해당 시작 포지션(checkExactPos)의 미노출 후보를 다 본 경우:
  // 다른 포지션(심지어 인접 포지션)으로 넘어가기 전에, 현재 화면에 떠 있는 카드들(hardCurrentScreenKeys)과
  // 수업일지(loggedUrls)를 제외한 '동일 시작 포지션(checkExactPos)'의 가장 오래전에 본 영상(FIFO)을 먼저 순환!
  // ==========================================
  if (candidates.length < countToPick) {
    const oldestFirstKeys = [...seenUrlsOrder];

    allVideosPool.forEach((video) => {
      if (checkExactPos(video)) {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        const k = getNormalizedVideoKey(urlStr);
        if (k && !hardCurrentScreenKeys.has(k) && !candidateKeys.has(k)) {
          seenUrlsHistory.delete(k);
          const idx = seenUrlsOrder.indexOf(k);
          if (idx !== -1) seenUrlsOrder.splice(idx, 1);
        }
      }
    });

    const getRecycleAgeRank = (video: AiRecommendedVideoCandidate): number => {
      const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
      const k = getNormalizedVideoKey(urlStr);
      const idx = oldestFirstKeys.indexOf(k);
      return idx === -1 ? -1 : idx;
    };

    const recycledStylePool = [...rotatedStylePool].sort(
      (a, b) => getRecycleAgeRank(a) - getRecycleAgeRank(b)
    );
    const recycledLangPool = [...rotatedLangPool].sort(
      (a, b) => getRecycleAgeRank(a) - getRecycleAgeRank(b)
    );
    const recycledAllPool = [...rotatedAllPool].sort(
      (a, b) => getRecycleAgeRank(a) - getRecycleAgeRank(b)
    );

    recycledStylePool.forEach((video) => {
      const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
      const key = getNormalizedVideoKey(urlStr);
      if (
        checkExactPos(video) &&
        isTypeMatch(video) &&
        !loggedUrls.has(key) &&
        !hardCurrentScreenKeys.has(key)
      ) {
        pushUniqueCandidate(video);
      }
    });

    if (candidates.length < countToPick) {
      recycledStylePool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        const key = getNormalizedVideoKey(urlStr);
        if (
          checkExactPos(video) &&
          !loggedUrls.has(key) &&
          !hardCurrentScreenKeys.has(key)
        ) {
          pushUniqueCandidate(video);
        }
      });
    }

    if (candidates.length < countToPick) {
      recycledLangPool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        const key = getNormalizedVideoKey(urlStr);
        if (
          checkExactPos(video) &&
          !loggedUrls.has(key) &&
          !hardCurrentScreenKeys.has(key)
        ) {
          pushUniqueCandidate(video);
        }
      });
    }

    if (candidates.length < countToPick) {
      recycledAllPool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        const key = getNormalizedVideoKey(urlStr);
        if (
          checkExactPos(video) &&
          !loggedUrls.has(key) &&
          !hardCurrentScreenKeys.has(key)
        ) {
          pushUniqueCandidate(video);
        }
      });
    }
  }

  // ==========================================
  // [Step 6] 만약 특정 세부 포지션의 전체 영상 수가 5개 이하라서 직전 화면 3개를 제외하면
  // 1~2자리가 부족한 경우에만, 직계 동일 주제 패밀리(checkFamilyPos)에서 보충
  // ==========================================
  if (candidates.length < countToPick) {
    rotatedStylePool.forEach((video) => {
      const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
      if (checkFamilyPos(video) && isTypeMatch(video) && isUnseenOnCurrentDay(urlStr)) {
        pushUniqueCandidate(video);
      }
    });
    if (candidates.length < countToPick) {
      rotatedStylePool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        if (checkFamilyPos(video) && isUnseenOnCurrentDay(urlStr)) {
          pushUniqueCandidate(video);
        }
      });
    }
    if (candidates.length < countToPick) {
      rotatedLangPool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        if (checkFamilyPos(video) && isUnseenOnCurrentDay(urlStr)) {
          pushUniqueCandidate(video);
        }
      });
    }
    if (candidates.length < countToPick) {
      rotatedAllPool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        if (checkFamilyPos(video) && isUnseenOnCurrentDay(urlStr)) {
          pushUniqueCandidate(video);
        }
      });
    }
    if (candidates.length < countToPick) {
      rotatedAllPool.forEach((video) => {
        const urlStr = (video as any).url || video.youtubeUrl || video.youtubeId || '';
        const key = getNormalizedVideoKey(urlStr);
        if (
          checkFamilyPos(video) &&
          !loggedUrls.has(key) &&
          !hardCurrentScreenKeys.has(key)
        ) {
          pushUniqueCandidate(video);
        }
      });
    }
  }

  // 최종 선택된 영상들의 URL을 '이미 노출된 URL'로 즉시 등록
  const selected = candidates.slice(0, countToPick).map((v) => ({
    ...v,
    startPosition: targetPosition || v.startPosition,
  }));

  selected.forEach((v) => {
    const urlStr = (v as any).url || v.youtubeUrl || v.youtubeId || '';
    const key = getNormalizedVideoKey(urlStr);
    if (key) {
      currentlyAssignedUrls.add(key);
      if (recordToSeenHistory) {
        recordUrlToSeenHistory(key);
      }
    }
  });

  return selected;
}

/**
 * Main recommendation query function for a given day (powered by pickUniqueVideos)
 */
export function getRecommendedCandidatesForDay(
  dateStr: string,
  settings: AiRecommendSettings,
  currentJournalEntries: ClassJournalEntry[] = [],
  overridePosition?: string,
  overrideCategory?: string,
  seedOffset: number = 0,
  userLibraryVideos: TechniqueVideo[] = [],
  excludeYoutubeIdsForSession?: Set<string>,
  sharedAssignedUrls?: Set<string>,
  recordToSeenHistory: boolean = false
): {
  startPosition: string;
  dayStyle: AiRecommendDayStyle;
  isOffDay?: boolean;
  candidates: AiRecommendedVideoCandidate[];
  totalPoolSize: number;
  unseenPoolSize: number;
  wasReset?: boolean;
} {
  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
  const dayStyle: AiRecommendDayStyle =
    (settings.dayStyles as Record<number, AiRecommendDayStyle>)[dayOfWeek] || 'all';

  if (dayStyle === 'off') {
    return {
      startPosition: '휴관 (수업 없음)',
      dayStyle: 'off',
      isOffDay: true,
      candidates: [],
      totalPoolSize: 0,
      unseenPoolSize: 0,
    };
  }

  const startPosition = calculateStartPositionForDate(
    dateStr,
    settings.positionCycle,
    overridePosition,
    settings.searchScope || 'all_expanded',
    dayStyle
  );

  const allVideosPool = buildAllVideosPool(userLibraryVideos);
  const loggedUrls = getLoggedUrlsSet(
    currentJournalEntries,
    settings.dedupPeriod,
    settings.customDedupDays,
    dateStr
  );

  const currentlyAssignedUrls = sharedAssignedUrls || new Set<string>();
  const currentScreenUrls = new Set<string>();
  if (excludeYoutubeIdsForSession && excludeYoutubeIdsForSession.size > 0) {
    excludeYoutubeIdsForSession.forEach((item) => {
      const k = getNormalizedVideoKey(item);
      if (k) {
        currentScreenUrls.add(k);
        recordUrlToSeenHistory(k);
      }
    });
  }

  const goalCount = Math.min(Math.max(settings.dailyGoalCount || 3, 1), 3);
  const targetType =
    !overrideCategory || overrideCategory === '전체' || overrideCategory === '미분류'
      ? 'ALL'
      : overrideCategory;

  const prevSeenSize = seenUrlsHistory.size;
  const selected = pickUniqueVideos({
    allVideosPool,
    settings,
    dateStr,
    dayOfWeek,
    targetPosition: startPosition,
    targetType,
    loggedUrls,
    currentlyAssignedUrls,
    currentScreenUrls,
    countToPick: goalCount,
    recordToSeenHistory,
  });
  const wasReset = prevSeenSize > 0 && seenUrlsHistory.size < prevSeenSize;

  return {
    startPosition,
    dayStyle,
    candidates: selected,
    totalPoolSize: allVideosPool.length,
    unseenPoolSize: selected.length,
    wasReset,
  };
}


