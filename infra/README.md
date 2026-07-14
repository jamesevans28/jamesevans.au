# Infrastructure — jamesevans.au

AWS CDK (TypeScript) for hosting the static site: private **S3** origin →
**CloudFront** (Origin Access Control) → **ACM** cert → **Route 53** DNS, plus
an **OIDC deploy role** for GitHub Actions.

The whole stack is in **us-east-1** because CloudFront requires its ACM
certificate there. The S3 origin is co-located — behind a global CDN the
origin region is immaterial, and this avoids cross-region complexity.

## Stacks

| Stack | What it creates |
|-------|-----------------|
| `JamesEvansSite` | S3 bucket, CloudFront distribution + OAC, security-headers policy, URL-rewrite/www-redirect CloudFront Function, ACM cert, Route 53 hosted zone, apex + www alias records |
| `JamesEvansDeployRole` | IAM role assumed by GitHub Actions via OIDC, locked to `repo:<owner>/jamesevans.au:ref:refs/heads/main`, scoped to the bucket + CloudFront invalidation |

## Prerequisites

- Node 22+, AWS credentials for the target account (`aws sso login` or env vars)
- One-time CDK bootstrap of us-east-1:
  ```bash
  npx cdk bootstrap aws://<ACCOUNT_ID>/us-east-1
  ```

## Deploy — first time

```bash
cd infra
npm install

# 1. Deploy the site stack (creates the hosted zone + requests the cert).
npx cdk deploy JamesEvansSite
```

The deploy will **pause on certificate validation** until DNS resolves. Do the
GoDaddy delegation now:

### GoDaddy → Route 53 delegation

1. In the `JamesEvansSite` outputs (or the Route 53 console) copy the **four
   `NameServers`** for the new hosted zone.
2. In GoDaddy: **Domain Settings → Nameservers → Change → Enter my own
   nameservers**, and paste all four. (Registration stays at GoDaddy; only DNS
   moves to Route 53.)
3. Wait for propagation (minutes to a couple of hours). ACM then validates via
   the CNAME the stack already added to the zone, and the deploy completes.

> ⚠️ Delegation moves **all** DNS for the domain to Route 53. If any records
> exist at GoDaddy today (e.g. email/MX), recreate them in the hosted zone
> **before** switching nameservers.

```bash
# 2. Deploy the OIDC deploy role (needs the repo slug).
npx cdk deploy JamesEvansDeployRole -c githubRepo=<owner>/jamesevans.au
```

## Wire up GitHub Actions

Set these **repository variables** (Settings → Secrets and variables →
Actions → Variables) from the stack outputs — no secrets needed, OIDC handles
auth:

| Variable | Source output |
|----------|---------------|
| `AWS_DEPLOY_ROLE_ARN` | `DeployRoleArn` |
| `AWS_REGION` | `us-east-1` (`BucketRegionOut`) |
| `SITE_BUCKET` | `BucketName` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `DistributionId` |

Once set, pushing to `main` runs `.github/workflows/deploy.yml`.

## Everyday commands

```bash
npx cdk diff      # preview changes
npx cdk deploy    # apply
npx cdk synth     # render CloudFormation locally
```

## Notes

- The bucket has `RemovalPolicy.RETAIN` and versioning on — it will **not** be
  deleted if the stack is torn down. Empty and delete it manually if needed.
- Security headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy) are applied via a CloudFront response-headers policy. The
  CSP allows Google Analytics; tighten it if GA is removed.
- Estimated running cost: ~US$1–3/month (hosted zone $0.50 + minimal
  S3/CloudFront at personal-site traffic).
