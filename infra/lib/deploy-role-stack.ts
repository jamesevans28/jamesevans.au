import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface DeployRoleStackProps extends cdk.StackProps {
  /** GitHub repo in "owner/name" form. */
  githubRepo: string;
  siteBucketArn: string;
  distributionArn: string;
}

/**
 * IAM role assumed by GitHub Actions via OpenID Connect — no long-lived AWS
 * keys. The trust policy is locked to this repository and the main branch;
 * permissions are limited to syncing the site bucket and invalidating the
 * one CloudFront distribution.
 */
export class DeployRoleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeployRoleStackProps) {
    super(scope, id, props);

    const { githubRepo, siteBucketArn, distributionArn } = props;

    // Reuse the account's existing GitHub OIDC provider if present, else
    // create one. GitHub's thumbprint is validated by AWS automatically for
    // this well-known provider.
    const providerArn = `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`;
    const provider =
      iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        'GitHubOidc',
        providerArn,
      );

    const role = new iam.Role(this, 'DeployRole', {
      roleName: 'jamesevans-au-deploy',
      description:
        'Assumed by GitHub Actions (OIDC) to deploy the static site.',
      maxSessionDuration: cdk.Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          // Lock to this repo + main branch only.
          'token.actions.githubusercontent.com:sub': `repo:${githubRepo}:ref:refs/heads/main`,
        },
      }),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SyncSiteBucket',
        actions: [
          's3:ListBucket',
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [siteBucketArn, `${siteBucketArn}/*`],
      }),
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'InvalidateCdn',
        actions: ['cloudfront:CreateInvalidation'],
        resources: [distributionArn],
      }),
    );

    new cdk.CfnOutput(this, 'DeployRoleArn', {
      value: role.roleArn,
      description: 'Set as the AWS_DEPLOY_ROLE_ARN GitHub repo variable',
    });
  }
}
