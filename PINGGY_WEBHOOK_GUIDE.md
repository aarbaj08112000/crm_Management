# Generating a Webhook URL with Pinggy for WhatsApp API

Because Meta's WhatsApp API requires a publicly accessible, secure `HTTPS` URL to send messages to, you cannot use a simple `localhost` address. 

To solve this during development, we use **Pinggy**—a fast tunneling service that forwards a public URL directly to your local development server, bypassing Meta's strict anti-phishing filters.

Here is the exact step-by-step process you need to follow to generate and apply this URL whenever you restart your environment.

---

### Step 1: Start your Local Next.js Application
Before configuring the tunnel, your CRM application must be running locally.
Open your terminal and run your server (it usually runs on port 3000):
```bash
npm run dev
# or
pnpm dev
```

### Step 2: Generate the Pinggy Tunnel URL
Open a **new, separate terminal window** and run the following secure SSH command. This command acts as a bridge between the internet and your port `3000`:
```bash
ssh -p 443 -R0:localhost:3000 -o StrictHostKeyChecking=no a.pinggy.io
```

### Step 3: Copy the Generated URL
Once executed, Pinggy will display an output box in your terminal. Look for the secure `https` link.
It will look something like this:
`https://cdgke-114-143-234-6.free.pinggy.net`

Copy that URL and append your API route path to the end of it:
**Final URL:** `https://cdgke-114-143-234-6.free.pinggy.net/api/webhook`

> [!IMPORTANT]
> Because Pinggy is a free service, **this URL will change every time you stop and restart the SSH command.** You will need to repeat this process and update Meta each time your session expires.

---

### Step 4: Configure Meta Developer Dashboard
Now that you have your active URL, you must link it to Meta.

1. Log into your [Meta for Developers Dashboard](https://developers.facebook.com/).
2. Select your WhatsApp App.
3. On the left sidebar, navigate to **WhatsApp** &rarr; **Configuration**.
4. In the **Webhook** section, click the **Edit** button.
5. **Callback URL:** Paste your full Pinggy URL here (e.g., `https://.../api/webhook`).
6. **Verify Token:** Enter your secret token. By default for this project, the token is: `whatsapp_crm_verify_token` *(Check your `.env` file under WEBHOOK_VERIFY_TOKEN if it fails)*.
7. Click **Verify and Save**.

### Step 5: Webhook Fields Subscription
If this is your first time setting up the app, ensure you are subscribed to the correct events so Meta knows what data to send to the tunnel.
1. Just below the URL settings in the Webhook section, click **Manage**.
2. Subscribe to the `messages` field.

---
### Going to Production
When you finally deploy this application to a live server (like an AWS EC2 instance, Vercel, or a cPanel VPS), you will **no longer need Pinggy**. You will simply use your actual live domain (e.g., `https://yourcrm.com/api/webhook`) in the Meta dashboard, and the connection will become permanent.
