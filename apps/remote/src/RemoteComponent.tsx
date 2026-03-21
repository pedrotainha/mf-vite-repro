import { welcome } from '@repro/pkg-a';

export const RemoteComponent = () => {
  return <div data-testid="remote">{welcome('World')}</div>;
};

export default RemoteComponent;
