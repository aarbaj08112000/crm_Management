# Generating a Permanent Webhook URL with Ngrok

Because Meta's WhatsApp API requires a publicly accessible, secure `HTTPS` URL, you cannot use `.local` or `localhost`. 
Now that we are switching to **Ngrok**, we can obtain a **free, permanent static domain** that will *never* change. This means you will only have to configure Meta *once*.

Follow these exact steps to set it up:

---

### Step 1: Create an Ngrok Account & Get Your Domain
Since you need a permanent URL, you must link it to a free Ngrok account.
1. Go to [ngrok.com](https://ngrok.com/) and create a free account (or log in).
2. On your Ngrok dashboard, look at the left sidebar and click on **Domains**.
3. Under "Domains", click the button to **Create a Domain** or **Claim a Free Static Domain**.
4. Ngrok will assign you a permanent URL (e.g., `https://upward-lemur-surely.ngrok-free.app`). **Copy this domain.**

### Step 2: Authenticate your Terminal
You need to tell the Ngrok app on your computer who you are.
1. On your Ngrok dashboard, go to **Getting Started &rarr; Setup & Installation**.
2. Copy the command under the "Connect your account" section. It looks like this:
   ```bash
   ngrok config add-authtoken <YOUR_SECRET_TOKEN>
   ```
3. Run that exact command in your computer's terminal. (You only ever have to do this step **once**).

### Step 3: Start your Next.js Application
Before starting the tunnel, your CRM app needs to be running.
Open a terminal and run:
```bash
npm run dev
# or
pnpm dev
```

### Step 4: Start the Permanent Ngrok Tunnel
Open a **new, separate terminal window** and run the following command. 
*(Replace the `upward-lemur...ngrok-free.app` part with the exact domain you claimed in Step 1!)*

```bash
ngrok http 3000
```
When you run this, Ngrok will create a live, permanent connection between your localhost and the internet!

---

### Step 5: Configure Meta Developer Dashboard (Do this only ONCE!)
Now that you have your permanent URL, you just need to link it to Meta one final time.

1. Log into your [Meta for Developers Dashboard](https://developers.facebook.com/).
2. Select your WhatsApp App.
3. On the left sidebar, navigate to **WhatsApp** &rarr; **Configuration**.
4. In the **Webhook** section, click the **Edit** button.
5. **Callback URL:** Paste your full Ngrok URL and append `/api/webhook` to it.
   - Example: `https://upward-lemur-surely.ngrok-free.app/api/webhook`
6. **Verify Token:** Enter your secret token. By default, it is: `whatsapp_crm_verify_token` *(or whatever is inside your project's `.env` under WEBHOOK_VERIFY_TOKEN)*.
7. Click **Verify and Save**.

---
**Why is this better?**
Tomorrow, when you turn your computer back on and want to work on the CRM, you simply run `npm run dev` in one terminal, and `ngrok http --domain=your-domain... 3000` in another. Because the URL is identical, Meta will instantly connect without you having to log back into the dashboard!
