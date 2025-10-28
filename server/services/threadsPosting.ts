// server/services/threadsPosting.ts

// Threads posting service for publishing content

export interface ThreadsMediaUpload {
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  alt_text?: string;
}

export interface ThreadsPostData {
  text?: string;
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  media_url?: string;
  children?: string[]; // For carousel posts - array of media container IDs
  alt_text?: string;
}

export interface ThreadsPostResult {
  id: string;
  permalink?: string;
  creation_id?: string;
}

export interface ThreadsMediaContainer {
  id: string;
  status: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
  error_message?: string;
}

export interface ThreadsApiResponse {
  id: string;
  [key: string]: unknown;
}

export interface ThreadsStatusResponse {
  status: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
  error_message?: string;
}

export interface ThreadsPostDetails {
  id: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  username: string;
  text?: string;
  timestamp: string;
  shortcode: string;
  thumbnail_url?: string;
  children?: ThreadsPostDetails[];
  is_quote_post: boolean;
}

export interface ThreadsUserPostsResponse {
  data: ThreadsPostDetails[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

export class ThreadsPostingService {
  private baseUrl = 'https://graph.threads.net/v1.0';

  constructor(private accessToken: string, private userId: string) {}

  // Upload media and create media container
  async createMediaContainer(mediaData: ThreadsMediaUpload): Promise<ThreadsMediaContainer> {
    const url = `${this.baseUrl}/${this.userId}/threads`;
    
    const params = new URLSearchParams({
      media_type: mediaData.media_type,
      media_url: mediaData.media_url,
      access_token: this.accessToken
    });

    if (mediaData.alt_text) {
      params.append('alt_text', mediaData.alt_text);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Media container creation failed: ${errorText}`);
    }

    const result = await response.json() as ThreadsApiResponse;
    return {
      id: result.id,
      status: 'IN_PROGRESS'
    };
  }

  // Check media container status
  async checkMediaContainerStatus(containerId: string): Promise<ThreadsMediaContainer> {
    const url = `${this.baseUrl}/${containerId}?fields=status,error_message&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check failed: ${errorText}`);
    }

    const result = await response.json() as ThreadsStatusResponse;
    return {
      id: containerId,
      status: result.status,
      error_message: result.error_message
    };
  }

  // Wait for media container to be ready
  async waitForMediaContainer(containerId: string, maxWaitTime = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkMediaContainerStatus(containerId);
      
      if (status.status === 'FINISHED') {
        return;
      }
      
      if (status.status === 'ERROR') {
        throw new Error(`Media processing failed: ${status.error_message}`);
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Media processing timeout');
  }

  // Create text post
  async createTextPost(text: string): Promise<ThreadsPostResult> {
    const url = `${this.baseUrl}/${this.userId}/threads`;
    
    const params = new URLSearchParams({
      media_type: 'TEXT',
      text: text,
      access_token: this.accessToken
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Text post creation failed: ${errorText}`);
    }

    const result = await response.json() as ThreadsApiResponse;
    return { id: result.id, creation_id: result.id };
  }

  // Create single media post (image or video)
  async createMediaPost(postData: ThreadsPostData): Promise<ThreadsPostResult> {
    if (!postData.media_url) {
      throw new Error('Media URL is required for media posts');
    }

    // First create media container
    const mediaContainer = await this.createMediaContainer({
      media_type: postData.media_type as 'IMAGE' | 'VIDEO',
      media_url: postData.media_url,
      alt_text: postData.alt_text
    });

    // Wait for media to be processed
    await this.waitForMediaContainer(mediaContainer.id);

    // Create the post
    const url = `${this.baseUrl}/${this.userId}/threads`;
    
    const params = new URLSearchParams({
      media_type: postData.media_type,
      media_url: postData.media_url,
      access_token: this.accessToken
    });

    if (postData.text) {
      params.append('text', postData.text);
    }

    if (postData.alt_text) {
      params.append('alt_text', postData.alt_text);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Media post creation failed: ${errorText}`);
    }

    const result = await response.json() as ThreadsApiResponse;
    return { id: result.id, creation_id: result.id };
  }

  // Create carousel post (multiple media items)
  async createCarouselPost(text: string, mediaItems: ThreadsMediaUpload[]): Promise<ThreadsPostResult> {
    if (mediaItems.length < 2 || mediaItems.length > 10) {
      throw new Error('Carousel posts must have 2-10 media items');
    }

    // Create media containers for all items
    const containerIds: string[] = [];
    
    for (const mediaItem of mediaItems) {
      const container = await this.createMediaContainer(mediaItem);
      containerIds.push(container.id);
    }

    // Wait for all media containers to be ready
    for (const containerId of containerIds) {
      await this.waitForMediaContainer(containerId);
    }

    // Create the carousel post
    const url = `${this.baseUrl}/${this.userId}/threads`;
    
    const params = new URLSearchParams({
      media_type: 'CAROUSEL',
      text: text,
      children: containerIds.join(','),
      access_token: this.accessToken
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Carousel post creation failed: ${errorText}`);
    }

    const result = await response.json() as ThreadsApiResponse;
    return { id: result.id, creation_id: result.id };
  }

  // Publish a post (final step)
  async publishPost(creationId: string): Promise<ThreadsPostResult> {
    const url = `${this.baseUrl}/${this.userId}/threads_publish`;
    
    const params = new URLSearchParams({
      creation_id: creationId,
      access_token: this.accessToken
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Post publishing failed: ${errorText}`);
    }

    const result = await response.json() as ThreadsApiResponse;
    return { 
      id: result.id,
      permalink: `https://threads.net/@${this.userId}/post/${result.id}`
    };
  }

  // Complete workflow: create and publish post
  async createAndPublishPost(postData: ThreadsPostData): Promise<ThreadsPostResult> {
    let creationResult: ThreadsPostResult;

    switch (postData.media_type) {
      case 'TEXT':
        if (!postData.text) {
          throw new Error('Text is required for text posts');
        }
        creationResult = await this.createTextPost(postData.text);
        break;

      case 'IMAGE':
      case 'VIDEO':
        creationResult = await this.createMediaPost(postData);
        break;

      case 'CAROUSEL':
        if (!postData.text || !postData.children) {
          throw new Error('Text and children are required for carousel posts');
        }
        // This would need media items passed differently for carousel
        throw new Error('Use createCarouselPost method for carousel posts');

      default:
        throw new Error(`Unsupported media type: ${postData.media_type}`);
    }

    // Publish the post
    if (creationResult.creation_id) {
      const publishResult = await this.publishPost(creationResult.creation_id);
      return publishResult;
    }

    throw new Error('Failed to get creation ID from post creation');
  }

  // Get post details
  async getPost(postId: string): Promise<ThreadsPostDetails> {
    const url = `${this.baseUrl}/${postId}?fields=id,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get post: ${errorText}`);
    }

    return await response.json() as ThreadsPostDetails;
  }

  // Get user's posts
  async getUserPosts(limit = 25): Promise<ThreadsUserPostsResponse> {
    const url = `${this.baseUrl}/${this.userId}/threads?fields=id,media_type,media_url,permalink,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post&limit=${limit}&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user posts: ${errorText}`);
    }

    return await response.json() as ThreadsUserPostsResponse;
  }
}