import { PositionFolder } from '../types';
import { STANDARD_POSITIONS_37 } from '../data/bjjTaxonomy';

// Position English mappings
const POSITION_EN_MAP: Record<string, string> = {};
STANDARD_POSITIONS_37.forEach((p) => {
  if (p.name) POSITION_EN_MAP[p.name] = p.nameEn || p.name;
});

// Category Group English mappings
export const CATEGORY_GROUP_EN_MAP: Record<string, string> = {
  'cat-grp-takedown': 'Takedowns',
  'cat-grp-pass': 'Guard Passes',
  'cat-grp-sweep': 'Sweeps',
  'cat-grp-escape': 'Escapes & Recovery',
  'cat-grp-core': 'Others',
  'cat-grp-submission': 'Submissions',
  '테이크다운': 'Takedowns',
  '가드 패스': 'Guard Passes',
  '스윕': 'Sweeps',
  '이스케이프 & 리커버리': 'Escapes & Recovery',
  '이스케이프': 'Escapes',
  '기타': 'Others',
  '핵심 연계 및 기타 속성': 'Others',
  '서브미션': 'Submissions',
};

// Category items English mappings
export const CATEGORY_ITEM_EN_MAP: Record<string, string> = {
  '미분류': 'Uncategorized',
  '싱글렉 테이크다운': 'Single Leg Takedown',
  '더블렉 테이크다운': 'Double Leg Takedown',
  '바디락 테이크다운': 'Bodylock Takedown',
  '앵클 픽': 'Ankle Pick',
  '메치기/업어치기 류': 'Judo Throws & Trips',
  '발목 받치기 / 후리기': 'Foot Sweeps & Reaps',
  '스프롤 & 테이크다운 방어': 'Sprawl & Takedown Defense',
  '니 슬라이드 / 니컷 패스': 'Knee Slice / Knee Cut Pass',
  '토레안도 패스': 'Toreando / Bullfighter Pass',
  '롱 스텝 패스': 'Long Step Pass',
  '폴딩 / 스매시 패스': 'Folding / Smash Pass',
  '바디락 패스': 'Bodylock Pass',
  '레그 드랙 패스': 'Leg Drag Pass',
  '싱글/더블 언더 패스': 'Single / Double Under Pass',
  '오버 언더 패스': 'Over Under Pass',
  'X 패스': 'X-Pass',
  '백스텝 패스': 'Backstep Pass',
  '카트휠 패스': 'Cartwheel Pass',
  '스텝 오버 / 기무라 트랩 패스': 'Stepover / Kimura Trap Pass',
  '레그 위브 / 레그 레이스': 'Leg Weave / Leg Lace Pass',
  '루오톨로식 버즈소우 패스': 'Ruotolo Buzzsaw Passing',
  '힙 범프 스윕': 'Hip Bump Sweep',
  '시저스 스윕': 'Scissors Sweep',
  '플라워 / 펜듈럼 스윕': 'Flower / Pendulum Sweep',
  '럼버잭 스윕': 'Lumberjack Sweep',
  '훅 / 버터플라이 스윕': 'Hook / Butterfly Sweep',
  '엘리베이터 스윕': 'Elevator Sweep',
  '기무라 스윕': 'Kimura Sweep',
  '트라이포드 스윕': 'Tripod Sweep',
  '싱글렉X / X가드 스윕': 'SLX / X-Guard Sweeps',
  '데라히바 스윕': 'De La Riva Sweep',
  '라쏘 스윕': 'Lasso Sweep',
  '락다운 스윕 / 일렉트릭 체어 스윕': 'Lockdown / Electric Chair Sweep',
  '힙 이스케이프 / 새우빼기': 'Hip Escape / Shrimp',
  '우파 / 브릿지 이스케이프': 'Upa / Bridge Escape',
  '프레이밍 / 펌멜링': 'Framing / Pummeling',
  '그라나비 롤': 'Granby Roll',
  '숄더 롤 / 인버티드 리커버리': 'Shoulder Roll / Inverted Recovery',
  '레그 크로스': 'Leg Cross',
  '하프가드 복구': 'Half Guard Recovery',
  '터틀 이스케이프': 'Turtle Escape',
  '서브미션': 'Submission',
  '백 테이크': 'Back Take',
  '트랜지션': 'Transition',
  '카운터': 'Counter',
  '가드 리텐션 & 리커버리': 'Guard Retention & Recovery',
};

// Submission group English mappings
export const SUBMISSION_GROUP_EN_MAP: Record<string, string> = {
  choke: 'Chokes',
  armlock: 'Upper Body Locks',
  leglock: 'Leglocks',
  compression: 'Compressions & Slicers',
  '조르기 (Chokes)': 'Chokes',
  '상체 관절기 (Upper Body Locks)': 'Upper Body Locks',
  '하체 관절기 (Leglocks)': 'Leglocks',
  '압박 및 슬라이서 (Compression & Slicers)': 'Compressions & Slicers',
  '조르기 (19종)': 'Chokes (19 Types)',
  '상체 관절기 (8종)': 'Upper Body Locks (8 Types)',
  '하체 관절기 (8종)': 'Leglocks (8 Types)',
  '압박 및 슬라이서 (6종)': 'Compressions (6 Types)',
};

// Submission item English mappings
export const SUBMISSION_ITEM_EN_MAP: Record<string, string> = {
  '미지정': 'Unassigned',
  '크로스 칼라 초크': 'Cross Collar Choke',
  '페이퍼커터 초크': 'Paper Cutter Choke',
  '보우 앤 애로우 초크': 'Bow and Arrow Choke',
  '보우 앤 애로우': 'Bow and Arrow Choke',
  '클락 초크': 'Clock Choke',
  '리어 네이키드 초크 / RNC': 'Rear Naked Choke (RNC)',
  'RNC (리어네이키드)': 'Rear Naked Choke (RNC)',
  '트라이앵글 초크': 'Triangle Choke',
  '트라이앵글': 'Triangle Choke',
  '리버스 트라이앵글 초크': 'Reverse Triangle Choke',
  '암 트라이앵글 초크': 'Arm Triangle Choke',
  '다스 초크': "D'Arce Choke",
  '다스초크': "D'Arce Choke",
  '아나콘다 초크': 'Anaconda Choke',
  '길로틴 초크': 'Guillotine Choke',
  '길로틴': 'Guillotine Choke',
  '페루비안 넥타이': 'Peruvian Necktie',
  '재패니즈 넥타이': 'Japanese Necktie',
  '이제키엘 초크': 'Ezekiel Choke',
  '이제키엘': 'Ezekiel Choke',
  '노스 사우스 초크': 'North-South Choke',
  '베이스볼 배트 초크': 'Baseball Bat Choke',
  '루프 초크': 'Loop Choke',
  '고고플라타': 'Gogoplata',
  '버기 초크': 'Buggy Choke',
  '암바': 'Armbar / Juji Gatame',
  '기무라': 'Kimura',
  '아메리카나': 'Americana',
  '스트레이트 암락': 'Straight Armlock',
  '오모플라타': 'Omoplata',
  '바랏플라타': 'Baratoplata',
  '타릭플라타': 'Tarikoplata',
  '리스트락': 'Wristlock',
  '스트레이트 앵클락': 'Straight Ankle Lock',
  '앵클락': 'Straight Ankle Lock',
  '아웃사이드 힐훅': 'Outside Heel Hook',
  '인사이드 힐훅': 'Inside Heel Hook',
  '힐훅': 'Heel Hook',
  '니바': 'Kneebar',
  '토홀드': 'Toe Hold',
  '에스티마 락': 'Estima Lock',
  '카이오 테라 풋락': 'Caio Terra Footlock',
  '아오키 락': 'Aoki Lock',
  '바이셉 슬라이서': 'Bicep Slicer',
  '카프 슬라이서': 'Calf Slicer',
  '카프 크러셔': 'Calf Crusher',
  '바나나 스플릿': 'Banana Split',
  '일렉트릭 체어': 'Electric Chair',
  '트위스터': 'Twister',
  '체스트 컴프레션 / 카운티 크러시': 'Chest Compression',
};

// Gi type English mappings
export const GI_TYPE_EN_MAP: Record<string, string> = {
  Gi: 'Gi',
  'No-Gi': 'No-Gi',
  Both: 'Both',
  All: 'All',
  미분류: 'Unclassified',
  도복: 'Gi',
  노기: 'No-Gi',
  공용: 'Both',
};

// Difficulty English mappings
export const DIFFICULTY_EN_MAP: Record<string, string> = {
  '초급(하)': 'Beginner',
  '중급(중)': 'Intermediate',
  '고급(상)': 'Advanced',
  '초급': 'Beginner',
  '중급': 'Intermediate',
  '고급': 'Advanced',
  '기초': 'Fundamentals',
  '마스터': 'Master',
  '미분류': 'Unclassified',
};

export function translatePosition(
  posName: string | undefined,
  lang: 'ko' | 'en',
  positions?: PositionFolder[]
): string {
  if (!posName) return '';
  if (lang === 'ko') return posName;
  if (positions) {
    const found = positions.find((p) => p.name === posName || p.nameEn === posName);
    if (found?.nameEn) return found.nameEn;
  }
  return POSITION_EN_MAP[posName] || posName;
}

export function translateCategory(
  catName: string | undefined,
  lang: 'ko' | 'en'
): string {
  if (!catName) return '';
  if (lang === 'ko') return catName;
  return CATEGORY_ITEM_EN_MAP[catName] || CATEGORY_GROUP_EN_MAP[catName] || catName;
}

export function translateCategoryGroup(
  grpIdOrName: string | undefined,
  lang: 'ko' | 'en'
): string {
  if (!grpIdOrName) return '';

  // Check custom group titles from localStorage
  try {
    const saved = localStorage.getItem('bjj_custom_category_group_titles');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[grpIdOrName]) return parsed[grpIdOrName];
    }
  } catch {
    // ignore
  }

  if (lang === 'ko') {
    if (grpIdOrName === 'cat-grp-takedown') return '테이크다운';
    if (grpIdOrName === 'cat-grp-pass') return '가드 패스';
    if (grpIdOrName === 'cat-grp-sweep') return '스윕';
    if (grpIdOrName === 'cat-grp-escape') return '이스케이프 & 리커버리';
    if (grpIdOrName === 'cat-grp-core') return '기타';
    if (grpIdOrName === 'cat-grp-submission') return '서브미션';
    return grpIdOrName;
  }
  return CATEGORY_GROUP_EN_MAP[grpIdOrName] || grpIdOrName;
}

export function translateSubmissionGroup(
  groupId: string | undefined,
  lang: 'ko' | 'en'
): string {
  if (!groupId) return '';
  if (lang === 'ko') {
    if (groupId === 'choke') return '조르기 (Chokes)';
    if (groupId === 'armlock') return '상체 관절기 (Upper Body Locks)';
    if (groupId === 'leglock') return '하체 관절기 (Leglocks)';
    if (groupId === 'compression') return '압박 및 슬라이서 (Compression & Slicers)';
    return groupId;
  }
  return SUBMISSION_GROUP_EN_MAP[groupId] || groupId;
}

export function translateSubmissionDetail(
  detailName: string | undefined,
  lang: 'ko' | 'en'
): string {
  if (!detailName) return '';
  if (lang === 'ko') return detailName;
  return SUBMISSION_ITEM_EN_MAP[detailName] || detailName;
}

export function translateGiType(
  gi: string | undefined,
  lang: 'ko' | 'en'
): string {
  if (!gi) return '';
  if (lang === 'ko') {
    if (gi === 'Gi') return '도복 (Gi)';
    if (gi === 'No-Gi') return '노기 (No-Gi)';
    if (gi === 'Both' || gi === 'All') return '공용 (Both)';
    return gi;
  }
  return GI_TYPE_EN_MAP[gi] || gi;
}

export function translateDifficulty(
  diff: string | undefined,
  lang: 'ko' | 'en'
): string {
  if (!diff) return '';
  if (lang === 'ko') return diff;
  return DIFFICULTY_EN_MAP[diff] || diff;
}
