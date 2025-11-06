import { promises as fs } from 'fs';
import path from 'path';
import { slugify, generateUniqueSlug } from './slugger';

export interface PostMeta {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  keywords: string[];
  createdAt: string;
  provider: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const POSTS_JSON = path.join(CONTENT_DIR, 'posts.json');

export async function ensureContentDirs(): Promise<void> {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    await fs.mkdir(POSTS_DIR, { recursive: true });
    
    // Create posts.json if it doesn't exist
    try {
      await fs.access(POSTS_JSON);
    } catch {
      await fs.writeFile(POSTS_JSON, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error ensuring content directories:', error);
    throw error;
  }
}

export async function savePost(
  slug: string,
  bodyMd: string,
  meta: Omit<PostMeta, 'slug' | 'createdAt'>
): Promise<void> {
  await ensureContentDirs();

  const createdAt = new Date().toISOString();
  const record: PostMeta = {
    slug,
    createdAt,
    ...meta,
  };

  // Write markdown file
  const mdPath = path.join(POSTS_DIR, `${slug}.md`);
  await fs.writeFile(mdPath, bodyMd, 'utf-8');

  // Update posts.json
  const posts = await getAllPosts();
  posts.unshift(record); // Add to beginning
  await fs.writeFile(POSTS_JSON, JSON.stringify(posts, null, 2), 'utf-8');
}

export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const content = await fs.readFile(POSTS_JSON, 'utf-8');
    const posts: PostMeta[] = JSON.parse(content);
    return posts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<{
  meta: PostMeta;
  body: string;
} | null> {
  try {
    const posts = await getAllPosts();
    const meta = posts.find(p => p.slug === slug);
    
    if (!meta) {
      return null;
    }

    const mdPath = path.join(POSTS_DIR, `${slug}.md`);
    const body = await fs.readFile(mdPath, 'utf-8');
    
    return { meta, body };
  } catch {
    return null;
  }
}

export async function getExistingSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map(p => p.slug);
}

export async function deletePost(slug: string): Promise<void> {
  try {
    // Remove markdown file
    const mdPath = path.join(POSTS_DIR, `${slug}.md`);
    try {
      await fs.unlink(mdPath);
    } catch (error) {
      // File might not exist, continue
      console.warn(`Could not delete markdown file for ${slug}:`, error);
    }

    // Remove from posts.json
    const posts = await getAllPosts();
    const updatedPosts = posts.filter(p => p.slug !== slug);
    await fs.writeFile(POSTS_JSON, JSON.stringify(updatedPosts, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

