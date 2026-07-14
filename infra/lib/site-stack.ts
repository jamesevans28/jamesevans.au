import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export interface SiteStackProps extends cdk.StackProps {
  domainName: string;
}

/**
 * Static-site hosting: private S3 origin, CloudFront with Origin Access
 * Control, an ACM cert (this stack is in us-east-1 as CloudFront requires),
 * a Route 53 hosted zone with apex + www alias records, a CloudFront Function
 * that maps extensionless URLs to /index.html and 301-redirects www → apex,
 * and a response-headers policy applying HSTS/CSP and friends.
 */
export class SiteStack extends cdk.Stack {
  public readonly bucketArn: string;
  public readonly distributionArn: string;

  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props);

    const { domainName } = props;
    const wwwName = `www.${domainName}`;

    // Hosted zone: created here. After deploy, set the four NS records at
    // GoDaddy (see infra/README.md). Registration stays with GoDaddy.
    const zone = new route53.PublicHostedZone(this, 'Zone', {
      zoneName: domainName,
    });

    // Private origin bucket. Co-located with this stack (us-east-1): for a
    // CloudFront-fronted static site the origin is hit rarely (edge caches
    // serve almost everything), so origin region is not meaningful and
    // co-locating avoids cross-region-reference complexity.
    const bucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${domainName}-site`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
    });

    // ACM certificate (must be us-east-1 for CloudFront) — DNS validated.
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: [wwwName],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // CloudFront Function: rewrite directory URLs to /index.html and
    // 301-redirect the www host to the apex.
    const rewriteFn = new cloudfront.Function(this, 'RewriteFn', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var host = request.headers.host && request.headers.host.value;
  if (host === '${wwwName}') {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://${domainName}' + request.uri } }
    };
  }
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }
  return request;
}
`),
    });

    // Security headers applied to every response.
    const headersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'SecurityHeaders',
      {
        securityHeadersBehavior: {
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.days(730),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy:
              cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          contentSecurityPolicy: {
            // Static site + GA4. gtag needs Google's script/connect hosts.
            contentSecurityPolicy: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
              "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
              "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
            override: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
              override: true,
            },
          ],
        },
      },
    );

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      domainNames: [domainName, wwwName],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        responseHeadersPolicy: headersPolicy,
        functionAssociations: [
          {
            function: rewriteFn,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // Alias records for apex and www.
    new route53.ARecord(this, 'ApexAlias', {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
    });
    new route53.AaaaRecord(this, 'ApexAliasV6', {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
    });
    new route53.ARecord(this, 'WwwAlias', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
    });
    new route53.AaaaRecord(this, 'WwwAliasV6', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution),
      ),
    });

    this.bucketArn = bucket.bucketArn;
    this.distributionArn = `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`;

    // Outputs consumed when configuring GitHub Actions repo variables.
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new cdk.CfnOutput(this, 'BucketRegionOut', { value: this.region });
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, 'DistributionDomain', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(', ', zone.hostedZoneNameServers ?? []),
      description: 'Set these four NS records at GoDaddy',
    });
  }
}
