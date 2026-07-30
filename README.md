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
The first submission triggers a one-time confirmation email from FormSubmit that
must be clicked before entries arrive. To swap providers, change the `action`
on the form in `index.html`.
