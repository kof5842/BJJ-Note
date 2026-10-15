import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Video,
  Link2,
  Clock,
  Send,
  Trash2,
  Shield,
  AlertTriangle,
  Play,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CornerDownRight,
  Sparkles,
  ChevronLeft,
  X,
  FileText,
  FolderOpen,
  Tag,
  Layers,
  Check,
  RefreshCw,
  Megaphone,
  BarChart2,
  CheckSquare,
  Square,
  Radio,
} from 'lucide-react';
import {
  CommunityPost,
  CommunityComment,
  CommunityVideoClip,
  CommunityPostType,
  CommunityPoll,
  TechniqueVideo,
  MetadataConfig,
} from '../types';
import {
  fetchCommunityPosts,
  saveCommunityPost,
  deleteCommunityPost,
  fetchPostComments,
  savePostComment,
  deletePostComment,
  togglePostLike,
  togglePostDislike,
  incrementPostViews,
  togglePostPrivacy,
  toggleCommentPrivacy,
  voteOnPoll,
} from '../services/archiveService';
import { extractYoutubeId, getYoutubeThumbnail, formatSecondsToMMSS } from '../utils/bjjAnalyzer';
import { VideoPlayer16x9 } from './VideoPlayer16x9';
import { VideoArchivePickerModal } from './VideoArchivePickerModal';
import { useLanguage } from '../i18n/LanguageContext';

interface CommunityBoardViewProps {
  currentUser: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    isBanned?: boolean;
  };
  isAdmin: boolean;
  metadata: MetadataConfig;
  videos?: TechniqueVideo[];
  onNavigatePosition?: (positionName: string) => void;
  primaryColor?: string;
}

export const CommunityBoardView: React.FC<CommunityBoardViewProps> = ({
  currentUser,
  isAdmin,
  metadata,
  videos = [],
  primaryColor = '#0284c7',
}) => {
  const { t, language } = useLanguage();
  // State: Post list & selection
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [searchType, setSearchType] = useState<'all' | 'title' | 'content' | 'author' | 'comment'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<{ type: 'all' | 'title' | 'content' | 'author' | 'comment'; keyword: string }>({ type: 'all', keyword: '' });

  // State: Comments for the currently selected post
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Poll Voting state for currently selected post
  const [selectedPollOptionIds, setSelectedPollOptionIds] = useState<string[]>([]);
  const [submittingVote, setSubmittingVote] = useState<boolean>(false);

  // Video Player Seek state in detail & create modes
  const [detailSeekTime, setDetailSeekTime] = useState<{ time: number; nonce: number } | null>(null);
  const [createSeekTime, setCreateSeekTime] = useState<{ time: number; nonce: number } | null>(null);
  const [currentPlayTime, setCurrentPlayTime] = useState<number>(0);

  // Modal / View: Create Post
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('일반');
  const [newIsNotice, setNewIsNotice] = useState<boolean>(false);
  const [newPostType, setNewPostType] = useState<CommunityPostType>('TEXT');
  const [newContent, setNewContent] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);

  // Poll Creation State
  const [enablePoll, setEnablePoll] = useState<boolean>(false);
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState<boolean>(false);

  // Video attachment in Create Post
  const [newYoutubeUrl, setNewYoutubeUrl] = useState<string>('');
  const [newVideoTitle, setNewVideoTitle] = useState<string>('');
  const [newPositionTag, setNewPositionTag] = useState<string>('');
  const [attachedVideoThumbnail, setAttachedVideoThumbnail] = useState<string>('');
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState<boolean>(false);

  // Multi-clip list state in Create Post
  const [newClips, setNewClips] = useState<CommunityVideoClip[]>([]);
  const [tempClipStartTime, setTempClipStartTime] = useState<string>('00:00');
  const [tempClipEndTime, setTempClipEndTime] = useState<string>('');
  const [tempClipQuestion, setTempClipQuestion] = useState<string>('');

  // Status feedback toast
  const [feedback, setFeedback] = useState<string | null>(null);
  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Available categories based on admin permission
  const availableCategories = useMemo(() => {
    return isAdmin ? ['공지', '일반', '영상'] : ['일반', '영상'];
  }, [isAdmin]);

  // 1. Initial Load of Posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchCommunityPosts();
      setPosts(data);
    } catch (e) {
      console.error('Error fetching community posts:', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load Comments & initialize poll selections when selectedPost changes
  useEffect(() => {
    if (selectedPost) {
      loadComments(selectedPost.id);
      incrementPostViews(selectedPost.id, selectedPost.viewsCount || 0);
      setPosts((prev) =>
        prev.map((p) => (p.id === selectedPost.id ? { ...p, viewsCount: (p.viewsCount || 0) + 1 } : p))
      );

      // Initialize selected options if user already voted
      if (selectedPost.poll) {
        const myVotedOptionIds = selectedPost.poll.options
          .filter((opt) => opt.votedUserIds?.includes(currentUser.uid))
          .map((opt) => opt.id);
        setSelectedPollOptionIds(myVotedOptionIds);
      } else {
        setSelectedPollOptionIds([]);
      }
    } else {
      setComments([]);
      setSelectedPollOptionIds([]);
    }
  }, [selectedPost?.id]);

  const loadComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const list = await fetchPostComments(postId);
      setComments(list);
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  // Helper: Convert MM:SS or seconds string to number of seconds
  const parseTimeToSeconds = (input: string): number => {
    if (!input) return 0;
    const trimmed = input.trim();
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const min = parseInt(parts[0] || '0', 10) || 0;
      const sec = parseInt(parts[1] || '0', 10) || 0;
      return min * 60 + sec;
    }
    return Math.max(0, parseInt(trimmed, 10) || 0);
  };

  // Handle Add Clip to Create Post
  const handleAddClip = () => {
    const startSec = parseTimeToSeconds(tempClipStartTime);
    const endSec = tempClipEndTime.trim() ? parseTimeToSeconds(tempClipEndTime) : undefined;
    const questionText = tempClipQuestion.trim();

    if (!questionText) {
      alert('클립에 대한 질문 또는 문의 내용을 입력해주세요.');
      return;
    }

    const clipNum = newClips.length + 1;
    const timeLabel = endSec && endSec > startSec
      ? `${formatSecondsToMMSS(startSec)} ~ ${formatSecondsToMMSS(endSec)}`
      : `${formatSecondsToMMSS(startSec)}~`;

    const clipItem: CommunityVideoClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clipNumber: clipNum,
      startTime: startSec,
      endTime: endSec,
      timeLabel,
      question: questionText,
    };

    setNewClips([...newClips, clipItem]);
    setTempClipQuestion('');
    setTempClipEndTime('');
    showFeedback(`클립 ${clipNum}이(가) 추가되었습니다.`);
  };

  const handleRemoveClip = (clipId: string) => {
    const filtered = newClips.filter((c) => c.id !== clipId);
    const renumbered = filtered.map((c, idx) => ({ ...c, clipNumber: idx + 1 }));
    setNewClips(renumbered);
  };

  // Poll options helpers
  const handleAddPollOption = () => {
    if (pollOptions.length >= 10) {
      alert('투표 선택지는 최대 10개까지 추가할 수 있습니다.');
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length <= 2) {
      alert('투표 선택지는 최소 2개 이상이어야 합니다.');
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  // Handle Video Selection from Video Folder Picker Modal
  const handleSelectArchiveVideo = (video: TechniqueVideo) => {
    setNewPostType('VIDEO_CLIPS');
    setNewYoutubeUrl(video.youtubeUrl || (video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : ''));
    setNewVideoTitle(video.titleKo || video.titleEn || '기술 영상');
    setNewPositionTag(video.position || '');
    setAttachedVideoThumbnail(video.thumbnailUrl || (video.youtubeId ? getYoutubeThumbnail(video.youtubeId) : ''));
    if (newCategory !== '공지') setNewCategory('영상');
    setIsVideoPickerOpen(false);
    showFeedback(`[${video.titleKo || '영상'}]이(가) 첨부되었습니다.`);
  };

  // Reset Create Post Form
  const resetCreateForm = () => {
    setNewTitle('');
    setNewCategory('일반');
    setNewIsNotice(false);
    setNewPostType('TEXT');
    setNewContent('');
    setNewTags('');
    setNewYoutubeUrl('');
    setNewVideoTitle('');
    setNewPositionTag('');
    setAttachedVideoThumbnail('');
    setNewClips([]);
    setTempClipStartTime('00:00');
    setTempClipEndTime('');
    setTempClipQuestion('');
    setCurrentPlayTime(0);
    setEnablePoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollAllowMultiple(false);
    setIsCreatingPost(false);
  };

  // Submit New Post
  const handleCreatePostSubmit = async () => {
    if (currentUser.isBanned) {
      alert('현재 계정이 이용 정지 상태여서 새 글을 작성할 수 없습니다.');
      return;
    }
    if (!newTitle.trim()) {
      alert('게시글 제목을 입력해주세요.');
      return;
    }
    if (!newContent.trim()) {
      alert('게시글 본문 내용을 입력해주세요.');
      return;
    }

    // Validate poll if enabled
    let pollData: CommunityPoll | undefined = undefined;
    if (enablePoll) {
      const q = pollQuestion.trim() || newTitle.trim();
      const validOptions = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
      if (validOptions.length < 2) {
        alert('투표를 활성화하려면 최소 2개 이상의 선택지 내용을 입력해야 합니다.');
        return;
      }
      pollData = {
        id: `poll-${Date.now()}`,
        question: q,
        options: validOptions.map((optText, oIdx) => ({
          id: `opt-${oIdx + 1}`,
          text: optText,
          voteCount: 0,
          votedUserIds: [],
        })),
        allowMultiple: pollAllowMultiple,
        totalVotes: 0,
        closed: false,
        createdAt: new Date().toISOString(),
      };
    }

    setIsSubmittingPost(true);
    try {
      const parsedTags = newTags
        .split(/[,\s#]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const effectiveYtId = newPostType === 'VIDEO_CLIPS' ? extractYoutubeId(newYoutubeUrl) : '';
      const effectiveThumbnail = newPostType === 'VIDEO_CLIPS'
        ? (attachedVideoThumbnail || (effectiveYtId ? getYoutubeThumbnail(effectiveYtId) : ''))
        : '';

      const newPostId = `post-${Date.now()}`;
      const postNumber = posts.length + 1;
      const isNoticePost = isAdmin && (newIsNotice || newCategory === '공지');
      const authorName = localStorage.getItem('bjj_user_nickname') || currentUser.displayName || currentUser.email.split('@')[0] || '주짓수 수련자';

      const createdPost: CommunityPost = {
        id: newPostId,
        postNumber,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: authorName,
        userPhotoUrl: currentUser.photoURL || '',
        title: newTitle.trim(),
        content: newContent.trim(),
        category: isNoticePost ? '공지' : newCategory,
        postType: newPostType,
        youtubeUrl: newPostType === 'VIDEO_CLIPS' ? newYoutubeUrl.trim() : '',
        youtubeId: effectiveYtId || '',
        videoTitle: newPostType === 'VIDEO_CLIPS' ? newVideoTitle.trim() : '',
        thumbnailUrl: effectiveThumbnail || '',
        positionTag: newPositionTag || '',
        clips: newPostType === 'VIDEO_CLIPS' ? newClips : [],
        poll: pollData,
        isNotice: isNoticePost,
        tags: parsedTags,
        viewsCount: 1,
        likesCount: 0,
        likedUserIds: [],
        dislikesCount: 0,
        dislikedUserIds: [],
        commentsCount: 0,
        isPrivateByAdmin: false,
        isPinned: isNoticePost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveCommunityPost(createdPost);
      const freshPosts = await fetchCommunityPosts();
      setPosts(freshPosts);
      resetCreateForm();
      setSelectedPost(createdPost);
      showFeedback('게시글이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('게시글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (post: CommunityPost) => {
    if (!isAdmin && post.userId !== currentUser.uid) {
      alert('본인이 작성한 글만 삭제할 수 있습니다.');
      return;
    }
    if (!confirm(`'${post.title}' 게시글을 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await deleteCommunityPost(post.id);
      const freshPosts = await fetchCommunityPosts();
      setPosts(freshPosts);
      if (selectedPost?.id === post.id) {
        setSelectedPost(null);
      }
      showFeedback('게시글이 삭제되었습니다.');
    } catch (e) {
      console.error('Failed to delete post:', e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // Toggle Post Privacy (Admin Only)
  const handleTogglePostPrivacy = async (post: CommunityPost) => {
    if (!isAdmin) return;
    const nextVal = !post.isPrivateByAdmin;
    try {
      await togglePostPrivacy(post.id, nextVal);
      const freshPosts = await fetchCommunityPosts();
      setPosts(freshPosts);
      if (selectedPost?.id === post.id) {
        const updated = freshPosts.find((p) => p.id === post.id) || { ...post, isPrivateByAdmin: nextVal };
        setSelectedPost(updated);
      }
      showFeedback(nextVal ? '게시글이 비공개(블라인드) 처리되었습니다.' : '게시글 비공개가 해제되었습니다.');
    } catch (e) {
      console.error('Privacy toggle error:', e);
    }
  };

  // Toggle Like on Post (추천)
  const handleToggleLike = async () => {
    if (!selectedPost) return;
    const isLiked = selectedPost.likedUserIds?.includes(currentUser.uid) || false;
    const nextLiked = !isLiked;
    let newLikes = selectedPost.likedUserIds || [];
    let newDislikes = selectedPost.dislikedUserIds || [];
    if (nextLiked) {
      newLikes = [...newLikes, currentUser.uid];
      newDislikes = newDislikes.filter((u) => u !== currentUser.uid);
    } else {
      newLikes = newLikes.filter((u) => u !== currentUser.uid);
    }
    const updated: CommunityPost = {
      ...selectedPost,
      likedUserIds: newLikes,
      likesCount: newLikes.length,
      dislikedUserIds: newDislikes,
      dislikesCount: newDislikes.length,
    };
    setSelectedPost(updated);
    setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? updated : p)));
    await togglePostLike(selectedPost.id, currentUser.uid, nextLiked);
  };

  // Toggle Dislike on Post (비추)
  const handleToggleDislike = async () => {
    if (!selectedPost) return;
    const isDisliked = selectedPost.dislikedUserIds?.includes(currentUser.uid) || false;
    const nextDisliked = !isDisliked;
    let newDislikes = selectedPost.dislikedUserIds || [];
    let newLikes = selectedPost.likedUserIds || [];
    if (nextDisliked) {
      newDislikes = [...newDislikes, currentUser.uid];
      newLikes = newLikes.filter((u) => u !== currentUser.uid);
    } else {
      newDislikes = newDislikes.filter((u) => u !== currentUser.uid);
    }
    const updated: CommunityPost = {
      ...selectedPost,
      likedUserIds: newLikes,
      likesCount: newLikes.length,
      dislikedUserIds: newDislikes,
      dislikesCount: newDislikes.length,
    };
    setSelectedPost(updated);
    setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? updated : p)));
    await togglePostDislike(selectedPost.id, currentUser.uid, nextDisliked);
  };

  // Handle Poll Vote
  const handleVoteSubmit = async () => {
    if (!selectedPost || !selectedPost.poll) return;
    if (currentUser.isBanned) {
      alert('이용 정지 상태에서는 투표할 수 없습니다.');
      return;
    }
    if (selectedPollOptionIds.length === 0) {
      alert('선택지를 최소 1개 이상 선택해주세요.');
      return;
    }

    setSubmittingVote(true);
    try {
      const updated = await voteOnPoll(selectedPost.id, selectedPollOptionIds, currentUser.uid);
      if (updated) {
        setSelectedPost(updated);
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showFeedback('투표가 반영되었습니다.');
      }
    } catch (e) {
      console.error('Failed to submit vote:', e);
      alert('투표 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleTogglePollOption = (optionId: string) => {
    if (!selectedPost?.poll) return;
    const isMultiple = selectedPost.poll.allowMultiple;
    if (isMultiple) {
      if (selectedPollOptionIds.includes(optionId)) {
        setSelectedPollOptionIds(selectedPollOptionIds.filter((id) => id !== optionId));
      } else {
        setSelectedPollOptionIds([...selectedPollOptionIds, optionId]);
      }
    } else {
      setSelectedPollOptionIds([optionId]);
    }
  };

  // Submit Top-Level Comment
  const handleAddComment = async () => {
    if (currentUser.isBanned) {
      alert('이용 정지 상태에서는 댓글을 작성할 수 없습니다.');
      return;
    }
    if (!selectedPost || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const commentId = `comment-${Date.now()}`;
      const authorName = localStorage.getItem('bjj_user_nickname') || currentUser.displayName || currentUser.email.split('@')[0] || '익명 수련자';
      const newComment: CommunityComment = {
        id: commentId,
        postId: selectedPost.id,
        parentId: null,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: authorName,
        userPhotoUrl: currentUser.photoURL || '',
        content: newCommentText.trim(),
        likesCount: 0,
        likedUserIds: [],
        isPrivateByAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePostComment(selectedPost.id, newComment);
      const freshComments = await fetchPostComments(selectedPost.id);
      setComments(freshComments);
      setNewCommentText('');
      const freshPosts = await fetchCommunityPosts();
      setPosts(freshPosts);
      const refreshedPost = freshPosts.find((p) => p.id === selectedPost.id) || {
        ...selectedPost,
        commentsCount: (selectedPost.commentsCount || 0) + 1,
      };
      setSelectedPost(refreshedPost);
      showFeedback('댓글이 등록되었습니다.');
    } catch (e) {
      console.error('Failed to submit comment:', e);
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Submit Sub-Comment (대댓글)
  const handleAddReply = async (parentCommentId: string) => {
    if (currentUser.isBanned) {
      alert('이용 정지 상태에서는 대댓글을 작성할 수 없습니다.');
      return;
    }
    if (!selectedPost || !replyText.trim()) return;

    setSubmittingComment(true);
    try {
      const replyId = `reply-${Date.now()}`;
      const authorName = localStorage.getItem('bjj_user_nickname') || currentUser.displayName || currentUser.email.split('@')[0] || '익명 수련자';
      const newReply: CommunityComment = {
        id: replyId,
        postId: selectedPost.id,
        parentId: parentCommentId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: authorName,
        userPhotoUrl: currentUser.photoURL || '',
        content: replyText.trim(),
        likesCount: 0,
        likedUserIds: [],
        isPrivateByAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePostComment(selectedPost.id, newReply);
      const freshComments = await fetchPostComments(selectedPost.id);
      setComments(freshComments);
      setReplyText('');
      setReplyingToCommentId(null);
      const freshPosts = await fetchCommunityPosts();
      setPosts(freshPosts);
      const refreshedPost = freshPosts.find((p) => p.id === selectedPost.id) || {
        ...selectedPost,
        commentsCount: (selectedPost.commentsCount || 0) + 1,
      };
      setSelectedPost(refreshedPost);
      showFeedback('답글이 등록되었습니다.');
    } catch (e) {
      console.error('Failed to submit reply:', e);
      alert('답글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (comment: CommunityComment) => {
    if (!selectedPost) return;
    if (!isAdmin && comment.userId !== currentUser.uid) {
      alert('본인이 작성한 댓글만 삭제할 수 있습니다.');
      return;
    }
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    try {
      await deletePostComment(selectedPost.id, comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id && c.parentId !== comment.id));
      const updatedPost = {
        ...selectedPost,
        commentsCount: Math.max(0, (selectedPost.commentsCount || 1) - 1),
      };
      setSelectedPost(updatedPost);
      setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? updatedPost : p)));
      showFeedback('댓글이 삭제되었습니다.');
    } catch (e) {
      console.error('Failed to delete comment:', e);
    }
  };

  // Toggle Comment Privacy (Admin Only)
  const handleToggleCommentPrivacy = async (comment: CommunityComment) => {
    if (!isAdmin || !selectedPost) return;
    const nextVal = !comment.isPrivateByAdmin;
    try {
      await toggleCommentPrivacy(selectedPost.id, comment.id, nextVal);
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, isPrivateByAdmin: nextVal } : c))
      );
      showFeedback(nextVal ? '댓글이 비공개 처리되었습니다.' : '댓글 비공개가 해제되었습니다.');
    } catch (e) {
      console.error('Failed to toggle comment privacy:', e);
    }
  };

  // Seek Player to Time / Clip
  const handleSeekToClip = (seconds: number) => {
    setDetailSeekTime({ time: seconds, nonce: Date.now() });
  };

  // Render text containing @클립1, @클립2, @01:23 with interactive jump buttons
  const renderCommentContentWithClips = (text: string, postClips: CommunityVideoClip[] = []) => {
    const regex = /(@클립(\d+)|@(\d{1,2}:\d{2}))/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }

      const fullMatch = match[0];
      const clipIndexStr = match[2];
      const timecodeStr = match[3];

      if (clipIndexStr) {
        const cNum = parseInt(clipIndexStr, 10);
        const targetClip = postClips.find((c) => c.clipNumber === cNum);
        parts.push(
          <button
            key={`clip-tag-${match.index}`}
            type="button"
            onClick={() => targetClip && handleSeekToClip(targetClip.startTime)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded cursor-pointer transition-colors"
            title={targetClip ? `${targetClip.timeLabel} 구간으로 재생` : '클립 이동'}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            {fullMatch} {targetClip ? `(${targetClip.timeLabel})` : ''}
          </button>
        );
      } else if (timecodeStr) {
        const sec = parseTimeToSeconds(timecodeStr);
        parts.push(
          <button
            key={`time-tag-${match.index}`}
            type="button"
            onClick={() => handleSeekToClip(sec)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded cursor-pointer transition-colors"
            title={`${timecodeStr} 시점으로 재생`}
          >
            <Clock className="w-2.5 h-2.5" />
            {fullMatch}
          </button>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts;
  };

  // Filtered & Notice-Pinned Posts
  const filteredPosts = useMemo(() => {
    const list = posts.filter((p) => {
      if (p.isPrivateByAdmin && !isAdmin && p.userId !== currentUser.uid) {
        return false;
      }
      const activeKeyword = (appliedSearch.keyword || searchQuery).trim().toLowerCase();
      const activeType = appliedSearch.keyword.trim() ? appliedSearch.type : searchType;

      if (activeKeyword) {
        if (activeType === 'title') {
          return p.title.toLowerCase().includes(activeKeyword);
        }
        if (activeType === 'content') {
          return p.content.toLowerCase().includes(activeKeyword);
        }
        if (activeType === 'author') {
          return (
            p.userName.toLowerCase().includes(activeKeyword) ||
            (p.userEmail ? p.userEmail.toLowerCase().includes(activeKeyword) : false)
          );
        }
        if (activeType === 'comment') {
          try {
            const raw = localStorage.getItem(`bjj_comments_${p.id}_v2`);
            if (raw && raw.toLowerCase().includes(activeKeyword)) return true;
          } catch {}
          return false;
        }
        // 'all': 제목 + 내용
        return (
          p.title.toLowerCase().includes(activeKeyword) ||
          p.content.toLowerCase().includes(activeKeyword) ||
          (p.videoTitle ? p.videoTitle.toLowerCase().includes(activeKeyword) : false) ||
          (p.tags?.some((t) => t.toLowerCase().includes(activeKeyword)) ?? false)
        );
      }
      return true;
    });

    // Pinned Notices to top, then postNumber desc
    return list.sort((a, b) => {
      const aNotice = a.isNotice || a.category === '공지' ? 1 : 0;
      const bNotice = b.isNotice || b.category === '공지' ? 1 : 0;
      if (aNotice !== bNotice) return bNotice - aNotice;
      return (b.postNumber || 0) - (a.postNumber || 0);
    });
  }, [posts, appliedSearch, searchQuery, searchType, isAdmin, currentUser.uid]);

  const handleSearchSubmit = () => {
    setAppliedSearch({
      type: searchType,
      keyword: searchQuery.trim(),
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearch({ type: 'all', keyword: '' });
  };

  return (
    <div className="w-full min-h-screen bg-transparent text-slate-900 pb-20">
      {/* Global Toast Feedback */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl animate-in slide-in-from-top duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 1. MAIN LIST VIEW (UNBOXED & MINIMALIST)                         */}
      {/* ---------------------------------------------------------------- */}
      {!selectedPost && !isCreatingPost ? (
        <div className="max-w-6xl mx-auto px-2.5 sm:px-6 py-2 sm:py-4 space-y-3">
          {/* Header Row: Title & Write Button (No enclosing box) */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {t('boardTitle')}
              </h1>
              <span className="text-xs font-mono font-bold text-slate-500">
                ({filteredPosts.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingPost(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-90 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('writePost')}</span>
            </button>
          </div>

          {/* Post Table (Desktop) / Post Rows (Mobile) - Flat Unboxed Layout */}
          <div className="w-full">
            {/* DESKTOP TABLE HEADER (Flat light divider) */}
            <div className={`hidden md:grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-500`}>
              <div className="col-span-1 text-center font-mono">{t('numberCol')}</div>
              <div className="col-span-1 text-center">{t('categoryCol')}</div>
              <div className={isAdmin ? 'col-span-4' : 'col-span-5'}>{t('titleCol')}</div>
              <div className="col-span-1 text-center">{t('authorCol')}</div>
              <div className="col-span-1 text-center">{t('dateCol')}</div>
              <div className="col-span-1 text-center">{t('viewsCol')}</div>
              <div className="col-span-1 text-center">{t('likesCol')}</div>
              <div className="col-span-1 text-center">{t('dislikesCol')}</div>
              {isAdmin && <div className="col-span-1 text-center">{t('manageCol')}</div>}
            </div>

            {/* Loading / Empty States */}
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs space-y-2">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>게시글을 불러오는 중입니다...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs sm:text-sm font-semibold">
                  {appliedSearch.keyword ? '검색 결과와 일치하는 게시글이 없습니다.' : '등록된 게시글이 없습니다.'}
                </p>
                {appliedSearch.keyword ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    검색 초기화
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreatingPost(true)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-sky-700 text-xs font-bold hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> 첫 글 작성하기
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE ROWS (hidden md:block) */}
                <div className="hidden md:block divide-y divide-slate-100">
                  {filteredPosts.map((post) => {
                    const isNotice = post.isNotice || post.category === '공지';
                    const isVideoPost = post.postType === 'VIDEO_CLIPS' || post.category === '영상';
                    const formattedDate = post.createdAt ? post.createdAt.split('T')[0] : '';

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`group px-3 py-3 transition-colors cursor-pointer grid grid-cols-12 gap-2 items-center text-xs ${
                          isNotice
                            ? 'bg-rose-50/40 hover:bg-rose-50/70 font-semibold'
                            : post.isPrivateByAdmin
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* 1. 번호 (공지글은 공지 뱃지) */}
                        <div className="col-span-1 text-center font-mono font-semibold">
                          {isNotice ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                              <Megaphone className="w-2.5 h-2.5 shrink-0" />
                              공지
                            </span>
                          ) : (
                            <span className="text-slate-400">{post.postNumber || '-'}</span>
                          )}
                        </div>

                        {/* 2. 말머리 (공지 / 일반 / 영상) */}
                        <div className="col-span-1 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              isNotice
                                ? 'bg-rose-600 text-white'
                                : isVideoPost
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {post.category || '일반'}
                          </span>
                        </div>

                        {/* 3. 제목 & 미리보기 이미지 (제목 옆) & 댓글 수 & 투표 뱃지 */}
                        <div className={`${isAdmin ? 'col-span-4' : 'col-span-5'} flex items-center gap-2 min-w-0 overflow-hidden`}>
                          {isVideoPost && post.thumbnailUrl && (
                            <div className="relative w-8 h-5 rounded overflow-hidden bg-slate-800 shrink-0 border border-slate-200">
                              <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Play className="w-2 h-2 text-white fill-white" />
                              </div>
                            </div>
                          )}

                          <span className={`truncate ${isNotice ? 'text-rose-950 font-black' : 'text-slate-900 group-hover:text-sky-600 font-bold'} transition-colors`}>
                            {post.title}
                          </span>

                          {post.poll && (
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200 shrink-0 flex items-center gap-0.5">
                              <BarChart2 className="w-2.5 h-2.5" /> 투표
                            </span>
                          )}

                          {(post.commentsCount || 0) > 0 && (
                            <span className="text-[11px] font-bold text-sky-600 shrink-0">
                              [{post.commentsCount}]
                            </span>
                          )}

                          {isVideoPost && (post.clips?.length || 0) > 0 && (
                            <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-200 shrink-0">
                              클립 {post.clips?.length}
                            </span>
                          )}

                          {post.isPrivateByAdmin && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded shrink-0">
                              비공개
                            </span>
                          )}
                        </div>

                        {/* 4. 글쓴이 */}
                        <div className="col-span-1 text-center text-slate-700 truncate">
                          {post.userName}
                        </div>

                        {/* 5. 작성일 */}
                        <div className="col-span-1 text-center text-slate-400 font-mono text-[11px]">
                          {formattedDate}
                        </div>

                        {/* 6. 조회수 */}
                        <div className="col-span-1 text-center text-slate-500 font-mono">
                          {post.viewsCount || 0}
                        </div>

                        {/* 7. 추천수 */}
                        <div className="col-span-1 text-center font-bold font-mono text-emerald-600">
                          {post.likesCount || 0}
                        </div>

                        {/* 8. 비추수 */}
                        <div className="col-span-1 text-center font-bold font-mono text-rose-500">
                          {post.dislikesCount || 0}
                        </div>

                        {/* 9. 관리 (관리자만 노출) */}
                        {isAdmin && (
                          <div className="col-span-1 flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleTogglePostPrivacy(post)}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                post.isPrivateByAdmin
                                  ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title={post.isPrivateByAdmin ? '비공개 해제' : '관리자 비공개'}
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                              title="게시글 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* MOBILE FEED LIST (md:hidden - Single-line rows with Post Number) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredPosts.map((post) => {
                    const isNotice = post.isNotice || post.category === '공지';
                    const isVideoPost = post.postType === 'VIDEO_CLIPS' || post.category === '영상';
                    const formattedDate = post.createdAt ? post.createdAt.split('T')[0] : '';
                    const shortDate = formattedDate ? formattedDate.slice(5) : '';

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`flex items-center justify-between gap-1.5 py-2.5 px-1 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors ${
                          isNotice
                            ? 'bg-rose-50/40 font-semibold'
                            : post.isPrivateByAdmin
                              ? 'bg-amber-50/40'
                              : ''
                        }`}
                      >
                        {/* Left: Number + Category + Thumbnail + Title (Strict 1 line truncated) + Comment count + Poll Icon */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {/* 모바일 번호 표시 */}
                          <span className="font-mono text-[11px] text-slate-400 font-bold shrink-0 min-w-[20px] text-center">
                            {isNotice ? (
                              <span className="text-rose-600 font-black text-[10px]">공지</span>
                            ) : (
                              post.postNumber || '-'
                            )}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isNotice
                                ? 'bg-rose-600 text-white'
                                : isVideoPost
                                  ? 'bg-sky-100 text-sky-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {post.category || '일반'}
                          </span>

                          {isVideoPost && post.thumbnailUrl && (
                            <div className="w-5 h-4 rounded overflow-hidden bg-slate-800 shrink-0 border border-slate-200">
                              <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}

                          <span className={`text-xs truncate ${isNotice ? 'text-rose-950 font-black' : 'font-semibold text-slate-900'}`}>
                            {post.title}
                          </span>

                          {post.poll && (
                            <span className="text-[10px] text-emerald-600 font-bold shrink-0">
                              [투표]
                            </span>
                          )}

                          {(post.commentsCount || 0) > 0 && (
                            <span className="text-[11px] font-bold text-sky-600 shrink-0">
                              [{post.commentsCount}]
                            </span>
                          )}

                          {post.isPrivateByAdmin && (
                            <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded shrink-0">
                              비공개
                            </span>
                          )}
                        </div>

                        {/* Right: Date, Likes/Dislikes, Admin Icon (Compact single line) */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0 font-mono">
                          <span className="text-slate-400">{shortDate}</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <ThumbsUp className="w-2.5 h-2.5" />
                            {post.likesCount || 0}
                          </span>
                          {(post.dislikesCount || 0) > 0 && (
                            <span className="text-rose-500 font-bold flex items-center gap-0.5">
                              <ThumbsDown className="w-2.5 h-2.5" />
                              {post.dislikesCount}
                            </span>
                          )}

                          {/* Admin Quick Action */}
                          {isAdmin && (
                            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleTogglePostPrivacy(post)}
                                className={`p-0.5 rounded cursor-pointer ${
                                  post.isPrivateByAdmin ? 'text-amber-600' : 'text-slate-400 hover:text-slate-700'
                                }`}
                                title="비공개 토글"
                              >
                                <Shield className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post)}
                                className="p-0.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* BOTTOM SEARCH BAR */}
          <div className="flex items-center justify-center gap-1.5 pt-4 pb-4">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-2 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none shrink-0"
            >
              <option value="all">{language === 'ko' ? '제목+내용' : 'Title+Content'}</option>
              <option value="title">{t('titleCol')}</option>
              <option value="content">{language === 'ko' ? '내용' : 'Content'}</option>
              <option value="author">{t('authorCol')}</option>
              <option value="comment">{language === 'ko' ? '댓글' : 'Comment'}</option>
            </select>

            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit();
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSearchSubmit}
              className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              {t('searchBtn')}
            </button>
          </div>
        </div>
      ) : isCreatingPost ? (
        /* ---------------------------------------------------------------- */
        /* 2. CREATE POST VIEW (UNBOXED, NOTICE & POLL SUPPORT)             */
        /* ---------------------------------------------------------------- */
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetCreateForm}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base sm:text-lg font-black text-slate-900">{t('writePost')}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetCreateForm}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleCreatePostSubmit}
                disabled={isSubmittingPost || !newTitle.trim() || !newContent.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingPost ? (language === 'ko' ? '등록 중...' : 'Submitting...') : t('submitCommentBtn')}</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-1">
            {/* Category & Title */}
            <div className="flex items-center gap-2">
              <select
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  if (e.target.value === '공지') setNewIsNotice(true);
                  else setNewIsNotice(false);
                }}
                className={`px-3 py-2 text-xs sm:text-sm font-bold border rounded-xl bg-white focus:outline-none shrink-0 ${
                  newCategory === '공지'
                    ? 'border-rose-400 text-rose-700 bg-rose-50'
                    : 'border-slate-300 text-slate-800'
                }`}
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c === '공지' ? (language === 'ko' ? '📢 공지' : '📢 Notice') : c === '일반' ? (language === 'ko' ? '일반' : 'General') : c === '영상' ? (language === 'ko' ? '영상' : 'Video') : c}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={language === 'ko' ? "제목을 입력하세요" : "Enter title..."}
                className="flex-1 px-3 py-2 text-xs sm:text-sm font-bold border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Media & Poll Option Bar (Clean segmented bar) */}
            <div className="p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => {
                  setNewPostType('TEXT');
                  setNewYoutubeUrl('');
                  setNewVideoTitle('');
                  setAttachedVideoThumbnail('');
                  setNewClips([]);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  newPostType === 'TEXT' && !enablePoll
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('optionText')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVideoPickerOpen(true)}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  newPostType === 'VIDEO_CLIPS' && attachedVideoThumbnail
                    ? 'bg-sky-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('optionVideoArchive')}</span>
              </button>

              <button
                type="button"
                onClick={() => setNewPostType('VIDEO_CLIPS')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  newPostType === 'VIDEO_CLIPS' && !attachedVideoThumbnail
                    ? 'bg-sky-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('optionYoutube')}</span>
              </button>

              <button
                type="button"
                onClick={() => setEnablePoll(!enablePoll)}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  enablePoll
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{enablePoll ? t('optionPollConfigured') : t('optionPoll')}</span>
              </button>
            </div>

            {/* Poll Creation Box if enabled */}
            {enablePoll && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                    투표 설정
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={pollAllowMultiple}
                      onChange={(e) => setPollAllowMultiple(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>복수 선택 허용</span>
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    투표 질문 (미입력 시 게시글 제목이 질문으로 사용됩니다)
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="예: 가장 선호하는 가드 패스 스타일은?"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    선택지 목록 (최소 2개, 최대 10개)
                  </label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 w-5 text-center font-mono">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        placeholder={`선택지 ${idx + 1} 입력 (예: 토레안도 패스)`}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="mt-1 text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> 선택지 추가
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* If Video Attached */}
            {newPostType === 'VIDEO_CLIPS' && (
              <div className="space-y-3 pt-1">
                {attachedVideoThumbnail ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-sky-200 bg-sky-50/50">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={attachedVideoThumbnail}
                        alt=""
                        className="w-12 h-8 object-cover rounded-lg bg-black shrink-0"
                      />
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {newVideoTitle || '선택된 영상'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVideoPickerOpen(true)}
                      className="text-xs font-bold text-sky-700 hover:underline cursor-pointer shrink-0"
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={newYoutubeUrl}
                    onChange={(e) => setNewYoutubeUrl(e.target.value)}
                    placeholder="YouTube URL (예: https://www.youtube.com/watch?v=...)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                )}

                {/* Optional Video Preview & Clips for video post */}
                {(extractYoutubeId(newYoutubeUrl) || attachedVideoThumbnail) && (
                  <div className="space-y-3 pt-1">
                    <div className="rounded-xl overflow-hidden bg-black aspect-video max-w-lg mx-auto">
                      <VideoPlayer16x9
                        youtubeId={extractYoutubeId(newYoutubeUrl) || ''}
                        videoUrl={newYoutubeUrl}
                        title={newVideoTitle}
                        externalSeekTime={createSeekTime}
                        onTimeChange={(sec) => setCurrentPlayTime(sec)}
                        showPrecisionControls={true}
                        autoPlay={false}
                      />
                    </div>

                    {/* Clip Creator */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          구간 클립 질문 추가 (선택)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempClipStartTime(formatSecondsToMMSS(currentPlayTime));
                            showFeedback(`현재 재생 시점(${formatSecondsToMMSS(currentPlayTime)}) 캡처`);
                          }}
                          className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
                        >
                          현재시점({formatSecondsToMMSS(currentPlayTime)}) 캡처
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <input
                          type="text"
                          value={tempClipStartTime}
                          onChange={(e) => setTempClipStartTime(e.target.value)}
                          placeholder="시작 (MM:SS)"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                        />
                        <input
                          type="text"
                          value={tempClipEndTime}
                          onChange={(e) => setTempClipEndTime(e.target.value)}
                          placeholder="종료 (선택)"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleAddClip}
                          className="py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg cursor-pointer"
                        >
                          + 클립 추가
                        </button>
                      </div>

                      <input
                        type="text"
                        value={tempClipQuestion}
                        onChange={(e) => setTempClipQuestion(e.target.value)}
                        placeholder="이 구간에 대한 질문 입력..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs"
                      />

                      {/* Clip List */}
                      {newClips.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {newClips.map((clip) => (
                            <div
                              key={clip.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-bold text-sky-700">클립 {clip.clipNumber} ({clip.timeLabel})</span>
                                <span className="text-slate-600 truncate">{clip.question}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveClip(clip.id)}
                                className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Textarea */}
            <div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={language === 'ko' ? "내용을 자유롭게 입력하세요..." : "Write your post freely..."}
                rows={8}
                className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-sky-500 transition-all resize-y"
              />
            </div>

            {/* Tags */}
            <div>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder={language === 'ko' ? "해시태그 (선택, 쉼표 또는 띄어쓰기로 구분: #스파링 #질문)" : "Hashtags (optional, e.g. #sparring #technique)"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      ) : selectedPost ? (
        /* ---------------------------------------------------------------- */
        /* 3. POST DETAIL VIEW (UNBOXED & CLEAN)                            */
        /* ---------------------------------------------------------------- */
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
          {/* Top Action Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSelectedPost(null);
                loadPosts();
              }}
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('backToList')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedPost) {
                    loadComments(selectedPost.id);
                    loadPosts();
                    showFeedback(language === 'ko' ? '새로고침되었습니다.' : 'Refreshed.');
                  }
                }}
                disabled={loadingComments}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingComments ? 'animate-spin text-sky-600' : ''}`} />
                <span>{t('refreshBtn')}</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleTogglePostPrivacy(selectedPost)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    selectedPost.isPrivateByAdmin
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{selectedPost.isPrivateByAdmin ? t('unprivateBtn') : t('makePrivateBtn')}</span>
                </button>
              )}

              {(isAdmin || selectedPost.userId === currentUser.uid) && (
                <button
                  type="button"
                  onClick={() => handleDeletePost(selectedPost)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('deleteBtn')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Post Header */}
          <div className="space-y-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedPost.isNotice || selectedPost.category === '공지' ? (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-rose-600 text-white flex items-center gap-1">
                  <Megaphone className="w-3 h-3" /> {t('noticeBadge')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
                  {selectedPost.category === '일반' ? t('generalCat') : selectedPost.category === '영상' ? t('videoCat') : selectedPost.category}
                </span>
              )}

              {selectedPost.isPrivateByAdmin && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  {t('privateBadge')}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
              {selectedPost.title}
            </h1>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{selectedPost.userName}</span>
                <span>•</span>
                <span className="font-mono text-[11px]">
                  {selectedPost.createdAt ? selectedPost.createdAt.replace('T', ' ').substring(0, 16) : ''}
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  {selectedPost.viewsCount || 0}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ThumbsUp className="w-3 h-3" />
                  {selectedPost.likesCount || 0}
                </span>
                {(selectedPost.dislikesCount || 0) > 0 && (
                  <span className="flex items-center gap-1 text-rose-500 font-bold">
                    <ThumbsDown className="w-3 h-3" />
                    {selectedPost.dislikesCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Video Player & Clips (If VIDEO_CLIPS) */}
          {selectedPost.postType === 'VIDEO_CLIPS' && selectedPost.youtubeId && (
            <div className="space-y-3 pt-1">
              <div className="rounded-2xl overflow-hidden bg-black shadow-sm aspect-video">
                <VideoPlayer16x9
                  youtubeId={selectedPost.youtubeId}
                  videoUrl={selectedPost.youtubeUrl}
                  title={selectedPost.videoTitle || selectedPost.title}
                  externalSeekTime={detailSeekTime}
                  showPrecisionControls={true}
                  autoPlay={false}
                />
              </div>

              {selectedPost.clips && selectedPost.clips.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-700">질문 구간 클립:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedPost.clips.map((clip) => (
                      <div
                        key={clip.id}
                        onClick={() => handleSeekToClip(clip.startTime)}
                        className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 hover:border-sky-300 transition-all cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-sky-600 text-white text-[10px] font-bold">
                              클립 {clip.clipNumber}
                            </span>
                            <span className="text-xs font-bold text-sky-800">{clip.timeLabel}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800">{clip.question}</div>
                        </div>

                        <button
                          type="button"
                          className="flex items-center gap-1 px-2 py-1 rounded bg-sky-600 text-white text-[11px] font-bold shrink-0"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>재생</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Poll Display */}
          {selectedPost.poll && (
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-600 text-white">
                    <BarChart2 className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-emerald-950">
                    {selectedPost.poll.question}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">
                  총 {selectedPost.poll.totalVotes}표 {selectedPost.poll.allowMultiple ? '(복수선택)' : ''}
                </span>
              </div>

              {/* Poll Options List */}
              <div className="space-y-2 pt-1">
                {selectedPost.poll.options.map((opt) => {
                  const isChecked = selectedPollOptionIds.includes(opt.id);
                  const total = selectedPost.poll?.totalVotes || 0;
                  const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
                  const isMyVote = opt.votedUserIds?.includes(currentUser.uid);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleTogglePollOption(opt.id)}
                      className={`relative p-3 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                        isChecked
                          ? 'border-emerald-500 bg-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Background Progress Bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-500 ${
                          isChecked ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />

                      <div className="relative flex items-center justify-between gap-2 z-10">
                        <div className="flex items-center gap-2 min-w-0">
                          {selectedPost.poll?.allowMultiple ? (
                            isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )
                          ) : isChecked ? (
                            <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center shrink-0">
                              <div className="w-2 h-2 rounded-full bg-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                          )}
                          <span className={`text-xs font-bold ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {opt.text}
                          </span>
                          {isMyVote && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-extrabold">
                              {t('pollMyVote')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className="text-slate-400 text-[11px]">{opt.voteCount}{language === 'ko' ? '표' : ' votes'}</span>
                          <span className="font-bold text-emerald-700 w-9 text-right">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vote Submit Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleVoteSubmit}
                  disabled={submittingVote || selectedPollOptionIds.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {submittingVote ? (language === 'ko' ? '투표 중...' : 'Voting...') : t('pollVoteBtn')}
                </button>
              </div>
            </div>
          )}

          {/* Post Content (Simple unboxed text) */}
          <div className="text-slate-900 text-sm sm:text-base leading-relaxed whitespace-pre-line py-3">
            {selectedPost.content}
          </div>

          {/* Hashtags */}
          {selectedPost.tags && selectedPost.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-3">
              {selectedPost.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                >
                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}

          {/* Post Action: Like & Dislike Buttons (Side by Side) */}
          <div className="flex items-center justify-center gap-3 py-6 border-t border-b border-slate-200">
            {/* 추천 버튼 */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedPost.likedUserIds?.includes(currentUser.uid)
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{t('recommendBtn')}</span>
              <span className="font-mono">{selectedPost.likesCount || 0}</span>
            </button>

            {/* 비추 버튼 */}
            <button
              type="button"
              onClick={handleToggleDislike}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedPost.dislikedUserIds?.includes(currentUser.uid)
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{t('dislikeBtn')}</span>
              <span className="font-mono">{selectedPost.dislikesCount || 0}</span>
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* COMMENTS SECTION WITH QUICK CLIP MENTION CHIPS                   */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>{t('commentsTitle')} ({comments.length})</span>
              </h3>
            </div>

            {/* Comment Write Input with Quick Clip Mentions */}
            <div className="space-y-2">
              {/* Quick Clip Mention Tags */}
              {selectedPost.clips && selectedPost.clips.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-sky-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    클립 언급:
                  </span>
                  {selectedPost.clips.map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => setNewCommentText((prev) => `${prev} @클립${clip.clipNumber} `)}
                      className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + @클립{clip.clipNumber} ({clip.timeLabel})
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={
                  currentUser.isBanned
                    ? (language === 'ko' ? '이용 정지 상태에서는 댓글 작성이 제한됩니다.' : 'Comment submission is restricted.')
                    : (language === 'ko'
                      ? '댓글을 입력하세요. (클립 언급: @클립1, 타임점프: @01:23)'
                      : 'Write a comment... (Mention clip: @clip1, Jump: @01:23)')
                }
                disabled={currentUser.isBanned}
                rows={2}
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-sky-500 transition-all resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={submittingComment || !newCommentText.trim() || currentUser.isBanned}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('submitCommentBtn')}</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                {language === 'ko' ? '댓글을 불러오는 중...' : 'Loading comments...'}
              </div>
            ) : comments.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                {language === 'ko' ? '등록된 댓글이 없습니다. 첫 번째 피드백을 남겨보세요!' : 'No comments yet. Leave the first feedback!'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {comments
                  .filter((c) => !c.parentId)
                  .map((comment) => {
                    const isAuthor = comment.userId === currentUser.uid;
                    const replies = comments.filter((r) => r.parentId === comment.id);

                    return (
                      <div key={comment.id} className="py-3 space-y-1.5">
                        {/* Comment Header */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{comment.userName}</span>
                            {comment.userId === selectedPost.userId && (
                              <span className="px-1 py-0.2 bg-sky-100 text-sky-700 rounded text-[9px] font-bold">
                                작성자
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              {comment.createdAt ? comment.createdAt.replace('T', ' ').substring(0, 16) : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setReplyingToCommentId(
                                  replyingToCommentId === comment.id ? null : comment.id
                                )
                              }
                              className="text-[11px] font-semibold text-slate-500 hover:text-sky-600 cursor-pointer"
                            >
                              {t('replyBtn')}
                            </button>

                            {(isAuthor || isAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                title={t('deleteBtn')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleToggleCommentPrivacy(comment)}
                                className="text-slate-400 hover:text-amber-600 p-0.5 cursor-pointer"
                                title="비공개 토글"
                              >
                                <Shield className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Comment Content with interactive clip tags */}
                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          {renderCommentContentWithClips(comment.content, selectedPost.clips || [])}
                        </div>

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="pl-4 pt-1.5 space-y-1.5 border-l-2 border-slate-100">
                            {replies.map((reply) => {
                              const isReplyAuthor = reply.userId === currentUser.uid;
                              return (
                                <div key={reply.id} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-700">{reply.userName}</span>
                                      {reply.userId === selectedPost.userId && (
                                        <span className="px-1 py-0.2 bg-sky-100 text-sky-700 rounded text-[9px] font-bold">
                                          {language === 'ko' ? '작성자' : 'Author'}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {reply.createdAt ? reply.createdAt.replace('T', ' ').substring(0, 16) : ''}
                                      </span>
                                    </div>

                                    {(isReplyAuthor || isAdmin) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(reply)}
                                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                        title={t('deleteBtn')}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>

                                  <div className="text-xs text-slate-800 leading-relaxed">
                                    {renderCommentContentWithClips(reply.content, selectedPost.clips || [])}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Input Form with Clip Quick Mentions */}
                        {replyingToCommentId === comment.id && (
                          <div className="pl-4 pt-2 space-y-1.5">
                            {selectedPost.clips && selectedPost.clips.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap text-[11px]">
                                {selectedPost.clips.map((clip) => (
                                  <button
                                    key={clip.id}
                                    type="button"
                                    onClick={() => setReplyText((prev) => `${prev} @클립${clip.clipNumber} `)}
                                    className="px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded border border-sky-200 text-[10px] font-bold cursor-pointer"
                                  >
                                    + @클립{clip.clipNumber}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={
                                  language === 'ko'
                                    ? `${comment.userName}님에게 답글... (클립: @클립1)`
                                    : `Reply to ${comment.userName}... (Clip: @clip1)`
                                }
                                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddReply(comment.id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddReply(comment.id)}
                                disabled={submittingComment || !replyText.trim()}
                                className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                {t('submitCommentBtn')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToCommentId(null);
                                  setReplyText('');
                                }}
                                className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                              >
                                {t('cancelBtn')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* 4. VIDEO FOLDER PICKER MODAL                                      */}
      {/* ---------------------------------------------------------------- */}
      {isVideoPickerOpen && (
        <VideoArchivePickerModal
          videos={videos}
          metadata={metadata}
          primaryColor={primaryColor}
          onSelectVideo={handleSelectArchiveVideo}
          onClose={() => setIsVideoPickerOpen(false)}
        />
      )}
    </div>
  );
};
