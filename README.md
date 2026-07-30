# Youmechef website

Marketing site for Youmechef. Static HTML and CSS, no build step.

## Files

- `index.html` — the whole page
- `styles.css` — brand palette, copied from the mobile app's `lib/theme.ts`
- `assets/` — logo and favicon, taken from the mobile app icon

## Preview locally

Open `index.html` in a browser, or serve it:

    python -m http.server 8000

## Deploy

Pushing to `main` publishes to GitHub Pages. No workflow needed, Pages serves the branch root.

## Waitlist form

The email form posts to FormSubmit, which forwards to david.mo.brini@gmail.com.

**Activate it before launch.** Submit the form once yourself on the live site.
FormSubmit replies with a one-time confirmation email, and entries only start
arriving after you click that link.

The destination address is base64'd in `data-inbox` and the form `action` is set
at submit time, so the address is not in the served markup for scrapers to find.
This means the form needs JavaScript. To remove that dependency, activate the
address at formsubmit.co, then put the hashed endpoint they give you straight in
`action` and delete the submit handler.
