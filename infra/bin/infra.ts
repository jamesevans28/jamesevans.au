#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EdgeStack } from '../lib/edge-stack.js';
import { SiteStack } from '../lib/site-stack.js';
import { DeployRoleStack } from '../lib/deploy-role-stack.js';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const domainName = 'jamesevans.au';

// GitHub repo allowed to assume the deploy role, e.g. "owner/jamesevans.au".
// Pass at deploy time: cdk deploy --all -c githubRepo=owner/repo
const githubRepo = app.node.tryGetContext('githubRepo') as string | undefined;

/**
 * Two-stack split so we keep as much as possible in the AWS Australia region
 * (ap-southeast-2 / Sydney):
 *
 *   - EdgeStack (us-east-1): ACM certificate + hosted zone. CloudFront REQUIRES
 *     its certificate in us-east-1 — this is the only thing forced out of
 *     Australia. Route 53 is a global service.
 *   - SiteStack (ap-southeast-2): S3 origin bucket + CloudFront + alias records.
 *
 * crossRegionReferences lets the Sydney stack consume the us-east-1 cert/zone
 * without manual exports.
 */
const edge = new EdgeStack(app, 'JamesEvansEdge', {
  env: { account, region: 'us-east-1' },
  crossRegionReferences: true,
  domainName,
});

const site = new SiteStack(app, 'JamesEvansSite', {
  env: { account, region: 'ap-southeast-2' },
  crossRegionReferences: true,
  domainName,
  certificate: edge.certificate,
  hostedZoneId: edge.hostedZoneId,
  hostedZoneName: edge.hostedZoneName,
});
site.addDependency(edge);

// OIDC deploy role for GitHub Actions (no long-lived keys). Deployed in the
// Sydney region alongside the resources it manages.
if (githubRepo) {
  const deployRole = new DeployRoleStack(app, 'JamesEvansDeployRole', {
    env: { account, region: 'ap-southeast-2' },
    githubRepo,
    siteBucketArn: site.bucketArn,
    distributionArn: site.distributionArn,
  });
  deployRole.addDependency(site);
}

app.synth();
