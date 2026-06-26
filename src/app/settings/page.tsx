import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/traffic-pulse?view=setup');
}
