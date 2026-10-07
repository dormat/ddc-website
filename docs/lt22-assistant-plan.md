# LT22 assistant plan

Closed product assistant for Control Applications / DDC. Version 1 answers only from the LT22 user manual, on the Hebrew contact page. WhatsApp uses the same assistant after that page is answering well.

The first version lives in this repo: `bot/` is the service, the Hebrew contact page has the chat, and the manual pack is `bot/knowledge/`. WhatsApp is not connected. The billing budget in Google Cloud is still set in the console, not by this code.

## Decisions

| Topic | Choice |
| --- | --- |
| What it may know on day one | The LT22 user manual only |
| How much of that manual | The whole manual, except section 8.1 |
| Section 8.1 | Removed before the model ever sees the text. Never quoted, never described. A question about it gets the same “not in the manual” reply as any other missing answer |
| Screenshots in the manual | Shown in the chat when the answer refers to that figure |
| Photo of the customer’s meter | Allowed from day one. Match it to a known screen, read the visible numbers, explain what each field means. Do not say whether those readings are good or bad |
| Where it appears | Hebrew contact page only (`site/he/contact/index.html`). The existing form stays. No links from product pages |
| Languages | Page, opening text, and refusals are Hebrew. A message in English is answered in English. Screen labels stay as printed on the meter. Spanish waits |
| When it does not know | Say it is not in the LT22 manual, mention that it can help with screens, keys, and settings, and point to the form on the page |
| Adding more context | A short notes file, plus later manuals prepared the same way as this PDF. No admin upload screen in this version |
| Memory for the visitor | One visit. Follow-up questions work until they leave. The next visit starts empty |
| What is saved | Name and phone or email, required before the first message, plus the full questions, replies, and any photo. The visitor cannot read this log |
| Model | Gemini Flash, with the manual text cached. A photo is sent only on turns that include one |
| Where it runs | The whole website moves to a new Firebase project. The assistant is a service in that project |
| WhatsApp | Same assistant, after the contact page works. The existing WhatsApp Business number stays on the phone app and is also connected to the API |

## The manual

Reviewed file: `LT22_User_Manual_HE.pdf` (46 pages, Hebrew, “מדריך למשתמש והתקנה – מונה אנרגיה LT22”).

The PDF is a good source for this assistant:

- About 68 product screenshots.
- Almost every screenshot already has two paragraphs under it: **מה מוצג** (what is on the screen) and **מקשים** (what each key does).
- Settings pages also include tables of allowed values and defaults.
- The written text is enough to answer “what is this screen?” and “what does this key do?”. The model does not need to look at the manual images on every question.
- The pictures are still kept, so the chat can show the matching screenshot.
- Numbers printed inside the figures (a sample kWh total, a sample voltage) are examples in the manual. They are not the customer’s meter.

Plain text export of this PDF scrambles Hebrew reading order. Preparing the knowledge pack means a careful extract, so paragraphs stay in order. That is a one-time step.

Section 8.1 is the technician code list (password change, resets, deleting stored history, calibration, and similar). Delete that section, including its table, from the knowledge pack. Do not leave a note in the prompt that says the section was removed.

The default settings password is printed in an earlier chapter. That chapter stays, because only section 8.1 was excluded.

Installation, wiring, settings, and communications stay in. When a step is only for a certified electrician, the assistant repeats that limit from the manual.

Another manual later is prepared the same way: clean text, excluded sections removed, each screenshot saved under its figure number.

## Closed context

The assistant has no web search and no other tools. Each request contains only:

- the system instructions
- the prepared LT22 manual
- the notes file
- the current visit’s messages
- a photo, only if the visitor attached one on that turn

Instructions to hold:

- Answer only from the manual and the notes file.
- If it is not there, use the refusal below. Do not fill gaps from general product knowledge.
- Do not judge a customer’s live voltage, current, power, or wiring from a photo. Explain what the fields are.
- Reply in the language of the visitor’s message (Hebrew or English).
- Keep on-screen labels as they appear on the meter.
- When the answer uses a figure, include that figure’s id so the page can show the image.

This is a strong limit, not a guarantee. The check before launch is a set of questions whose answers are known to be outside the manual, including questions aimed at section 8.1. The assistant should refuse those without hinting that a hidden code list exists.

At this size, put the whole prepared manual in the prompt. Do not split it into a search index. Gemini’s prompt cache keeps the manual as a fixed prefix, so repeat questions mostly pay for the new message and the reply.

## Refusal

One Hebrew reply, used for anything outside the manual, for section 8.1, for other products, and for a photo that is not an LT22 screen:

- It is not in the LT22 manual.
- It can help with screens, keys, and settings on this meter.
- The form on this page is how to reach a person.

The same reply, in English, when the visitor wrote in English. Do not add a sentence that a restricted section exists.

On WhatsApp there is no form. There the assistant says it does not have the answer and stops, so a person can continue on that number.

## Contact page

Hebrew contact page only. The form, map, and existing details stay.

Before the first message, the visitor enters a name and a phone or email. That is how the log records who asked. The chat then starts.

The page shows the manual screenshot when a reply cites a figure. The visitor can attach a photo of their own meter.

Manual screenshots are public assets of the site. Customer photos are not. Customer photos go to private storage and are only readable from the admin side.

For this version, read the log in Firebase. Do not build a separate admin screen.

## Adding context later

Two files, both closed:

- The prepared LT22 manual.
- A short notes file for corrections and facts the PDF does not say. It starts empty.

Dropping a new PDF in is a repeat of the manual preparation, not a new product. An upload page in the admin is out of this version.

## Service

A small HTTPS service in the new Firebase project. The contact page calls only that service. The Gemini API key stays on the server.

On a normal turn the service sends the cached manual, the notes, the visit so far, and the new message. On a photo turn it also sends that image. The reply comes back as text plus any figure ids.

Suggested records:

- A conversation: name, phone or email, start time.
- Each message: who spoke, the text, the reply, figure ids, and the private path of a photo if there was one.

The browser keeps the visit only until the visitor leaves or refreshes. The saved copy in Firebase is the one you read. The next visit is a new conversation.

## Security that ships with the first public version

- No Gemini credential in the website. Cloud Run calls Gemini with the project service account.
- The contact page is the only website origin allowed to call the service.
- A limit on messages per visit, and a daily cap.
- A hard monthly spend limit on the Gemini account.
- No public URL for a customer photo.
- The knowledge pack contains no secrets beyond what the manual already says to customers. Visitors can push the assistant to quote the pack.

## WhatsApp

Build this after the contact-page assistant is answering well. It is a second door onto the same service, not a second assistant.

Same manual, same notes file, same section 8.1 rule, same photo behavior, same Hebrew-or-English replies. The log uses the WhatsApp phone number as who asked, so there is no name form.

The existing WhatsApp Business app stays. Connect that same number to the WhatsApp Cloud API with Meta’s coexistence setup. Messages typed by hand in the phone app stay free. Messages the bot sends through the API are billed by Meta.

From 1 October 2026, each business number includes 1,000 free bot replies per month. After that, each delivered bot reply is charged at Meta’s utility rate for the customer’s country. Gemini is an extra, smaller cost.

The customer has to message first. That opens a window in which the bot may answer. After a quiet stretch, treat the thread as a new visit, same as leaving the contact page. The bot does not start conversations.

When the bot does not know, or the customer asks for a person, it stops auto-replying so someone can continue from the WhatsApp Business app on the same number.

A matching manual screenshot is sent back as an image in the chat.

## New Firebase project, before any bot code

Do this in the same project the site is moving to. Do not create a second project for the assistant. Do not turn on WhatsApp yet. Do not put Gemini in the browser, and do not follow a console wizard that adds an AI key to the public website.

1. Attach a billing account and switch the project to the Blaze plan. A payment method is required. You do not prepay a balance. Then create a billing budget for this project with alerts at 50%, 90%, and 100% of a small monthly cap. A budget alert does not always cut the service off the moment it is crossed, so set the cap low now and raise it when the chat is public.
2. Create Cloud Firestore in **Native mode** in **me-west1** (Tel Aviv). This location cannot be changed later. Do not accept the United States default. Names, phone numbers, emails, and chat text will live here. Lock the rules so the website cannot read or write this database. Only the bot service can.
3. Create the Cloud Storage bucket for customer photos in **me-west1**, private. The manual screenshots that the chat shows are normal site files, not this bucket. Lock the storage rules the same way: no public access.
4. Enable Cloud Run. The bot will be one service in me-west1. The static site stays on Firebase Hosting.
5. Enable the Vertex AI / Gemini API on this project (`aiplatform.googleapis.com`). The Cloud Run service calls Gemini as itself. Give that service account permission to use Vertex AI. Do not create an API key and do not put one in the website. Leave Google Search grounding turned off.
6. Confirm Gemini Flash is enabled for the project and that the spend budget from step 1 covers it.

WhatsApp and a public Gemini API key are not part of this setup.

### Google Sign-In (Hebrew contact assistant)

The Kal / LT22 chat on the Hebrew contact page requires Firebase Auth with the Google provider. Contact forms below the chat stay public.

**Code (already wired):** Hebrew contact injects Firebase Auth + `LT22_FIREBASE_CONFIG`; the chat UI gates on Google sign-in; `/api/assistant/*` expects `Authorization: Bearer <Firebase ID token>`; Cloud Run verifies it and stores `googleUid`, `email`, and `authProvider: "google"` on the chat.

**Firebase Console steps still required** for project **control-applications-ddc**:

1. **Authentication → Sign-in method → Google → Enable**, then Save. (If prompted, pick a project support email; Firebase will create/link the OAuth client.)
2. **Authentication → Settings → Authorized domains** — keep at least:
   - `localhost` (local tests)
   - `control-applications-ddc.web.app`
   - `control-applications-ddc.firebaseapp.com`
   - `ddc.co.il` / `www.ddc.co.il`
   - `control-applications-preview.web.app` / `control-applications-cms.web.app` (if those hosts use the assistant)
3. After enabling Google, open https://control-applications-ddc.web.app/he/contact/ and confirm the sign-in popup works (not `auth/operation-not-allowed` or `auth/unauthorized-domain`).

## Order of work

1. Create the new Firebase project and point the site hosting at it.
2. Prepare the manual: clean Hebrew text, delete section 8.1, save each screenshot under its figure number. Leave the notes file empty.
3. Add the service: cached manual, Gemini Flash, figure ids on the reply, photos sent only on turns that include one.
4. Add the chat to the Hebrew contact page: name and phone or email first, then messages, photo attach, and the manual screenshot when the reply cites one.
5. Save conversations and customer photos for reading in Firebase.
6. Turn on the domain check, the per-visit limit, the daily cap, and the Gemini spend limit.
7. Try real questions in Hebrew and English, including questions that must be refused, before sending customers to it.
8. Connect the existing WhatsApp Business number, and send its messages through the same service.

## Out of this version

- Other product manuals, until they are prepared and added on purpose.
- Spanish.
- The chat on any page except the Hebrew contact page.
- Links from product pages.
- An admin screen for the log or for uploading PDFs.
- Chunked search over the manual.
- The bot deciding that a customer’s live readings are a fault.
