import { verifyAuthToken, type VerifiedAuthUser } from '@iliad/auth/middleware';
import { NextRequest } from 'next/server';

export interface TrafficApiAuthContext {
  tenantId: string;
  user: VerifiedAuthUser;
}

/** Verified iig-core user with a provisioned tenant, or null (caller returns 401). */
export async function resolveTrafficApiAuthContext(
  request: NextRequest,
): Promise<TrafficApiAuthContext | null> {
  const authUser = await verifyAuthToken(request);
  if (!authUser?.tenantId) {
    return null;
  }

  return {
    tenantId: authUser.tenantId,
    user: authUser,
  };
}
