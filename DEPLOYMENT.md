# Production Deployment Notes

## Domain Setup

- Point `yourdomain.com` to the ALB DNS name.
- Use Route53 for DNS if the domain is hosted in AWS.
- Use CloudFront for CDN caching if desired.

## SSL/TLS

- Use AWS Certificate Manager for a free SSL certificate.
- Attach the certificate to the Application Load Balancer.
- Enable HTTP to HTTPS redirect on the ALB listener.

## Backup Strategy

- Enable RDS automated backups with a 7 day retention period.
- Enable S3 versioning for the `blog-platform-images` bucket.
- Schedule regular RDS snapshots to a different AWS region.
