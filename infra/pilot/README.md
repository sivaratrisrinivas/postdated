# AWS pilot intake

This is the protected pilot HTTP deployment. It is intentionally separate from the public Next
deployment and defaults to disabled. It accepts only authenticated `fake-challenge` submissions
whose SHA-256 digest appears in `FakeChallenges`; it does not authorize real patient-document
processing.

Deploy it only from the AWS account and region approved for the shadow pilot. The recommended
region is Mumbai (`ap-south-1`). The template uses an HTTP API, a Node.js Lambda adapter, and an
Amazon Bedrock adapter. It writes no application logs and configures a one-day platform log
retention as a conservative default; the hospital's approved audit and retention plan must replace
that setting before any real pilot.

```sh
sam build --template-file infra/pilot/template.yaml
sam deploy --guided \
  --template-file .aws-sam/build/template.yaml \
  --region ap-south-1
```

Keep these deployment parameters safe and explicit:

- `PilotEnabled=false` until every issue #9 gate is complete.
- `ProviderApproved=false` until the provider, retention, transfer, and contract review is complete.
- `PilotUsers` contains one distinct long random token per approved hospital employee.
- `FakeChallenges` contains only reviewed fake challenge documents.
- `AllowedOrigin` is the exact pilot workbench origin, never `*`.
- `BedrockModelId` must be an approved model/inference profile whose retention and region behavior
  match the hospital notice. The current research warns that the Claude route may process outside
  India even when the Lambda is in Mumbai.

Before real uploads, independently test consent/notice, access review, deletion, incident response,
pilot-wide stop, Bedrock retention `none`, provider-data-sharing denial, request-body logging
settings, and every subprocessor. Until then, use fake or fully anonymised documents only.
