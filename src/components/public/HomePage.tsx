
import type { Member, Settings } from '@/lib/types';
import NameSearch from '@/components/public/NameSearch';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
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
