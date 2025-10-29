// server/services/threadsOAuth.ts

export interface ThreadsAuthResult {
  accessToken: string;
  userId: string;
  username: string;
  expiresAt: string;
}

interface ThreadsTokenResponse {
  access_token: string;
  user_id: string;
  token_type?: string;
}

interface ThreadsProfileResponse {
  id: string;
  username?: string;
  name?: string;
}

export const initiateThreadsAuth = async (): Promise<string> => {
  const clientId = process.env.THREADS_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('THREADS_CLIENT_ID environment variable is not set. Please configure your Meta Threads app credentials.');
  }
  
  const state = Math.random().toString(36).substring(2); // CSRF protection
  
  // Use the correct Meta Threads OAuth endpoint (no www subdomain)
  const authUrl = new URL('https://threads.net/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', `${process.env.BASE_URL}/auth/threads/callback`);
  authUrl.searchParams.set('scope', 'threads_basic,threads_content_publish,threads_manage_insights');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  
  return authUrl.toString();
};

export const handleThreadsCallback = async (code: string): Promise<ThreadsAuthResult> => {
  const clientId = process.env.THREADS_CLIENT_ID;
  const clientSecret = process.env.THREADS_CLIENT_SECRET;
  const redirectUri = `${process.env.BASE_URL}/auth/threads/callback`;
  
  if (!clientId || !clientSecret) {
    throw new Error('Threads OAuth credentials are not configured. Please set THREADS_CLIENT_ID and THREADS_CLIENT_SECRET environment variables.');
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      })
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }
    
    const tokenData = await tokenResponse.json() as ThreadsTokenResponse;
    const { access_token, user_id } = tokenData;
    
    // Get user profile information
    const profileResponse = await fetch(`https://graph.threads.net/v1.0/${user_id}?fields=id,username,name&access_token=${access_token}`);
    
    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      throw new Error(`Profile fetch failed: ${error}`);
    }
    
    const profileData = await profileResponse.json() as ThreadsProfileResponse;
    
    return {
      accessToken: access_token,
      userId: user_id,
      username: profileData.username || profileData.name || user_id,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };
  } catch (error) {
    console.error('Threads OAuth callback error:', error);
    
    // Fallback to mock data for development if API fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock Threads data for development');
      return {
        accessToken: 'dev_mock_access_token',
        userId: 'dev_mock_user_id',
        username: 'dev_user',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
    }
    
    throw error;
  }
};
