'use client';

import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { IconLogout } from '@tabler/icons-react';

export function SignOutButton() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
      <IconLogout className="mr-2 h-4 w-4" />
      Sign out
    </DropdownMenuItem>
  );
}
