import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface EdgeStackProps extends cdk.StackProps {
  domainName: string;
}

/**
 * us-east-1 "edge" stack. Holds only what AWS forces into us-east-1:
 * the ACM certificate for CloudFront. The hosted zone lives here too so ACM
 * DNS-validation records are created in the same stack (no cross-region
 * dance for validation). Everything else — S3, CloudFront, alias records —
 * is in the Sydney main stack, which references the cert and zone below.
 */
export class EdgeStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;
  public readonly hostedZoneId: string;
  public readonly hostedZoneName: string;
  public readonly nameServers: string;

  constructor(scope: Construct, id: string, props: EdgeStackProps) {
    super(scope, id, props);

    const { domainName } = props;
    const wwwName = `www.${domainName}`;

    // Hosted zone. After deploy, set the four NS records at GoDaddy (see
    // infra/README.md). Registration stays with GoDaddy.
    const zone = new route53.PublicHostedZone(this, 'Zone', {
      zoneName: domainName,
    });

    // ACM certificate — must be us-east-1 for CloudFront. DNS-validated
    // against the zone in this same stack.
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: [wwwName],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    this.certificate = certificate;
    this.hostedZoneId = zone.hostedZoneId;
    this.hostedZoneName = zone.zoneName;
    this.nameServers = cdk.Fn.join(', ', zone.hostedZoneNameServers ?? []);

    new cdk.CfnOutput(this, 'NameServers', {
      value: this.nameServers,
      description: 'Set these four NS records at GoDaddy',
    });
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
    });
  }
}
