import type { ShellApi } from '@-label-/contracts';

interface Props {
  shellApi?: ShellApi;
}

const FleetMfe = ({ shellApi: _shellApi }: Props) => {
  return (
    <div data-testid="fleet-mfe">
      <h1>Hello from Fleet</h1>
      <p>This is the Fleet MFE loaded via Module Federation.</p>
    </div>
  );
};

export default FleetMfe;
