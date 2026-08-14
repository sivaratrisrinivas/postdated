# Patient-document AI processing for the first shadow pilot

**Decision date:** 14 August 2026
**Question:** What happens to a patient's document when POSTDATED asks an AI model to read it, and which setup should the first real shadow pilot use?

## Short answer

The current POSTDATED deployment must be used only with fake or fully anonymised documents.

Today, the browser sends the patient's photo to a Vercel server function. That function sends the full photo to Anthropic's normal commercial API. Anthropic does not use normal commercial API data to train its models, but it normally keeps the input and output for up to 30 days. Anthropic may also process the request in several parts of the world. Therefore, the promise currently written in `POSTDATED.md`—“Session-only. No retention. No third-party sharing.”—is not true for the deployed path.

For the first pilot with real patient documents, use a protected API in AWS Mumbai and call Claude through Amazon Bedrock. Configure Bedrock retention to `none`, lock that setting with AWS permissions, keep the image only in memory, and never put the photo or extracted medical facts in logs or a database. Use Claude Sonnet 4.6, not the current `claude-opus-5`, because Sonnet 4.6 officially supports both images and strict structured output on Bedrock.

This recommendation removes normal 30-day model-provider storage and prevents AWS from sharing the prompt with Anthropic. It does **not** guarantee India-only processing: the current Bedrock route for Claude Sonnet 4.6 from Mumbai is a Global route and may process the request in another AWS commercial region. The hospital must approve that cross-border processing in writing. If the hospital requires India-only AI processing, do not use real documents until an India-region model has passed POSTDATED's extraction tests.

## What the current code actually does

These are code facts, not assumptions. They come from [`app/page.tsx`](../../app/page.tsx), [`lib/compress.ts`](../../lib/compress.ts), [`app/api/extract/route.ts`](../../app/api/extract/route.ts), and [`package.json`](../../package.json):

1. The browser resizes the selected image, converts it to JPEG, and places the complete image in a base64 string.
2. The browser sends that string to POSTDATED's `/api/extract` route.
3. The server route sends the complete image inline to Anthropic using `@anthropic-ai/sdk`.
4. The route currently selects `claude-opus-5` and asks for a structured JSON response.
5. The repository does not save the image or extraction to a database, object store, `localStorage`, or `sessionStorage`.
6. The route does not deliberately log the request body. It does log the caught error object, which should be replaced with a patient-safe error event before a real pilot.
7. There is no patient or staff sign-in, consent record, deletion control, or access audit in this route.

“We do not save it in our database” is not the same as “nobody retains it.” The Vercel function still receives the image, and Anthropic's normal API retention rules still apply.

The repository cannot show whether the Anthropic account already has a special zero-retention contract, which Vercel plan is active, or which options were changed in cloud dashboards. The account owners must verify those settings directly. Until that proof exists, this report uses each provider's documented default.

## Verified facts about each processing choice

### 1. Direct Anthropic API—the setup used now

**Training.** Anthropic says it does not use inputs or outputs from its commercial products, including its API, to train generative models unless the customer explicitly opts into a development programme or submits material as feedback. [Anthropic: model training and commercial data](https://privacy.anthropic.com/en/articles/7996885-how-do-you-use-personal-data-in-model-training)

**Normal retention.** Anthropic says normal API inputs and outputs are deleted within 30 days. It lists exceptions for legal duties and policy enforcement. Content flagged by automated safety systems may be kept for up to two years, associated safety scores for up to seven years, and data submitted as feedback for five years. [Anthropic: commercial data retention](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data)

**Zero-data-retention option.** Anthropic offers zero data retention only to eligible Enterprise API customers after approval. Under that agreement, it does not retain API inputs and outputs, except where law or misuse controls require it. Safety-classifier results may still be retained. The protection does not automatically cover every feature: the Files API keeps files until deletion, and some prompt-caching, batch, beta, and external-tool arrangements have separate rules. [Anthropic: zero data retention scope](https://privacy.anthropic.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to)

**Place of processing.** Anthropic says its commercial services may process data in the United States, Europe, Asia, and Australia. Standard storage is in the United States. A customer may contract for US-only processing, but Anthropic does not document an India-only option. [Anthropic: server and processing locations](https://privacy.anthropic.com/en/articles/7996890-where-are-your-servers-located-do-you-host-your-models-on-eu-servers)

**Contract controls.** Anthropic's data-processing addendum is automatically included in its commercial terms, and Anthropic describes itself as the processor while the customer is the controller. A healthcare business-associate agreement is a separate, sales-reviewed arrangement for eligible services and configurations. [Anthropic: DPA](https://privacy.anthropic.com/en/articles/7996862-how-do-i-view-and-sign-your-data-processing-addendum-dpa), [Anthropic: processor role](https://support.anthropic.com/en/articles/9267385-does-anthropic-act-as-a-data-processor-or-controller), [Anthropic: healthcare BAAs](https://privacy.anthropic.com/en/articles/8114513-business-associate-agreements-baas-for-commercial-customers)

**Meaning for POSTDATED.** Direct Anthropic is simple, but the account's normal configuration does not support POSTDATED's current “no retention” sentence. It is suitable for development with fake data. It becomes a possible real-pilot choice only after written zero-retention and healthcare/privacy terms are confirmed for this exact API account and feature set.

### 2. Amazon Bedrock—the recommended real-pilot route

**Retention and provider sharing.** Bedrock lets an account set its data-retention policy to `none`. AWS says that under `none`, request and response bodies are not written to durable storage by AWS and are not shared with the model provider. AWS also documents an IAM control that can prevent users from changing the setting. [AWS: Bedrock data-retention controls](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)

**Training.** AWS says Bedrock inputs and outputs are not shared with model providers and are not used to train the base models. AWS also supports private network access through AWS PrivateLink. [AWS: Bedrock FAQ](https://aws.amazon.com/bedrock/faqs/)

**Important exceptions.** Bedrock has an optional provider-data-sharing setting. AWS currently says some models, including Claude Mythos 5 and Fable 5, require it and may send content to Anthropic for retention of up to 30 days. POSTDATED must not enable this setting or select a model that requires it. [AWS: Bedrock data-retention controls](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html), [AWS service terms](https://aws.amazon.com/service-terms/)

**Model fit.** AWS lists Claude Sonnet 4.6 as accepting images and supporting structured output through Bedrock Runtime. Those are the two model abilities used by the present extraction route. [AWS: Claude Sonnet 4.6 model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-4-6.html), [AWS: structured output](https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html)

**Region limit.** AWS offers three inference-location types: In-Region, geographic, and Global. In-Region stays in one AWS region; Global may use any supported commercial AWS region. For Claude Sonnet 4.6, the official model card currently shows only Global inference when called from Mumbai (`ap-south-1`). Therefore, placing POSTDATED's API in Mumbai does not make Claude inference India-only. [AWS: model and region compatibility](https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html), [AWS: Claude Sonnet 4.6 model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-4-6.html)

**Security controls.** Bedrock supports TLS 1.2 for data in transit. Bedrock, API Gateway, Cognito, Lambda, and ECS/Fargate are on AWS's current HIPAA-eligible services list. Eligibility means the services can be included in an appropriate AWS agreement and configuration; it does not by itself prove that POSTDATED complies with Indian law. [AWS: Bedrock encryption](https://docs.aws.amazon.com/bedrock/latest/userguide/data-encryption.html), [AWS: HIPAA-eligible services](https://aws.amazon.com/compliance/hipaa-eligible-services-reference/)

**Meaning for POSTDATED.** Bedrock is the safest practical first-pilot choice because one AWS account can control the API, permissions, logs, network, model call, and retention setting. It avoids waiting for Anthropic to approve a direct zero-retention account. The trade-off is that current Claude inference is not confined to India.

### 3. Google Vertex AI—a useful fallback, not the first choice

**Training and retention controls.** Google says it will not use Vertex AI customer data to train or fine-tune AI models without the customer's permission. Its zero-retention guidance says customers may also need to disable caching, avoid certain grounding features, and obtain an exception from abuse-monitoring retention for applicable Google models. [Google Cloud: Vertex AI zero data retention](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention)

**India-region model.** Google lists Gemini 2.5 Flash as accepting images, producing structured output, and supporting processing in Mumbai (`asia-south1`). It also lists data-residency and enterprise security controls for that model. However, its published retirement date is 20 October 2026, only about two months after this decision. [Google Cloud: Gemini 2.5 Flash model card](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash)

**Newer model limit.** Google lists the newer Gemini 3.7 Flash as supporting images and structured output, but currently only in Global, US multi-region, and EU multi-region locations—not Mumbai. [Google Cloud: Gemini 3.7 Flash model card](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-7-flash)

**Meaning for POSTDATED.** Gemini 2.5 Flash is a technically credible short bridge if India-only processing is mandatory, but building the first pilot around a model that retires in October would create immediate migration work. It should be evaluated only if the hospital refuses cross-border Claude processing.

### 4. Vercel—the present application host

**Contract warning.** Vercel's current data-processing addendum says Pro and Enterprise customers use Vercel as a processor. The same addendum's processing schedule says customers are prohibited from placing sensitive data or special-category data in Customer Data. Patient medical documents are plainly sensitive in ordinary language, so POSTDATED must obtain Vercel's written contractual clearance before routing them through a normal Vercel function. [Vercel: data-processing addendum](https://vercel.com/legal/dpa)

**Enterprise healthcare controls.** Vercel says healthcare BAAs and Secure Compute are Enterprise features. [Vercel: security and compliance](https://vercel.com/docs/security/compliance)

**Location and logs.** Vercel Functions default to Washington, DC (`iad1`) unless a project configures another region; Mumbai (`bom1`) is available. Runtime logs have plan-dependent retention. This repository does not contain a Vercel region pin, and the code's actual Vercel plan and dashboard settings are not visible here. [Vercel: function regions](https://vercel.com/docs/functions/configuring-functions/region), [Vercel: available regions](https://vercel.com/docs/regions), [Vercel: runtime-log retention](https://vercel.com/docs/logs/runtime)

**Meaning for POSTDATED.** Do not send real patient documents through the current Vercel function. The static web page can remain on Vercel only if the browser sends the document directly to the protected AWS API and no patient document or extracted medical detail passes through Vercel analytics, logs, or server functions.

## Indian privacy duties that matter

This section reports the law's text; it is not legal advice.

India's Digital Personal Data Protection Act says the organisation deciding why personal data is processed remains responsible for processing done on its behalf. A processor must be engaged under a valid contract. The organisation must use reasonable security safeguards and must erase data—and cause its processor to erase it—when consent is withdrawn or the purpose ends, unless another law requires retention. [Digital Personal Data Protection Act 2023, section 8](https://www.indiacode.nic.in/show-data?abv=CEN&actid=AC_CEN_45_0_00003_2023-22_1763464807080&orderno=8&orgactid=AC_CEN_45_0_00003_2023-22_1763464807080&statehandle=123456789%2F1362)

The Act also allows the Central Government to restrict transfers to notified countries and leaves stronger protections in other Indian laws intact. [Digital Personal Data Protection Act 2023, section 16](https://www.indiacode.nic.in/show-data?abv=CEN&actid=AC_CEN_45_0_00003_2023-22_1763464807080&orderno=16&orgactid=AC_CEN_45_0_00003_2023-22_1763464807080&sectionId=101282&sectionno=16&statehandle=123456789%2F1362)

The DPDP Rules were notified in November 2025 with staggered commencement dates. POSTDATED should have the pilot hospital's privacy/legal owner confirm which duties are in force on the pilot date and document the hospital's lawful basis, notice, consent or other permission, processor contracts, deletion period, and response plan. [MeitY: Digital Personal Data Protection Rules 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)

## Recommended pilot design

The following is a recommendation, not a statement that the current repository already does it.

1. Keep development and public demonstrations on fake or fully anonymised documents.
2. Put the sensitive pilot API in an AWS account controlled for the pilot, in Mumbai (`ap-south-1`). Use authenticated access through API Gateway plus Lambda, or a small ECS/Fargate service if the workload needs it.
3. Call Claude Sonnet 4.6 through Bedrock Runtime using its image and structured-output support.
4. Set Bedrock data retention to `none`. Add an organisation policy or IAM denial so an application operator cannot enable provider data sharing or change retention during the pilot.
5. Do not use Fable, Mythos, the Files API, web search, external tools, batch storage, prompt caching, or any feature whose retention has not been checked separately.
6. Hold the raw JPEG and extracted result only in memory for the few seconds needed to return the answer. Do not write them to S3, a database, a queue, tracing software, analytics, error reports, or logs.
7. Replace raw exception logging with a generated request ID and a patient-free error category. Explicitly disable request-body logging in the gateway, runtime, observability tools, and web host.
8. Keep only patient-free evaluation numbers, such as “required document detected: yes/no,” reviewer agreement, latency, and cost. If a reviewer needs to compare a result with a chart, do that inside the hospital's approved environment and erase it at the agreed time.
9. Add staff sign-in, least-privilege access, a written consent or approved shadow-review procedure, an audit trail that contains no clinical text, a short deletion rule, and a tested incident plan before the first real upload.
10. Tell the hospital plainly that Bedrock's current Claude route may process the request outside India. Obtain written approval and the required processor contracts before enabling real data.
11. If India-only processing is a firm requirement, block real uploads. Run a small, de-identified comparison of India-region models against POSTDATED's extraction schema and only proceed after accuracy, retention, contractual, and security checks pass.

## Wording POSTDATED can honestly use

Do not promise “no third-party sharing.” AWS is still a contracted processor, even when AWS does not share the content with Anthropic.

After the recommended controls are implemented and independently checked, a safer statement is:

> Your document is sent to our contracted cloud processor only to create this result. The document and AI response are not written to durable storage by our service or the model service. We keep only patient-free pilot measurements. Processing may occur outside India, as described in the pilot notice.

The exact notice must be approved by the hospital's privacy/legal owner and must match the final deployed configuration.

## Final decision gate

The pilot may use real patient documents only when all of these are true:

- the hospital has approved the purpose, patient/staff workflow, cross-border processing, and notice or consent approach;
- signed processor terms cover every service that can see the document;
- the document path is authenticated and does not pass through the current ordinary Vercel function;
- Bedrock retention is demonstrably `none`, provider data sharing is blocked, and the chosen model does not require sharing;
- request bodies, images, extracted medical details, and model errors are absent from storage and logs;
- deletion, access review, incident response, and a stop-the-pilot switch have been tested; and
- POSTDATED's core clinical rule remains enforced: the AI may report what the document says, request a missing document, or ask a clinician a question, but it must never invent or write a clinical fact.

Until every gate is met, use fake or fully anonymised documents only.
