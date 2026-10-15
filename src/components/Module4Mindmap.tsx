import { translatePosition, translateCategory, translateSubmissionGroup, translateSubmissionDetail } from '../utils/taxonomyTranslation';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Minimize2,
  Expand,
  RotateCcw,
  Edit3,
  Eye,
  EyeOff,
  Compass,
  Layers,
  Folder,
  Sun,
  Moon,
  Play,
  PanelLeft,
  PanelRight,
  Sliders,
  AlignJustify,
  Search,
  X,
  Crosshair,
  ChevronRight,
} from 'lucide-react';
import {
  AppSettings,
  MetadataConfig,
  MindmapModeLayout,
  MindmapStorageState,
  MindmapToolbarPosition,
  SubmissionGroupId,
  TechniqueVideo,
} from '../types';
import { parseSubmissionDetails, getEndPositionsArray } from '../utils/bjjAnalyzer';
import { useLanguage } from '../i18n/LanguageContext';
import { computeUniformMindmapRadius } from '../data/initialData';

export function cleanHubTitle(title: string): string {
  if (!title) return '';
  let t = title
    .replace(/\b(12시|6시|3시|9시)\b:?\s*/g, '')
    .replace(/\((12시|6시|3시|9시)\)/g, '')
    .trim();
  if (t.includes('상체') && (t.includes('관절기') || t.includes('피니시'))) {
    return '상체 관절기';
  }
  if (t.includes('하체') && (t.includes('관절기') || t.includes('피니시'))) {
    return '하체 관절기';
  }
  if (t.includes('초크')) {
    return '초크';
  }
  if (t.includes('압박')) {
    return '압박 및 기타 피니시';
  }
  return t.replace(/\s*\(.*Finish.*\)/i, '').trim() || t;
}

interface Module4MindmapProps {
  videos: TechniqueVideo[];
  metadata: MetadataConfig;
  settings: AppSettings;
  mindmapState: MindmapStorageState;
  onUpdateMindmapState: (next: MindmapStorageState) => void;
  onOpenModal: (video: TechniqueVideo, mode: 'view' | 'edit') => void;
  onOpenSettingsModal: () => void;
  onUpdateSettings?: (patch: Partial<AppSettings>) => void;
}

type ClusterViewMode = 'byPosition' | 'byCategory';
type MindmapScoreFilter = 'all' | 'high' | 'low';

export const Module4Mindmap: React.FC<Module4MindmapProps> = ({
  videos,
  metadata,
  settings,
  mindmapState,
  onUpdateMindmapState,
  onOpenModal,
  onOpenSettingsModal,
  onUpdateSettings,
}) => {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<ClusterViewMode>('byPosition');
  const [scoreFilter, setScoreFilter] = useState<MindmapScoreFilter>('all');
  const [showUnrated, setShowUnrated] = useState<boolean>(true);
  const [showEmptyFolders, setShowEmptyFolders] = useState<boolean>(true);

  // Bring clicked folder to front!
  const [frontFolder, setFrontFolder] = useState<string | null>(null);

  // Spacing / orbit radius scaling factor (expand/contract distance between folders)
  const [orbitSpacing, setOrbitSpacing] = useState<number>(1.15);

  // Canvas element reference for focal zoom calculation
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Background Theme: Default to 'white' as requested!
  const [canvasTheme, setCanvasTheme] = useState<'white' | 'dark'>(
    settings.mindmapTheme || 'white'
  );

  React.useEffect(() => {
    if (settings.mindmapTheme) {
      setCanvasTheme(settings.mindmapTheme);
    }
  }, [settings.mindmapTheme]);

  const [zoom, setZoom] = useState<number>(0.68);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch gesture state for 1-finger pan and 2-finger pinch-to-zoom
  const touchStateRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startTouches: Array<{ clientX: number; clientY: number }>;
    startPan: { x: number; y: number };
    startZoom: number;
    initialDistance: number;
    worldFocalPoint: { x: number; y: number };
  }>({
    mode: 'none',
    startTouches: [],
    startPan: { x: 0, y: 0 },
    startZoom: 1,
    initialDistance: 0,
    worldFocalPoint: { x: 0, y: 0 },
  });

  const currentLayout: MindmapModeLayout = mindmapState[viewMode];

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const orbitSpacingRef = useRef(orbitSpacing);
  const currentLayoutRef = useRef(currentLayout);
  const mindmapStateRef = useRef(mindmapState);
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
    orbitSpacingRef.current = orbitSpacing;
    currentLayoutRef.current = currentLayout;
    mindmapStateRef.current = mindmapState;
    viewModeRef.current = viewMode;
  }, [zoom, pan, orbitSpacing, currentLayout, mindmapState, viewMode]);

  const [dragState, setDragState] = useState<{
    type: 'folder' | 'card' | 'submissionHub' | 'submissionSat';
    id: string;
    startMouseX: number;
    startMouseY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const [arrangeToast, setArrangeToast] = useState<string | null>(null);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  // Quick Search & Autocomplete in Diagram (Request: 다이어그램 도구함 아래 검색)
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [highlightedItem, setHighlightedItem] = useState<{
    id: string;
    type: 'folder' | 'submission' | 'category' | 'video';
  } | null>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const clusterNames = useMemo(() => {
    if (viewMode === 'byPosition') {
      return metadata.positions.map((p) => p.name);
    }
    return metadata.categories;
  }, [viewMode, metadata]);

  const visibleVideos = useMemo(() => {
    return videos.filter((v) => {
      if (v.proficiencyScore === 0 && !showUnrated) {
        return false;
      }
      if (scoreFilter === 'high') {
        return v.proficiencyScore >= settings.highScoreThreshold;
      }
      if (scoreFilter === 'low') {
        return (
          v.proficiencyScore > 0 &&
          v.proficiencyScore <= settings.lowScoreThreshold
        );
      }
      return true;
    });
  }, [
    videos,
    showUnrated,
    scoreFilter,
    settings.highScoreThreshold,
    settings.lowScoreThreshold,
  ]);

  const videosByCluster = useMemo(() => {
    const map: Record<string, TechniqueVideo[]> = {};
    for (const name of clusterNames) {
      map[name] = [];
    }
    for (const v of visibleVideos) {
      const key = viewMode === 'byPosition' ? v.position : v.category;
      if (!map[key]) map[key] = [];
      map[key].push(v);
    }
    return map;
  }, [clusterNames, visibleVideos, viewMode]);

  const getBaseFolderCoord = (clusterName: string, index: number) => {
    const existing = currentLayout.folders[clusterName];
    if (existing) {
      return {
        x: existing.x,
        y: existing.y,
        collapsed: existing.collapsed,
      };
    }
    const total = Math.max(1, clusterNames.length);
    const R = computeUniformMindmapRadius(total, viewMode);
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const rX = Math.round(R * 1.06);
    const rY = R;
    return {
      x: Math.round(Math.cos(angle) * rX),
      y: Math.round(Math.sin(angle) * rY),
      collapsed: false,
    };
  };

  const getFolderCoord = (clusterName: string, index: number) => {
    const base = getBaseFolderCoord(clusterName, index);
    return {
      x: Math.round(base.x * orbitSpacing),
      y: Math.round(base.y * orbitSpacing),
      collapsed: base.collapsed,
    };
  };

  const cardWorldPositions = useMemo(() => {
    const posMap: Record<
      string,
      {
        x: number;
        y: number;
        dx: number;
        dy: number;
        folderCollapsed: boolean;
      }
    > = {};

    clusterNames.forEach((clusterName, cIdx) => {
      const folder = getFolderCoord(clusterName, cIdx);
      const list = videosByCluster[clusterName] || [];
      list.forEach((v, idx) => {
        const offset = currentLayout.cardOffsets[v.id] || { dx: 0, dy: 0 };
        const gridY = 48 + idx * 54;
        if (folder.collapsed) {
          posMap[v.id] = {
            x: folder.x,
            y: folder.y,
            dx: offset.dx,
            dy: offset.dy,
            folderCollapsed: true,
          };
        } else {
          posMap[v.id] = {
            x: folder.x + offset.dx,
            y: folder.y - 20 + gridY + offset.dy,
            dx: offset.dx,
            dy: offset.dy,
            folderCollapsed: false,
          };
        }
      });
    });

    return posMap;
  }, [clusterNames, videosByCluster, currentLayout, orbitSpacing]);

  const isWhite = canvasTheme === 'white';

  const compassSubmissionLayout = useMemo(() => {
    const userOffsets = currentLayout.submissionOffsets || {};

    const chokeHubOffset = userOffsets['choke'] || { x: 0, y: 0 };
    const armlockHubOffset = userOffsets['armlock'] || { x: 0, y: 0 };
    const leglockHubOffset = userOffsets['leglock'] || { x: 0, y: 0 };
    const compressionHubOffset = userOffsets['compression'] || { x: 0, y: 0 };

    const hubs: Record<
      SubmissionGroupId,
      {
        x: number;
        y: number;
        colorHex: string;
        borderClass: string;
        bgClass: string;
        textClass: string;
        satellites: Array<{
          name: string;
          x: number;
          y: number;
        }>;
      }
    > = {
      choke: {
        x: Math.round(chokeHubOffset.x),
        y: -Math.round(570 * orbitSpacing) + Math.round(chokeHubOffset.y),
        colorHex: '#6366f1',
        borderClass: isWhite ? 'border-indigo-600' : 'border-indigo-500/80',
        bgClass: isWhite ? 'bg-indigo-50/95 shadow-md shadow-indigo-100' : 'bg-indigo-950/90',
        textClass: isWhite ? 'text-indigo-950' : 'text-indigo-200',
        satellites: [],
      },
      armlock: {
        x: -Math.round(760 * orbitSpacing) + Math.round(armlockHubOffset.x),
        y: Math.round(armlockHubOffset.y),
        colorHex: '#ea580c',
        borderClass: isWhite ? 'border-orange-500' : 'border-orange-500/80',
        bgClass: isWhite ? 'bg-orange-50/95 shadow-md shadow-orange-100' : 'bg-orange-950/90',
        textClass: isWhite ? 'text-orange-950' : 'text-orange-200',
        satellites: [],
      },
      leglock: {
        x: Math.round(760 * orbitSpacing) + Math.round(leglockHubOffset.x),
        y: Math.round(leglockHubOffset.y),
        colorHex: '#e11d48',
        borderClass: isWhite ? 'border-rose-500' : 'border-rose-500/80',
        bgClass: isWhite ? 'bg-rose-50/95 shadow-md shadow-rose-100' : 'bg-rose-950/90',
        textClass: isWhite ? 'text-rose-950' : 'text-rose-200',
        satellites: [],
      },
      compression: {
        x: Math.round(compressionHubOffset.x),
        y: Math.round(570 * orbitSpacing) + Math.round(compressionHubOffset.y),
        colorHex: '#d97706',
        borderClass: isWhite ? 'border-amber-500' : 'border-amber-500/80',
        bgClass: isWhite ? 'bg-amber-50/95 shadow-md shadow-amber-100' : 'bg-amber-950/90',
        textClass: isWhite ? 'text-amber-950' : 'text-amber-200',
        satellites: [],
      },
    };

    for (const grp of metadata.submissions) {
      const items = grp.items;
      const count = items.length;
      if (grp.id === 'choke') {
        const spanWidth = Math.max(540, count * 115) * orbitSpacing;
        items.forEach((name, idx) => {
          const satOffset = userOffsets[`${grp.id}:::${name}`] || { x: 0, y: 0 };
          const offsetX =
            count === 1 ? 0 : -spanWidth / 2 + (idx / (count - 1)) * spanWidth;
          // Positioned safely above the hub with outward stagger so they NEVER overlap the hub
          const staggerY =
            hubs.choke.y - Math.round((70 + (idx % 2) * 50) * orbitSpacing);
          hubs.choke.satellites.push({
            name,
            x: Math.round(hubs.choke.x + offsetX + satOffset.x),
            y: Math.round(staggerY + satOffset.y),
          });
        });
      } else if (grp.id === 'armlock') {
        const spanHeight = Math.max(400, count * 82) * orbitSpacing;
        items.forEach((name, idx) => {
          const satOffset = userOffsets[`${grp.id}:::${name}`] || { x: 0, y: 0 };
          const offsetY =
            count === 1
              ? 0
              : -spanHeight / 2 + (idx / (count - 1)) * spanHeight;
          // Positioned safely to the left (further West) of armlock hub
          const staggerX =
            hubs.armlock.x - Math.round((85 + (idx % 2) * 55) * orbitSpacing);
          hubs.armlock.satellites.push({
            name,
            x: Math.round(staggerX + satOffset.x),
            y: Math.round(hubs.armlock.y + offsetY + satOffset.y),
          });
        });
      } else if (grp.id === 'leglock') {
        const spanHeight = Math.max(400, count * 82) * orbitSpacing;
        items.forEach((name, idx) => {
          const satOffset = userOffsets[`${grp.id}:::${name}`] || { x: 0, y: 0 };
          const offsetY =
            count === 1
              ? 0
              : -spanHeight / 2 + (idx / (count - 1)) * spanHeight;
          // Positioned safely to the right (further East) of leglock hub
          const staggerX =
            hubs.leglock.x + Math.round((85 + (idx % 2) * 55) * orbitSpacing);
          hubs.leglock.satellites.push({
            name,
            x: Math.round(staggerX + satOffset.x),
            y: Math.round(hubs.leglock.y + offsetY + satOffset.y),
          });
        });
      } else if (grp.id === 'compression') {
        const spanWidth = Math.max(500, count * 115) * orbitSpacing;
        items.forEach((name, idx) => {
          const satOffset = userOffsets[`${grp.id}:::${name}`] || { x: 0, y: 0 };
          const offsetX =
            count === 1 ? 0 : -spanWidth / 2 + (idx / (count - 1)) * spanWidth;
          // Positioned safely below (further South) of compression hub
          const staggerY =
            hubs.compression.y + Math.round((70 + (idx % 2) * 50) * orbitSpacing);
          hubs.compression.satellites.push({
            name,
            x: Math.round(hubs.compression.x + offsetX + satOffset.x),
            y: Math.round(staggerY + satOffset.y),
          });
        });
      }
    }

    return hubs;
  }, [metadata.submissions, isWhite, orbitSpacing, currentLayout.submissionOffsets]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) {
      const deltaX = (e.clientX - dragState.startMouseX) / zoom;
      const deltaY = (e.clientY - dragState.startMouseY) / zoom;

      if (dragState.type === 'folder') {
        const deltaBaseX = deltaX / orbitSpacing;
        const deltaBaseY = deltaY / orbitSpacing;
        const nextFolders = {
          ...currentLayout.folders,
          [dragState.id]: {
            collapsed: currentLayout.folders[dragState.id]?.collapsed || false,
            x: Math.round(dragState.initialX + deltaBaseX),
            y: Math.round(dragState.initialY + deltaBaseY),
          },
        };
        onUpdateMindmapState({
          ...mindmapState,
          [viewMode]: {
            ...currentLayout,
            folders: nextFolders,
          },
        });
      } else if (dragState.type === 'card') {
        const nextOffsets = {
          ...currentLayout.cardOffsets,
          [dragState.id]: {
            dx: Math.round(dragState.initialX + deltaX),
            dy: Math.round(dragState.initialY + deltaY),
          },
        };
        onUpdateMindmapState({
          ...mindmapState,
          [viewMode]: {
            ...currentLayout,
            cardOffsets: nextOffsets,
          },
        });
      } else if (dragState.type === 'submissionHub' || dragState.type === 'submissionSat') {
        const currentSubOffsets = currentLayout.submissionOffsets || {};
        const nextSubOffsets = {
          ...currentSubOffsets,
          [dragState.id]: {
            x: Math.round(dragState.initialX + deltaX),
            y: Math.round(dragState.initialY + deltaY),
          },
        };
        onUpdateMindmapState({
          ...mindmapState,
          [viewMode]: {
            ...currentLayout,
            submissionOffsets: nextSubOffsets,
          },
        });
      }
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
  };

  // Window-level mousemove and mouseup listeners to guarantee buttery-smooth, un-clipped dragging across the entire screen
  useEffect(() => {
    if (!isPanning && !dragState) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (dragState) {
        const currentZoom = zoomRef.current;
        const currentOrbit = orbitSpacingRef.current;
        const layout = currentLayoutRef.current;
        const deltaX = (e.clientX - dragState.startMouseX) / currentZoom;
        const deltaY = (e.clientY - dragState.startMouseY) / currentZoom;

        if (dragState.type === 'folder') {
          const deltaBaseX = deltaX / currentOrbit;
          const deltaBaseY = deltaY / currentOrbit;
          const nextFolders = {
            ...layout.folders,
            [dragState.id]: {
              collapsed: layout.folders[dragState.id]?.collapsed || false,
              x: Math.round(dragState.initialX + deltaBaseX),
              y: Math.round(dragState.initialY + deltaBaseY),
            },
          };
          onUpdateMindmapState({
            ...mindmapStateRef.current,
            [viewModeRef.current]: {
              ...layout,
              folders: nextFolders,
            },
          });
        } else if (dragState.type === 'card') {
          const nextOffsets = {
            ...layout.cardOffsets,
            [dragState.id]: {
              dx: Math.round(dragState.initialX + deltaX),
              dy: Math.round(dragState.initialY + deltaY),
            },
          };
          onUpdateMindmapState({
            ...mindmapStateRef.current,
            [viewModeRef.current]: {
              ...layout,
              cardOffsets: nextOffsets,
            },
          });
        } else if (
          dragState.type === 'submissionHub' ||
          dragState.type === 'submissionSat'
        ) {
          const currentSubOffsets = layout.submissionOffsets || {};
          const nextSubOffsets = {
            ...currentSubOffsets,
            [dragState.id]: {
              x: Math.round(dragState.initialX + deltaX),
              y: Math.round(dragState.initialY + deltaY),
            },
          };
          onUpdateMindmapState({
            ...mindmapStateRef.current,
            [viewModeRef.current]: {
              ...layout,
              submissionOffsets: nextSubOffsets,
            },
          });
        }
        return;
      }

      if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      }
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (dragState && e.touches.length > 0) {
        const t = e.touches[0];
        const currentZoom = zoomRef.current;
        const currentOrbit = orbitSpacingRef.current;
        const layout = currentLayoutRef.current;
        const deltaX = (t.clientX - dragState.startMouseX) / currentZoom;
        const deltaY = (t.clientY - dragState.startMouseY) / currentZoom;

        if (dragState.type === 'folder') {
          const deltaBaseX = deltaX / currentOrbit;
          const deltaBaseY = deltaY / currentOrbit;
          const nextFolders = {
            ...layout.folders,
            [dragState.id]: {
              collapsed: layout.folders[dragState.id]?.collapsed || false,
              x: Math.round(dragState.initialX + deltaBaseX),
              y: Math.round(dragState.initialY + deltaBaseY),
            },
          };
          onUpdateMindmapState({
            ...mindmapStateRef.current,
            [viewModeRef.current]: {
              ...layout,
              folders: nextFolders,
            },
          });
        } else if (dragState.type === 'card') {
          const nextOffsets = {
            ...layout.cardOffsets,
            [dragState.id]: {
              dx: Math.round(dragState.initialX + deltaX),
              dy: Math.round(dragState.initialY + deltaY),
            },
          };
          onUpdateMindmapState({
            ...mindmapStateRef.current,
            [viewModeRef.current]: {
              ...layout,
              cardOffsets: nextOffsets,
            },
          });
        } else if (
          dragState.type === 'submissionHub' ||
          dragState.type === 'submissionSat'
        ) {
          const currentSubOffsets = layout.submissionOffsets || {};
          const nextSubOffsets = {
            ...currentSubOffsets,
            [dragState.id]: {
              x: Math.round(dragState.initialX + deltaX),
              y: Math.round(dragState.initialY + deltaY),
            },
          };
          onUpdateMindmapState({
            ...mindmapStateRef.current,
            [viewModeRef.current]: {
              ...layout,
              submissionOffsets: nextSubOffsets,
            },
          });
        }
      }
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
      setDragState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handleWindowMouseUp);
    window.addEventListener('touchcancel', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
      window.removeEventListener('touchcancel', handleWindowMouseUp);
    };
  }, [isPanning, dragState, onUpdateMindmapState]);

  const handleToggleFolderCollapse = (clusterName: string, cIdx: number) => {
    const base = getBaseFolderCoord(clusterName, cIdx);
    const nextFolders = {
      ...currentLayout.folders,
      [clusterName]: {
        x: base.x,
        y: base.y,
        collapsed: !base.collapsed,
      },
    };
    onUpdateMindmapState({
      ...mindmapState,
      [viewMode]: {
        ...currentLayout,
        folders: nextFolders,
      },
    });
  };

  const handleCollapseAllFolders = (collapsed: boolean) => {
    const nextFolders: MindmapModeLayout['folders'] = {};
    clusterNames.forEach((name, idx) => {
      const base = getBaseFolderCoord(name, idx);
      nextFolders[name] = {
        x: base.x,
        y: base.y,
        collapsed,
      };
    });
    onUpdateMindmapState({
      ...mindmapState,
      [viewMode]: {
        ...currentLayout,
        folders: nextFolders,
      },
    });
  };

  const handleFolderLockedAutoArrange = () => {
    const preservedFolders: MindmapModeLayout['folders'] = {};
    clusterNames.forEach((name, idx) => {
      preservedFolders[name] = getBaseFolderCoord(name, idx);
    });

    onUpdateMindmapState({
      ...mindmapState,
      [viewMode]: {
        folders: preservedFolders,
        cardOffsets: {},
        submissionOffsets: currentLayout.submissionOffsets,
      },
    });

    setArrangeToast(
      '폴더 위치를 보존한 채, 폴더 내부 기술 카드들만 격자 규격으로 깔끔하게 정돈했습니다.'
    );
    setTimeout(() => setArrangeToast(null), 3200);
  };

  const handleResetCircularOrbit = () => {
    const nextFolders: MindmapModeLayout['folders'] = {};
    const total = Math.max(1, clusterNames.length);
    const R = computeUniformMindmapRadius(total, viewMode);
    const rX = Math.round(R * 1.06);
    const rY = R;
    clusterNames.forEach((name, idx) => {
      const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
      nextFolders[name] = {
        x: Math.round(Math.cos(angle) * rX),
        y: Math.round(Math.sin(angle) * rY),
        collapsed: currentLayout.folders[name]?.collapsed || false,
      };
    });
    onUpdateMindmapState({
      ...mindmapState,
      [viewMode]: {
        folders: nextFolders,
        cardOffsets: {},
        submissionOffsets: {},
      },
    });
    setArrangeToast(
      '모든 폴더의 간격을 완전히 균등하게 정원형으로 자동 배치했습니다.'
    );
    setTimeout(() => setArrangeToast(null), 3200);
  };

  // Native non-passive wheel event listener to strictly zoom without scrolling outer webpage
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const worldX = (mouseX - currentPan.x) / currentZoom;
      const worldY = (mouseY - currentPan.y) / currentZoom;

      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const nextZoom = Math.min(
        2.5,
        Math.max(0.3, Math.round(currentZoom * factor * 1000) / 1000)
      );

      const nextPanX = mouseX - worldX * nextZoom;
      const nextPanY = mouseY - worldY * nextZoom;

      setZoom(nextZoom);
      setPan({ x: nextPanX, y: nextPanY });
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Native non-passive touch event listeners for 1-finger pan and 2-finger pinch-to-zoom on mobile smartphones
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleNativeTouchStart = (e: TouchEvent) => {
      // Allow interaction with buttons, inputs, links, and search dropdowns
      if ((e.target as HTMLElement)?.closest('button, input, select, a, textarea')) {
        return;
      }

      if (e.touches.length === 1) {
        // Single finger touch: Start smooth canvas pan
        const t = e.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startTouches: [{ clientX: t.clientX, clientY: t.clientY }],
          startPan: { ...panRef.current },
          startZoom: zoomRef.current,
          initialDistance: 0,
          worldFocalPoint: { x: 0, y: 0 },
        };
        setIsPanning(true);
      } else if (e.touches.length >= 2) {
        // Two fingers touch: Start pinch-to-zoom
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const rect = el.getBoundingClientRect();
        const centerOffsetX = midX - rect.left - rect.width / 2;
        const centerOffsetY = midY - rect.top - rect.height / 2;

        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;
        const worldX = (centerOffsetX - currentPan.x) / currentZoom;
        const worldY = (centerOffsetY - currentPan.y) / currentZoom;

        touchStateRef.current = {
          mode: 'pinch',
          startTouches: [
            { clientX: t1.clientX, clientY: t1.clientY },
            { clientX: t2.clientX, clientY: t2.clientY },
          ],
          startPan: { ...currentPan },
          startZoom: currentZoom,
          initialDistance: Math.max(10, dist),
          worldFocalPoint: { x: worldX, y: worldY },
        };
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      if (touchStateRef.current.mode === 'none') return;
      
      // Prevent default webpage scrolling during diagram touch interaction
      if (e.cancelable) {
        e.preventDefault();
      }

      if (e.touches.length === 1 && touchStateRef.current.mode === 'pan') {
        const t = e.touches[0];
        const start = touchStateRef.current.startTouches[0];
        if (!start) return;
        const deltaX = t.clientX - start.clientX;
        const deltaY = t.clientY - start.clientY;
        setPan({
          x: Math.round(touchStateRef.current.startPan.x + deltaX),
          y: Math.round(touchStateRef.current.startPan.y + deltaY),
        });
      } else if (e.touches.length >= 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const initialDist = touchStateRef.current.initialDistance || 1;
        const initialZoom = touchStateRef.current.startZoom;
        const scale = dist / initialDist;

        const nextZoom = Math.min(
          2.5,
          Math.max(0.25, Math.round(initialZoom * scale * 1000) / 1000)
        );

        const rect = el.getBoundingClientRect();
        const centerOffsetX = midX - rect.left - rect.width / 2;
        const centerOffsetY = midY - rect.top - rect.height / 2;

        const worldX = touchStateRef.current.worldFocalPoint.x;
        const worldY = touchStateRef.current.worldFocalPoint.y;

        const nextPanX = Math.round(centerOffsetX - worldX * nextZoom);
        const nextPanY = Math.round(centerOffsetY - worldY * nextZoom);

        setZoom(nextZoom);
        setPan({ x: nextPanX, y: nextPanY });
      }
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchStateRef.current.mode = 'none';
        setIsPanning(false);
      } else if (e.touches.length === 1) {
        // Transition gracefully back to pan with remaining finger
        const t = e.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startTouches: [{ clientX: t.clientX, clientY: t.clientY }],
          startPan: { ...panRef.current },
          startZoom: zoomRef.current,
          initialDistance: 0,
          worldFocalPoint: { x: 0, y: 0 },
        };
      }
    };

    el.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    el.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    el.addEventListener('touchend', handleNativeTouchEnd, { passive: false });
    el.addEventListener('touchcancel', handleNativeTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleNativeTouchStart);
      el.removeEventListener('touchmove', handleNativeTouchMove);
      el.removeEventListener('touchend', handleNativeTouchEnd);
      el.removeEventListener('touchcancel', handleNativeTouchEnd);
    };
  }, []);

  const buildBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx1 = x1 + dx * 0.35;
    const cy1 = y1 + dy * 0.1;
    const cx2 = x1 + dx * 0.65;
    const cy2 = y2 - dy * 0.1;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  const toolbarPosition: MindmapToolbarPosition =
    settings.mindmapToolbarPosition || 'top';
  const isVertical = toolbarPosition === 'left' || toolbarPosition === 'right';

  // Camera focal point centering
  const focusOnCoordinate = (worldX: number, worldY: number, targetZoom = 0.88) => {
    setZoom(targetZoom);
    setPan({
      x: Math.round(-worldX * targetZoom),
      y: Math.round(-worldY * targetZoom),
    });
  };

  // Real-time Autocomplete Suggestions for Positions, Submissions, Categories & Videos
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{
      id: string;
      name: string;
      subText: string;
      type: 'position' | 'submission' | 'category' | 'video';
      groupId?: SubmissionGroupId;
      count?: number;
      badgeLabel: string;
      badgeColor: string;
      videoObj?: TechniqueVideo;
    }> = [];

    // 1. Positions (시작 포지션)
    metadata.positions.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      ) {
        const count = videos.filter((v) => v.position === p.name).length;
        results.push({
          id: p.id,
          name: p.name,
          subText: language === 'ko' ? `시작 포지션 폴더 · 등록 영상 ${count}개` : `Starting Position · ${count} videos`,
          type: 'position',
          count,
          badgeLabel: language === 'ko' ? '시작 포지션' : 'Position',
          badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        });
      }
    });

    // 2. Submissions (서브미션 피니시)
    metadata.submissions.forEach((grp) => {
      // Hub group name match
      if (
        grp.name.toLowerCase().includes(q) ||
        (grp.directionLabel && grp.directionLabel.toLowerCase().includes(q)) ||
        (grp.hubTitle && grp.hubTitle.toLowerCase().includes(q))
      ) {
        const count = videos.filter((v) => v.submissionGroup === grp.id).length;
        results.push({
          id: grp.id,
          name: cleanHubTitle(grp.hubTitle),
          subText: language === 'ko' ? `${grp.directionLabel ? `${grp.directionLabel} ` : ''}${grp.name} · 피니시 ${grp.items.length}종류 (${count}개 영상)` : `${grp.name} · ${grp.items.length} finishes (${count} videos)`,
          type: 'submission',
          groupId: grp.id,
          count,
          badgeLabel: language === 'ko' ? '서브미션 기둥' : 'Submission Hub',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        });
      }

      // Satellite item match
      grp.items.forEach((item) => {
        if (item.toLowerCase().includes(q)) {
          const count = videos.filter(
            (v) =>
              v.submissionGroup === grp.id &&
              v.submissionDetail &&
              v.submissionDetail.includes(item)
          ).length;
          results.push({
            id: `${grp.id}-${item}`,
            name: item,
            subText: language === 'ko' ? `${grp.directionLabel ? `${grp.directionLabel} ` : ''}${grp.name} (${cleanHubTitle(grp.hubTitle)}) · 영상 ${count}개` : `${grp.name} · ${count} videos`,
            type: 'submission',
            groupId: grp.id,
            count,
            badgeLabel: language === 'ko' ? '서브미션 피니시' : 'Finish',
            badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          });
        }
      });
    });

    // 3. Categories (기술 성격)
    metadata.categories.forEach((cat) => {
      if (cat.toLowerCase().includes(q)) {
        const count = videos.filter((v) => v.category === cat).length;
        results.push({
          id: cat,
          name: cat,
          subText: language === 'ko' ? `기술 성격 카테고리 · 영상 ${count}개` : `Category · ${count} videos`,
          type: 'category',
          count,
          badgeLabel: language === 'ko' ? '기술 성격' : 'Category',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        });
      }
    });

    // 4. Videos (등록된 기술 영상)
    videos.forEach((v) => {
      if (
        v.titleKo.toLowerCase().includes(q) ||
        (v.titleEn && v.titleEn.toLowerCase().includes(q)) ||
        (v.submissionDetail && v.submissionDetail.toLowerCase().includes(q))
      ) {
        results.push({
          id: v.id,
          name: v.titleKo,
          subText: `${v.position} · ${v.category} · ${
            v.proficiencyScore > 0 ? (language === 'ko' ? `숙련도 ${v.proficiencyScore}점` : `Score ${v.proficiencyScore} pts`) : (language === 'ko' ? '미평가' : 'Unrated')
          }`,
          type: 'video',
          videoObj: v,
          badgeLabel: language === 'ko' ? '기술 영상' : 'Video',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        });
      }
    });

    return results;
  }, [searchQuery, metadata, videos]);

  const handleSelectSearchResult = (item: {
    id: string;
    name: string;
    type: 'position' | 'submission' | 'category' | 'video';
    groupId?: SubmissionGroupId;
    videoObj?: TechniqueVideo;
  }) => {
    setIsSearchOpen(false);

    if (item.type === 'position' || item.type === 'category') {
      if (item.type === 'position' && viewMode !== 'byPosition') {
        setViewMode('byPosition');
      } else if (item.type === 'category' && viewMode !== 'byCategory') {
        setViewMode('byCategory');
      }

      setFrontFolder(item.name);
      setHighlightedItem({ id: item.name, type: 'folder' });

      const cIdx = clusterNames.indexOf(item.name);
      const folderCoord = getFolderCoord(item.name, cIdx >= 0 ? cIdx : 0);
      focusOnCoordinate(folderCoord.x, folderCoord.y, 0.88);
      setArrangeToast(language === 'ko' ? `'${item.name}' 포지션 폴더로 화면을 이동했습니다.` : `Moved to '${item.name}' folder.`);
    } else if (item.type === 'submission') {
      setHighlightedItem({ id: item.name, type: 'submission' });
      const grp = metadata.submissions.find(
        (g) => g.id === item.groupId || g.items.includes(item.name)
      );
      if (grp) {
        const hub = compassSubmissionLayout[grp.id];
        if (hub) {
          const sat = hub.satellites.find((s) => s.name === item.name);
          const tx = sat ? sat.x : hub.x;
          const ty = sat ? sat.y : hub.y;
          focusOnCoordinate(tx, ty, 0.95);
          setArrangeToast(language === 'ko' ? `'${item.name}' 서브미션 피니시로 화면을 이동했습니다.` : `Moved to '${item.name}' finish.`);
        }
      }
    } else if (item.type === 'video' && item.videoObj) {
      const v = item.videoObj;
      setFrontFolder(v.position);
      setHighlightedItem({ id: v.id, type: 'video' });

      const cardPos = cardWorldPositions[v.id];
      if (cardPos) {
        focusOnCoordinate(cardPos.x, cardPos.y, 1.0);
      } else {
        const cIdx = clusterNames.indexOf(v.position);
        const folderCoord = getFolderCoord(v.position, cIdx >= 0 ? cIdx : 0);
        focusOnCoordinate(folderCoord.x, folderCoord.y, 0.88);
      }
      setArrangeToast(language === 'ko' ? `'${v.titleKo}' 기술 위치로 화면을 이동했습니다.` : `Moved to '${v.titleEn || v.titleKo}'.`);
    }

    setTimeout(() => {
      setHighlightedItem(null);
    }, 3500);
  };

  const renderMindmapSearchBar = () => {
    return (
      <div ref={searchContainerRef} className="relative w-full z-30">
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all shadow-2xs ${
            isSearchOpen
              ? 'bg-white border-sky-500 ring-3 ring-sky-500/20 shadow-md'
              : isWhite
                ? 'bg-white border-slate-200 hover:border-slate-300'
                : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          <Search className="w-4 h-4 text-sky-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder={language === 'ko' ? "다이어그램 내 포지션, 서브미션, 기술명 검색..." : "Search positions, submissions, techniques in diagram..."}
            className={`w-full bg-transparent text-xs font-semibold focus:outline-none placeholder:text-slate-400 ${
              isWhite ? 'text-slate-900' : 'text-slate-100'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              title={language === 'ko' ? "검색어 지우기" : "Clear search"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {searchQuery.trim() && (
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shrink-0 whitespace-nowrap">
              {searchSuggestions.length} {language === 'ko' ? '건 검색됨' : 'found'}
            </span>
          )}
        </div>

        {/* Live Suggestions Dropdown */}
        {isSearchOpen && searchSuggestions.length > 0 && (
          <div
            className={`absolute top-full left-0 right-0 mt-1.5 max-h-80 overflow-y-auto rounded-2xl border shadow-2xl p-2 space-y-1 custom-scrollbar animate-in fade-in zoom-in-95 duration-150 ${
              isWhite
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
              <span>{language === 'ko' ? '연관 검색 결과' : 'Search Results'} ({searchSuggestions.length})</span>
              <span className="text-[10px] text-sky-600">{language === 'ko' ? '클릭 시 해당 위치로 즉시 이동' : 'Click to jump to location'}</span>
            </div>

            {searchSuggestions.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer group ${
                  isWhite
                    ? 'hover:bg-sky-50/80 active:bg-sky-100'
                    : 'hover:bg-slate-800 active:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${item.badgeColor}`}
                  >
                    {item.badgeLabel}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.subText}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{language === 'ko' ? '이동' : 'Jump'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearchOpen && searchQuery.trim() && searchSuggestions.length === 0 && (
          <div
            className={`absolute top-full left-0 right-0 mt-1.5 p-5 rounded-2xl border shadow-2xl text-center text-xs space-y-1 animate-in fade-in duration-150 ${
              isWhite
                ? 'bg-white border-slate-200 text-slate-500'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="font-bold text-slate-700">{language === 'ko' ? '검색 결과가 없습니다.' : 'No search results found.'}</div>
            <div className="text-[11px] text-slate-400">
              {language === 'ko' ? `'${searchQuery}'에 일치하는 포지션이나 서브미션 항목이 없습니다.` : `No items matching '${searchQuery}'.`}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHorizontalToolbar = () => (
    <div
      className={`rounded-2xl border p-3.5 space-y-3 ${
        isWhite
          ? 'bg-white text-slate-800 border-slate-200 shadow-2xs'
          : 'bg-slate-900 text-slate-100 border-slate-800'
      }`}
    >
      {/* Quick Search Inside Toolbar Box (User Request) */}
      <div className="w-full">
        {renderMindmapSearchBar()}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode('byPosition')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'byPosition'
                  ? 'bg-blue-600 text-white'
                  : isWhite
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{language === 'ko' ? '포지션별 클러스터' : 'By Position'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('byCategory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'byCategory'
                  ? 'bg-blue-600 text-white'
                  : isWhite
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'ko' ? '기술 성격별 클러스터' : 'By Category'}</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => handleCollapseAllFolders(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isWhite
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title={language === 'ko' ? "모든 폴더 창을 줄입니다" : "Collapse all folder windows"}
            >
              <Minimize2 className="w-3.5 h-3.5 text-sky-600" />
              <span>{language === 'ko' ? '폴더 창 모두 줄이기' : 'Collapse All'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCollapseAllFolders(false)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isWhite
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Expand className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ko' ? '모두 펼치기' : 'Expand All'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEmptyFolders(!showEmptyFolders)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                isWhite ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{showEmptyFolders ? (language === 'ko' ? '빈 폴더 숨김' : 'Hide Empty') : (language === 'ko' ? '빈 폴더 표시' : 'Show Empty')}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border ${
            isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setScoreFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              scoreFilter === 'all'
                ? isWhite
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'bg-slate-800 text-white'
                : isWhite
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'ko' ? '전체 테크트리' : 'All Techniques'}
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('high')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              scoreFilter === 'high'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {language === 'ko' ? `${settings.highScoreThreshold}점 이상 고속도로` : `${settings.highScoreThreshold}+ pts Strengths`}
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('low')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              scoreFilter === 'low'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            {language === 'ko' ? `${settings.lowScoreThreshold}점 이하 취약 링크` : `${settings.lowScoreThreshold}- pts Weak Links`}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowUnrated(!showUnrated)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            showUnrated
              ? isWhite
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-slate-800 border-slate-700 text-slate-200'
              : isWhite
                ? 'bg-white border-slate-200 text-slate-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          {showUnrated ? (
            <Eye className="w-3.5 h-3.5 text-sky-600" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          <span>{language === 'ko' ? `미부여 기술 ${showUnrated ? (language === 'ko' ? '표시' : 'Show') : (language === 'ko' ? '숨김' : 'Hide')}` : `Unrated: ${showUnrated ? 'Show' : 'Hide'}`}</span>
        </button>

        {/* Canvas Background Color Toggle (White vs Dark) */}
        <button
          type="button"
          onClick={() => {
            const nextTheme = isWhite ? 'dark' : 'white';
            setCanvasTheme(nextTheme);
            onUpdateSettings?.({ mindmapTheme: nextTheme });
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            isWhite
              ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          title={language === 'ko' ? "캔버스 배경색 전환 (흰색 / 다크)" : "Toggle Background (White / Dark)"}
        >
          {isWhite ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'ko' ? '배경: 흰색' : 'Theme: White'}</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'ko' ? '배경: 다크' : 'Theme: Dark'}</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleFolderLockedAutoArrange}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          title={language === 'ko' ? "내부 기술 카드만 격자 정돈" : "Tidy cards inside folders"}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'ko' ? '폴더 고정 자동 정돈' : 'Tidy Cards'}</span>
        </button>

        <button
          type="button"
          onClick={handleResetCircularOrbit}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isWhite
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title={language === 'ko' ? "원형 궤도 초기화" : "Reset Orbit"}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Spacing / Orbit Radius Scaling Controls */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-xl border ${
            isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              setOrbitSpacing((s) => Math.max(0.6, Math.round((s - 0.15) * 100) / 100))
            }
            className={`p-1 cursor-pointer ${isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            title={language === 'ko' ? "원 크기 및 폴더 간격 축소" : "Contract Orbit Distance"}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <span
            className={`text-xs font-mono tabular-nums px-1 ${
              isWhite ? 'text-slate-800 font-bold' : 'text-slate-200'
            }`}
          >
            간격 {Math.round(orbitSpacing * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setOrbitSpacing((s) => Math.min(2.5, Math.round((s + 0.15) * 100) / 100))
            }
            className={`p-1 cursor-pointer ${isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            title={language === 'ko' ? "원 크기 및 폴더 간격 확대 (파일 사이 넓히기)" : "Expand Orbit Distance"}
          >
            <Expand className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-xl border ${
            isWhite ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.max(0.35, Math.round((z - 0.1) * 100) / 100))
            }
            className={`p-1 cursor-pointer ${isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span
            className={`text-xs font-mono tabular-nums px-1.5 ${
              isWhite ? 'text-slate-800 font-semibold' : 'text-slate-300'
            }`}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.min(1.4, Math.round((z + 0.1) * 100) / 100))
            }
            className={`p-1 cursor-pointer ${isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(0.68);
              setPan({ x: 0, y: 0 });
            }}
            className={`p-1 cursor-pointer ${isWhite ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            title={language === 'ko' ? "화면 중앙 맞춤" : "Center View"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Toolbar Position Switcher */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={() => onUpdateSettings?.({ mindmapToolbarPosition: 'left' })}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              toolbarPosition === 'left'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title="세로형 좌측 툴바로 전환"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings?.({
                mindmapToolbarPosition:
                  toolbarPosition === 'top' ? 'bottom' : 'top',
              })
            }
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              toolbarPosition === 'top' || toolbarPosition === 'bottom'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title={
              toolbarPosition === 'top'
                ? '가로형 하단으로 전환'
                : '가로형 상단으로 전환'
            }
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings?.({ mindmapToolbarPosition: 'right' })
            }
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              toolbarPosition === 'right'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title="세로형 우측 툴바로 전환"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

  const renderVerticalToolbar = () => (
    <div
      className={`w-full lg:w-72 shrink-0 rounded-2xl border p-4 space-y-4 max-h-[760px] overflow-y-auto custom-scrollbar ${
        isWhite
          ? 'bg-white text-slate-800 border-slate-200 shadow-2xs'
          : 'bg-slate-900 text-slate-100 border-slate-800'
      }`}
    >
      {/* Header with Title & Position controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>{language === 'ko' ? '다이어그램 도구함' : 'Diagram Toolbox'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateSettings?.({ mindmapToolbarPosition: 'top' })}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
            title="가로형 상단으로 이동"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings?.({
                mindmapToolbarPosition:
                  toolbarPosition === 'left' ? 'right' : 'left',
              })
            }
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
            title={toolbarPosition === 'left' ? '우측으로 이동' : '좌측으로 이동'}
          >
            {toolbarPosition === 'left' ? (
              <PanelRight className="w-3.5 h-3.5" />
            ) : (
              <PanelLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Search Inside Vertical Toolbox (User Request) */}
      <div className="pt-1 pb-0.5">
        {renderMindmapSearchBar()}
      </div>

      {/* 1. 클러스터 기준 */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-slate-400">{language === 'ko' ? '클러스터 모드' : 'Cluster Mode'}</div>
        <div className="grid grid-cols-1 gap-1">
          <button
            type="button"
            onClick={() => setViewMode('byPosition')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'byPosition'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isWhite
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5" />
              <span>{language === 'ko' ? '포지션별 클러스터' : 'By Position'}</span>
            </span>
            {viewMode === 'byPosition' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('byCategory')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'byCategory'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isWhite
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'ko' ? '기술 성격별 클러스터' : 'By Category'}</span>
            </span>
            {viewMode === 'byCategory' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>
        </div>
      </div>

      {/* 2. 폴더 창 제어 */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400">{language === 'ko' ? '폴더 창 제어' : 'Folder Windows'}</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleCollapseAllFolders(true)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
            title={language === 'ko' ? "모든 폴더 창을 줄입니다" : "Collapse all folder windows"}
          >
            <Minimize2 className="w-3 h-3 text-sky-600" />
            <span>{language === 'ko' ? '모두 줄이기' : 'Collapse All'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCollapseAllFolders(false)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
          >
            <Expand className="w-3 h-3 text-emerald-600" />
            <span>{language === 'ko' ? '모두 펼치기' : 'Expand All'}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowEmptyFolders(!showEmptyFolders)}
          className="w-full flex items-center justify-center py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer"
        >
          {showEmptyFolders ? (language === 'ko' ? '빈 폴더 숨김' : 'Hide Empty') : (language === 'ko' ? '빈 폴더 표시' : 'Show Empty')}
        </button>
      </div>

      {/* 3. 숙련도 필터 */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400">{language === 'ko' ? '숙련도 필터' : 'Score Filter'}</div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setScoreFilter('all')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              scoreFilter === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{language === 'ko' ? '전체 테크트리' : 'All Techniques'}</span>
            <span className="text-[10px] text-slate-400">{videos.length}개</span>
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('high')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              scoreFilter === 'high'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>{language === 'ko' ? `${settings.highScoreThreshold}점 이상 고속도로` : `${settings.highScoreThreshold}+ pts Strengths`}</span>
            <span className="text-[10px]">강점</span>
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('low')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              scoreFilter === 'low'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>{language === 'ko' ? `${settings.lowScoreThreshold}점 이하 취약 링크` : `${settings.lowScoreThreshold}- pts Weak Links`}</span>
            <span className="text-[10px]">보완</span>
          </button>
        </div>
      </div>

      {/* 4. 보기 & 배경 모드 */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400">{language === 'ko' ? '보기 및 배경' : 'View & Theme'}</div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowUnrated(!showUnrated)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              {showUnrated ? (
                <Eye className="w-3.5 h-3.5 text-sky-600" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{language === 'ko' ? '미부여 기술' : 'Unrated'}</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {showUnrated ? (language === 'ko' ? '표시' : 'Show') : (language === 'ko' ? '숨김' : 'Hide')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextTheme = isWhite ? 'dark' : 'white';
              setCanvasTheme(nextTheme);
              onUpdateSettings?.({ mindmapTheme: nextTheme });
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              {isWhite ? (
                <Sun className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>{language === 'ko' ? '배경 색상' : 'Canvas Theme'}</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {isWhite ? (language === 'ko' ? '흰색 (White)' : 'White') : (language === 'ko' ? '다크 (Dark)' : 'Dark')}
            </span>
          </button>
        </div>
      </div>

      {/* 5. 정렬 및 초기화 */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400">{language === 'ko' ? '자동 정돈 및 리셋' : 'Auto-Arrange & Reset'}</div>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleFolderLockedAutoArrange}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            title={language === 'ko' ? "내부 기술 카드만 격자 정돈" : "Tidy cards inside folders"}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? '폴더 고정 자동 정돈' : 'Tidy Cards'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetCircularOrbit}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
            title={language === 'ko' ? "원형 궤도 초기화" : "Reset Orbit"}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'ko' ? '원형 궤도 초기화' : 'Reset Orbit'}</span>
          </button>
        </div>
      </div>

      {/* 6. 폴더 간격 & 줌 */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>{language === 'ko' ? '폴더 간격 (거리)' : 'Folder Distance'}</span>
            <span className="font-mono text-slate-900 font-bold">
              {Math.round(orbitSpacing * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() =>
                setOrbitSpacing((s) =>
                  Math.max(0.6, Math.round((s - 0.15) * 100) / 100)
                )
              }
              className="p-1 flex-1 flex justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded cursor-pointer"
              title="원 크기 및 폴더 간격 축소"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setOrbitSpacing((s) =>
                  Math.min(2.5, Math.round((s + 0.15) * 100) / 100)
                )
              }
              className="p-1 flex-1 flex justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded cursor-pointer"
              title="원 크기 및 폴더 간격 확대"
            >
              <Expand className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>{language === 'ko' ? '캔버스 줌 배율' : 'Zoom Level'}</span>
            <span className="font-mono text-slate-900 font-bold">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(0.35, Math.round((z - 0.1) * 100) / 100))
              }
              className="p-1 flex-1 flex justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded cursor-pointer"
              title={language === 'ko' ? "축소" : "Zoom Out"}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(0.68);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 flex-1 flex justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded cursor-pointer"
              title={language === 'ko' ? "화면 중앙 맞춤" : "Center View"}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.min(1.4, Math.round((z + 0.1) * 100) / 100))
              }
              className="p-1 flex-1 flex justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded cursor-pointer"
              title={language === 'ko' ? "확대" : "Zoom In"}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const canvasElement = (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      className={`relative w-full h-[calc(100dvh-172px)] min-h-[360px] md:h-[760px] rounded-xl md:rounded-2xl overflow-hidden border select-none cursor-grab active:cursor-grabbing transition-colors touch-none ${
        isWhite
          ? 'bg-white border-slate-300 shadow-sm'
          : 'bg-[#090b10] border-slate-800'
      }`}
      style={{
        backgroundImage: isWhite
          ? 'radial-gradient(rgba(100, 116, 139, 0.25) 1px, transparent 1px)'
          : 'radial-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
        {/* Top-Left Legend Overlay (Desktop / Tablet) */}
        <div
          className={`absolute top-3 left-3 md:top-4 md:left-4 z-20 hidden sm:flex flex-wrap items-center gap-2 md:gap-3 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl border text-[10px] md:text-[11px] pointer-events-none ${
            isWhite
              ? 'bg-white/95 border-slate-200 text-slate-700 shadow-md backdrop-blur-xs'
              : 'bg-slate-950/85 border-slate-800 text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            강점 ({settings.highScoreThreshold}~10점)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            발전 구간
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            취약 링크 (1~{settings.lowScoreThreshold}점)
          </span>
        </div>

        {/* Transformed World Origin at Center of Viewport */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* SVG Layer for Orbit Rings & Bezier Curve Connectors */}
          <svg
            width="2600"
            height="2000"
            viewBox="-1300 -1000 2600 2000"
            className="overflow-visible pointer-events-none"
            style={{
              position: 'absolute',
              left: -1300,
              top: -1000,
            }}
          >
            {/* Concentric Orbit Guide Rings */}
            <circle
              cx={0}
              cy={0}
              r={Math.round(410 * orbitSpacing)}
              fill="none"
              stroke={isWhite ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.12)'}
              strokeWidth={1.2}
              strokeDasharray="4 4"
            />
            <circle
              cx={0}
              cy={0}
              r={Math.round(620 * orbitSpacing)}
              fill="none"
              stroke={isWhite ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.1)'}
              strokeWidth={1.2}
            />

            {/* Subtle Connector Lines from Main 4 Compass Hubs to their Outer Satellite Nodes */}
            {(Object.keys(compassSubmissionLayout) as SubmissionGroupId[]).map(
              (grpId) => {
                const hub = compassSubmissionLayout[grpId];
                return hub.satellites.map((sat) => (
                  <path
                    key={`hub-sat-${grpId}-${sat.name}`}
                    d={buildBezierPath(hub.x, hub.y, sat.x, sat.y)}
                    fill="none"
                    stroke={hub.colorHex}
                    strokeOpacity={isWhite ? 0.35 : 0.22}
                    strokeWidth={1.2}
                    strokeDasharray="2 3"
                  />
                ));
              }
            )}

            {/* Bezier Curves from Technique Cards directly to Outer Satellite Submission Nodes (Multi-Select Supported) */}
            {visibleVideos.map((v) => {
              const cardPos = cardWorldPositions[v.id];
              if (!cardPos) return null;

              const details = parseSubmissionDetails(v.submissionDetail);
              if (
                details.length === 0 &&
                (v.submissionGroup === 'none' || !v.submissionGroup)
              ) {
                return null;
              }

              // Collect target satellite nodes across ALL submission groups
              const targetNodes: Array<{
                name: string;
                x: number;
                y: number;
                colorHex: string;
              }> = [];

              if (details.length > 0) {
                details.forEach((detName) => {
                  // Find which group this submission belongs to
                  const matchedGroup =
                    metadata.submissions.find((g) => g.items.includes(detName)) ||
                    (v.submissionGroup !== 'none'
                      ? metadata.submissions.find((g) => g.id === v.submissionGroup)
                      : null);

                  if (matchedGroup) {
                    const hub = compassSubmissionLayout[matchedGroup.id];
                    if (hub) {
                      const sat = hub.satellites.find((s) => s.name === detName);
                      if (sat) {
                        targetNodes.push({
                          name: sat.name,
                          x: sat.x,
                          y: sat.y,
                          colorHex: hub.colorHex,
                        });
                      } else {
                        targetNodes.push({
                          name: detName,
                          x: hub.x,
                          y: hub.y,
                          colorHex: hub.colorHex,
                        });
                      }
                    }
                  }
                });
              } else if (v.submissionGroup !== 'none') {
                const hub = compassSubmissionLayout[v.submissionGroup];
                if (hub) {
                  const firstSat =
                    hub.satellites[0] || { x: hub.x, y: hub.y, name: '' };
                  targetNodes.push({
                    name: firstSat.name,
                    x: firstSat.x,
                    y: firstSat.y,
                    colorHex: hub.colorHex,
                  });
                }
              }

              if (targetNodes.length === 0) return null;

              const isStrong =
                v.proficiencyScore >= settings.highScoreThreshold;
              const isWeak =
                v.proficiencyScore > 0 &&
                v.proficiencyScore <= settings.lowScoreThreshold;

              const customSubLineColor =
                settings.mindmapColors?.submissionLineColor;

              return targetNodes.map((targetNode, satIdx) => {
                const strokeColor = customSubLineColor
                  ? customSubLineColor
                  : isStrong
                    ? '#059669'
                    : isWeak
                      ? '#e11d48'
                      : targetNode.colorHex;

                return (
                  <g key={`sub-curve-${v.id}-${targetNode.name}-${satIdx}`}>
                    <path
                      d={buildBezierPath(
                        cardPos.x,
                        cardPos.y,
                        targetNode.x,
                        targetNode.y
                      )}
                      fill="none"
                      stroke={strokeColor}
                      strokeOpacity={isWhite ? 0.8 : isStrong ? 0.9 : 0.65}
                      strokeWidth={isStrong ? 2.4 : 1.8}
                      strokeDasharray={isWhite ? '5 4' : '4 4'}
                    />
                    <circle
                      cx={targetNode.x}
                      cy={targetNode.y}
                      r={isWhite ? 4 : 3.5}
                      fill={strokeColor}
                    />
                  </g>
                );
              });
            })}

            {/* Bezier Curves for End Position (최종 포지션 전개 연계선 - 다중 연계 지원) */}
            {visibleVideos.flatMap((v) => {
              const targetEndPositions = getEndPositionsArray(v);
              if (targetEndPositions.length === 0) return [];

              const fromPos = cardWorldPositions[v.id];
              if (!fromPos) return [];

              const endLineColor =
                settings.mindmapColors?.endPositionLineColor || '#8b5cf6';

              return targetEndPositions.map((endPosName) => {
                if (endPosName === v.position) return null;

                const targetIdx = metadata.positions.findIndex(
                  (p) => p.name === endPosName
                );
                if (targetIdx < 0) return null;

                const targetFolder = getFolderCoord(endPosName, targetIdx);

                return (
                  <g key={`endpos-curve-${v.id}-${endPosName}`}>
                    <path
                      d={buildBezierPath(
                        fromPos.x,
                        fromPos.y,
                        targetFolder.x,
                        targetFolder.y - 15
                      )}
                      fill="none"
                      stroke={endLineColor}
                      strokeOpacity={isWhite ? 0.85 : 0.7}
                      strokeWidth={2.2}
                      strokeDasharray="6 4"
                    />
                    <circle
                      cx={targetFolder.x}
                      cy={targetFolder.y - 15}
                      r={isWhite ? 4.5 : 4}
                      fill={endLineColor}
                    />
                  </g>
                );
              });
            })}

            {/* Bezier Curves for Technique-to-Technique Chains (nextTechniqueIds) */}
            {visibleVideos.map((v) => {
              const fromPos = cardWorldPositions[v.id];
              if (!fromPos || !v.nextTechniqueIds?.length) return null;
              return v.nextTechniqueIds.map((targetId) => {
                const toPos = cardWorldPositions[targetId];
                if (!toPos) return null;
                return (
                  <path
                    key={`chain-${v.id}-${targetId}`}
                    d={buildBezierPath(fromPos.x, fromPos.y, toPos.x, toPos.y)}
                    fill="none"
                    stroke={isWhite ? '#0284c7' : '#38bdf8'}
                    strokeOpacity={isWhite ? 0.75 : 0.55}
                    strokeWidth={2}
                  />
                );
              });
            })}
          </svg>

          {/* 4-Direction Compass Main Hubs & Outer Satellite Submission Nodes */}
          {metadata.submissions.map((grp) => {
            const hub = compassSubmissionLayout[grp.id];
            if (!hub) return null;

            return (
              <React.Fragment key={grp.id}>
                {/* Main Compass Hub (Draggable) */}
                <div
                  style={{
                    transform: `translate(${hub.x}px, ${hub.y}px) translate(-50%, -50%)`,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const currentOffset =
                      currentLayout.submissionOffsets?.[grp.id] || { x: 0, y: 0 };
                    setDragState({
                      type: 'submissionHub',
                      id: grp.id,
                      startMouseX: e.clientX,
                      startMouseY: e.clientY,
                      initialX: currentOffset.x,
                      initialY: currentOffset.y,
                    });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    const t = e.touches[0];
                    const currentOffset =
                      currentLayout.submissionOffsets?.[grp.id] || { x: 0, y: 0 };
                    setDragState({
                      type: 'submissionHub',
                      id: grp.id,
                      startMouseX: t.clientX,
                      startMouseY: t.clientY,
                      initialX: currentOffset.x,
                      initialY: currentOffset.y,
                    });
                  }}
                  className={`absolute z-10 px-4 py-2 rounded-full border ${hub.borderClass} ${hub.bgClass} flex items-center gap-2 whitespace-nowrap cursor-move select-none shadow-md hover:scale-105 active:scale-95 transition-transform ${
                    highlightedItem?.id === grp.id || highlightedItem?.id === cleanHubTitle(grp.hubTitle)
                      ? 'ring-4 ring-indigo-500 scale-110 shadow-2xl animate-pulse z-40'
                      : ''
                  }`}
                  title={`${cleanHubTitle(grp.hubTitle)} (클릭하여 자유롭게 드래그 이동 가능)`}
                >
                  {grp.customImageUrl ? (
                    <img
                      src={grp.customImageUrl}
                      alt={grp.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: hub.colorHex }}
                    />
                  )}
                  <span className={`text-xs font-bold ${hub.textClass}`}>
                    {cleanHubTitle(grp.hubTitle)}
                  </span>
                </div>

                {/* Outer Satellite Submission Nodes (Draggable) */}
                {hub.satellites.map((sat) => {
                  const connectedCount = visibleVideos.filter(
                    (v) =>
                      v.submissionGroup === grp.id &&
                      v.submissionDetail.includes(sat.name)
                  ).length;

                  let satStyle = isWhite
                    ? 'border-slate-300 bg-white text-slate-700 shadow-2xs hover:border-slate-400'
                    : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700';

                  if (connectedCount > 0) {
                    satStyle = `${hub.borderClass} ${hub.bgClass} ${hub.textClass} shadow-md`;
                  }

                  const satKey = `${grp.id}:::${sat.name}`;
                  const isHighlighted =
                    highlightedItem?.id === sat.name || highlightedItem?.id === satKey;

                  let satCustomStyle: React.CSSProperties = {
                    transform: `translate(${sat.x}px, ${sat.y}px) translate(-50%, -50%)`,
                  };
                  if (connectedCount > 0 && settings.mindmapColors?.submissionNodeColor) {
                    satCustomStyle.borderColor = settings.mindmapColors.submissionNodeColor;
                  }

                  return (
                    <div
                      key={satKey}
                      style={satCustomStyle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const currentOffset =
                          currentLayout.submissionOffsets?.[satKey] || { x: 0, y: 0 };
                        setDragState({
                          type: 'submissionSat',
                          id: satKey,
                          startMouseX: e.clientX,
                          startMouseY: e.clientY,
                          initialX: currentOffset.x,
                          initialY: currentOffset.y,
                        });
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const t = e.touches[0];
                        const currentOffset =
                          currentLayout.submissionOffsets?.[satKey] || { x: 0, y: 0 };
                        setDragState({
                          type: 'submissionSat',
                          id: satKey,
                          startMouseX: t.clientX,
                          startMouseY: t.clientY,
                          initialX: currentOffset.x,
                          initialY: currentOffset.y,
                        });
                      }}
                      className={`absolute z-10 px-3 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap cursor-move select-none shadow-xs hover:scale-105 active:scale-95 transition-transform ${satStyle} ${
                        isHighlighted
                          ? 'ring-4 ring-rose-500 scale-120 shadow-2xl animate-pulse z-40'
                          : ''
                      }`}
                      title={`${sat.name} (클릭하여 자유롭게 드래그 이동 가능)`}
                    >
                      <span>{sat.name}</span>
                      {connectedCount > 0 && (
                        <span className="ml-1.5 font-mono tabular-nums text-[10px] font-bold opacity-90">
                          ({connectedCount})
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Cluster Folder Containers & Draggable Technique Nodes */}
          {clusterNames.map((clusterName, cIdx) => {
            const folder = getFolderCoord(clusterName, cIdx);
            const clusterVideos = videosByCluster[clusterName] || [];

            if ((!showEmptyFolders || scoreFilter !== 'all') && clusterVideos.length === 0) {
              return null;
            }

            const ratedVideos = clusterVideos.filter(
              (v) => v.proficiencyScore > 0
            );
            const avgScore =
              ratedVideos.length > 0
                ? (
                    ratedVideos.reduce((acc, v) => acc + v.proficiencyScore, 0) /
                    ratedVideos.length
                  ).toFixed(1)
                : null;

            const isFront = frontFolder === clusterName;
            const isFolderHighlighted = highlightedItem?.id === clusterName;

            const folderContainerStyle = isWhite
              ? `bg-white/98 border-slate-300 shadow-xl ${
                  isFolderHighlighted
                    ? 'ring-4 ring-sky-500 shadow-2xl scale-[1.04] animate-pulse z-50'
                    : isFront
                      ? 'ring-3 ring-indigo-500 shadow-2xl scale-[1.02]'
                      : 'shadow-slate-200/60'
                } text-slate-900 transition-all`
              : `bg-slate-900/98 border-slate-700/80 shadow-2xl ${
                  isFolderHighlighted
                    ? 'ring-4 ring-sky-400 scale-[1.04] animate-pulse z-50'
                    : isFront
                      ? 'ring-3 ring-indigo-400 scale-[1.02]'
                      : ''
                } text-slate-100 transition-all`;

            const folderHeaderStyle = isWhite
              ? 'border-slate-200 hover:bg-slate-100/70 text-slate-900'
              : 'border-slate-800 hover:bg-slate-800/70 text-slate-100';

            return (
              <div
                key={clusterName}
                style={{
                  transform: `translate(${folder.x}px, ${folder.y}px) translate(-50%, -24px)`,
                  zIndex: isFront ? 50 : 10,
                  borderTopColor:
                    viewMode === 'byPosition' && settings.mindmapColors?.startPositionColor
                      ? settings.mindmapColors.startPositionColor
                      : undefined,
                  borderTopWidth:
                    viewMode === 'byPosition' && settings.mindmapColors?.startPositionColor
                      ? '3px'
                      : undefined,
                }}
                onClick={() => setFrontFolder(clusterName)}
                className={`absolute w-64 rounded-2xl border backdrop-blur-xs ${folderContainerStyle}`}
              >
                {/* Folder Header */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setFrontFolder(clusterName);
                    const base = getBaseFolderCoord(clusterName, cIdx);
                    setDragState({
                      type: 'folder',
                      id: clusterName,
                      startMouseX: e.clientX,
                      startMouseY: e.clientY,
                      initialX: base.x,
                      initialY: base.y,
                    });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setFrontFolder(clusterName);
                    const t = e.touches[0];
                    const base = getBaseFolderCoord(clusterName, cIdx);
                    setDragState({
                      type: 'folder',
                      id: clusterName,
                      startMouseX: t.clientX,
                      startMouseY: t.clientY,
                      initialX: base.x,
                      initialY: base.y,
                    });
                  }}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2.5 border-b cursor-move select-none rounded-t-2xl transition-colors ${folderHeaderStyle}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-xs font-bold"
                      style={{
                        color:
                          viewMode === 'byPosition' && settings.mindmapColors?.startPositionColor
                            ? settings.mindmapColors.startPositionColor
                            : '#f43f5e',
                      }}
                    >
                      ✦
                    </span>
                    <span className="text-xs font-bold truncate">
                      {viewMode === 'byPosition' ? translatePosition(clusterName, language, metadata.positions) : translateCategory(clusterName, language)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono tabular-nums text-rose-600 font-bold">
                      {clusterVideos.length} {language === 'ko' ? '기술' : 'videos'}
                    </span>
                    {avgScore && (
                      <span className="text-[10px] font-mono tabular-nums text-emerald-600 font-bold">
                        · ★{avgScore}
                      </span>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFolderCollapse(clusterName, cIdx);
                      }}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        isWhite
                          ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                          : 'hover:bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title={
                        folder.collapsed ? '폴더 창 펼치기' : '폴더 창 줄이기'
                      }
                    >
                      {folder.collapsed ? (
                        <Expand className="w-3 h-3 text-sky-600" />
                      ) : (
                        <Minimize2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Folder Body */}
                {!folder.collapsed && (
                  <div className="p-2.5 space-y-2">
                    {clusterVideos.length === 0 ? (
                      <div
                        className={`py-4 text-center text-[11px] ${
                          isWhite ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {language === 'ko' ? '배치된 기술 없음' : 'No techniques assigned'}
                      </div>
                    ) : (
                      clusterVideos.map((v) => {
                        const offset = currentLayout.cardOffsets[v.id] || {
                          dx: 0,
                          dy: 0,
                        };

                        let cardBorder = '';
                        let scoreBadgeColor = '';

                        if (isWhite) {
                          if (v.proficiencyScore >= settings.highScoreThreshold) {
                            cardBorder =
                              'border-emerald-500 bg-emerald-50/70 text-slate-900 shadow-xs';
                            scoreBadgeColor = 'text-emerald-700 font-bold';
                          } else if (
                            v.proficiencyScore > 0 &&
                            v.proficiencyScore <= settings.lowScoreThreshold
                          ) {
                            cardBorder =
                              'border-rose-400 bg-rose-50/70 text-slate-900';
                            scoreBadgeColor = 'text-rose-700 font-bold';
                          } else if (v.proficiencyScore > 0) {
                            cardBorder =
                              'border-sky-400 bg-sky-50/60 text-slate-900';
                            scoreBadgeColor = 'text-sky-700 font-semibold';
                          } else {
                            cardBorder =
                              'border-dashed border-slate-300 bg-slate-50/80 text-slate-600';
                            scoreBadgeColor = 'text-slate-400';
                          }
                        } else {
                          if (v.proficiencyScore >= settings.highScoreThreshold) {
                            cardBorder =
                              'border-emerald-500/90 bg-emerald-950/30 text-white shadow-sm shadow-emerald-950';
                            scoreBadgeColor = 'text-emerald-400 font-bold';
                          } else if (
                            v.proficiencyScore > 0 &&
                            v.proficiencyScore <= settings.lowScoreThreshold
                          ) {
                            cardBorder =
                              'border-rose-500/90 bg-rose-950/35 text-rose-100';
                            scoreBadgeColor = 'text-rose-400 font-bold';
                          } else if (v.proficiencyScore > 0) {
                            cardBorder =
                              'border-sky-500/70 bg-slate-950/90 text-slate-100';
                            scoreBadgeColor = 'text-sky-400 font-semibold';
                          } else {
                            cardBorder =
                              'border-dashed border-slate-700 bg-slate-950/70 text-slate-400';
                            scoreBadgeColor = 'text-slate-400';
                          }
                        }

                        return (
                          <div
                            key={v.id}
                            style={{
                              transform: `translate(${offset.dx}px, ${offset.dy}px)`,
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDragState({
                                type: 'card',
                                id: v.id,
                                startMouseX: e.clientX,
                                startMouseY: e.clientY,
                                initialX: offset.dx,
                                initialY: offset.dy,
                              });
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              const t = e.touches[0];
                              setDragState({
                                type: 'card',
                                id: v.id,
                                startMouseX: t.clientX,
                                startMouseY: t.clientY,
                                initialX: offset.dx,
                                initialY: offset.dy,
                              });
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              onOpenModal(v, 'view');
                            }}
                            className={`group relative p-2 rounded-xl border transition-colors cursor-grab active:cursor-grabbing ${cardBorder}`}
                          >
                            <div className="flex items-center gap-2">
                              {/* Left: Small Video Thumbnail */}
                              <div className="w-10 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-200/60 shrink-0 relative flex items-center justify-center shadow-2xs">
                                {v.thumbnailUrl ? (
                                  <img
                                    src={v.thumbnailUrl}
                                    alt={language === 'en' ? (v.titleEn || v.titleKo) : v.titleKo}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <Play className="w-3.5 h-3.5 text-white/80" />
                                )}
                              </div>

                              {/* Right: Title & Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-bold truncate">
                                    {language === 'en' ? (v.titleEn || v.titleKo) : v.titleKo}
                                  </span>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenModal(v, 'edit');
                                    }}
                                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer shrink-0 ${
                                      isWhite
                                        ? 'text-slate-400 hover:text-slate-900'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="통합 수정 모달 열기"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between text-[10px] mt-0.5">
                                  <span
                                    className={`font-semibold truncate max-w-[105px] ${
                                      isWhite ? 'text-slate-600' : 'text-rose-400'
                                    }`}
                                  >
                                    {translateCategory(v.category, language)}
                                    {v.submissionGroup !== 'none'
                                      ? ` → ${translateSubmissionDetail(v.submissionDetail, language)}`
                                      : ''}
                                  </span>
                                  <span
                                    className={`font-mono tabular-nums shrink-0 ml-1 font-bold ${scoreBadgeColor}`}
                                  >
                                    {v.proficiencyScore > 0
                                      ? `★${v.proficiencyScore}`
                                      : '미평가'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

    // Desktop Header: Removed on PC as requested (Toolbox is always open and title bar is omitted)
    const renderMindmapHeader = () => null;

    // Mobile Header & Floating Toolbox Overlay (Matching Video Folder UI 1:1)
    const renderMobileHeader = () => (
      <div className="lg:hidden relative z-40">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600 px-1">
          <div className="flex-1 min-w-0">
            {renderMindmapSearchBar()}
          </div>
          
          <button
            type="button"
            onClick={() => setIsToolbarOpen(!isToolbarOpen)}
            className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shrink-0 shadow-3xs ${
              isToolbarOpen
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : isWhite
                  ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
            title={isToolbarOpen ? '도구함 닫기' : '도구함 열기'}
            aria-label="도구함 열기"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Filter Toolbox Floating Overlay (Matching Video Folder UI) */}
        {isToolbarOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150 text-slate-900">
            {/* Header Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                <Sliders className="w-4 h-4 text-sky-500" />
                <span>{language === 'ko' ? '다이어그램 도구함' : 'Diagram Toolbox'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsToolbarOpen(false)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'ko' ? '닫기 ✕' : 'Close ✕'}
              </button>
            </div>

            {/* 1. Cluster Mode */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400">{language === 'ko' ? '클러스터' : 'Cluster'}</span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('byPosition')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'byPosition'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {language === 'ko' ? '시작 포지션' : 'By Position'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('byCategory')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'byCategory'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {language === 'ko' ? '기술 속성' : 'By Category'}
                </button>
              </div>
            </div>

            {/* 2. Score Filter */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400">{language === 'ko' ? '숙련도' : 'Score'}</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setScoreFilter('all')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scoreFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {language === 'ko' ? '전체' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setScoreFilter('high')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scoreFilter === 'high'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {language === 'ko' ? '강점 (8점+)' : 'Strong (8+)'}
                </button>
                <button
                  type="button"
                  onClick={() => setScoreFilter('low')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scoreFilter === 'low'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {language === 'ko' ? '취약 (4점이하)' : 'Weak (≤4)'}
                </button>
              </div>
            </div>

            {/* 3. Display Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUnrated(!showUnrated)}
                className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  showUnrated
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {showUnrated ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{language === 'ko' ? `미부여 ${showUnrated ? '표시' : '숨김'}` : `Unrated ${showUnrated ? 'Show' : 'Hide'}`}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmptyFolders(!showEmptyFolders)}
                className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  showEmptyFolders
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {showEmptyFolders ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{language === 'ko' ? `빈 폴더 ${showEmptyFolders ? '표시' : '숨김'}` : `Empty ${showEmptyFolders ? 'Show' : 'Hide'}`}</span>
              </button>
            </div>

            {/* 4. Actions & Theme */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const nextTheme = canvasTheme === 'white' ? 'dark' : 'white';
                  setCanvasTheme(nextTheme);
                  if (onUpdateSettings) onUpdateSettings({ mindmapTheme: nextTheme });
                }}
                className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {canvasTheme === 'white' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{canvasTheme === 'white' ? (language === 'ko' ? '배경: 흰색' : 'Bg: White') : (language === 'ko' ? '배경: 다크' : 'Bg: Dark')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextLayout: MindmapModeLayout = {
                    folders: {},
                    cardOffsets: {},
                    submissionOffsets: {},
                  };
                  onUpdateMindmapState({
                    ...mindmapState,
                    [viewMode]: nextLayout,
                  });
                  setOrbitSpacing(1.15);
                  setZoom(0.68);
                  setPan({ x: 0, y: 0 });
                  setArrangeToast('⚡ 궤도가 초기화되었습니다.');
                  setTimeout(() => setArrangeToast(null), 2500);
                }}
                className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'ko' ? '궤도 리셋' : 'Reset Orbit'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );

    if (isVertical) {
      return (
        <div className="space-y-2.5 md:space-y-3.5">
          {renderMobileHeader()}
          <div
            className={`flex flex-col ${
              toolbarPosition === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'
            } gap-3.5 items-start`}
          >
            {/* On Desktop only (lg:block): Always show vertical sidebar on PC! */}
            <div className="hidden lg:block w-72 shrink-0">
              {renderVerticalToolbar()}
            </div>
            <div className="flex-1 min-w-0 w-full space-y-3">
              {arrangeToast && (
                <div
                  className={`px-4 py-2 rounded-xl text-xs font-medium border ${
                    isWhite
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-emerald-950 border-emerald-700 text-emerald-200'
                  }`}
                >
                  {arrangeToast}
                </div>
              )}
              {canvasElement}
            </div>
          </div>
        </div>
      );
    }

    if (toolbarPosition === 'bottom') {
      return (
        <div className="space-y-2.5 md:space-y-3.5">
          {renderMobileHeader()}
          {arrangeToast && (
            <div
              className={`px-4 py-2 rounded-xl text-xs font-medium border ${
                isWhite
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-950 border-emerald-700 text-emerald-200'
              }`}
            >
              {arrangeToast}
            </div>
          )}
          {canvasElement}
          {/* Desktop horizontal toolbar always open on PC */}
          <div className="hidden lg:block">
            {renderHorizontalToolbar()}
          </div>
        </div>
      );
    }

    // Default: 'top'
    return (
      <div className="space-y-2.5 md:space-y-3.5">
        {renderMobileHeader()}
        {/* Desktop horizontal toolbar always open on PC */}
        <div className="hidden lg:block">
          {renderHorizontalToolbar()}
        </div>
        {arrangeToast && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-medium border ${
              isWhite
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-950 border-emerald-700 text-emerald-200'
            }`}
          >
            {arrangeToast}
          </div>
        )}
        {canvasElement}
      </div>
    );
  };
