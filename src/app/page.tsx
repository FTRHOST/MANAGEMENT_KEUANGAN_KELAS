
import { collection, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Settings } from '@/lib/types';
import { getSettings } from '@/lib/actions';
import HomePage from '@/components/public/HomePage';
import { query } from 'firebase/firestore';

/**
 * Fetches the list of members from the Firestore database.
 * @returns {Promise<Member[]>} A promise that resolves to an array of member objects.
 */
async function getMembers(): Promise<Member[]> {
  const membersCol = collection(db, 'members');
  const membersSnapshot = await getDocs(query(membersCol, orderBy('name')));
  return membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
}

/**
 * The home page of the application.
 * It fetches the members and settings and renders the HomePage component.
 * @returns {Promise<JSX.Element>} A promise that resolves to the HomePage component.
 */
export default async function Home() {
  const members = await getMembers();
  const settings: Settings = await getSettings();

  return <HomePage members={members} settings={settings} />;
}
