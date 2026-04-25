import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export function useWatchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setHistory([]); setLoading(false); return; }
    const q = query(
      collection(db, 'watchHistory'),
      where('uid', '==', user.uid),
      orderBy('watchedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { history, loading };
}