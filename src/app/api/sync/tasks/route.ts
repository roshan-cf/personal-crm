import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { syncCompletedTasks } from '@/lib/calendar';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncCompletedTasks(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing tasks:', error);
    return NextResponse.json({ error: 'Failed to sync tasks' }, { status: 500 });
  }
}
