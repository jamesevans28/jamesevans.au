import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface BlogStackProps extends cdk.StackProps {
  domainName: string;
}

/**
 * Canonical store for blog posts (ap-southeast-2 / Sydney).
 *
 * The site is a static export, so this table is read at BUILD time only —
 * a handful of queries per deploy, which is why on-demand billing costs
 * effectively nothing. There is no runtime path from the public internet to
 * this table: writes come from James's local credentials, reads from the
 * GitHub Actions deploy role. See docs/BLOG_PLAN.md §3.
 *
 * Single-collection design: pk="POST", sk=<slug>, so a post is a GetItem by
 * slug. The by-status GSI answers the only other query the site needs —
 * "published posts, newest first".
 */
export class BlogStack extends cdk.Stack {
  public readonly tableName: string;
  public readonly tableArn: string;

  constructor(scope: Construct, id: string, props: BlogStackProps) {
    super(scope, id, props);

    const table = new dynamodb.TableV2(this, 'BlogTable', {
      tableName: `${props.domainName}-blog`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      // Content is the product — never let a stack operation delete it.
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      deletionProtection: true,
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      globalSecondaryIndexes: [
        {
          indexName: 'by-status',
          partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
    });

    this.tableName = table.tableName;
    this.tableArn = table.tableArn;

    new cdk.CfnOutput(this, 'BlogTableName', {
      value: table.tableName,
      description: 'Set as the BLOG_TABLE GitHub repo variable',
    });
  }
}
