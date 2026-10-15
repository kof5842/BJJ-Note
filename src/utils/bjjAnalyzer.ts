import { MetadataConfig, SubmissionGroupId } from '../types';

export function extractUrlsFromText(rawText: string): string[] {
  if (!rawText) return [];

  // 1. Match full http/https URLs
  const urlRegex = /(https?:\/\/[^\s,"'<>\]\)\`]+)/gi;
  const standardMatches = rawText.match(urlRegex) || [];

  // 2. Also match raw domain links without http/https (e.g. instagram.com/reel/..., www.instagram.com/..., youtu.be/..., m.youtube.com/...)
  const domainRegex =
    /(?:^|[\s(\[<"'`])((?:www\.|m\.)?(?:instagram\.com|instagr\.am|youtube\.com|youtu\.be)\/[^\s,"'<>\]\)\`]+)/gi;
  const domainMatches: string[] = [];
  let dMatch;
  while ((dMatch = domainRegex.exec(rawText)) !== null) {
    if (dMatch[1]) {
      const u = dMatch[1].trim();
      domainMatches.push(u.startsWith('http') ? u : `https://${u}`);
    }
  }

  const all = [...standardMatches, ...domainMatches];
  const cleaned = all
    .map((u) => u.replace(/[.,;!?)"'`\]>]+$/, '').trim())
    .filter((u) => {
      try {
        const parsed = new URL(u);
        return parsed.hostname.length > 3 && parsed.pathname.length > 1;
      } catch {
        return false;
      }
    });

  return Array.from(new Set(cleaned));
}

export function extractYoutubeId(url: string): string {
  if (!url) return '';
  try {
    const regExp =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // ignore
  }
  return '';
}

export function isInstagramUrl(url: string): boolean {
  if (!url) return false;
  return /(?:instagram\.com|instagr\.am)/i.test(url);
}

export function extractInstagramReelId(url: string): string {
  if (!url) return '';
  try {
    const clean = url.trim();
    if (clean.startsWith('ig-')) {
      return clean.replace(/^ig-/, '');
    }
    // Matches instagram.com/reel/ID, /reels/ID, /p/ID, /tv/ID, /share/reel/ID, /username/reel/ID, etc.
    const regExp =
      /(?:instagram\.com|instagr\.am)(?:\/[^/?#\s]+)*\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i;
    const match = clean.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: match direct reel/ID or p/ID pattern
    const fallbackMatch = clean.match(/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1];
    }
  } catch {
    // ignore
  }
  return '';
}

export function getInstagramThumbnail(shortcode: string, title?: string): string {
  const displayTitle = title ? title.slice(0, 30) : 'Instagram Reel';
  const cleanCode = (shortcode || '').replace(/^ig-/, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f09433"/>
        <stop offset="25%" stop-color="#e6683c"/>
        <stop offset="50%" stop-color="#dc2743"/>
        <stop offset="75%" stop-color="#cc2366"/>
        <stop offset="100%" stop-color="#bc1888"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#ig-grad)"/>
    <rect width="640" height="360" fill="rgba(0,0,0,0.2)"/>
    <g transform="translate(320, 150)" text-anchor="middle">
      <circle cx="0" cy="0" r="38" fill="white" fill-opacity="0.25"/>
      <path d="M-10,-14 L16,0 L-10,14 Z" fill="white"/>
    </g>
    <text x="320" y="235" fill="white" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="800" font-size="20" text-anchor="middle">${displayTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    <text x="320" y="265" fill="rgba(255,255,255,0.85)" font-family="monospace" font-weight="600" font-size="13" text-anchor="middle">Instagram Reel (@${cleanCode})</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getYoutubeThumbnail(youtubeId: string): string {
  if (!youtubeId) return '';
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getVideoPlatform(urlOrId: string): 'youtube' | 'instagram' | 'other' {
  if (!urlOrId) return 'other';
  if (isInstagramUrl(urlOrId) || urlOrId.startsWith('ig-') || extractInstagramReelId(urlOrId)) {
    return 'instagram';
  }
  if (extractYoutubeId(urlOrId) || /youtube\.com|youtu\.be/i.test(urlOrId)) {
    return 'youtube';
  }
  return 'other';
}

export function isMostlyKorean(text: string): boolean {
  const koMatches = text.match(/[가-힣]/g);
  return (koMatches ? koMatches.length : 0) >= 2;
}

const EN_TO_KO_DICTIONARY: Array<[RegExp, string]> = [
  // Multi-word phrases & idioms (Highest Priority)
  [/\bhow to finish\b/gi, '실전 피니시 공략:'],
  [/\bhow to do\b/gi, '실전 가이드:'],
  [/\bhow to\b/gi, '실전 공략:'],
  [/\bevery single time\b|\bevery time\b|\ball the time\b/gi, '언제나 100% 성공하는'],
  [/\bstep by step\b/gi, '단계별 완벽 가이드'],
  [/\bin 3 steps\b|\bin 3 minutes\b/gi, '3단계 핵심 공략'],
  [/\bin 5 minutes\b/gi, '5분 완성'],
  [/\bdrills and techniques\b|\bdrills & techniques\b/gi, '드릴 수련 및 실전 기술'],
  [/\btechnique breakdown\b/gi, '기술 정밀 분석'],
  [/\bultimate guide\b|\bcomplete guide\b/gi, '궁극의 완벽 가이드'],
  [/\bmasterclass\b|\bmaster class\b/gi, '마스터클래스'],
  [/\bstop doing this\b|\bnever do this\b|\bdon't do this\b/gi, '절대 피해야 할 치명적 실수'],
  [/\bworks on everyone\b|\bworks against everyone\b/gi, '누구에게나 통하는'],
  [/\bsimple and effective\b|\beasy and effective\b/gi, '쉽고 확실하게 통하는'],
  [/\bgame changer\b/gi, '실력 급상승 핵심 팁'],
  [/\bfor beginners\b|\bfor beginner\b/gi, '초보자 맞춤'],
  [/\bbeginner to advanced\b/gi, '초보부터 상급자까지'],
  [/\bwhite belt to black belt\b/gi, '모든 벨트 필수'],
  [/\bwhite belt\b/gi, '화이트벨트'],
  [/\bblue belt\b/gi, '블루벨트'],
  [/\bpurple belt\b/gi, '퍼플벨트'],
  [/\bbrown belt\b/gi, '브라운벨트'],
  [/\bblack belt\b/gi, '블랙벨트'],

  // Guards & Positions
  [/\bclosed guard\b/gi, '클로즈드 가드'],
  [/\bhalf butterfly guard\b|\bhalf butterfly\b/gi, '하프 버터플라이 가드'],
  [/\bdeep half guard\b|\bdeep half\b/gi, '딥하프 가드'],
  [/\bhalf guard sweep\b/gi, '하프 가드 스윕'],
  [/\bhalf guard pass\b/gi, '하프 가드 패스'],
  [/\bhalf guard\b/gi, '하프 가드'],
  [/\bbutterfly guard\b/gi, '버터플라이 가드'],
  [/\bsingle leg x-guard\b|\bsingle leg x guard\b|\bsingle leg x\b/gi, '싱글레그 X(SLX)'],
  [/\bslx\b/gi, '싱글레그 X'],
  [/\bx-guard\b|\bx guard\b/gi, 'X-가드'],
  [/\bk-guard\b|\bk guard\b/gi, 'K-가드'],
  [/\brubber guard\b/gi, '러버 가드'],
  [/\bworm guard\b/gi, '웜 가드'],
  [/\bsquid guard\b/gi, '스퀴드 가드'],
  [/\blasso guard\b/gi, '라쏘 가드'],
  [/\bspider guard\b/gi, '스파이더 가드'],
  [/\bcollar sleeve guard\b|\bcollar and sleeve\b|\bcollar sleeve\b/gi, '칼라 슬리브 가드'],
  [/\breverse de la riva\b|\brdlr\b/gi, '리버스 데라히바'],
  [/\bde la riva guard\b|\bde la riva\b|\bdlr\b/gi, '데라히바 가드'],
  [/\bopen guard\b/gi, '오픈 가드'],
  [/\bsaddle position\b|\bsaddle\b|\b411\b|\bhoney hole\b/gi, '새들(411)'],
  [/\b50\/50 guard\b|\b50\/50\b|\bfifty fifty\b/gi, '50/50 가드'],
  [/\bberimbolo\b/gi, '베림볼로'],
  [/\bturtle position\b|\bturtle\b/gi, '터틀 포지션'],
  [/\bside control escape\b/gi, '사이드 컨트롤 탈출'],
  [/\bside control\b|\bside mount\b/gi, '사이드 컨트롤'],
  [/\bknee on belly\b|\bkob\b/gi, '니온벨리'],
  [/\bfull mount\b|\bmount escape\b/gi, '마운트 탈출'],
  [/\bmount\b/gi, '마운트'],
  [/\bback take\b|\bback takes\b|\bbacktake\b|\bbacktakes\b/gi, '백 테이크'],
  [/\bback control\b|\bback mount\b/gi, '백 컨트롤'],
  [/\bnorth south position\b|\bnorth south\b|\bnorth-south\b/gi, '노스사우스'],

  // Submissions & Locks
  [/\brear naked choke\b|\brnc\b/gi, '리어네이키드 초크(RNC)'],
  [/\bguillotine choke\b|\bguillotine\b/gi, '길로틴 초크'],
  [/\btriangle choke\b|\btriangle\b/gi, '트라이앵글 초크'],
  [/\bd'arce choke\b|\bdarce choke\b|\bd'arce\b|\bdarce\b/gi, '다스 초크'],
  [/\banaconda choke\b|\banaconda\b/gi, '아나콘다 초크'],
  [/\bezekiel choke\b|\bezekiel\b/gi, '에제키엘 초크'],
  [/\bbow and arrow choke\b|\bbow and arrow\b/gi, '보우 앤 애로우 초크'],
  [/\bcross collar choke\b|\bcross choke\b/gi, '크로스 칼라 초크'],
  [/\bbaseball choke\b|\bbaseball bat choke\b/gi, '베이스볼 초크'],
  [/\bclock choke\b/gi, '클락 초크'],
  [/\bloop choke\b/gi, '루프 초크'],
  [/\bnorth south choke\b|\bnorth-south choke\b/gi, '노스사우스 초크'],
  [/\bstraight armbar\b|\barmbar\b|\barm bar\b/gi, '암바'],
  [/\bkimura lock\b|\bkimura trap\b|\bkimura\b/gi, '기무라'],
  [/\bamericana lock\b|\bamericana\b/gi, '아메리카나'],
  [/\bomoplata\b/gi, '오모플라타'],
  [/\bwristlock\b|\bwrist lock\b/gi, '손목꺾기(리스트락)'],
  [/\bstraight armlock\b|\bstraight arm lock\b/gi, '스트레이트 암락'],
  [/\binside heel hook\b/gi, '인사이드 힐훅'],
  [/\boutside heel hook\b/gi, '아웃사이드 힐훅'],
  [/\bheel hook\b|\bheelhook\b/gi, '힐훅'],
  [/\bkneebar\b|\bknee bar\b/gi, '니바'],
  [/\bstraight ankle lock\b|\bankle lock\b/gi, '앵클락'],
  [/\btoe hold\b|\btoehold\b/gi, '토홀드'],
  [/\bestima lock\b/gi, '에스티마 락'],
  [/\bbicep slicer\b/gi, '바이셉 슬라이서'],
  [/\bcalf crusher\b|\bcalf slicer\b/gi, '카프 크러셔'],
  [/\btwister\b/gi, '트위스터'],
  [/\bbanana split\b/gi, '바나나 스플릿'],
  [/\bneck crank\b/gi, '넥 크랭크'],

  // Actions & Concepts
  [/\bguard pass\b|\bguard passing\b/gi, '가드 패스'],
  [/\bpassing\b|\bpasses\b|\bpass\b/gi, '패스'],
  [/\bsweeps\b|\bsweep\b/gi, '스윕'],
  [/\bsubmissions\b|\bsubmission\b/gi, '서브미션'],
  [/\bescapes\b|\bescape\b/gi, '이스케이프'],
  [/\btakedowns\b|\btakedown\b/gi, '테이크다운'],
  [/\bcounters\b|\bcounter\b/gi, '카운터'],
  [/\bguard retention\b|\bguard recovery\b|\bretention\b|\brecovery\b/gi, '가드 리커버리'],
  [/\bdrills\b|\bdrill\b/gi, '드릴 수련'],
  [/\bsetup\b|\bset up\b|\bsetups\b/gi, '셋업'],
  [/\bfinish\b|\bfinishing\b|\bfinishes\b/gi, '피니시'],
  [/\bdetails\b|\bdetail\b/gi, '핵심 디테일'],
  [/\btechnique\b|\btechniques\b/gi, '기술'],
  [/\btutorial\b|\binstructional\b/gi, '실전 강좌'],
  [/\bbreakdown\b/gi, '정밀 분석'],
  [/\bhighlights?\b/gi, '하이라이트'],
  [/\bsparring\b/gi, '스파링'],
  [/\brolling\b/gi, '롤링'],
  [/\bcompetition\b/gi, '시합 실전'],
  [/\bsecrets?\b/gi, '비결'],
  [/\btips?\b/gi, '핵심 팁'],
  [/\btricks?\b/gi, '실전 테크닉'],
  [/\bmistakes?\b/gi, '치명적 실수'],
  [/\bdefense\b|\bdefence\b/gi, '디펜스'],
  [/\battacks?\b/gi, '어택'],
  [/\bunderhook\b/gi, '언더훅'],
  [/\boverhook\b/gi, '오버훅'],
  [/\barm drag\b/gi, '암드래그'],
  [/\bduck under\b/gi, '덕언더'],
  [/\bsprawl\b/gi, '스프롤'],
  [/\bpressure\b/gi, '압박'],
  [/\bposture\b/gi, '포스처'],
  [/\bframes?\b/gi, '프레임'],
  [/\bgrips?\b/gi, '그립'],
  [/\bhooks?\b/gi, '훅'],
  [/\bbridge\b/gi, '브릿지'],
  [/\bhip escape\b|\bshrimp\b/gi, '새우빼기'],
  [/\binvert\b|\binversion\b/gi, '인버티드'],
  [/\bgranby roll\b/gi, '그랜비 롤'],

  // Modifiers & Connectors
  [/\bunstoppable\b|\bunbeatable\b/gi, '막을 수 없는'],
  [/\beasy\b/gi, '쉬운'],
  [/\bsimple\b/gi, '간단한'],
  [/\beffective\b/gi, '효과적인'],
  [/\bpowerful\b|\bpower\b/gi, '강력한'],
  [/\bperfect\b/gi, '완벽한'],
  [/\bclean\b/gi, '깔끔한'],
  [/\bfast\b|\bquick\b/gi, '빠른'],
  [/\btight\b/gi, '타이트한'],
  [/\bbest\b/gi, '최고의'],
  [/\bfrom\b/gi, '→'],
  [/\bto\b/gi, '연계'],
  [/\bagainst\b/gi, '대응'],
  [/\bwith\b|\busing\b/gi, '활용'],
  [/\band\b|\b&\b/gi, '및'],
  [/\bor\b/gi, '또는'],
  [/\bno-gi\b|\bnogi\b/gi, '노기(No-Gi)'],
  [/\bgi\b/gi, '도복'],
  [/\bbjj\b|\bjiu jitsu\b|\bjiu-jitsu\b/gi, '주짓수'],
  [/\bmma\b/gi, 'MMA'],
  [/\bufc\b/gi, 'UFC'],
];

const KO_TO_EN_DICTIONARY: Array<[RegExp, string]> = [
  [/클로즈드\s*가드|클로즈\s*가드/g, 'Closed Guard'],
  [/하프버터플라이\s*가드|하프\s*버터플라이/g, 'Half Butterfly Guard'],
  [/딥하프\s*가드|딥\s*하프/g, 'Deep Half Guard'],
  [/하프\s*가드|하프가드/g, 'Half Guard'],
  [/버터플라이\s*가드/g, 'Butterfly Guard'],
  [/싱글레그\s*X|싱글렉\s*X|SLX/gi, 'Single Leg X (SLX)'],
  [/X-?가드|엑스가드/gi, 'X-Guard'],
  [/K-?가드|케이가드/gi, 'K-Guard'],
  [/러버\s*가드|러버가드/g, 'Rubber Guard'],
  [/웜\s*가드|웜가드/g, 'Worm Guard'],
  [/라쏘\s*가드|라쏘가드|올가미\s*가드/g, 'Lasso Guard'],
  [/스파이더\s*가드|스파이더가드/g, 'Spider Guard'],
  [/리버스\s*데라히바|RDLR/gi, 'Reverse De La Riva'],
  [/데라히바\s*가드|데라히바/g, 'De La Riva Guard'],
  [/새들|411|허니홀/g, 'Saddle (411)'],
  [/50\/50\s*가드|50\/50/g, '50/50 Guard'],
  [/베림볼로/g, 'Berimbolo'],
  [/터틀\s*포지션|터틀/g, 'Turtle Position'],
  [/사이드\s*컨트롤|사이드\s*마운트|사이드/g, 'Side Control'],
  [/풀\s*마운트|마운트/g, 'Mount'],
  [/백\s*컨트롤|백\s*포지션|백\s*마운트/g, 'Back Control'],
  [/백\s*테이크|백테이크/g, 'Back Take'],
  [/니온벨리/g, 'Knee on Belly'],
  [/남북\s*초크|노스사우스\s*초크/g, 'North-South Choke'],
  [/리어네이키드\s*초크|RNC|백초크/gi, 'Rear Naked Choke (RNC)'],
  [/길로틴\s*초크|길로틴/g, 'Guillotine Choke'],
  [/트라이앵글\s*초크|삼각\s*초크|트라이앵글|삼각조르기/g, 'Triangle Choke'],
  [/다스\s*초크|다스초크/g, "D'Arce Choke"],
  [/아나콘다\s*초크|아나콘다/g, 'Anaconda Choke'],
  [/에제키엘\s*초크|에제키엘/g, 'Ezekiel Choke'],
  [/보우\s*앤\s*애로우|보우앤애로우/g, 'Bow and Arrow Choke'],
  [/루프\s*초크|루프초크/g, 'Loop Choke'],
  [/초크|목조르기/g, 'Choke'],
  [/암바|팔가로누워꺾기/g, 'Armbar'],
  [/기무라/g, 'Kimura'],
  [/아메리카나/g, 'Americana'],
  [/오모플라타/g, 'Omoplata'],
  [/손목\s*꺾기|리스트락/g, 'Wristlock'],
  [/스트레이트\s*암락/g, 'Straight Armlock'],
  [/인사이드\s*힐훅/g, 'Inside Heel Hook'],
  [/아웃사이드\s*힐훅/g, 'Outside Heel Hook'],
  [/힐훅/g, 'Heel Hook'],
  [/니바|무릎십자꺾기/g, 'Kneebar'],
  [/앵클락|스트레이트\s*앵클락|발목꺾기/g, 'Straight Ankle Lock'],
  [/토홀드/g, 'Toe Hold'],
  [/에스티마\s*락|에스티마/g, 'Estima Lock'],
  [/바이셉\s*슬라이서/g, 'Bicep Slicer'],
  [/카프\s*크러셔|카프\s*슬라이서/g, 'Calf Crusher'],
  [/트위스터/g, 'Twister'],
  [/바나나\s*스플릿/g, 'Banana Split'],
  [/넥\s*크랭크/g, 'Neck Crank'],
  [/가드\s*패스|가드패스|패스/g, 'Guard Pass'],
  [/스윕|스위프|뒤집기/g, 'Sweep'],
  [/서브미션|피니시/g, 'Submission Finish'],
  [/이스케이프|탈출/g, 'Escape'],
  [/테이크다운|넘어뜨리기/g, 'Takedown'],
  [/카운터|반격/g, 'Counter'],
  [/가드\s*리커버리|가드\s*복귀/g, 'Guard Retention'],
  [/셋업|설정/g, 'Setup'],
  [/디테일|핵심/g, 'Key Details'],
  [/초보자|초심자/g, 'Beginner'],
  [/노기/g, 'No-Gi'],
  [/도복/g, 'Gi'],
  [/주짓수/g, 'BJJ'],
];

export function translateBjjTitle(rawTitle: string): {
  titleKo: string;
  titleEn: string;
} {
  let clean = (rawTitle || '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/(?:www\.)?(?:youtube\.com|youtu\.be|instagram\.com|instagr\.am)\/[^\s]+/gi, '')
    .replace(/^\s*[-*•\d]+[\)\.\:\-]\s*/, '')
    .replace(/\s*-\s*YouTube$/i, '')
    .replace(/\s*\|\s*YouTube$/i, '')
    .replace(/\s*•\s*YouTube$/i, '')
    .replace(/\[\s*(?:유튜브|인스타|실전 기술|영상|4K|HD|Full HD)\s*\]/gi, '')
    .replace(/[|•·-]\s*(?:YouTube|Instagram|Reel|주짓수|BJJ)\s*$/gi, '')
    .trim();

  if (!clean || clean.length < 2 || clean.startsWith('http') || clean.includes('youtube.com') || clean.includes('youtu.be')) {
    return { titleKo: '주짓수 수련 기술 영상', titleEn: 'BJJ Technique Video' };
  }

  if (isMostlyKorean(clean)) {
    let en = clean;
    for (const [regex, replacement] of KO_TO_EN_DICTIONARY) {
      en = en.replace(regex, ` ${replacement} `);
    }
    en = en.replace(/\s+/g, ' ').trim();
    const stripped = en.replace(/[가-힣]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (stripped.length >= 3) {
      en = stripped;
    } else {
      en = clean;
    }
    return {
      titleKo: clean,
      titleEn: en,
    };
  } else {
    let ko = clean;
    for (const [regex, replacement] of EN_TO_KO_DICTIONARY) {
      ko = ko.replace(regex, replacement);
    }

    // Clean residual English grammar words/particles/fillers that should not be left in Korean text
    const RESIDUAL_WORDS_CLEANUP: Array<[RegExp, string]> = [
      [/\b(the|a|an)\b/gi, ''],
      [/\b(this|that|these|those)\b/gi, '이'],
      [/\b(every|all)\b/gi, '모든'],
      [/\b(time|times)\b/gi, '상황'],
      [/\b(in|on|at)\b/gi, '에서'],
      [/\b(for)\b/gi, '을 위한'],
      [/\b(of|by)\b/gi, '의'],
      [/\b(with|using)\b/gi, '활용'],
      [/\b(and|&)\b/gi, '및'],
      [/\b(or)\b/gi, '또는'],
      [/\b(you|your)\b/gi, '실전'],
      [/\b(we|our)\b/gi, ''],
      [/\b(is|are|was|were|be|been)\b/gi, ''],
      [/\b(can|will|must|should)\b/gi, ''],
      [/\b(do|does|did)\b/gi, ''],
      [/\b(get|have|make)\b/gi, ''],
      [/\b(drill|drills)\b/gi, '드릴 수련'],
      [/\b(sweep|sweeps)\b/gi, '스윕'],
      [/\b(pass|passing|passes)\b/gi, '가드 패스'],
      [/\b(finish|finishing|finishes)\b/gi, '피니시'],
      [/\b(submission|submissions)\b/gi, '서브미션'],
      [/\b(choke|chokes)\b/gi, '초크'],
      [/\b(lock|locks)\b/gi, '락'],
      [/\b(guard|guards)\b/gi, '가드'],
      [/\b(mount)\b/gi, '마운트'],
      [/\b(escape|escapes)\b/gi, '이스케이프'],
      [/\b(defense|defence)\b/gi, '디펜스'],
      [/\b(attack|attacks)\b/gi, '어택'],
      [/\b(counter|counters)\b/gi, '카운터'],
      [/\b(detail|details)\b/gi, '핵심 디테일'],
      [/\b(tip|tips)\b/gi, '핵심 팁'],
      [/\b(trick|tricks)\b/gi, '실전 테크닉'],
      [/\b(breakdown)\b/gi, '정밀 분석'],
      [/\b(technique|techniques)\b/gi, '기술'],
      [/\b(tutorial|instructional)\b/gi, '강좌'],
      [/\b(rule|rules)\b/gi, '규칙'],
      [/\b(gi)\b/gi, '도복'],
      [/\b(nogi|no-gi)\b/gi, '노기'],
      [/\b(bjj|jiu-jitsu|jiujitsu)\b/gi, '주짓수'],
    ];

    for (const [regex, replacement] of RESIDUAL_WORDS_CLEANUP) {
      ko = ko.replace(regex, replacement);
    }

    // Clean any remaining lone 1-2 letter latin characters or orphaned symbols
    ko = ko
      .replace(/\b[a-zA-Z]{1,2}\b/g, '')
      .replace(/:\s*:/g, ':')
      .replace(/\s*([,:;!?])\s*/g, '$1 ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      titleKo: ko || clean,
      titleEn: clean,
    };
  }
}

// Client-side cache to eliminate repeated translation calls
const clientTranslationCache = new Map<string, { titleKo: string; titleEn: string }>();

/**
 * Asynchronously translates a BJJ video title into 100% natural, idiomatic, professional Korean terminology.
 * Tries the server-side Gemini AI model first; falls back cleanly to the enhanced algorithmic dictionary.
 */
export async function translateBjjTitleAsync(rawTitle: string): Promise<{
  titleKo: string;
  titleEn: string;
}> {
  const clean = (rawTitle || '').trim();
  if (!clean) return translateBjjTitle(rawTitle);

  // Check client cache first
  if (clientTranslationCache.has(clean)) {
    return clientTranslationCache.get(clean)!;
  }

  const syncFallback = translateBjjTitle(clean);

  // If already purely Korean and no English words remain, cache and return as is
  if (isMostlyKorean(clean) && !/[a-zA-Z]{3,}/.test(clean)) {
    clientTranslationCache.set(clean, syncFallback);
    return syncFallback;
  }

  // 1. Try server-side AI translation with Gemini
  try {
    const res = await fetch('/api/translate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: clean }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.titleKo === 'string' && data.titleKo.trim().length > 0) {
        const aiKo = data.titleKo.trim();
        // If AI returned a natural Korean title, use it!
        if (isMostlyKorean(aiKo)) {
          const result = {
            titleKo: aiKo,
            titleEn: clean,
          };
          clientTranslationCache.set(clean, result);
          return result;
        }
      }
    }
  } catch {
    // Fallback to sync algorithm
  }

  clientTranslationCache.set(clean, syncFallback);
  return syncFallback;
}

export function detectSubmissionFromTitle(
  title: string,
  metadata: MetadataConfig
): {
  submissionGroup: SubmissionGroupId | 'none';
  submissionDetail: string;
  submissionDetails?: string[];
} {
  const text = title.toLowerCase();

  const explicitRules: Array<{
    group: SubmissionGroupId;
    detail: string;
    keywords: RegExp;
  }> = [
    {
      group: 'choke',
      detail: '길로틴',
      keywords: /guillotine|길로틴/i,
    },
    {
      group: 'choke',
      detail: 'RNC (리어네이키드)',
      keywords: /rear naked|\brnc\b|리어네이키드|백초크/i,
    },
    {
      group: 'choke',
      detail: '트라이앵글',
      keywords: /triangle|트라이앵글|삼각초크|삼각조르기/i,
    },
    {
      group: 'choke',
      detail: '남북초크',
      keywords: /north[\s-]*south choke|남북\s*초크|남북초크/i,
    },
    {
      group: 'choke',
      detail: '다스초크',
      keywords: /d'?arce|다스\s*초크|다스초크/i,
    },
    {
      group: 'choke',
      detail: '아나콘다 초크',
      keywords: /anaconda|아나콘다/i,
    },
    {
      group: 'choke',
      detail: '에제키엘',
      keywords: /ezekiel|에제키엘/i,
    },
    {
      group: 'choke',
      detail: '보우 앤 애로우',
      keywords: /bow and arrow|보우\s*앤\s*애로우|보우앤애로우/i,
    },
    {
      group: 'choke',
      detail: '루프 초크',
      keywords: /loop choke|루프\s*초크|루프초크/i,
    },
    {
      group: 'armlock',
      detail: '암바',
      keywords: /arm\s*bar|암바|팔가로누워꺾기/i,
    },
    {
      group: 'armlock',
      detail: '기무라',
      keywords: /kimura|기무라/i,
    },
    {
      group: 'armlock',
      detail: '아메리카나',
      keywords: /americana|아메리카나|\bkeylock\b|키락/i,
    },
    {
      group: 'armlock',
      detail: '오모플라타',
      keywords: /omoplata|오모플라타/i,
    },
    {
      group: 'armlock',
      detail: '손목꺾기',
      keywords: /wrist\s*lock|손목\s*꺾기|리스트락/i,
    },
    {
      group: 'armlock',
      detail: '스트레이트 암락',
      keywords: /straight arm\s*lock|스트레이트\s*암락/i,
    },
    {
      group: 'leglock',
      detail: '힐훅',
      keywords: /heel\s*hook|힐훅/i,
    },
    {
      group: 'leglock',
      detail: '니바',
      keywords: /knee\s*bar|니바/i,
    },
    {
      group: 'leglock',
      detail: '앵클락',
      keywords: /ankle\s*lock|앵클락|발목\s*꺾기/i,
    },
    {
      group: 'leglock',
      detail: '토홀드',
      keywords: /toe\s*hold|토홀드/i,
    },
    {
      group: 'leglock',
      detail: '에스티마 락',
      keywords: /estima\s*lock|에스티마/i,
    },
    {
      group: 'compression',
      detail: '바이셉 슬라이서',
      keywords: /bicep\s*slicer|바이셉\s*슬라이서/i,
    },
    {
      group: 'compression',
      detail: '트위스터',
      keywords: /twister|트위스터/i,
    },
    {
      group: 'compression',
      detail: '카프 크러셔',
      keywords: /calf\s*(crusher|slicer)|카프\s*(크러셔|슬라이서)/i,
    },
    {
      group: 'compression',
      detail: '바나나 스플릿',
      keywords: /banana\s*split|바나나\s*스플릿/i,
    },
    {
      group: 'compression',
      detail: '넥 크랭크',
      keywords: /neck\s*crank|넥\s*크랭크/i,
    },
  ];

  const matchedFinishes: Array<{ group: SubmissionGroupId; detail: string }> = [];

  for (const rule of explicitRules) {
    if (rule.keywords.test(text)) {
      if (!matchedFinishes.some((m) => m.detail === rule.detail)) {
        matchedFinishes.push({ group: rule.group, detail: rule.detail });
      }
    }
  }

  for (const subGroup of metadata.submissions) {
    for (const item of subGroup.items) {
      const cleanItem = item.replace(/\(.*\)/, '').trim();
      if (cleanItem.length >= 2 && text.includes(cleanItem.toLowerCase())) {
        if (!matchedFinishes.some((m) => m.detail === item)) {
          matchedFinishes.push({ group: subGroup.id, detail: item });
        }
      }
    }
  }

  if (matchedFinishes.length === 0 && (/\bchoke\b|초크/.test(text))) {
    const chokeItem = metadata.submissions.find((s) => s.id === 'choke')?.items[0] || '길로틴';
    matchedFinishes.push({ group: 'choke', detail: chokeItem });
  }

  if (matchedFinishes.length > 0) {
    return {
      submissionGroup: matchedFinishes[0].group,
      submissionDetail: matchedFinishes.map((m) => m.detail).join(', '),
      submissionDetails: matchedFinishes.map((m) => m.detail),
    };
  }

  return {
    submissionGroup: 'none',
    submissionDetail: '미지정',
    submissionDetails: [],
  };
}

export function parseSubmissionDetails(detail: string | undefined): string[] {
  if (!detail || detail === '미지정') return [];
  return detail
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatSubmissionDetails(details: string[]): string {
  const filtered = details.filter((d) => d && d !== '미지정');
  return filtered.length > 0 ? filtered.join(', ') : '미지정';
}

export function detectMetadataFromTitle(
  title: string,
  metadata: MetadataConfig
): {
  position: string;
  category: string;
  giType: string;
} {
  const lower = title.toLowerCase();
  const sub = detectSubmissionFromTitle(title, metadata);

  let detectedPosition = '미분류';
  const positionRules: Array<[RegExp, string]> = [
    [/saddle|411|honey\s*hole|새들/i, '새들 (Saddle / 411)'],
    [/single\s*leg\s*x|\bslx\b|싱글레그\s*x|싱글렉/i, '싱글레그 X (SLX)'],
    [/\bx-?guard\b|x\s*가드|엑스가드/i, 'X-가드 (X-Guard)'],
    [/\bk-?guard\b|k\s*가드|케이가드/i, 'K-가드 (K-Guard)'],
    [/50\/50|fifty\s*fifty/i, '50/50'],
    [/berimbolo|베림볼로/i, '베림볼로 (Berimbolo)'],
    [/rubber\s*guard|러버\s*가드|러버가드/i, '러버 가드 (Rubber Guard)'],
    [/deep\s*half|딥\s*하프|딥하프/i, '딥하프 가드 (Deep Half)'],
    [/half\s*butterfly|하프\s*버터플라이/i, '하프버터플라이 가드'],
    [/half\s*guard|하프\s*가드|하프가드/i, '하프 가드 (Half Guard)'],
    [/closed\s*guard|클로즈드\s*가드|클로즈\s*가드|닫힌\s*guard/i, '클로즈드 가드'],
    [/lasso|spider|라쏘|스파이더|올가미/i, '클로즈드 가드'],
    [/turtle|터틀/i, '터틀 포지션 (Turtle)'],
    [/side\s*control|side\s*mount|사이드/i, '사이드 컨트롤'],
    [/back\s*control|back\s*mount|rear\s*mount|백\s*컨트롤|백\s*포지션/i, '백 포지션'],
    [/\bmount\b|마운트/i, '마운트'],
    [/standing|takedown|wrestling|judo|스탠딩|테이크다운/i, '스탠딩 / 테이크다운'],
  ];

  for (const [regex, posName] of positionRules) {
    if (regex.test(lower)) {
      const matchedFolder = metadata.positions.find(
        (p) => p.name === posName || p.name.includes(posName.split(' ')[0])
      );
      if (matchedFolder) {
        detectedPosition = matchedFolder.name;
        break;
      }
    }
  }

  let detectedCategory = '미분류';
  if (sub.submissionGroup !== 'none') {
    detectedCategory = '서브미션';
  } else if (/sweep|스윕|스위프|청소|뒤집기/i.test(lower)) {
    detectedCategory = '스윕';
  } else if (/pass|패스/i.test(lower)) {
    detectedCategory = '가드 패스';
  } else if (/escape|이스케이프|탈출/i.test(lower)) {
    detectedCategory = '이스케이프';
  } else if (/back\s*take|berimbolo|백\s*테이크|백테이크|베림볼로/i.test(lower)) {
    detectedCategory = '백 테이크';
  } else if (/retention|recovery|복귀|리커버리|리텐션/i.test(lower)) {
    detectedCategory = '가드 복귀';
  } else if (/takedown|throw|wrestling|테이크다운/i.test(lower)) {
    detectedCategory = '테이크다운';
  } else if (/counter|카운터|반격/i.test(lower)) {
    detectedCategory = '카운터';
  }

  let detectedGi = '미분류';
  if (/no-?gi|nogi|노기|heel\s*hook|힐훅|saddle|새들|adcc/i.test(lower)) {
    detectedGi = 'No-Gi';
  } else if (/(\bgi\b|도복|기\s*수련|kimono)/i.test(lower)) {
    detectedGi = 'Gi';
  } else if (/all|both|공통|공용/i.test(lower)) {
    detectedGi = 'Both';
  } else {
    detectedGi = '미분류';
  }

  return {
    position: detectedPosition,
    category: detectedCategory,
    giType: detectedGi,
  };
}

export async function fetchYoutubeVideoTitle(url: string): Promise<string> {
  const ytId = extractYoutubeId(url);
  const canonicalUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : url.trim();

  // 1. Try local server-side API proxy (avoids browser CORS or tracking blocker restrictions)
  try {
    const apiRes = await fetch(`/api/video-info?url=${encodeURIComponent(canonicalUrl)}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
        return data.title.trim();
      }
    }
  } catch {
    // Fall through to direct fetch
  }

  // 2. Try noembed.com (Fastly CDN, CORS: *, reliable)
  try {
    const noembedRes = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(canonicalUrl)}`
    );
    if (noembedRes.ok) {
      const data = await noembedRes.json();
      if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
        return data.title.trim();
      }
    }
  } catch {
    // ignore
  }

  // 3. Try official YouTube oEmbed with properly encoded URL parameter
  try {
    const ytRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`
    );
    if (ytRes.ok) {
      const data = await ytRes.json();
      if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
        return data.title.trim();
      }
    }
  } catch {
    // ignore
  }

  // 4. Try youtube-nocookie oEmbed
  try {
    const nocookieRes = await fetch(
      `https://www.youtube-nocookie.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`
    );
    if (nocookieRes.ok) {
      const data = await nocookieRes.json();
      if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
        return data.title.trim();
      }
    }
  } catch {
    // ignore
  }

  // 5. Try with raw URL if canonical was different
  if (url.trim() !== canonicalUrl) {
    try {
      const rawRes = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(url.trim())}`
      );
      if (rawRes.ok) {
        const data = await rawRes.json();
        if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
          return data.title.trim();
        }
      }
    } catch {
      // ignore
    }
  }

  return ytId ? `주짓수 기술 영상 (${ytId})` : '주짓수 수련 기술 영상';
}

export async function fetchInstagramVideoTitle(url: string, shortcode?: string): Promise<string> {
  const code = shortcode || extractInstagramReelId(url);
  const canonicalUrl = code ? `https://www.instagram.com/reel/${code}/` : url.trim();

  // 1. Try local server-side API proxy
  try {
    const apiRes = await fetch(`/api/video-info?url=${encodeURIComponent(canonicalUrl)}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
        return data.title.trim();
      }
    }
  } catch {
    // Fall through
  }

  // 2. Try noembed.com
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(canonicalUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
        return data.title.trim();
      }
      if (data && typeof data.author_name === 'string' && data.author_name.trim().length > 0) {
        return `인스타그램 릴스 기술 (@${data.author_name.trim()})`;
      }
    }
  } catch {
    // Fallback
  }
  return code ? `인스타그램 릴스 기술 (@${code})` : '인스타그램 릴스 기술 영상';
}

export function formatSecondsToMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatSecondsToKoreanLabel(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}분 ${String(secs).padStart(2, '0')}초`;
}

export function formatDateKorean(dateStr?: string): string {
  if (!dateStr) return '수련 이력 없음';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
}

export function formatDateDot(dateStr?: string): string {
  if (!dateStr) return '이력 없음';
  return dateStr.replace(/-/g, '.');
}

const FIXED_SOLAR_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

const YEAR_SPECIFIC_HOLIDAYS: Record<string, string> = {
  '2025-01-27': '임시공휴일',
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-03-03': '대체공휴일(삼일절)',
  '2025-05-05': '어린이날·부처님오신날',
  '2025-05-06': '대체공휴일',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일(추석)',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-02': '대체공휴일(삼일절)',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일(부처님오신날)',
  '2026-08-17': '대체공휴일(광복절)',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-05': '대체공휴일(개천절)',
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일(설날)',
  '2027-05-13': '부처님오신날',
  '2027-08-16': '대체공휴일(광복절)',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-04': '대체공휴일(개천절)',
  '2027-10-11': '대체공휴일(한글날)',
};

export function getKoreanHolidayName(dateStr: string): string | null {
  if (YEAR_SPECIFIC_HOLIDAYS[dateStr]) {
    return YEAR_SPECIFIC_HOLIDAYS[dateStr];
  }
  const mmdd = dateStr.slice(5);
  return FIXED_SOLAR_HOLIDAYS[mmdd] || null;
}

export function getScoreColorStyle(val: number): {
  bgClass: string;
  borderClass: string;
  textClass: string;
  hexColor: string;
} {
  if (val >= 1 && val <= 3) {
    return { bgClass: 'bg-rose-600', borderClass: 'border-rose-700', textClass: 'text-white', hexColor: '#e11d48' };
  }
  if (val >= 4 && val <= 7) {
    return { bgClass: 'bg-amber-500', borderClass: 'border-amber-600', textClass: 'text-white', hexColor: '#f59e0b' };
  }
  if (val >= 8 && val <= 10) {
    return { bgClass: 'bg-emerald-600', borderClass: 'border-emerald-700', textClass: 'text-white', hexColor: '#059669' };
  }
  return { bgClass: 'bg-slate-100', borderClass: 'border-slate-200', textClass: 'text-slate-600', hexColor: '#f1f5f9' };
}

export function getEndPositionsArray(video: { endPosition?: string; endPositions?: string[] }): string[] {
  if (video.endPositions && Array.isArray(video.endPositions) && video.endPositions.length > 0) {
    return video.endPositions.filter((p) => p && p !== 'none' && p !== '미지정');
  }
  if (video.endPosition && video.endPosition !== 'none' && video.endPosition !== '미지정') {
    return video.endPosition.split(',').map((s) => s.trim()).filter((s) => s && s !== 'none' && s !== '미지정');
  }
  return [];
}

const HANGUL_CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export function matchesChosungOrQuery(text: string, query: string): boolean {
  if (!query) return true;
  if (!text) return false;

  const cleanQuery = query.trim().toLowerCase();
  const cleanText = text.trim().toLowerCase();

  if (cleanText.includes(cleanQuery)) return true;

  let chosungStr = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - 0xac00) / 588);
      chosungStr += HANGUL_CHOSUNG[idx];
    } else {
      chosungStr += text[i];
    }
  }

  return chosungStr.toLowerCase().includes(cleanQuery);
}

/**
 * Helper to extract technique tags and hashtags from memo content and techniqueTag field.
 */
export function extractTechniqueTagsFromMemo(
  memo: { content?: string; techniqueTag?: string },
  metadata?: MetadataConfig
): string[] {
  const result = new Set<string>();

  if (memo.techniqueTag && memo.techniqueTag.trim()) {
    result.add(memo.techniqueTag.trim());
  }

  const content = memo.content || '';
  if (!content) return Array.from(result);

  // 1. If metadata is provided, check against known taxonomy names for exact or space-insensitive matches
  if (metadata) {
    const allTaxonomyNames: string[] = [];
    if (metadata.positions) {
      metadata.positions.forEach((p) => {
        if (p.name) allTaxonomyNames.push(p.name);
        if (p.subCategories && Array.isArray(p.subCategories)) {
          p.subCategories.forEach((sub) => sub && allTaxonomyNames.push(sub));
        }
      });
    }
    if (metadata.categories) {
      metadata.categories.forEach((c) => c && allTaxonomyNames.push(c));
    }
    if (metadata.submissions) {
      metadata.submissions.forEach((g) => {
        if (g.items) g.items.forEach((item) => item && allTaxonomyNames.push(item));
      });
    }

    const contentLower = content.toLowerCase();
    const contentNoSpace = contentLower.replace(/\s+/g, '');

    for (const name of allTaxonomyNames) {
      if (!name) continue;
      const nameLower = name.toLowerCase();
      const nameNoSpace = nameLower.replace(/\s+/g, '');

      // Check if content has #Name or #NameNoSpace or Name
      if (
        contentLower.includes('#' + nameLower) ||
        contentNoSpace.includes('#' + nameNoSpace) ||
        contentLower.includes(nameLower)
      ) {
        result.add(name);
      }
    }
  }

  // 2. Generic hashtag extraction: match #tag
  const matches = content.matchAll(/#([가-힣a-zA-Z0-9_\/·\-\s]+?)(?=[.,;!?\n\r]|\s#|\s*$)/g);
  for (const match of matches) {
    const rawTag = match[1].trim();
    if (rawTag && rawTag.length >= 1) {
      result.add(rawTag);
    }
  }

  return Array.from(result);
}

