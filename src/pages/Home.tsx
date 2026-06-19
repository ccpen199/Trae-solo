import { useAppStore } from '@/store/useAppStore';
import GuestHome from '@/components/home/GuestHome';
import JobseekerDashboard from '@/components/home/JobseekerDashboard';
import HRDashboard from '@/components/home/HRDashboard';

export default function Home() {
  const { user, role } = useAppStore();

  if (!user.isLoggedIn) {
    return <GuestHome />;
  }

  if (role === 'hr') {
    return <HRDashboard />;
  }

  return <JobseekerDashboard />;
}
