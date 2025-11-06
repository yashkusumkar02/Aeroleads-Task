import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const POSTS_JSON = path.join(CONTENT_DIR, 'posts.json');

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Delete markdown file
    const mdPath = path.join(POSTS_DIR, `${slug}.md`);
    try {
      await fs.unlink(mdPath);
    } catch (error) {
      // File might not exist, continue anyway
    }

    // Remove from posts.json
    try {
      const content = await fs.readFile(POSTS_JSON, 'utf-8');
      const posts = JSON.parse(content);
      const filteredPosts = posts.filter((p: any) => p.slug !== slug);
      await fs.writeFile(POSTS_JSON, JSON.stringify(filteredPosts, null, 2), 'utf-8');
    } catch (error) {
      // posts.json might not exist, continue anyway
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

