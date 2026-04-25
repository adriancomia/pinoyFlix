import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (!user) { setBookmarks([]); return; }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setBookmarks(snap.data()?.bookmarks || []);
    });
    return unsub;
  }, [user]);

  const addBookmark = async (item) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      bookmarks: arrayUnion(item),
    });
  };

  const removeBookmark = async (contentId) => {
    if (!user) return;
    const current = bookmarks.find((b) => b.contentId === contentId);
    if (!current) return;
    await updateDoc(doc(db, 'users', user.uid), {
      bookmarks: arrayRemove(current),
    });
  };

  const isBookmarked = (contentId) =>
    bookmarks.some((b) => b.contentId === contentId);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked };
}