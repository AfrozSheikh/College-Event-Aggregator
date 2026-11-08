import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Brand from '@/components/common/Brand';

const NotFound = () => (
  <div className="bg-background flex min-h-screen flex-col px-6 py-6 sm:px-10">
    <Brand />
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-16">
      <p className="meta mb-4">Error 404</p>
      <h1 className="text-5xl leading-[1.05] sm:text-6xl">
        This notice has been <em className="text-primary">taken down.</em>
      </h1>
      <p className="text-muted-foreground mt-5 max-w-md text-lg">
        The page you're after doesn't exist, or it moved when nobody was looking. Head back and try again from the start.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link to="/">
            <ArrowLeft /> Back to the board
          </Link>
        </Button>
      </div>
    </div>
  </div>
);

export default NotFound;
