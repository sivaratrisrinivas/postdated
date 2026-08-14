# Indian privacy and health-data rules for the first shadow pilot

**Researched:** 14 August 2026
**Question:** What must the first POSTDATED shadow pilot do about Indian privacy, consent, security, retention and health data, and who owns each duty?
**Scope:** One supervised hospital pilot in Bengaluru, for consenting adults, using selected cashless inpatient claims. POSTDATED gives an internal warning report; it does not change the medical record, submit a claim or make an insurer decision.

> This is a product and engineering research note, not legal advice. The hospital and POSTDATED should have Indian health/privacy counsel approve the final pilot agreement, consent form and data flow before any real patient document is used.

## Short answer

The pilot can use real patient documents only after five things are true:

1. The **hospital gets clear, written, case-specific permission from the patient** for this extra shadow-pilot use and for disclosure to POSTDATED and every real service provider involved.
2. The **hospital and POSTDATED sign a processor agreement** that says exactly what POSTDATED may do, where data may go, who else may receive it and when every copy is deleted.
3. **POSTDATED stops real patient data from reaching any ordinary AI/API setup that keeps a copy.** Anthropic says standard commercial API inputs and outputs are normally deleted within 30 days, while zero data retention is available only for specially approved arrangements and has product limits. That does not match a promise that raw photos are deleted immediately after processing. ([Anthropic retention policy](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data), [Anthropic zero-data-retention scope](https://privacy.anthropic.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to))
4. Both parties use real security controls: named accounts, least access, encryption, safe logs, tested deletion and a six-hour cyber-incident response path.
5. The hospital keeps the official medical record. POSTDATED keeps no reusable patient file and no copy for model training, product improvement, demos or debugging.

The current operational privacy law is still section 43A of the Information Technology Act and the 2011 Sensitive Personal Data Rules. Most working duties in the Digital Personal Data Protection Act and Rules do **not** begin until **13 May 2027**. The product should still be built for those future duties now, because the pilot may continue across that date. ([DPDP commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf), [DPDP Rules commencement](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf))

## What law applies today

### 1. Medical information is sensitive personal data

The 2011 Rules call a person’s physical, physiological or mental health condition, and their medical records and history, **sensitive personal data or information**. A photographed discharge summary, investigation report, prescription or claim document is therefore sensitive even before POSTDATED reads it. ([SPDI Rules, rule 3](https://upload.indiacode.nic.in/showfile?actid=AC_CEN_45_76_00001_200021_1517807324077&filename=GSR313E_10511%281%29_0.pdf&type=rule))

Section 43A of the IT Act can make a body corporate pay compensation when negligent security for sensitive personal data causes wrongful loss or gain. Section 72A separately punishes certain disclosures made without consent or in breach of a lawful contract, where there is intent or knowledge of likely wrongful loss or gain. ([IT Act, section 43A](https://www.indiacode.nic.in/show-data?abv=RJ&actid=AC_CEN_45_76_00001_200021_1517807324077&orderno=49), [IT Act, section 72A](https://www.indiacode.nic.in/show-data?actid=AC_CEN_45_76_00001_200021_1517807324077&orderno=96&sectionId=13105&sectionno=72A))

### 2. The hospital owns the patient-facing permission

Under the SPDI Rules, the organisation that has the direct relationship with the person must:

- collect written consent for the stated purpose;
- collect only what is necessary for a lawful purpose;
- tell the person what is being collected, why, who will receive it, and who will keep it;
- use it only for that purpose;
- allow correction and written withdrawal; and
- keep it only as long as needed or required by law.

Disclosure to a third party needs the person’s prior permission unless that disclosure was already agreed in the contract with the person or is legally required. A recipient may not pass the information onward. A transfer inside or outside India is allowed only when the receiver gives the same level of protection and the transfer is necessary for a lawful contract or the person consented. ([SPDI Rules, rules 5–7](https://upload.indiacode.nic.in/showfile?actid=AC_CEN_45_76_00001_200021_1517807324077&filename=GSR313E_10511%281%29_0.pdf&type=rule))

MeitY’s official clarification says that a vendor handling sensitive information under a contract with another legal entity is not itself responsible for the direct collection and disclosure steps in rules 5 and 6; those sit with the body that has the direct relationship with the person. Electronic communication can count as written consent. This makes the hospital the patient-facing owner and POSTDATED its limited processor. It does **not** free POSTDATED from security, privacy-policy, confidentiality, contract or transfer duties. ([MeitY clarification dated 24 August 2011](https://www.meity.gov.in/writereaddata/files/PressNote_25811.pdf))

For this pilot, the safest reading is: the hospital should get fresh permission for the new shadow-pilot purpose and its vendor disclosures, even if the hospital already has permission to treat the patient and process the insurance claim.

### 3. Both parties must protect the data

The SPDI Rules require a documented security programme with managerial, technical, operational and physical controls that match the sensitivity of the data and the nature of the business. The organisation must be able to show those controls after a security incident. ISO/IEC 27001 is one recognised route, but the rule does not say it is the only route. ([SPDI Rules, rule 8](https://upload.indiacode.nic.in/showfile?actid=AC_CEN_45_76_00001_200021_1517807324077&filename=GSR313E_10511%281%29_0.pdf&type=rule))

Each body corporate handling this data must also publish a privacy policy that explains what it collects, why, its disclosure practices and its security practices. The direct-data organisation must publish a grievance contact and handle complaints within one month. ([SPDI Rules, rules 4 and 5(9)](https://upload.indiacode.nic.in/showfile?actid=AC_CEN_45_76_00001_200021_1517807324077&filename=GSR313E_10511%281%29_0.pdf&type=rule))

### 4. Cyber incidents and logs have separate current rules

The CERT-In directions apply to body corporates, including companies, firms, sole proprietorships and other commercial or professional associations. Each covered organisation should name a CERT-In point of contact, securely keep ICT-system logs for a rolling **180 days**, and be able to provide them to CERT-In. The directions require the logs to be maintained within Indian jurisdiction. The official FAQ explains that an organisation may also store logs outside India if it can produce them to CERT-In, but the safe pilot design is to keep a compliant, accessible Indian copy. ([CERT-In directions](https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf?trk=public_post_comment-text), [CERT-In FAQ](https://www.cert-in.org.in/PDF/FAQs_on_CyberSecurityDirections_May2022.pdf))

A data breach or data leak is a listed cyber incident. A covered organisation must report a qualifying incident to CERT-In within **six hours of noticing it**. It can send the information it has first and add missing details later. The duty cannot be handed away in a vendor contract: an entity that notices a reportable incident remains responsible for reporting it. ([CERT-In FAQ, incident reporting questions 19–25](https://www.cert-in.org.in/PDF/FAQs_on_CyberSecurityDirections_May2022.pdf))

This means the contract needs a much faster internal alert, for example immediate notification from POSTDATED to the hospital, so that both sides can meet their own six-hour duty.

### 5. The hospital must preserve the actual medical record

The National Medical Commission put the 2023 professional-conduct regulations on hold and expressly restored the 2002 Code of Medical Ethics. That Code requires a physician to keep inpatient medical records for **three years from the start of treatment** and provide them to the patient, authorised attendant or legal authority within 72 hours when requested. It also imposes medical confidentiality, subject to narrow legal and public-health exceptions. ([NMC notification restoring the 2002 Code](https://www.nmc.org.in/ActivitiWebClient/open/getDocument?path=%2FDocuments%2FPublic%2FPortal%2FNmcGazette%2F248297.pdf), [NMC Code of Medical Ethics 2002](https://www.nmc.org.in/rules-regulations/code-of-medical-ethics-regulations-2002/1000/))

Deleting POSTDATED’s temporary photo never means deleting the hospital’s official source record. POSTDATED must not alter that record and must never invent or insert a clinical fact.

## Who is responsible for what

| Job | Hospital | POSTDATED |
|---|---|---|
| Decide whether the pilot has a proper care/operations purpose | **Owns it.** Approves the pilot protocol, eligible cases and staff. | Describes the tool truthfully and stays inside the approved purpose. |
| Patient notice and consent | **Owns it.** Explains the pilot and gets a dated consent record before upload. | Supplies accurate plain-English descriptions of its data flow, limits, vendors and deletion. |
| Refusal or withdrawal | Ensures refusal does not reduce care or claim handling; tells POSTDATED to stop/delete. | Stops new processing and deletes its copies, unless a legal hold applies. Confirms deletion. |
| Official medical and claim record | **Owns it.** Keeps the source record under medical, insurance and hospital rules. | Never becomes the system of record; never edits or writes clinical facts. |
| Choose what is uploaded | Staff upload only the minimum pages needed for the chosen checks. | Rejects unrelated pages and fields where practical; does not quietly expand collection. |
| Accounts and staff access | Creates/approves named users and removes leavers. | Enforces named accounts, least privilege, strong authentication and audit trails. |
| Software and infrastructure security | Secures hospital devices, network and local downloads. | Secures the application, cloud, secrets, encryption, logs, backups, deletion and development process. |
| Vendors and AI models | Approves the complete vendor/subprocessor list and overseas transfers. | **Owns its subcontractors.** Gets proper contracts, exposes every real recipient and prevents unauthorised reuse. |
| Patient questions and corrections | Main contact for the patient; corrects the hospital record when appropriate. | Gives the hospital a fast route to find, correct or delete POSTDATED-held data. |
| Outcome measurement | Keeps the private link between pilot case and insurer outcome. | Receives only the minimum result needed; keeps only genuinely anonymous totals after evaluation. |
| Incident response | Secures hospital systems, informs affected people as appropriate and meets its legal reports. | Immediately contains and alerts the hospital; preserves safe evidence; meets its own CERT-In duty. |
| Privacy policy and grievance path | Publishes the hospital policy/contact. | Publishes the POSTDATED policy/contact where it handles the data. |
| Proof | Keeps consent, staff approval and source-record evidence. | Keeps contract, access, deletion, security-test and incident evidence without copying clinical content into logs. |

The hospital remains responsible for choosing and supervising the processor. POSTDATED remains responsible for what its product, staff and subprocessors actually do. Calling POSTDATED “only a processor” does not make a leak, insecure design or secret third-party disclosure acceptable.

## What the consent should say, in plain English

The hospital’s consent screen or form should make these points obvious before the patient says yes:

- This is an optional internal shadow pilot. It does not decide the claim, send anything to the insurer or replace hospital staff.
- Saying no will not reduce treatment, discharge support or normal claim work.
- Which documents or fields will be used, and the narrow reason for using them.
- The hospital, POSTDATED and every actual cloud/model provider that will receive identifiable data.
- Whether any data can leave India, where it goes and what contract protects it.
- How long each copy lasts, including temporary files, model-provider copies, reports, logs and backups.
- That the software can be wrong; a trained person checks every warning.
- That the patient can withdraw in writing, who to contact and what deletion cannot undo.
- Permission for the hospital to compare the warning with the later insurer result for this pilot.
- The hospital and POSTDATED grievance contacts.

Consent should be an affirmative action, not a pre-ticked box or a sentence buried in a general admission form. Keep a copy of the exact notice/version the patient saw. Use a language the patient understands. For the first pilot, exclude minors and people who cannot consent for themselves unless hospital counsel has approved a representative-consent path.

Do not bundle research or publicity permission into operational consent. If the team later wants to publish generalisable research, let an authorised hospital ethics committee decide whether ethics review and a separate research consent are required. ICMR’s 2017 research guidelines require informed consent for biomedical and health research; its 2023 AI guidance also stresses known purpose, privacy, safety, accountability and truthful explanation of AI use. These are ethical standards and guidance, not a replacement for the law. ([ICMR National Ethical Guidelines 2017](https://www.icmr.gov.in/icmrobject/custom_data/pdf/resource-guidelines/ICMR_Ethical_Guidelines_2017.pdf), [ICMR Ethical Guidelines for AI in Healthcare 2023](https://www.icmr.gov.in/icmrobject/custom_data/pdf/Ethical-guidelines/Ethical_Guidelines_AI_Healthcare_2023.pdf))

## Retention: what stays and what goes

| Data | Where it should live | Rule for the first pilot |
|---|---|---|
| Hospital medical/claim source record | Hospital system | Hospital keeps it. The NMC rule requires at least three years for inpatient medical records; other hospital/insurance rules may require longer. |
| Patient notice and consent record | Hospital system | Keep the signed/recorded consent and the exact notice version under the hospital’s approved legal record schedule. POSTDATED needs only a yes/no authorisation token and notice version, not another patient-signed copy. |
| Raw document photo | Temporary, tightly controlled POSTDATED processing area | Delete automatically after the checked report is created or the short retry window ends. Do not put it in browser storage, camera roll, analytics, support tools, ordinary logs or long-lived backups. Test and record that deletion works. |
| Extracted text and page-level clinical fields | Same temporary job | Delete with the raw photo. Do not create a reusable patient profile or training corpus. |
| Warning report | Hospital-controlled case file | Hospital keeps the reviewed report under its approved pilot/claim record schedule. POSTDATED should not retain a patient copy after secure delivery and acknowledgement. |
| Link from pilot case to insurer outcome | Hospital only | Hospital keeps the re-identification key. Give POSTDATED the minimum outcome data needed for measurement. |
| Pilot measurement data | POSTDATED may keep only genuinely anonymous totals | Use broad aggregate counts. A made-up pilot ID is still personal data if anyone can reconnect it to a patient. |
| Security/access logs | Each party’s controlled logging system | Keep a rolling 180 days for CERT-In compliance. Log who, when, action, job ID and result—not document text, diagnosis, name or image. |
| Backups, queues, caches and failed jobs | Every involved system | The deletion promise must cover these too. A “deleted” database row is not enough if the file remains in an object-store version, queue, cache or vendor system. |

The SPDI Rules do not give POSTDATED a fixed number of days for temporary copies. They say not to retain data longer than the lawful purpose or another law requires. Therefore the contract must choose exact, short time limits and the code must enforce them. ([SPDI Rules, rule 5(4)](https://upload.indiacode.nic.in/showfile?actid=AC_CEN_45_76_00001_200021_1517807324077&filename=GSR313E_10511%281%29_0.pdf&type=rule))

## The AI-provider problem is a launch gate

Anthropic says commercial API data is not used to train its generative models by default. That is helpful, but it does **not** mean the data is never stored or never disclosed to a service provider. ([Anthropic training policy](https://privacy.anthropic.com/en/articles/7996868-is-my-data-used-for-model-training))

For real patient pages, POSTDATED must choose one of these before launch:

1. **Approved zero-data-retention route:** a signed commercial/data-processing agreement, approved zero-data-retention status for the exact API products and features being used, a verified subprocessor/transfer map, hospital approval and matching patient notice; or
2. **No identifiable data sent to that provider:** process in a hospital-controlled or otherwise contractually approved environment, or remove identifiers so thoroughly that neither POSTDATED nor the provider can reasonably reconnect the material to a person.

Standard API retention is a **no-go** for the current “delete raw photos after processing” promise. Prompt caching, batch jobs, file APIs, tracing, feedback buttons and support tickets must each be checked separately; one zero-retention feature does not automatically cover another. Anthropic states that its commercial Data Processing Addendum is part of the commercial terms, but the actual signed terms and subprocessor/residency facts still need review. ([Anthropic DPA information](https://privacy.anthropic.com/en/articles/7996862-how-do-i-view-and-sign-your-data-processing-addendum-dpa))

Never paste a patient prompt or screenshot into a bug report, chat, telemetry tool or model feedback form.

## Minimum security gate before one real case

This is the practical minimum needed to support the legal “reasonable security” duty:

- a signed hospital–POSTDATED data-processing and confidentiality agreement, including subprocessors, transfer location, deletion, audit, breach and end-of-pilot terms;
- a written data-flow map covering browser/device, application, model provider, storage, logs, backups, support and deletion;
- named employee accounts, multi-factor authentication, least privilege, fast access removal and no shared pilot password;
- encryption in transit and at rest, controlled keys and secrets, and separate test and real-patient environments;
- an in-app capture/upload flow that does not save a copy to the device camera roll, downloads folder or browser cache;
- logs that record actions but never raw clinical content, retained securely for 180 days with a compliant Indian copy;
- no patient data in analytics, crash reporting, prompt tracing, customer support or developer workstations;
- automatic deletion across files, databases, queues, caches, object versions, backups and subprocessors, with a test and deletion evidence;
- dependency patching, vulnerability scanning and an independent security review before real data;
- staff confidentiality and privacy training, plus a written incident drill that can detect, contain, alert the other party and begin CERT-In reporting inside six hours; and
- a tested stop button: the hospital can disable uploads and POSTDATED can revoke access and isolate processing immediately.

ISO/IEC 27001 certification is not stated here as an automatic launch requirement, but the security programme should be designed so POSTDATED can show what controls exist, who owns them and that they actually work.

## The DPDP law: current versus future

The DPDP Act was passed in 2023, but its working duties were brought into force in stages by the 13 November 2025 commencement notification.

### In force on 14 August 2026

- institutional and interpretation provisions needed to establish the Data Protection Board; and
- related rule-making and Board provisions.

These do not yet replace the operational SPDI duties described above.

### Starting 13 November 2026

- the narrow registration framework for consent managers begins.

POSTDATED is not a “consent manager” merely because it displays or records a hospital consent form. It should not claim that regulated role.

### Starting 13 May 2027

Most operational duties begin: lawful processing, notice, consent, data-fiduciary duties, processor contracts, security, breach notification, erasure, rights, children’s data and cross-border controls. At the same time, section 43A of the IT Act is repealed by section 44(2) of the DPDP Act. ([DPDP Act, including sections 5–8 and 44](https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf), [official commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf))

The future rules require reasonable safeguards including encryption or masking/tokenisation, access controls, monitoring/logs, continuity measures, processor-contract safeguards and other technical/organisational measures. A breach must be explained to affected people without delay, notified to the Board without delay and followed with fuller information within 72 hours. ([DPDP Rules, rules 6 and 7](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf))

The future rules also require certain personal data, traffic data and logs to be kept for at least one year for specified government/legal purposes before erasure unless another law requires longer. This will need a carefully separated log design: keep the evidence the future rule requires, but do not use it as an excuse to keep raw medical documents. ([DPDP Rules, rule 8](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf))

The future Act makes the hospital, as data fiduciary, responsible for processing done on its behalf by a processor. It requires a valid processor contract, reasonable safeguards and erasure when consent is withdrawn or the purpose ends unless law requires retention. It also says data used to make a decision affecting a person, or disclosed to another fiduciary, should be complete, accurate and consistent. That supports POSTDATED’s existing product rule: show evidence and uncertainty, require human review and never invent a clinical fact. ([DPDP Act, section 8](https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf))

**Design decision:** build the pilot to the future standard now, but label the 13 May 2027 duties as future until they actually begin. Re-check the commencement rules before launch and again before that date.

## ABDM and health-data standards

The Ayushman Bharat Digital Mission Health Data Management Policy describes itself as guidance for the national digital health ecosystem, and participation in ABDM is voluntary. It becomes directly relevant if POSTDATED joins the ABDM ecosystem, acts as a Health Information Provider/User, uses ABHA-linked exchange or accepts the ecosystem’s contractual rules. The standalone pilot should not require an ABHA number or claim ABDM membership. ([ABDM Health Data Management Policy](https://abdm.gov.in/static/media/health_management_policy_bac9429a79.80f74bc3e039c00acd4f.pdf))

MoHFW’s 2016 EHR Standards are valuable design guidance for interoperability, privacy and security, but they are not a blanket statute making every standalone pilot an ABDM/EHR system. ([MoHFW EHR Standards for India 2016](https://www.mohfw.gov.in/sites/default/files/EMR-EHR_Standards_for_India_as_notified_by_MOHFW_2016_0.pdf))

## Hard no-go conditions

Do not use one real patient document if any of these is still true:

- consent is missing, generic, bundled into treatment, or does not name the real recipients and retention;
- refusing the pilot could slow or harm the patient’s treatment, discharge or normal insurance help;
- a standard AI API keeps the patient input/output after POSTDATED says it has deleted the photo;
- the hospital has not approved the vendor, transfer and security arrangement;
- staff share accounts, or a user can see another patient’s case without a work reason;
- clinical text or images appear in logs, analytics, support tickets, backups or developer machines;
- deletion has not been tested end to end;
- nobody can start the six-hour CERT-In response; or
- the tool can automatically change the medical record, claim or insurer submission.

## Questions counsel must close before launch

1. Is the exact hospital entity and its local Karnataka registration/licence subject to any additional KPME record or consent condition for this workflow?
2. Does the final patient language and electronic signature method create valid, provable permission for the hospital’s disclosure and POSTDATED’s processing?
3. Is the exercise only supervised service evaluation, or does its planned analysis/publication make ethics-committee classification or research consent necessary?
4. Do the signed cloud/model-provider terms provide the promised deletion, same level of protection, acceptable overseas transfer and a complete subprocessor list?
5. What exact hospital schedule applies to the reviewed warning report, consent evidence and insurer-outcome comparison?
6. What must change before 13 May 2027, especially breach notices and the future one-year retention rule for specified logs?

## Pilot decision record

For the first pilot, the practical responsibility split should be:

- **Hospital:** data fiduciary/patient-facing owner, consent owner, official-record owner, staff-access owner and main patient contact.
- **POSTDATED:** limited processor, secure-tool owner, subprocessor owner and deletion owner.
- **Both:** independently responsible for their own security and CERT-In compliance, with a shared incident playbook.

The cleanest architecture is one where the hospital holds identity, consent, source records, the reviewed report and the outcome link; POSTDATED receives one authorised job, returns one warning report, deletes the clinical material, and keeps only non-clinical security evidence plus truly anonymous pilot totals.
