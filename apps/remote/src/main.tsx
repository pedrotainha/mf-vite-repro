import { createRoot } from 'react-dom/client';
import { RemoteComponent } from './RemoteComponent';

const root = document.querySelector('#root');
if (root) {
  createRoot(root).render(<RemoteComponent />);
}
