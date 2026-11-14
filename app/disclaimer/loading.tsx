import { LoadingBlock } from '@/components/ui/skeleton';

// Shown at once while the page is fetched, and lets the link be prefetched in the background.
export default function Loading() {
  return <div className="container-page py-10"><LoadingBlock rows={3} /></div>;
}
