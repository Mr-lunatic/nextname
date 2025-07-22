import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gradient-premium">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        <Button asChild size="lg">
          <Link href="/">
            Go back to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
