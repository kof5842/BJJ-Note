import { MetadataConfig, PositionFolder, SubmissionCompassGroup } from '../types';

export interface BjjTaxonomySection {
  id: string;
  category: 'takedown' | 'pass' | 'sweep' | 'escape' | 'upper_sub' | 'lower_sub' | 'positions';
  title: string;
  badge: string;
  description: string;
  iconName: string;
  items: Array<{
    name: string;
    nameEn?: string;
    alias?: string;
    targetSubGroup?: 'choke' | 'armlock' | 'leglock' | 'compression';
  }>;
}

export interface CategoryFolderGroup {
  id: string;
  name: string;
  badge: string;
  description: string;
  items: string[];
}

export const STANDARD_CATEGORY_GROUPS: CategoryFolderGroup[] = [
  {
    id: 'cat-grp-takedown',
    name: '테이크다운',
    badge: '7종',
    description: '스탠딩 및 클린치에서 상대를 바닥으로 넘기는 기술',
    items: [
      '싱글렉 테이크다운',
      '더블렉 테이크다운',
      '바디락 테이크다운',
      '앵클 픽',
      '메치기/업어치기 류',
      '발목 받치기 / 후리기',
      '스프롤 & 테이크다운 방어',
    ],
  },
  {
    id: 'cat-grp-pass',
    name: '가드 패스',
    badge: '14종',
    description: '상대의 가드를 무력화하고 상위 포지션으로 진입하는 기술',
    items: [
      '니 슬라이드 / 니컷 패스',
      '토레안도 패스',
      '롱 스텝 패스',
      '폴딩 / 스매시 패스',
      '바디락 패스',
      '레그 드랙 패스',
      '싱글/더블 언더 패스',
      '오버 언더 패스',
      'X 패스',
      '백스텝 패스',
      '카트휠 패스',
      '스텝 오버 / 기무라 트랩 패스',
      '레그 위브 / 레그 레이스',
      '루오톨로식 버즈소우 패스',
    ],
  },
  {
    id: 'cat-grp-sweep',
    name: '스윕',
    badge: '12종',
    description: '하위 포지션에서 상대를 뒤집어 상위로 전환하는 기술',
    items: [
      '힙 범프 스윕',
      '시저스 스윕',
      '플라워 / 펜듈럼 스윕',
      '럼버잭 스윕',
      '훅 / 버터플라이 스윕',
      '엘리베이터 스윕',
      '기무라 스윕',
      '트라이포드 스윕',
      '싱글렉X / X가드 스윕',
      '데라히바 스윕',
      '라쏘 스윕',
      '락다운 스윕 / 일렉트릭 체어 스윕',
    ],
  },
  {
    id: 'cat-grp-escape',
    name: '이스케이프 & 리커버리',
    badge: '8종',
    description: '불리한 포지션 탈출 및 가드 방어벽 복구 기술',
    items: [
      '힙 이스케이프 / 새우빼기',
      '우파 / 브릿지 이스케이프',
      '프레이밍 / 펌멜링',
      '그라나비 롤',
      '숄더 롤 / 인버티드 리커버리',
      '레그 크로스',
      '하프가드 복구',
      '터틀 이스케이프',
    ],
  },
  {
    id: 'cat-grp-core',
    name: '기타',
    badge: '4종',
    description: '백 테이크, 트랜지션, 카운터, 가드 리텐션 등 기타 속성',
    items: [
      '백 테이크',
      '트랜지션',
      '카운터',
      '가드 리텐션 & 리커버리',
    ],
  },
];

export const ALL_ACTION_TECHNIQUES = Array.from(
  new Set(['미분류', ...STANDARD_CATEGORY_GROUPS.flatMap((g) => g.items)])
);

export const BJJ_CORE_TAXONOMY: BjjTaxonomySection[] = [
  {
    id: 'sec-positions-standing',
    category: 'positions',
    title: '스탠딩',
    badge: '허브 포지션 2종',
    description: '스탠딩 및 오픈 그립, 클린치 상황',
    iconName: 'User',
    items: [
      { name: '스탠딩 / 오픈 그립', nameEn: 'Standing / Open Grip' },
      { name: '레슬링 클린치 / 타이업', nameEn: 'Wrestling Clinch / Tie-up' },
    ],
  },
  {
    id: 'sec-positions-other',
    category: 'positions',
    title: '기타',
    badge: '허브 포지션 4종',
    description: '터틀, 트럭, 아시 가라미 및 하체 엔탱글먼트',
    iconName: 'Shield',
    items: [
      { name: '터틀 포지션', nameEn: 'Turtle Position' },
      { name: '트럭 (The Truck)', nameEn: 'The Truck' },
      { name: '아시 가라미 / 스탠다드 아시', nameEn: 'Ashi Garami / Standard Ashi' },
      { name: '새들 / 411 / 허니홀', nameEn: 'Saddle / 411 / Honey Hole' },
    ],
  },
  {
    id: 'sec-positions-dominant',
    category: 'positions',
    title: '탑 & 도미넌트 (상위)',
    badge: '상위 포지션 8종',
    description: '상대를 제압하는 강력한 상위 컨트롤 포지션',
    iconName: 'Crown',
    items: [
      { name: '마운트', nameEn: 'Full Mount' },
      { name: '백 마운트 / 백 컨트롤', nameEn: 'Back Mount / Back Control' },
      { name: '사이드 컨트롤', nameEn: 'Side Control' },
      { name: '니온밸리', nameEn: 'Knee on Belly' },
      { name: '노스 사우스 컨트롤', nameEn: 'North-South Control' },
      { name: '곁누르기 / 케사 가타메', nameEn: 'Kesa Gatame / Scarf Hold' },
      { name: '크루시픽스', nameEn: 'Crucifix' },
      { name: '헤드쿼터', nameEn: 'Headquarters / HQ' },
    ],
  },
  {
    id: 'sec-positions-guard',
    category: 'positions',
    title: '가드 포지션 (하위)',
    badge: '하위 가드 23종',
    description: '하위 포지션에서 전개하는 다양한 가드 프레임',
    iconName: 'Shield',
    items: [
      { name: '클로즈드 가드', nameEn: 'Closed Guard' },
      { name: '하프 가드', nameEn: 'Half Guard' },
      { name: '딥 하프 가드', nameEn: 'Deep Half Guard' },
      { name: '리버스 하프 가드', nameEn: 'Reverse Half Guard' },
      { name: 'Z-가드 / 니 쉴드', nameEn: 'Z-Guard / Knee Shield' },
      { name: '록다운', nameEn: 'Lockdown' },
      { name: '버터플라이 가드', nameEn: 'Butterfly Guard' },
      { name: '칼라 앤 슬리브 가드', nameEn: 'Collar & Sleeve Guard' },
      { name: '싱글렉 X 가드', nameEn: 'Single Leg X Guard / SLX' },
      { name: 'X 가드', nameEn: 'X-Guard' },
      { name: '더블렉 X 가드', nameEn: 'Double Leg X Guard' },
      { name: '데라히바 가드', nameEn: 'De La Riva Guard' },
      { name: '리버스 데라히바 가드', nameEn: 'Reverse De La Riva Guard / RDLR' },
      { name: 'K-가드', nameEn: 'K-Guard' },
      { name: '스파이더 가드', nameEn: 'Spider Guard' },
      { name: '라쏘 가드', nameEn: 'Lasso Guard' },
      { name: '러버 가드', nameEn: 'Rubber Guard' },
      { name: '웜가드', nameEn: 'Worm Guard' },
      { name: '스퀴드 가드', nameEn: 'Squid Guard' },
      { name: '신투신 가드', nameEn: 'Shin-to-Shin Guard' },
      { name: '50/50 가드', nameEn: '50/50 Guard' },
      { name: '싯업 가드', nameEn: 'Sit-up Guard' },
      { name: '기타 가드 (옥토퍼스 / 맨티스 / 동키 / 시저스 가드 등)', nameEn: 'Others (Octopus, Mantis, Donkey, Scissors)' },
    ],
  },
  {
    id: 'sec-takedown',
    category: 'takedown',
    title: '테이크다운',
    badge: '스탠딩 기술 7종',
    description: '스탠딩 및 클린치 상황에서 상대를 바닥으로 넘기는 동작',
    iconName: 'Zap',
    items: [
      { name: '싱글렉 테이크다운', nameEn: 'Single Leg Takedown' },
      { name: '더블렉 테이크다운', nameEn: 'Double Leg Takedown' },
      { name: '바디락 테이크다운', nameEn: 'Body Lock Takedown' },
      { name: '앵클 픽', nameEn: 'Ankle Pick' },
      { name: '메치기/업어치기 류', nameEn: 'Judo Throws (Seoi Nage, Uchi Mata)' },
      { name: '발목 받치기 / 후리기', nameEn: 'Trips & Sweeps (Osoto Gari, Foot Sweeps)' },
      { name: '스프롤 & 테이크다운 방어', nameEn: 'Sprawl & Takedown Defense' },
    ],
  },
  {
    id: 'sec-pass',
    category: 'pass',
    title: '가드 패스',
    badge: '돌파 기술 14종',
    description: '상대의 가드를 돌파하여 상위 포지션을 점유하는 기술',
    iconName: 'Zap',
    items: [
      { name: '니 슬라이드 / 니컷 패스', nameEn: 'Knee Slide / Knee Cut Pass' },
      { name: '토레안도 패스', nameEn: 'Toreando Pass' },
      { name: '롱 스텝 패스', nameEn: 'Long Step Pass' },
      { name: '폴딩 / 스매시 패스', nameEn: 'Folding / Smash Pass' },
      { name: '바디락 패스', nameEn: 'Body Lock Pass' },
      { name: '레그 드랙 패스', nameEn: 'Leg Drag Pass' },
      { name: '싱글/더블 언더 패스', nameEn: 'Single / Double Under Pass' },
      { name: '오버 언더 패스', nameEn: 'Over Under Pass' },
      { name: 'X 패스', nameEn: 'X-Pass' },
      { name: '백스텝 패스', nameEn: 'Backstep Pass' },
      { name: '카트휠 패스', nameEn: 'Cartwheel Pass' },
      { name: '스텝 오버 / 기무라 트랩 패스', nameEn: 'Step Over / Kimura Trap Pass' },
      { name: '레그 위브 / 레그 레이스', nameEn: 'Leg Weave / Lace' },
      { name: '루오톨로식 버즈소우 패스', nameEn: 'Ruotolo Buzzsaw Pass' },
    ],
  },
  {
    id: 'sec-sweep',
    category: 'sweep',
    title: '스윕',
    badge: '공수 전환 12종',
    description: '하위 포지션에서 상위를 뒤집는 반격 기법',
    iconName: 'RefreshCw',
    items: [
      { name: '힙 범프 스윕', nameEn: 'Hip Bump Sweep' },
      { name: '시저스 스윕', nameEn: 'Scissors Sweep' },
      { name: '플라워 / 펜듈럼 스윕', nameEn: 'Flower / Pendulum Sweep' },
      { name: '럼버잭 스윕', nameEn: 'Lumberjack Sweep' },
      { name: '훅 / 버터플라이 스윕', nameEn: 'Hook / Butterfly Sweep' },
      { name: '엘리베이터 스윕', nameEn: 'Elevator Sweep' },
      { name: '기무라 스윕', nameEn: 'Kimura Sweep' },
      { name: '트라이포드 스윕', nameEn: 'Tripod Sweep' },
      { name: '싱글렉X / X가드 스윕', nameEn: 'SLX / X-Guard Sweeps' },
      { name: '데라히바 스윕', nameEn: 'De La Riva Sweep' },
      { name: '라쏘 스윕', nameEn: 'Lasso Sweep' },
      { name: '락다운 스윕 / 일렉트릭 체어 스윕', nameEn: 'Lockdown / Electric Chair Sweep' },
    ],
  },
  {
    id: 'sec-escape',
    category: 'escape',
    title: '이스케이프 & 디펜스',
    badge: '방어 및 탈출 8종',
    description: '불리한 포지션을 탈출하거나 가드를 복구하는 방어 기술',
    iconName: 'LogOut',
    items: [
      { name: '힙 이스케이프 / 새우빼기', nameEn: 'Hip Escape / Shrimp' },
      { name: '우파 / 브릿지 이스케이프', nameEn: 'Upa / Bridge Escape' },
      { name: '프레이밍 / 펌멜링', nameEn: 'Framing / Pummeling' },
      { name: '그라나비 롤', nameEn: 'Granby Roll' },
      { name: '숄더 롤 / 인버티드 리커버리', nameEn: 'Shoulder Roll / Inverted Recovery' },
      { name: '레그 크로스', nameEn: 'Leg Cross' },
      { name: '하프가드 복구', nameEn: 'Half Guard Recovery' },
      { name: '터틀 이스케이프', nameEn: 'Turtle Escape' },
    ],
  },
  {
    id: 'sec-upper-sub',
    category: 'upper_sub',
    title: '상체 관절기 및 조르기',
    badge: '상체 피니시 27종',
    description: '상체관절기 및 초크 피니시',
    iconName: 'Flame',
    items: [
      { name: '크로스 칼라 초크', nameEn: 'Cross Collar Choke', targetSubGroup: 'choke' },
      { name: '페이퍼커터 초크', nameEn: 'Paper Cutter Choke', targetSubGroup: 'choke' },
      { name: '보우 앤 애로우 초크', nameEn: 'Bow and Arrow Choke', targetSubGroup: 'choke' },
      { name: '클락 초크', nameEn: 'Clock Choke', targetSubGroup: 'choke' },
      { name: '리어 네이키드 초크 / RNC', nameEn: 'Rear Naked Choke (RNC)', targetSubGroup: 'choke' },
      { name: '트라이앵글 초크', nameEn: 'Triangle Choke', targetSubGroup: 'choke' },
      { name: '리버스 트라이앵글 초크', nameEn: 'Reverse Triangle Choke', targetSubGroup: 'choke' },
      { name: '암 트라이앵글 초크', nameEn: 'Arm Triangle Choke', targetSubGroup: 'choke' },
      { name: '다스 초크', nameEn: 'D\'Arce Choke', targetSubGroup: 'choke' },
      { name: '아나콘다 초크', nameEn: 'Anaconda Choke', targetSubGroup: 'choke' },
      { name: '길로틴 초크', nameEn: 'Guillotine Choke', targetSubGroup: 'choke' },
      { name: '페루비안 넥타이', nameEn: 'Peruvian Necktie', targetSubGroup: 'choke' },
      { name: '재패니즈 넥타이', nameEn: 'Japanese Necktie', targetSubGroup: 'choke' },
      { name: '이제키엘 초크', nameEn: 'Ezekiel Choke', targetSubGroup: 'choke' },
      { name: '노스 사우스 초크', nameEn: 'North-South Choke', targetSubGroup: 'choke' },
      { name: '베이스볼 배트 초크', nameEn: 'Baseball Bat Choke', targetSubGroup: 'choke' },
      { name: '루프 초크', nameEn: 'Loop Choke', targetSubGroup: 'choke' },
      { name: '고고플라타', nameEn: 'Gogoplata', targetSubGroup: 'choke' },
      { name: '버기 초크', nameEn: 'Buggy Choke', targetSubGroup: 'choke' },
      { name: '암바', nameEn: 'Armbar / Juji Gatame', targetSubGroup: 'armlock' },
      { name: '기무라', nameEn: 'Kimura', targetSubGroup: 'armlock' },
      { name: '아메리카나', nameEn: 'Americana', targetSubGroup: 'armlock' },
      { name: '스트레이트 암락', nameEn: 'Straight Armlock', targetSubGroup: 'armlock' },
      { name: '오모플라타', nameEn: 'Omoplata', targetSubGroup: 'armlock' },
      { name: '바랏플라타', nameEn: 'Baratoplata', targetSubGroup: 'armlock' },
      { name: '타릭플라타', nameEn: 'Tarikoplata', targetSubGroup: 'armlock' },
      { name: '리스트락', nameEn: 'Wristlock', targetSubGroup: 'armlock' },
    ],
  },
  {
    id: 'sec-lower-sub',
    category: 'lower_sub',
    title: '하체 관절기 및 슬라이서',
    badge: '하체/슬라이서 14종',
    description: '하체 관절기 및 압박/슬라이서 피니시',
    iconName: 'Crosshair',
    items: [
      { name: '스트레이트 앵클락', nameEn: 'Straight Ankle Lock', targetSubGroup: 'leglock' },
      { name: '아웃사이드 힐훅', nameEn: 'Outside Heel Hook', targetSubGroup: 'leglock' },
      { name: '인사이드 힐훅', nameEn: 'Inside Heel Hook', targetSubGroup: 'leglock' },
      { name: '니바', nameEn: 'Kneebar', targetSubGroup: 'leglock' },
      { name: '토홀드', nameEn: 'Toe Hold', targetSubGroup: 'leglock' },
      { name: '에스티마 락', nameEn: 'Estima Lock', targetSubGroup: 'leglock' },
      { name: '카이오 테라 풋락', nameEn: 'Caio Terra Footlock', targetSubGroup: 'leglock' },
      { name: '아오키 락', nameEn: 'Aoki Lock', targetSubGroup: 'leglock' },
      { name: '바이셉 슬라이서', nameEn: 'Bicep Slicer', targetSubGroup: 'compression' },
      { name: '카프 슬라이서', nameEn: 'Calf Slicer', targetSubGroup: 'compression' },
      { name: '바나나 스플릿', nameEn: 'Banana Split', targetSubGroup: 'compression' },
      { name: '일렉트릭 체어', nameEn: 'Electric Chair', targetSubGroup: 'compression' },
      { name: '트위스터', nameEn: 'Twister', targetSubGroup: 'compression' },
      { name: '넥 크랭크 / 캔 오프너', nameEn: 'Neck Crank / Can Opener', targetSubGroup: 'compression' },
    ],
  },
];

export const STANDARD_POSITIONS_37: PositionFolder[] = [
  { id: 'pos-p0', name: '미분류', nameEn: 'Unclassified', group: '미분류', subCategories: [...ALL_ACTION_TECHNIQUES] },
  // 1. 스탠딩 (2종)
  { id: 'pos-p1', name: '스탠딩 / 오픈 그립', nameEn: 'Standing / Open Grip', group: '스탠딩', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p2', name: '레슬링 클린치 / 타이업', nameEn: 'Wrestling Clinch / Tie-up', group: '스탠딩', subCategories: [...ALL_ACTION_TECHNIQUES] },
  // 2. 기타 (4종)
  { id: 'pos-p3', name: '터틀 포지션', nameEn: 'Turtle Position', group: '기타', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p4', name: '트럭 (The Truck)', nameEn: 'The Truck', group: '기타', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p5', name: '아시 가라미 / 스탠다드 아시', nameEn: 'Ashi Garami / Standard Ashi', group: '기타', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p6', name: '새들 / 411 / 허니홀', nameEn: 'Saddle / 411 / Honey Hole', group: '기타', subCategories: [...ALL_ACTION_TECHNIQUES] },

  // 2. 탑 & 도미넌트 (상위) (8종)
  { id: 'pos-p7', name: '마운트', nameEn: 'Full Mount', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p8', name: '백 마운트 / 백 컨트롤', nameEn: 'Back Mount / Back Control', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p9', name: '사이드 컨트롤', nameEn: 'Side Control', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p10', name: '니온밸리', nameEn: 'Knee on Belly', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p11', name: '노스 사우스 컨트롤', nameEn: 'North-South Control', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p12', name: '곁누르기 / 케사 가타메', nameEn: 'Kesa Gatame / Scarf Hold', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p13', name: '크루시픽스', nameEn: 'Crucifix', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p14', name: '헤드쿼터', nameEn: 'Headquarters / HQ', group: '탑 & 도미넌트 (상위)', subCategories: [...ALL_ACTION_TECHNIQUES] },

  // 3. 가드 포지션 (하위) (23종)
  { id: 'pos-p15', name: '클로즈드 가드', nameEn: 'Closed Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p16', name: '하프 가드', nameEn: 'Half Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p17', name: '딥 하프 가드', nameEn: 'Deep Half Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p18', name: '리버스 하프 가드', nameEn: 'Reverse Half Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p19', name: 'Z-가드 / 니 쉴드', nameEn: 'Z-Guard / Knee Shield', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p20', name: '록다운', nameEn: 'Lockdown', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p21', name: '버터플라이 가드', nameEn: 'Butterfly Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p22', name: '칼라 앤 슬리브 가드', nameEn: 'Collar & Sleeve Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p23', name: '싱글렉 X 가드', nameEn: 'Single Leg X Guard / SLX', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p24', name: 'X 가드', nameEn: 'X-Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p25', name: '더블렉 X 가드', nameEn: 'Double Leg X Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p26', name: '데라히바 가드', nameEn: 'De La Riva Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p27', name: '리버스 데라히바 가드', nameEn: 'Reverse De La Riva Guard / RDLR', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p28', name: 'K-가드', nameEn: 'K-Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p29', name: '스파이더 가드', nameEn: 'Spider Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p30', name: '라쏘 가드', nameEn: 'Lasso Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p31', name: '러버 가드', nameEn: 'Rubber Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p32', name: '웜가드', nameEn: 'Worm Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p33', name: '스퀴드 가드', nameEn: 'Squid Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p34', name: '신투신 가드', nameEn: 'Shin-to-Shin Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p35', name: '50/50 가드', nameEn: '50/50 Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p36', name: '싯업 가드', nameEn: 'Sit-up Guard', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
  { id: 'pos-p37', name: '기타 가드 (옥토퍼스 / 맨티스 / 동키 / 시저스 가드 등)', nameEn: 'Others (Octopus, Mantis, Donkey, Scissors)', group: '가드 포지션 (하위)', subCategories: [...ALL_ACTION_TECHNIQUES] },
];

export const STANDARD_SUBMISSIONS_41: SubmissionCompassGroup[] = [
  {
    id: 'choke',
    direction: 'N',
    directionLabel: '북',
    name: '조르기 (Chokes)',
    hubTitle: '조르기 (19종)',
    items: [
      '크로스 칼라 초크',
      '페이퍼커터 초크',
      '보우 앤 애로우 초크',
      '클락 초크',
      '리어 네이키드 초크 / RNC',
      '트라이앵글 초크',
      '리버스 트라이앵글 초크',
      '암 트라이앵글 초크',
      '다스 초크',
      '아나콘다 초크',
      '길로틴 초크',
      '페루비안 넥타이',
      '재패니즈 넥타이',
      '이제키엘 초크',
      '노스 사우스 초크',
      '베이스볼 배트 초크',
      '루프 초크',
      '고고플라타',
      '버기 초크',
    ],
  },
  {
    id: 'armlock',
    direction: 'W',
    directionLabel: '서',
    name: '상체 관절기 (Upper Body Locks)',
    hubTitle: '상체 관절기 (8종)',
    items: [
      '암바',
      '기무라',
      '아메리카나',
      '스트레이트 암락',
      '오모플라타',
      '바랏플라타',
      '타릭플라타',
      '리스트락',
    ],
  },
  {
    id: 'leglock',
    direction: 'E',
    directionLabel: '동',
    name: '하체 관절기 (Leglocks)',
    hubTitle: '하체 관절기 (8종)',
    items: [
      '스트레이트 앵클락',
      '아웃사이드 힐훅',
      '인사이드 힐훅',
      '니바',
      '토홀드',
      '에스티마 락',
      '카이오 테라 풋락',
      '아오키 락',
    ],
  },
  {
    id: 'compression',
    direction: 'S',
    directionLabel: '남',
    name: '압박 및 슬라이서 (Compression & Slicers)',
    hubTitle: '압박 및 슬라이서 (6종)',
    items: [
      '바이셉 슬라이서',
      '카프 슬라이서',
      '바나나 스플릿',
      '일렉트릭 체어',
      '트위스터',
      '넥 크랭크 / 캔 오프너',
    ],
  },
];

export function getSavedCategoryGroups(): CategoryFolderGroup[] {
  try {
    const saved = localStorage.getItem('bjj_custom_category_groups');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...STANDARD_CATEGORY_GROUPS];
}

export function saveCategoryGroups(groups: CategoryFolderGroup[]): void {
  try {
    localStorage.setItem('bjj_custom_category_groups', JSON.stringify(groups));
    window.dispatchEvent(new Event('bjj_taxonomy_groups_changed'));
  } catch {
    // ignore
  }
}

/**
 * Checks if a category string belongs to a category folder group
 */
export function isCategoryInGroup(category: string, grp: CategoryFolderGroup): boolean {
  if (!category || !grp) return false;
  const trimmed = category.trim();
  if (!trimmed) return false;

  // 1. Direct item match in group items
  if (grp.items && grp.items.includes(trimmed)) return true;

  // 2. Direct group name or id match
  if (grp.name === trimmed || grp.id === trimmed) return true;

  // 3. Keyword/Domain matching based on group id
  const lowerTrimmed = trimmed.toLowerCase();
  const lowerId = (grp.id || '').toLowerCase();

  if (lowerId.includes('takedown')) {
    if (trimmed.includes('테이크다운') || lowerTrimmed.includes('takedown')) return true;
  }
  if (lowerId.includes('pass')) {
    if (trimmed.includes('패스') || lowerTrimmed.includes('pass')) return true;
  }
  if (lowerId.includes('sweep')) {
    if (trimmed.includes('스윕') || lowerTrimmed.includes('sweep')) return true;
  }
  if (lowerId.includes('escape')) {
    if (
      trimmed.includes('이스케이프') ||
      trimmed.includes('리커버리') ||
      trimmed.includes('탈출') ||
      lowerTrimmed.includes('escape') ||
      lowerTrimmed.includes('recovery')
    ) {
      return true;
    }
  }
  if (lowerId.includes('core')) {
    if (
      trimmed.includes('기타') ||
      trimmed.includes('백 테이크') ||
      trimmed.includes('트랜지션') ||
      trimmed.includes('카운터') ||
      trimmed.includes('리텐션') ||
      lowerTrimmed.includes('core')
    ) {
      return true;
    }
  }

  // 4. Substring contains group name or vice versa
  if (trimmed.includes(grp.name) || grp.name.includes(trimmed)) return true;

  return false;
}

/**
 * Automatically splits Korean and English when entered into a single input
 * (e.g. "클로즈드 가드 (Closed Guard)", "하프가드 Half Guard", "암바 / Armbar", "Triangle Choke 트라이앵글 초크")
 */
export function splitKoreanAndEnglish(input: string): { nameKo: string; nameEn: string } {
  if (!input || !input.trim()) return { nameKo: '', nameEn: '' };
  const raw = input.trim();

  // 1. Parenthetical pattern: "한글 (English)" or "English (한글)"
  const parenMatch = raw.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const part1 = parenMatch[1].trim();
    const part2 = parenMatch[2].trim();
    const hasHangul1 = /[가-힣]/.test(part1);
    const hasHangul2 = /[가-힣]/.test(part2);
    if (hasHangul1 && !hasHangul2) {
      return { nameKo: part1, nameEn: part2 };
    }
    if (!hasHangul1 && hasHangul2) {
      return { nameKo: part2, nameEn: part1 };
    }
  }

  // 2. Slash / Dash pattern: "한글 / English" or "English / 한글"
  const slashMatch = raw.match(/^([^/\-—]+)\s*[/\\-—]\s*([^/\-—]+)$/);
  if (slashMatch) {
    const part1 = slashMatch[1].trim();
    const part2 = slashMatch[2].trim();
    const hasHangul1 = /[가-힣]/.test(part1);
    const hasHangul2 = /[가-힣]/.test(part2);
    if (hasHangul1 && !hasHangul2) {
      return { nameKo: part1, nameEn: part2 };
    }
    if (!hasHangul1 && hasHangul2) {
      return { nameKo: part2, nameEn: part1 };
    }
  }

  // 3. Mixed Hangul & English text separated by space (e.g. "클로즈드 가드 Closed Guard" or "Triangle Choke 트라이앵글 초크")
  const hasHangul = /[가-힣]/.test(raw);
  const hasEnglish = /[a-zA-Z]/.test(raw);

  if (hasHangul && hasEnglish) {
    const hangulMatches = raw.match(/[가-힣0-9\s~·]+/g);
    const englishMatches = raw.match(/[a-zA-Z0-9\s'’-]+/g);

    const koPart = (hangulMatches || []).map((s) => s.trim()).filter(Boolean).join(' ').trim();
    const enPart = (englishMatches || []).map((s) => s.trim()).filter(Boolean).join(' ').trim();

    if (koPart && enPart) {
      return { nameKo: koPart, nameEn: enPart };
    }
  }

  // If purely Korean or purely English
  if (hasHangul) {
    return { nameKo: raw, nameEn: '' };
  }
  return { nameKo: raw, nameEn: raw };
}

export function getSavedCategoryGroupTitles(): Record<string, string> {
  try {
    const saved = localStorage.getItem('bjj_custom_category_group_titles');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveCategoryGroupTitles(titles: Record<string, string>): void {
  try {
    localStorage.setItem('bjj_custom_category_group_titles', JSON.stringify(titles));
    window.dispatchEvent(new Event('bjj_taxonomy_groups_changed'));
  } catch {
    // ignore
  }
}

export function getSavedPositionGroupTitles(): Record<string, string> {
  try {
    const saved = localStorage.getItem('bjj_custom_position_group_titles');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function savePositionGroupTitles(titles: Record<string, string>): void {
  try {
    localStorage.setItem('bjj_custom_position_group_titles', JSON.stringify(titles));
    window.dispatchEvent(new Event('bjj_taxonomy_groups_changed'));
  } catch {
    // ignore
  }
}

export const DEFAULT_POSITION_GROUPS = [
  '스탠딩',
  '기타',
  '탑 & 도미넌트 (상위)',
  '가드 포지션 (하위)',
];

export function getSavedPositionGroupOrder(): string[] {
  try {
    const saved = localStorage.getItem('bjj_position_groups_order');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_POSITION_GROUPS];
}

export function savePositionGroupOrder(order: string[]): void {
  try {
    localStorage.setItem('bjj_position_groups_order', JSON.stringify(order));
    window.dispatchEvent(new Event('bjj_taxonomy_groups_changed'));
  } catch {
    // ignore
  }
}

export function getSavedSubmissionGroupTitles(): Record<string, string> {
  try {
    const saved = localStorage.getItem('bjj_custom_submission_group_titles');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveSubmissionGroupTitles(titles: Record<string, string>): void {
  try {
    localStorage.setItem('bjj_custom_submission_group_titles', JSON.stringify(titles));
    window.dispatchEvent(new Event('bjj_taxonomy_groups_changed'));
  } catch {
    // ignore
  }
}

/**
 * Cleanly overwrites all metadata with the exact Technical System (37 positions, 46 action category techniques, 41 submissions)
 * without keeping any stale obsolete items.
 */
export function applyCoreTaxonomyToMetadata(current?: MetadataConfig): MetadataConfig {
  return {
    giTypes: ['Gi', 'No-Gi', 'Both', '미분류'],
    difficulties: ['미분류', '초급', '중급', '고급'],
    categories: [...ALL_ACTION_TECHNIQUES],
    positions: [...STANDARD_POSITIONS_37],
    submissions: [...STANDARD_SUBMISSIONS_41],
  };
}
