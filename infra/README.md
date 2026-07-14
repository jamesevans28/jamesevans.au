# Infrastructure — jamesevans.au

AWS CDK (TypeScript) for hosting the static site: private **S3** origin →
**CloudFront** (Origin Access Control) → **ACM** cert → **Route 53** DNS, plus
an **OIDC deploy role** for GitHub Actions.

**Region strategy — as much in Australia as AWS allows.** The S3 origin,
CloudFront config, DNS alias records, and the deploy role are all in
**ap-southeast-2 (Sydney)**. The **only** thing outside Australia is the ACM
certificate, which CloudFront *requires* in **us-east-1** — that constraint is
AWS's, not a choice. Route 53 and CloudFront are global services. The two
stacks are wired with CDK cross-region references.

> Phase 6 note: when the contact-form backend is added, its Lambda + SES also
> deploy to ap-southeast-2, keeping all compute and storage in Australia.

## Stacks

| Stack | Region | What it creates |
|-------|--------|-----------------|
| `JamesEvansEdge` | us-east-1 | ACM certificate (CloudFront-required region) + Route 53 hosted zone |
| `JamesEvansSite` | ap-southeast-2 | S3 bucket, CloudFront + OAC, security-headers policy, URL-rewrite/www-redirect Function, apex + www alias records |
| `JamesEvansDeployRole` | ap-southeast-2 | IAM role assumed by GitHub Actions via OIDC, locked to `repo:<owner>/jamesevans.au:ref:refs/heads/main`, scoped to the bucket + CloudFront invalidation |

## Prerequisites

- Node 22+, AWS credentials for the target account (`aws sso login` or env vars)
- One-time CDK bootstrap of **both** regions the stacks use:
  ```bash
  npx cdk bootstrap aws://<ACCOUNT_ID>/us-east-1
  npx cdk bootstrap aws://<ACCOUNT_ID>/ap-southeast-2
  ```

## Deploy — first time

```bash
cd infra
npm install

# 1. Deploy the edge + site stacks. cdk resolves the dependency order
#    (edge first: it creates the hosted zone + cert the site stack consumes).
npx cdk deploy JamesEvansEdge JamesEvansSite
```

The deploy will **pause on certificate validation** until DNS resolves. Do the
GoDaddy delegation now:

### GoDaddy → Route 53 delegation

1. In the `JamesEvansEdge` outputs (or the Route 53 console) copy the **four
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
| `AWS_DEPLOY_ROLE_ARN` | `DeployRoleArn` (JamesEvansDeployRole) |
| `AWS_REGION` | `ap-southeast-2` (`BucketRegionOut`) |
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
