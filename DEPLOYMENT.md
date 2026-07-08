# AWS Deployment Guide Without a Custom Domain

This guide deploys the Blog Platform on AWS without buying a domain. You will use AWS-generated URLs:

- Frontend URL: Application Load Balancer DNS name, for example `http://blog-alb-123456.us-east-1.elb.amazonaws.com`
- API URL: same ALB DNS name with routes forwarded to the backend services
- S3 images: S3 public object URLs, or CloudFront later if you add it

## Recommended AWS Architecture

Use this setup for a clean production-style deployment:

- Amazon ECS Fargate for containers
- Amazon ECR for Docker images
- Application Load Balancer for public access
- MongoDB Atlas or Amazon DocumentDB for MongoDB
- Amazon S3 for image uploads
- IAM task role for AWS permissions where possible

If you want the simplest deployment for a university project/demo, use the EC2 Docker Compose option near the end.

## Important No-Domain Rule

Because you do not have a domain, replace domain-based values with the ALB DNS name after the ALB is created.

Example:

```env
CORS_ORIGIN=http://blog-alb-123456.us-east-1.elb.amazonaws.com
REACT_APP_API_URL=http://blog-alb-123456.us-east-1.elb.amazonaws.com
```

Do not use HTTPS unless you have a certificate. AWS Certificate Manager cannot issue a public certificate for the default ALB DNS name. For no-domain deployments, use HTTP on port `80`.

## Required AWS Services

1. ECR repositories
   - `blog-platform-auth`
   - `blog-platform-blog`
   - `blog-platform-frontend`

2. Database
   - Recommended: MongoDB Atlas free/shared cluster
   - Alternative: Amazon DocumentDB

3. S3 bucket
   - Example: `blog-platform-images-yourname`
   - Enable block public access according to your upload/display strategy.
   - If using public-read object uploads, bucket policy must allow public object reads.

4. ECS cluster
   - Fargate launch type

5. Application Load Balancer
   - Public ALB
   - Listener: HTTP `80`
   - Target groups:
     - frontend target group, container port `80`
     - auth target group, container port `3001`
     - blog target group, container port `3002`

## ALB Routing Rules

Use one ALB and route by path:

| Path | Target |
| --- | --- |
| `/auth/*` | auth-service:3001 |
| `/api/*` | blog-service:3002 |
| `/*` | frontend:80 |

The frontend should call:

```env
REACT_APP_API_URL=http://YOUR_ALB_DNS_NAME
```

The frontend API helper already calls:

- `/auth/...` for authentication
- `/api/...` for blog posts and comments

## Production Environment Variables

### Auth Service

Set these in the ECS task definition or EC2 `.env` file:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/blog-auth
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://YOUR_ALB_DNS_NAME
```

### Blog Service

```env
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/blog-posts
AUTH_SERVICE_URL=http://auth-service:3001/auth
JWT_SECRET=use-the-same-long-random-secret
AWS_S3_BUCKET=blog-platform-images-yourname
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
CORS_ORIGIN=http://YOUR_ALB_DNS_NAME
```

For better security on ECS, prefer an IAM task role instead of `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

### Frontend Build Args

These are build-time values:

```env
REACT_APP_API_URL=http://YOUR_ALB_DNS_NAME
REACT_APP_AWS_S3_URL=https://blog-platform-images-yourname.s3.amazonaws.com
```

## Build Docker Images Locally

Replace account ID and region with your values:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -f Dockerfile.auth -t blog-platform-auth .
docker build -f Dockerfile.blog -t blog-platform-blog .
docker build -f Dockerfile.frontend \
  --build-arg REACT_APP_API_URL=http://YOUR_ALB_DNS_NAME \
  --build-arg REACT_APP_AWS_S3_URL=https://blog-platform-images-yourname.s3.amazonaws.com \
  -t blog-platform-frontend .
```

Tag and push:

```bash
docker tag blog-platform-auth ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blog-platform-auth:latest
docker tag blog-platform-blog ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blog-platform-blog:latest
docker tag blog-platform-frontend ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blog-platform-frontend:latest

docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blog-platform-auth:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blog-platform-blog:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blog-platform-frontend:latest
```

## ECS Fargate Deployment Steps

1. Create ECR repositories and push the three images.
2. Create an ECS cluster.
3. Create task definitions:
   - `auth-service`, port `3001`
   - `blog-service`, port `3002`
   - `frontend`, port `80`
4. Add environment variables to each task definition.
5. Create a public Application Load Balancer.
6. Create target groups for each service.
7. Create ECS services and attach each one to its target group.
8. Add ALB listener rules:
   - `/auth/*` -> auth target group
   - `/api/*` -> blog target group
   - default `/*` -> frontend target group
9. Open security groups:
   - ALB inbound: HTTP `80` from internet
   - ECS tasks inbound: only from ALB security group
   - Database inbound: only from ECS task security group or Atlas allowed IPs
10. Visit the ALB DNS name in your browser.

## S3 Bucket Setup

Create a bucket:

```bash
aws s3 mb s3://blog-platform-images-yourname --region us-east-1
```

If your app uploads public images with `ACL: public-read`, configure the bucket to allow public reads for uploaded objects. For a class project, this simple bucket policy is common:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::blog-platform-images-yourname/*"
    }
  ]
}
```

For a more secure production app, use private objects plus CloudFront or signed URLs.

## Simpler EC2 Docker Compose Deployment

Use this if ECS feels too much.

1. Launch an Ubuntu EC2 instance.
2. Open inbound ports:
   - `22` for SSH from your IP
   - `80` or `3000` for frontend access
   - `3001` and `3002` only if you want to test APIs directly
3. Install Docker and Docker Compose.
4. Clone or upload this project to EC2.
5. Create a root `.env` file next to `docker-compose.yml`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/blog
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRE=7d
AWS_S3_BUCKET=blog-platform-images-yourname
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
CORS_ORIGIN=http://EC2_PUBLIC_DNS_OR_IP:3000
REACT_APP_API_URL=http://EC2_PUBLIC_DNS_OR_IP:3000
REACT_APP_AWS_S3_URL=https://blog-platform-images-yourname.s3.amazonaws.com
```

6. Run:

```bash
docker compose up --build -d
```

7. Open:

```txt
http://EC2_PUBLIC_DNS_OR_IP:3000
```

## Current docker-compose.yml Behavior

The current Compose file is production-oriented:

- It expects an external MongoDB connection string.
- It expects AWS S3 values.
- It does not start a local MongoDB container.
- It fails fast if required env vars are missing.

Before running:

```bash
docker compose config
docker compose up --build
```

## Common Problems

### CORS Error

Set `CORS_ORIGIN` to exactly the frontend URL:

```env
CORS_ORIGIN=http://YOUR_ALB_DNS_NAME
```

If using EC2 Compose:

```env
CORS_ORIGIN=http://EC2_PUBLIC_DNS_OR_IP:3000
```

### Frontend Calls Wrong API URL

Rebuild the frontend image after changing:

```env
REACT_APP_API_URL=http://YOUR_ALB_DNS_NAME
```

React env vars are baked into the build.

### MongoDB Connection Fails

Check:

- Database username/password
- Network access rules
- Security groups
- Atlas IP allowlist or DocumentDB VPC access
- Correct TLS settings in the connection string

### S3 Upload Fails

Check:

- Bucket name
- Region
- IAM permissions: `s3:PutObject`, `s3:DeleteObject`, `s3:GetObject`
- Public read policy if displaying public images

## Later: Adding a Domain

When you get a domain:

1. Create a Route53 hosted zone or point DNS to AWS.
2. Request an SSL certificate in AWS Certificate Manager.
3. Attach the certificate to the ALB.
4. Add HTTP to HTTPS redirect.
5. Change:

```env
CORS_ORIGIN=https://yourdomain.com
REACT_APP_API_URL=https://api.yourdomain.com
```

Until then, the ALB DNS name is enough for deployment and testing.
