import { Suspense } from 'react';
import ClientHome from './ClientHome';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <ClientHome />
    </Suspense>
  );
}
