import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function isValidBucketName(bucket: string) {
  return /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket);
}

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function buildPublicUrl(key: string) {
  const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!publicBase) {
    throw new Error('CLOUDFLARE_R2_PUBLIC_URL is not configured');
  }

  return `${publicBase.replace(/\/$/, '')}/${key}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 bucket is not configured' },
        { status: 500 },
      );
    }

    if (!isValidBucketName(bucket)) {
      return NextResponse.json(
        {
          error:
            'Invalid R2 bucket name. Set CLOUDFLARE_R2_BUCKET_NAME to your real bucket name (e.g. lesson-images), not API token name.',
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Max size is 5MB' },
        { status: 400 },
      );
    }

    const fileExtension = file.name.includes('.')
      ? file.name.split('.').pop()?.toLowerCase()
      : undefined;
    const safeExtension = fileExtension?.replace(/[^a-z0-9]/g, '') || 'bin';
    const key = `lesson-images/${crypto.randomUUID()}.${safeExtension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    return NextResponse.json({
      success: true,
      url: buildPublicUrl(key),
      key,
    });
  } catch (error) {
    console.error('Lesson image upload failed:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
