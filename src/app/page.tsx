
import { collection, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Member, Settings } from '@/lib/types';
import NameSearch from '@/components/public/NameSearch';
import { getSettings } from '@/lib/actions';

async function getMembers(): Promise<Member[]> {
  const membersCol = collection(db, 'members');
  const membersSnapshot = await getDocs(query(membersCol, orderBy('name')));
  return membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
}

export default async function Home() {
  const members = await getMembers();
  const settings: Settings = await getSettings();

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {settings.heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {settings.heroDescription}
        </p>
      </div>
      <NameSearch members={members} />
    </div>
  );
}
// To query documents, we need to import `query`
import { query } from 'firebase/firestore';
