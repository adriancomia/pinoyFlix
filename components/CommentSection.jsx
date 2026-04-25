import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Image,
} from 'react-native';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp, doc, updateDoc, increment,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function CommentSection({ contentId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments', contentId, 'messages'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [contentId]);

  const postComment = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'comments', contentId, 'messages'), {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        text: text.trim(),
        createdAt: serverTimestamp(),
        likes: 0,
      });
      setText('');
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const likeComment = async (commentId, currentLikes) => {
    if (!user) return;
    await updateDoc(doc(db, 'comments', contentId, 'messages', commentId), {
      likes: increment(1),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        💬 Comments {comments.length > 0 ? `(${comments.length})` : ''}
      </Text>

      {/* Input — only for logged in users */}
      {user ? (
        <View style={styles.inputWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.inputRight}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.postBtn, (!text.trim() || posting) && styles.postBtnDisabled]}
              onPress={postComment}
              disabled={!text.trim() || posting}
            >
              {posting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.postBtnText}>Post</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            🔒 Sign in to join the conversation
          </Text>
        </View>
      )}

      {/* Comments list */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
      ) : comments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <CommentCard item={item} onLike={likeComment} canLike={!!user} />
          )}
        />
      )}
    </View>
  );
}

function CommentCard({ item, onLike, canLike }) {
  const timeAgo = (ts) => {
    if (!ts) return '';
    const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <View style={styles.comment}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {item.displayName?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>{item.displayName}</Text>
          <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => onLike(item.id, item.likes)}
          disabled={!canLike}
        >
          <Text style={styles.likeBtnText}>❤️ {item.likes || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: SPACING.xl },
  heading: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },

  // Input area
  inputWrap: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  inputRight: { flex: 1 },
  input: {
    backgroundColor: COLORS.surfaceLight, color: COLORS.text,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.sm,
    fontSize: 14, minHeight: 44, marginBottom: SPACING.xs,
  },
  postBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.lg,
    alignSelf: 'flex-end',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Login prompt
  loginPrompt: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center',
  },
  loginPromptText: { color: COLORS.textSecondary, fontSize: 13 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },

  // Comment card
  comment: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  commentAvatarText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentName: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  commentTime: { color: COLORS.textMuted, fontSize: 11 },
  commentText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: SPACING.xs },
  likeBtn: { alignSelf: 'flex-start' },
  likeBtnText: { color: COLORS.textMuted, fontSize: 12 },
});