import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file') as File;
    
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Only allow images
    if (!file.type.startsWith('image/')) {
      return new NextResponse("File must be an image", { status: 400 });
    }

    // Create unique filename with SITE_ID prefix
    const fileExtension = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const uniqueFilename = `${process.env.SITE_ID}_user_${session.user.id}_${timestamp}.${fileExtension}`;

    const blob = await put(uniqueFilename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      addRandomSuffix: false // We're already using timestamp for uniqueness
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse("Error uploading file", { status: 500 });
  }
} 