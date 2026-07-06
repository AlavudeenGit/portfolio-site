# Muhammed Rahib cp — Portfolio Website

A premium, single-page portfolio for a fine artist & graphic designer, built with
plain HTML/CSS/JS and Supabase (Auth + Database + Storage). No backend server —
deploys directly to GitHub Pages.

## 1. File structure

```
index.html        Public site
admin.html         Hidden admin dashboard (not linked in nav)
css/style.css      Public site styles
css/admin.css      Admin dashboard styles
js/config.js       Supabase credentials + site content config
js/supabase.js     Supabase client + data helpers
js/gallery.js      Gallery fetch, filter, lightbox
js/animations.js   Loader, smooth scroll, scroll reveals, micro-interactions
js/main.js         Nav, services, testimonials, contact form
js/admin.js        Admin auth gate + CRUD dashboard
assets/            Images and icons (add your own artwork photos here)
```

## 2. Supabase setup

### a) Create a project
Go to [supabase.com](https://supabase.com) → New Project.

### b) Create the `artworks` table
Run this in the Supabase SQL editor:

```sql
create table artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  image_url text not null,
  featured boolean default false,
  year_created text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table artworks enable row level security;

-- Anyone can read artworks (public gallery)
create policy "Public read access"
  on artworks for select
  using (true);

-- Only authenticated users (you, the admin) can write
create policy "Authenticated insert"
  on artworks for insert
  to authenticated
  with check (true);

create policy "Authenticated update"
  on artworks for update
  to authenticated
  using (true);

create policy "Authenticated delete"
  on artworks for delete
  to authenticated
  using (true);
```

### c) Create a Storage bucket
Storage → New Bucket → name it `artworks` → set to **Public**.

Add a storage policy so authenticated users can upload:

```sql
create policy "Authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'artworks');

create policy "Public read"
  on storage.objects for select
  using (bucket_id = 'artworks');
```

### c.1) Create the `inquiries` table (contact form submissions)

Run this in the SQL editor too:

```sql
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  service text,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table inquiries enable row level security;

-- Anyone (site visitors) can submit the contact form
create policy "Public insert"
  on inquiries for insert
  to anon
  with check (true);

-- Only you (logged into admin.html) can read, update, or delete messages
create policy "Authenticated read"
  on inquiries for select
  to authenticated
  using (true);

create policy "Authenticated update"
  on inquiries for update
  to authenticated
  using (true);

create policy "Authenticated delete"
  on inquiries for delete
  to authenticated
  using (true);
```

This keeps submissions private — visitors can only insert a new row, never read
other people's messages. Only your logged-in admin session can view them, in
the **Messages** tab of `admin.html`.

### d) Create your admin login
Authentication → Users → Add User → enter your email + a password.
This is the only login the admin dashboard accepts — there is no public sign-up.

### e) Add your credentials
Open `js/config.js` and paste in your Project URL and anon public key
(Project Settings → API).

## 3. Content

- Replace the images in `assets/images/` (hero artwork, artist portrait, client
  photos) with your own.
- Edit `window.SITE_CONFIG` in `js/config.js` for your name, tagline, and
  contact/social links.
- Testimonials and the process timeline are static content inside `index.html`
  — edit the text directly for now, since they change rarely.
- Everything in the **Portfolio Gallery** is loaded from Supabase — add
  artworks from `admin.html`, not by editing HTML.

## 4. Running locally

Any static file server works, e.g.:

```bash
npx serve .
```

Then open the printed local URL. Supabase calls work the same locally and
in production since there's no backend to configure.

## 5. Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. Repo → Settings → Pages → Source: deploy from the `main` branch, root folder.
3. Your site will be live at `https://<username>.github.io/<repo>/`.
4. `admin.html` will be publicly reachable at that URL too (by design — it's
   just not linked from the nav). Access is protected by Supabase Auth, not
   by hiding the URL, so this is safe as long as you keep RLS policies in
   place and never share your admin password.

## 6. Contact form

The contact form currently validates and shows a success message client-side.
Since this is a static site, wire the final submit handler in `js/main.js`
to either:
- A Supabase table (e.g. `inquiries`) using the same pattern as `supabase.js`, or
- A form backend like Formspree or Getform (just point the fetch call at
  their endpoint).

## 7. Customization notes

- All color and type tokens live at the top of `css/style.css` under
  `:root` — change the palette or fonts in one place.
- The gallery filter buttons in `index.html` must use the same `data-filter`
  values as the `category` values you choose when uploading artwork in
  the admin dashboard.
