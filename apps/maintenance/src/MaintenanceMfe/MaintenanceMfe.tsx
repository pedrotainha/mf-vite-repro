import type { ShellApi } from '@-label-/contracts';

interface Props {
  shellApi?: ShellApi;
}

const MaintenanceMfe = ({ shellApi: _shellApi }: Props) => {
  return (
    <div data-testid="maintenance-mfe">
      <h1>Maintenance</h1>
      <p>This is the Maintenance MFE loaded via Module Federation.</p>
    </div>
  );
};

export default MaintenanceMfe;
