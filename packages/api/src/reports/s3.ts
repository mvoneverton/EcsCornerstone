import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.AWS_S3_BUCKET ?? 'ecscornerstone-reports';
const REGION  = process.env.AWS_REGION   ?? 'us-east-1';

const s3 = new S3Client({
  region: REGION,
  // In dev without real credentials the client still initialises;
  // upload calls will fail — that's the expected dev behaviour.
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  }),
});

/**
 * Upload a PDF buffer to S3.
 * Key format: reports/{companyId}/{invitationId}.pdf
 */
export async function uploadReport(
  companyId:    string,
  invitationId: string,
  pdfBuffer:    Buffer
): Promise<string> {
  const key = `reports/${companyId}/${invitationId}.pdf`;

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        pdfBuffer,
      ContentType: 'application/pdf',
      // Objects are private — access only via pre-signed URLs
      ServerSideEncryption: 'AES256',
    })
  );

  return key;
}

/**
 * Generate a pre-signed GET URL for a stored report.
 * Default expiry: 1 hour.
 */
export async function getReportUrl(
  s3Key:        string,
  expiresInSec: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSec });
}

export async function deleteReport(s3Key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
}
