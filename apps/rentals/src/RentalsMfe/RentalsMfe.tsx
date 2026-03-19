import type { ShellApi } from '@-label-/contracts';

interface Props {
  shellApi?: ShellApi;
}

const RentalsMfe = ({ shellApi: _shellApi }: Props) => {
  return (
    <div data-testid="rentals-mfe">
      <h1>Rentals</h1>
      <p>This is the Rentals MFE loaded via Module Federation.</p>
    </div>
  );
};

export default RentalsMfe;
