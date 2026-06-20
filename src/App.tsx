import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { routes } from '@/router/routes';

function RouteContent() {
  const element = useRoutes(routes);
  return element;
}

export default function App() {
  return (
    <Router>
      <RouteContent />
    </Router>
  );
}
