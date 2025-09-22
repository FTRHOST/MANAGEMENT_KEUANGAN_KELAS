
import { collection, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Settings } from '@/lib/types';
import { getSettings } from '@/lib/actions';
import HomePage from '@/components/public/HomePage';
import { query } from 'firebase/firestore';

async function getMembers(): Promise<Member[]> {
  const membersCol = collection(db, 'members');
  const membersSnapshot = await getDocs(query(membersCol, orderBy('name')));
  return membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
}

export default async function Home() {
  const members = await getMembers();
  const settings: Settings = await getSettings();

  return <HomePage members={members} settings={settings} />;
}
