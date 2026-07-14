#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiteStack } from '../lib/site-stack.js';
import { DeployRoleStack } from '../lib/deploy-role-stack.js';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const domainName = 'jamesevans.au';

// GitHub repo allowed to assume the deploy role, e.g. "owner/jamesevans.au".
// Pass at deploy time: cdk deploy -c githubRepo=owner/repo
const githubRepo = app.node.tryGetContext('githubRepo') as string | undefined;

/**
 * Static site: private S3 origin + CloudFront + ACM + Route 53. The whole
 * stack lives in us-east-1 because CloudFront requires its ACM certificate
 * there; the S3 origin is co-located (origin region is immaterial behind a
 * global CDN, and this avoids cross-region-reference complexity).
 */
const site = new SiteStack(app, 'JamesEvansSite', {
  env: { account, region: 'us-east-1' },
  domainName,
});

// OIDC deploy role for GitHub Actions (no long-lived keys).
if (githubRepo) {
  new DeployRoleStack(app, 'JamesEvansDeployRole', {
    env: { account, region: 'us-east-1' },
    githubRepo,
    siteBucketArn: site.bucketArn,
    distributionArn: site.distributionArn,
  });
}

app.synth();
