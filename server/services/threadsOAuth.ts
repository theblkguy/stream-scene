// server/services/threadsOAuth.ts// server/services/threadsOAuth.ts



// Clean Threads OAuth integration service// Clean Threads OAuth integration service



export interface ThreadsOAuthConfig {export interface ThreadsOAuthConfig {

  clientId: string;  clientId: string;

  clientSecret: string;  clientSecret: string;

  redirectUri: string;  redirectUri: string;

  baseUrl: string;  baseUrl: string;

}}



export interface ThreadsProfile {export interface ThreadsProfile {

  id: string;  id: string;

  username: string;  username: string;

  name?: string;  name?: string;

  account_type?: string;  account_type?: string;

  profile_picture_url?: string;  profile_picture_url?: string;

  biography?: string;  biography?: string;

  website?: string;  website?: string;

  followers_count?: number;  followers_count?: number;

  media_count?: number;  media_count?: number;

  is_verified?: boolean;  is_verified?: boolean;

  is_verified_blue?: boolean;  is_verified_blue?: boolean;

}}



export interface ThreadsTokenResponse {export interface ThreadsTokenResponse {

  access_token: string;  access_token: string;

  user_id: string;  user_id: string;

  expires_in: number;  expires_in: number;

}}



export interface ThreadsAuthResult {export interface ThreadsAuthResult {

  accessToken: string;  accessToken: string;

  userId: string;  userId: string;

  username: string;  username: string;

  expiresAt: Date;  expiresAt: Date;

}}



// Generate OAuth URL for Threads authentication// Generate OAuth URL for Threads authentication

export const initiateThreadsAuth = async (): Promise<string> => {export const initiateThreadsAuth = async (): Promise<string> => {

  const clientId = process.env.THREADS_CLIENT_ID;  const clientId = process.env.THREADS_CLIENT_ID;

  const baseUrl = process.env.BASE_URL || 'https://streamscene.net';  const baseUrl = process.env.BASE_URL || 'https://streamscene.net';

  const redirectUri = `${baseUrl}/auth/threads/callback`;  const redirectUri = `${baseUrl}/auth/threads/callback`;

    

  if (!clientId) {  if (!clientId) {

    throw new Error('Missing THREADS_CLIENT_ID environment variable');    throw new Error('Missing THREADS_CLIENT_ID environment variable');

  }  }

    

  const state = Math.random().toString(36).substring(2, 15);  const state = Math.random().toString(36).substring(2, 15);

    

  const authParams = new URLSearchParams({  const authParams = new URLSearchParams({

    client_id: clientId,    client_id: clientId,

    redirect_uri: redirectUri,    redirect_uri: redirectUri,

    scope: 'threads_basic,threads_content_publish',    scope: 'threads_basic,threads_content_publish',

    response_type: 'code',    response_type: 'code',

    state: state    state: state

  });  });

    

  return `https://threads.net/oauth/authorize?${authParams.toString()}`;  return `https://threads.net/oauth/authorize?${authParams.toString()}`;

};};



// Handle OAuth callback and exchange code for token// Handle OAuth callback and exchange code for token

export const handleThreadsCallback = async (code: string): Promise<ThreadsAuthResult> => {export const handleThreadsCallback = async (code: string): Promise<ThreadsAuthResult> => {

  const clientId = process.env.THREADS_CLIENT_ID;  const clientId = process.env.THREADS_CLIENT_ID;

  const clientSecret = process.env.THREADS_CLIENT_SECRET;  const clientSecret = process.env.THREADS_CLIENT_SECRET;

  const baseUrl = process.env.BASE_URL || 'https://streamscene.net';  const baseUrl = process.env.BASE_URL || 'https://streamscene.net';

  const redirectUri = `${baseUrl}/auth/threads/callback`;  const redirectUri = `${baseUrl}/auth/threads/callback`;

    

  if (!clientId || !clientSecret) {  if (!clientId || !clientSecret) {

    throw new Error('Missing THREADS_CLIENT_ID or THREADS_CLIENT_SECRET environment variables');    throw new Error('Missing THREADS_CLIENT_ID or THREADS_CLIENT_SECRET environment variables');

  }  }

    

  // Exchange authorization code for access token  // Exchange authorization code for access token

  const tokenParams = new URLSearchParams({  const tokenParams = new URLSearchParams({

    client_id: clientId,    client_id: clientId,

    client_secret: clientSecret,    client_secret: clientSecret,

    grant_type: 'authorization_code',    grant_type: 'authorization_code',

    redirect_uri: redirectUri,    redirect_uri: redirectUri,

    code: code    code: code

  });  });

    

  const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {  const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {

    method: 'POST',    method: 'POST',

    headers: {    headers: {

      'Content-Type': 'application/x-www-form-urlencoded',      'Content-Type': 'application/x-www-form-urlencoded',

    },    },

    body: tokenParams.toString()    body: tokenParams.toString()

  });  });

    

  if (!tokenResponse.ok) {  if (!tokenResponse.ok) {

    const errorText = await tokenResponse.text();    const errorText = await tokenResponse.text();

    throw new Error(`Token exchange failed: ${errorText}`);    throw new Error(`Token exchange failed: ${errorText}`);

  }  }

    

  const tokenData: ThreadsTokenResponse = await tokenResponse.json();  const tokenData: ThreadsTokenResponse = await tokenResponse.json();

    

  // Get user profile  // Get user profile

  const profileResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,account_type&access_token=${tokenData.access_token}`);  const profileResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,account_type&access_token=${tokenData.access_token}`);

    

  if (!profileResponse.ok) {  if (!profileResponse.ok) {

    const errorText = await profileResponse.text();    const errorText = await profileResponse.text();

    throw new Error(`Profile fetch failed: ${errorText}`);    throw new Error(`Profile fetch failed: ${errorText}`);

  }  }

    

  const profileData: ThreadsProfile = await profileResponse.json();  const profileData: ThreadsProfile = await profileResponse.json();

    

  // Calculate expiration date  // Calculate expiration date

  const expiresAt = new Date();  const expiresAt = new Date();

  expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);  expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    

  return {  return {

    accessToken: tokenData.access_token,    accessToken: tokenData.access_token,

    userId: tokenData.user_id,    userId: tokenData.user_id,

    username: profileData.username,    username: profileData.username,

    expiresAt: expiresAt    expiresAt: expiresAt

  };  };

};};



// Refresh access token// Refresh access token

export const refreshThreadsToken = async (refreshToken: string): Promise<ThreadsAuthResult> => {export const refreshThreadsToken = async (refreshToken: string): Promise<ThreadsAuthResult> => {

  const clientId = process.env.THREADS_CLIENT_ID;  const clientId = process.env.THREADS_CLIENT_ID;

  const clientSecret = process.env.THREADS_CLIENT_SECRET;  const clientSecret = process.env.THREADS_CLIENT_SECRET;

    

  if (!clientId || !clientSecret) {  if (!clientId || !clientSecret) {

    throw new Error('Missing THREADS_CLIENT_ID or THREADS_CLIENT_SECRET environment variables');    throw new Error('Missing THREADS_CLIENT_ID or THREADS_CLIENT_SECRET environment variables');

  }  }

    

  const refreshParams = new URLSearchParams({  const refreshParams = new URLSearchParams({

    client_id: clientId,    client_id: clientId,

    client_secret: clientSecret,    client_secret: clientSecret,

    grant_type: 'refresh_token',    grant_type: 'refresh_token',

    refresh_token: refreshToken    refresh_token: refreshToken

  });  });

    

  const response = await fetch('https://graph.threads.net/oauth/access_token', {  const response = await fetch('https://graph.threads.net/oauth/access_token', {

    method: 'POST',    method: 'POST',

    headers: {    headers: {

      'Content-Type': 'application/x-www-form-urlencoded',      'Content-Type': 'application/x-www-form-urlencoded',

    },    },

    body: refreshParams.toString()    body: refreshParams.toString()

  });  });

    

  if (!response.ok) {  if (!response.ok) {

    const errorText = await response.text();    const errorText = await response.text();

    throw new Error(`Token refresh failed: ${errorText}`);    throw new Error(`Token refresh failed: ${errorText}`);

  }  }

    

  const tokenData: ThreadsTokenResponse = await response.json();  const tokenData: ThreadsTokenResponse = await response.json();

    

  // Get updated user profile  // Get updated user profile

  const profileResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,account_type&access_token=${tokenData.access_token}`);  const profileResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,account_type&access_token=${tokenData.access_token}`);

    

  if (!profileResponse.ok) {  if (!profileResponse.ok) {

    const errorText = await profileResponse.text();    const errorText = await profileResponse.text();

    throw new Error(`Profile fetch failed: ${errorText}`);    throw new Error(`Profile fetch failed: ${errorText}`);

  }  }

    

  const profileData: ThreadsProfile = await profileResponse.json();  const profileData: ThreadsProfile = await profileResponse.json();

    

  // Calculate expiration date  // Calculate expiration date

  const expiresAt = new Date();  const expiresAt = new Date();

  expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);  expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    

  return {  return {

    accessToken: tokenData.access_token,    accessToken: tokenData.access_token,

    userId: tokenData.user_id,    userId: tokenData.user_id,

    username: profileData.username,    username: profileData.username,

    expiresAt: expiresAt    expiresAt: expiresAt

  };  };

};};

}}



export interface ThreadsTokenResponse {export interface ThreadsTokenResponse {

  access_token: string;  access_token: string;

  token_type: string;  token_type: string;

  expires_in?: number;  expires_in?: number;

}}



// Get OAuth configuration from environment// Get OAuth configuration from environment

const getOAuthConfig = (): ThreadsOAuthConfig => {const getOAuthConfig = (): ThreadsOAuthConfig => {

  const clientId = process.env.THREADS_CLIENT_ID;  const clientId = process.env.THREADS_CLIENT_ID;

  const clientSecret = process.env.THREADS_CLIENT_SECRET;  const clientSecret = process.env.THREADS_CLIENT_SECRET;

  const baseUrl = process.env.BASE_URL || 'https://streamscene.net';  const baseUrl = process.env.BASE_URL || 'https://streamscene.net';

    

  if (!clientId || !clientSecret) {  if (!clientId || !clientSecret) {

    throw new Error('Missing THREADS_CLIENT_ID or THREADS_CLIENT_SECRET environment variables');    throw new Error('Missing THREADS_CLIENT_ID or THREADS_CLIENT_SECRET environment variables');

  }  }

    

  return {  return {

    clientId,    clientId,

    clientSecret,    clientSecret,

    redirectUri: `${baseUrl}/auth/threads/callback`,    redirectUri: `${baseUrl}/auth/threads/callback`,

    baseUrl    baseUrl

  };  };

};};



// Generate authorization URL// Generate authorization URL

export const initiateThreadsAuth = async (req: Request, res: Response) => {export const initiateThreadsAuth = async (req: Request, res: Response) => {

  try {  try {

    const config = getOAuthConfig();    const config = getOAuthConfig();

        

    // Generate state parameter for CSRF protection    // Generate state parameter for CSRF protection

    const state = crypto.randomBytes(32).toString('hex');    const state = crypto.randomBytes(32).toString('hex');

        

    // Store state in session for verification    // Store state in session for verification

    (req.session as any).threadsOAuthState = state;    (req.session as any).threadsOAuthState = state;

        

    // Build authorization URL    // Build authorization URL

    const authParams = new URLSearchParams({    const authParams = new URLSearchParams({

      client_id: config.clientId,      client_id: config.clientId,

      redirect_uri: config.redirectUri,      redirect_uri: config.redirectUri,

      scope: 'threads_basic,threads_content_publish,threads_manage_insights',      scope: 'threads_basic,threads_content_publish,threads_manage_insights',

      response_type: 'code',      response_type: 'code',

      state: state      state: state

    });    });

        

    const authUrl = `https://threads.net/oauth/authorize?${authParams.toString()}`;    const authUrl = `https://threads.net/oauth/authorize?${authParams.toString()}`;

        

    console.log('Initiating Threads OAuth:', { authUrl, redirectUri: config.redirectUri });    console.log('Initiating Threads OAuth:', { authUrl, redirectUri: config.redirectUri });

    res.redirect(authUrl);    res.redirect(authUrl);

        

  } catch (error) {  } catch (error) {

    console.error('Failed to initiate Threads authentication:', error);    console.error('Failed to initiate Threads authentication:', error);

    res.status(500).json({     res.status(500).json({ 

      error: 'Failed to initiate Threads authentication',      error: 'Failed to initiate Threads authentication',

      details: error instanceof Error ? error.message : 'Unknown error'      details: error instanceof Error ? error.message : 'Unknown error'

    });    });

  }  }

};};



// Handle OAuth callback// Handle OAuth callback

export const handleThreadsCallback = async (req: Request, res: Response) => {export const handleThreadsCallback = async (req: Request, res: Response) => {

  try {  try {

    const { code, state, error: oauthError } = req.query;    const { code, state, error: oauthError } = req.query;

    const config = getOAuthConfig();    const config = getOAuthConfig();

        

    // Check for OAuth errors    // Check for OAuth errors

    if (oauthError) {    if (oauthError) {

      console.error('OAuth error:', oauthError);      console.error('OAuth error:', oauthError);

      return res.redirect(`${config.baseUrl}/dashboard?error=oauth_denied`);      return res.redirect(`${config.baseUrl}/dashboard?error=oauth_denied`);

    }    }

        

    // Verify state parameter    // Verify state parameter

    if (!state || state !== (req.session as any).threadsOAuthState) {    if (!state || state !== (req.session as any).threadsOAuthState) {

      console.error('Invalid state parameter');      console.error('Invalid state parameter');

      return res.redirect(`${config.baseUrl}/dashboard?error=invalid_state`);      return res.redirect(`${config.baseUrl}/dashboard?error=invalid_state`);

    }    }

        

    // Clear state from session    // Clear state from session

    delete (req.session as any).threadsOAuthState;    delete (req.session as any).threadsOAuthState;

        

    if (!code || typeof code !== 'string') {    if (!code || typeof code !== 'string') {

      return res.redirect(`${config.baseUrl}/dashboard?error=no_code`);      return res.redirect(`${config.baseUrl}/dashboard?error=no_code`);

    }    }

        

    // Exchange authorization code for access token    // Exchange authorization code for access token

    const tokenResponse = await exchangeCodeForToken(code, config);    const tokenResponse = await exchangeCodeForToken(code, config);

        

    // Fetch user profile    // Fetch user profile

    const profile = await fetchThreadsProfile(tokenResponse.access_token);    const profile = await fetchThreadsProfile(tokenResponse.access_token);

        

    // Store connection info in session (simplified for now)    // Store connection info in session (simplified for now)

    (req.session as any).threadsAuth = {    (req.session as any).threadsAuth = {

      userId: profile.id,      userId: profile.id,

      username: profile.username,      username: profile.username,

      accessToken: tokenResponse.access_token,      accessToken: tokenResponse.access_token,

      connectedAt: new Date().toISOString()      connectedAt: new Date().toISOString()

    };    };

        

    console.log('Threads OAuth successful for user:', profile.username);    console.log('Threads OAuth successful for user:', profile.username);

        

    // Redirect to success page    // Redirect to success page

    res.redirect(`${config.baseUrl}/dashboard?threads_connected=true`);    res.redirect(`${config.baseUrl}/dashboard?threads_connected=true`);

        

  } catch (error) {  } catch (error) {

    console.error('Failed to handle Threads callback:', error);    console.error('Failed to handle Threads callback:', error);

    res.redirect(`${getOAuthConfig().baseUrl}/dashboard?error=callback_failed`);    res.redirect(`${getOAuthConfig().baseUrl}/dashboard?error=callback_failed`);

  }  }

};};



// Exchange authorization code for access token// Exchange authorization code for access token

async function exchangeCodeForToken(code: string, config: ThreadsOAuthConfig): Promise<ThreadsTokenResponse> {async function exchangeCodeForToken(code: string, config: ThreadsOAuthConfig): Promise<ThreadsTokenResponse> {

  try {  try {

    const tokenParams = new URLSearchParams({    const tokenParams = new URLSearchParams({

      client_id: config.clientId,      client_id: config.clientId,

      client_secret: config.clientSecret,      client_secret: config.clientSecret,

      grant_type: 'authorization_code',      grant_type: 'authorization_code',

      redirect_uri: config.redirectUri,      redirect_uri: config.redirectUri,

      code: code      code: code

    });    });

        

    const response = await fetch('https://graph.threads.net/oauth/access_token', {    const response = await fetch('https://graph.threads.net/oauth/access_token', {

      method: 'POST',      method: 'POST',

      headers: {      headers: {

        'Content-Type': 'application/x-www-form-urlencoded'        'Content-Type': 'application/x-www-form-urlencoded'

      },      },

      body: tokenParams.toString()      body: tokenParams.toString()

    });    });

        

    if (!response.ok) {    if (!response.ok) {

      const errorText = await response.text();      const errorText = await response.text();

      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);

    }    }

        

    const data = await response.json() as ThreadsTokenResponse;    const data = await response.json() as ThreadsTokenResponse;

        

    if (!data.access_token) {    if (!data.access_token) {

      throw new Error('No access token received from Threads');      throw new Error('No access token received from Threads');

    }    }

        

    return data;    return data;

        

  } catch (error) {  } catch (error) {

    console.error('Token exchange failed:', error);    console.error('Token exchange failed:', error);

    throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`);    throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`);

  }  }

}}



// Fetch user profile from Threads API// Fetch user profile from Threads API

async function fetchThreadsProfile(accessToken: string): Promise<ThreadsProfile> {async function fetchThreadsProfile(accessToken: string): Promise<ThreadsProfile> {

  try {  try {

    const params = new URLSearchParams({    const params = new URLSearchParams({

      fields: 'id,username,name,account_type,profile_picture_url,biography,website,followers_count,media_count,is_verified,is_verified_blue',      fields: 'id,username,name,account_type,profile_picture_url,biography,website,followers_count,media_count,is_verified,is_verified_blue',

      access_token: accessToken      access_token: accessToken

    });    });

        

    const response = await fetch(`https://graph.threads.net/v1.0/me?${params.toString()}`);    const response = await fetch(`https://graph.threads.net/v1.0/me?${params.toString()}`);

        

    if (!response.ok) {    if (!response.ok) {

      const errorText = await response.text();      const errorText = await response.text();

      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);

    }    }

        

    const data = await response.json() as ThreadsProfile;    const data = await response.json() as ThreadsProfile;

    return data;    return data;

        

  } catch (error) {  } catch (error) {

    console.error('Failed to fetch Threads profile:', error);    console.error('Failed to fetch Threads profile:', error);

    throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`);    throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`);

  }  }

}}



// Get access token from session (simplified version)// Get access token from session (simplified version)

export const getThreadsAccessToken = (req: Request): string | null => {export const getThreadsAccessToken = (req: Request): string | null => {

  const threadsAuth = (req.session as any).threadsAuth;  const threadsAuth = (req.session as any).threadsAuth;

  return threadsAuth?.accessToken || null;  return threadsAuth?.accessToken || null;

};};



// Check if user has Threads connected// Check if user has Threads connected

export const isThreadsConnected = (req: Request): boolean => {export const isThreadsConnected = (req: Request): boolean => {

  const threadsAuth = (req.session as any).threadsAuth;  const threadsAuth = (req.session as any).threadsAuth;

  return !!(threadsAuth?.accessToken && threadsAuth?.userId);  return !!(threadsAuth?.accessToken && threadsAuth?.userId);

};};