import { Link } from 'react-router';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20" data-testid="not-found-page">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground">Page not found</p>
      <Link className="text-primary underline underline-offset-4 hover:text-primary/80" to="/">
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
